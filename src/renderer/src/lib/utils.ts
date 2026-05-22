import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'running' || s === 'active' || s === 'ready' || s === 'true') return 'text-green-400'
  if (s === 'pending' || s === 'containercreating' || s === 'init:') return 'text-yellow-400'
  if (s === 'failed' || s === 'crashloopbackoff' || s === 'error' || s === 'oomkilled') return 'text-red-400'
  if (s === 'terminating' || s === 'notready') return 'text-orange-400'
  return 'text-slate-400'
}

export function getStatusDot(status: string): string {
  const s = status.toLowerCase()
  if (s === 'running' || s === 'active' || s === 'ready' || s === 'true') return 'bg-green'
  if (s === 'pending' || s === 'containercreating') return 'bg-yellow'
  if (s === 'failed' || s === 'crashloopbackoff' || s === 'error') return 'bg-red'
  if (s === 'terminating') return 'bg-orange'
  return 'bg-slate-500'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'Ki', 'Mi', 'Gi', 'Ti']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function parseKubeMemory(mem: string): number {
  if (!mem) return 0
  if (mem.endsWith('Ki')) return parseInt(mem) * 1024
  if (mem.endsWith('Mi')) return parseInt(mem) * 1024 * 1024
  if (mem.endsWith('Gi')) return parseInt(mem) * 1024 * 1024 * 1024
  return parseInt(mem) || 0
}

export function renderMarkdown(text: string): string {
  // Protect code blocks first, replace after other transforms
  const codeBlocks: string[] = []
  let result = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.push(`<pre><code>${code.trimEnd()}</code></pre>`) - 1
    return `\x00CODE${idx}\x00`
  })

  result = result
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Wrap consecutive list lines in <ul>
    .replace(/((?:^[*-] .+(?:\n|$))+)/gm, (block) => {
      const items = block.trim().split('\n').filter(Boolean)
        .map((line) => `<li>${line.replace(/^[*-] /, '')}</li>`).join('')
      return `<ul>${items}</ul>`
    })
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    // Restore code blocks
    .replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)])

  return result
}
