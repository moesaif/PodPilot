import { ipcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import Store from 'electron-store'
import { k8sManager } from '../k8s/client'
import type { AIMessage, AIContext } from '../../shared/types'

const store = new Store()

function getClient(): Anthropic {
  return new Anthropic({ apiKey: store.get('anthropic_api_key', '') as string })
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const K8S_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_cluster_overview',
    description:
      'Get real-time cluster health metrics: total pods and breakdown by status (Running/Pending/Failed/Succeeded), node count, deployment count, service count, namespace count, and pod distribution by namespace. Call this first for any health or overview question.',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'get_pods',
    description:
      'List pods with status, readiness, restart count, node assignment, container states and error reasons. Use namespace="all" for cluster-wide view. Essential for finding unhealthy workloads.',
    input_schema: {
      type: 'object' as const,
      properties: {
        namespace: { type: 'string', description: 'Namespace name, or "all" for all namespaces' }
      },
      required: ['namespace']
    }
  },
  {
    name: 'get_nodes',
    description:
      'Get node status (Ready/NotReady), roles (control-plane/worker), Kubernetes version, OS image, and allocatable CPU/memory. Use to check node health and capacity.',
    input_schema: { type: 'object' as const, properties: {} }
  },
  {
    name: 'get_events',
    description:
      'Get recent Kubernetes events sorted by time. Warning events indicate scheduling failures, OOMKill, ImagePullBackOff, and other problems. Invaluable for root cause analysis.',
    input_schema: {
      type: 'object' as const,
      properties: {
        namespace: { type: 'string', description: 'Namespace to query, or "all" for cluster-wide events' }
      },
      required: ['namespace']
    }
  },
  {
    name: 'get_pod_logs',
    description:
      'Fetch the most recent logs from a specific pod. Critical for diagnosing CrashLoopBackOff, application errors, OOMKilled, and runtime failures. Get events first to identify which pod to inspect.',
    input_schema: {
      type: 'object' as const,
      properties: {
        namespace: { type: 'string', description: 'Pod namespace' },
        pod_name: { type: 'string', description: 'Exact pod name' },
        container: { type: 'string', description: 'Container name (optional — omit to use default container)' }
      },
      required: ['namespace', 'pod_name']
    }
  },
  {
    name: 'get_deployments',
    description:
      'List deployments with ready/desired replica counts, up-to-date replicas, and container images. Shows which deployments are degraded or rolling out.',
    input_schema: {
      type: 'object' as const,
      properties: {
        namespace: { type: 'string', description: 'Namespace or "all"' }
      },
      required: ['namespace']
    }
  },
  {
    name: 'get_resource_yaml',
    description:
      'Get the full YAML manifest for a specific Kubernetes resource. Use to review configuration, detect misconfigurations, check resource limits/requests, and verify spec correctness.',
    input_schema: {
      type: 'object' as const,
      properties: {
        kind: { type: 'string', description: 'Resource kind: Pod, Deployment, Service, ConfigMap, Secret, Ingress, StatefulSet, etc.' },
        name: { type: 'string', description: 'Exact resource name' },
        namespace: { type: 'string', description: 'Resource namespace' }
      },
      required: ['kind', 'name', 'namespace']
    }
  },
  {
    name: 'get_services',
    description:
      'List services with type (ClusterIP/NodePort/LoadBalancer), cluster IPs, external IPs, and port mappings. Use to diagnose network connectivity issues.',
    input_schema: {
      type: 'object' as const,
      properties: {
        namespace: { type: 'string', description: 'Namespace or "all"' }
      },
      required: ['namespace']
    }
  }
]

async function executeTool(
  name: string,
  input: Record<string, string>,
  contextName: string
): Promise<unknown> {
  try {
    switch (name) {
      case 'get_cluster_overview':
        return await k8sManager.getClusterMetrics(contextName)
      case 'get_pods':
        return await k8sManager.getPods(contextName, input.namespace || 'default')
      case 'get_nodes':
        return await k8sManager.getNodes(contextName)
      case 'get_events':
        return await k8sManager.getEvents(contextName, input.namespace || 'default')
      case 'get_pod_logs':
        return await k8sManager.getPodLogs(contextName, input.namespace, input.pod_name, input.container)
      case 'get_deployments':
        return await k8sManager.getDeployments(contextName, input.namespace || 'default')
      case 'get_resource_yaml':
        return await k8sManager.getResourceYaml(contextName, input.namespace, input.kind, input.name)
      case 'get_services':
        return await k8sManager.getServices(contextName, input.namespace || 'default')
      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    return { error: String(err) }
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are PodPilot AI, an expert Kubernetes assistant with DIRECT, REAL-TIME access to the live cluster through tools.

IMPORTANT RULES:
1. When users ask about their cluster, ALWAYS use tools to fetch live data — never ask them to run kubectl or paste output.
2. For any health, diagnostic, or analysis question: fetch data first, then give a specific answer based on what you find.
3. Mention exact resource names, namespaces, error messages from logs/events in your response.
4. Multiple tool calls are fine — fetch everything you need to give a complete answer.

TOOL STRATEGY:
- Cluster health / overview → get_cluster_overview, then get_events("all")
- Pod crashing / CrashLoopBackOff → get_pods("all") to find it, then get_pod_logs
- Unhealthy workloads → get_pods("all"), filter non-Running pods, investigate with get_pod_logs
- "Why is X failing?" → get_events("all"), then get_pod_logs for the affected pod
- Resource misconfiguration → get_resource_yaml for the specific resource
- Network / connectivity → get_services + get_events
- General questions (YAML generation, kubectl syntax) → answer directly without tools

FORMAT: Use markdown. Code blocks for kubectl commands and YAML. Be specific and actionable.`

// ─── IPC handlers ────────────────────────────────────────────────────────────

export function registerAIHandlers(): void {
  ipcMain.handle('ai:getApiKey', async () => store.get('anthropic_api_key', '') as string)

  ipcMain.handle('ai:setApiKey', async (_, apiKey: string) => {
    store.set('anthropic_api_key', apiKey)
    return true
  })

  // ── Main chat with tool use loop ──────────────────────────────────────────
  ipcMain.handle('ai:chat', async (event, messages: AIMessage[], context: AIContext) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }

    const apiKey = store.get('anthropic_api_key', '') as string
    if (!apiKey) {
      return { error: 'No API key configured. Go to Settings to add your Anthropic API key.' }
    }

    const client = getClient()
    const contextName = context.clusterName || ''

    let systemPrompt = SYSTEM_PROMPT
    if (context.resourceType && context.resourceName) {
      systemPrompt += `\n\nCURRENT FOCUS: ${context.resourceType}/${context.resourceName}`
      if (context.namespace) systemPrompt += ` in namespace "${context.namespace}"`
      if (context.yaml) systemPrompt += `\n\nResource YAML already loaded:\n\`\`\`yaml\n${context.yaml}\n\`\`\``
      if (context.logs) systemPrompt += `\n\nRecent logs already loaded:\n\`\`\`\n${context.logs}\n\`\`\``
      if (context.events) systemPrompt += `\n\nEvents already loaded:\n\`\`\`\n${context.events}\n\`\`\``
    }

    type ConvMessage = { role: 'user' | 'assistant'; content: string | Anthropic.ContentBlock[] }
    const conv: ConvMessage[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    try {
      // Tool use agentic loop — max 10 iterations to prevent runaway
      for (let iteration = 0; iteration < 10; iteration++) {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: conv,
          tools: contextName ? K8S_TOOLS : []
        })

        // Stream text deltas to renderer
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta' &&
            chunk.delta.text
          ) {
            win.webContents.send('ai:stream', { delta: chunk.delta.text, done: false })
          }
        }

        const final = await stream.finalMessage()

        // No more tool calls — we're done
        if (final.stop_reason !== 'tool_use') {
          win.webContents.send('ai:stream', { delta: '', done: true })
          break
        }

        // Collect tool_use blocks from response
        const toolUseBlocks = final.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        )

        // Append assistant turn (with tool calls) to conversation
        conv.push({ role: 'assistant', content: final.content })

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (tu) => {
            win.webContents.send('ai:tool-call', {
              id: tu.id,
              name: tu.name,
              input: tu.input,
              status: 'running'
            })

            const result = await executeTool(
              tu.name,
              tu.input as Record<string, string>,
              contextName
            )

            win.webContents.send('ai:tool-call', {
              id: tu.id,
              name: tu.name,
              input: tu.input,
              status: 'done'
            })

            return {
              type: 'tool_result' as const,
              tool_use_id: tu.id,
              content: JSON.stringify(result, null, 2)
            }
          })
        )

        // Append tool results as user turn and loop
        conv.push({ role: 'user', content: toolResults })
      }

      return { success: true }
    } catch (err) {
      win.webContents.send('ai:stream', { delta: '', done: true })
      return { error: String(err) }
    }
  })

  // ── Diagnose (detail panel) ───────────────────────────────────────────────
  ipcMain.handle('ai:diagnose', async (event, context: AIContext) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }
    const apiKey = store.get('anthropic_api_key', '') as string
    if (!apiKey) return { error: 'No API key configured.' }

    const client = getClient()
    const parts = ['Diagnose this Kubernetes resource concisely. Give the root cause and exact fix:']
    if (context.resourceType && context.resourceName) parts.push(`\nResource: ${context.resourceType}/${context.resourceName}`)
    if (context.namespace) parts.push(`Namespace: ${context.namespace}`)
    if (context.logs) parts.push(`\nLogs:\n\`\`\`\n${context.logs.slice(-3000)}\n\`\`\``)
    if (context.events) parts.push(`\nEvents:\n\`\`\`\n${context.events.slice(-2000)}\n\`\`\``)
    if (context.yaml) parts.push(`\nYAML:\n\`\`\`yaml\n${context.yaml.slice(-3000)}\n\`\`\``)

    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: parts.join('\n') }]
      })
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          win.webContents.send('ai:diagnose-stream', { delta: chunk.delta.text, done: false })
        }
      }
      win.webContents.send('ai:diagnose-stream', { delta: '', done: true })
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // ── Cluster health (legacy) ───────────────────────────────────────────────
  ipcMain.handle('ai:clusterHealth', async (event, clusterSummary: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }
    const apiKey = store.get('anthropic_api_key', '') as string
    if (!apiKey) return { error: 'No API key configured.' }

    const client = getClient()
    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Analyze this Kubernetes cluster and give prioritized recommendations:\n\n${clusterSummary}` }]
      })
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          win.webContents.send('ai:health-stream', { delta: chunk.delta.text, done: false })
        }
      }
      win.webContents.send('ai:health-stream', { delta: '', done: true })
      return { success: true }
    } catch (err) {
      return { error: String(err) }
    }
  })
}
