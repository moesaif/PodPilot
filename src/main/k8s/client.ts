import * as k8s from '@kubernetes/client-node'
import * as path from 'path'
import * as os from 'os'
import * as YAML from 'yaml'
import type {
  ClusterConfig, PodInfo, DeploymentInfo, ServiceInfo, NodeInfo,
  NamespaceInfo, EventInfo, ClusterMetrics, StatefulSetInfo, DaemonSetInfo,
  JobInfo, CronJobInfo, IngressInfo, ConfigMapInfo, SecretInfo, PVCInfo
} from '../../shared/types'

class K8sClientManager {
  private activeContext: string | null = null
  private extraKubeconfigContents: string[] = []

  getKubeConfig(): k8s.KubeConfig {
    const kc = new k8s.KubeConfig()
    try {
      kc.loadFromDefault()
    } catch {
      try {
        kc.loadFromFile(path.join(os.homedir(), '.kube', 'config'))
      } catch {
        kc.loadFromClusterAndUser(
          { name: 'default', server: '' } as k8s.Cluster,
          { name: 'default' } as k8s.User
        )
      }
    }

    // Merge any extra kubeconfigs
    for (const content of this.extraKubeconfigContents) {
      try {
        const extraKc = new k8s.KubeConfig()
        extraKc.loadFromString(content)
        for (const cluster of extraKc.clusters) {
          if (!kc.clusters.find((c) => c.name === cluster.name)) {
            kc.clusters.push(cluster)
          }
        }
        for (const user of extraKc.users) {
          if (!kc.users.find((u) => u.name === user.name)) {
            kc.users.push(user)
          }
        }
        for (const ctx of extraKc.contexts) {
          if (!kc.contexts.find((c) => c.name === ctx.name)) {
            kc.contexts.push(ctx)
          }
        }
      } catch { /* skip invalid */ }
    }

    return kc
  }

  addKubeconfigContent(content: string): string[] {
    const kc = new k8s.KubeConfig()
    kc.loadFromString(content)
    const newContexts = kc.getContexts().map((c) => c.name)
    if (newContexts.length > 0) {
      this.extraKubeconfigContents.push(content)
    }
    return newContexts
  }

  getContexts(): ClusterConfig[] {
    const kc = this.getKubeConfig()
    const contexts = kc.getContexts()
    const currentContext = kc.getCurrentContext()

    return contexts.map((ctx) => {
      const cluster = kc.getCluster(ctx.cluster)
      return {
        id: ctx.name,
        name: ctx.name,
        context: ctx.name,
        server: cluster?.server || 'unknown',
        namespace: ctx.namespace || 'default',
        isActive: ctx.name === currentContext,
        addedAt: Date.now()
      }
    })
  }

  setContext(contextName: string): void {
    this.activeContext = contextName
  }

  private getClientForContext(contextName: string) {
    const kc = this.getKubeConfig()
    kc.setCurrentContext(contextName)
    return kc
  }

  async testConnection(contextName: string): Promise<{ ok: boolean; version?: string; error?: string }> {
    try {
      const kc = this.getClientForContext(contextName)
      const versionApi = kc.makeApiClient(k8s.VersionApi)
      const { body } = await versionApi.getCode()
      return { ok: true, version: `${body.major}.${body.minor}` }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  }

  async getPods(contextName: string, namespace = 'default'): Promise<PodInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listPodForAllNamespaces()
      : await coreApi.listNamespacedPod(namespace)

    return (body.items || []).map((pod) => {
      const status = pod.status
      const containers = pod.spec?.containers || []
      const containerStatuses = status?.containerStatuses || []
      const readyCount = containerStatuses.filter((cs) => cs.ready).length
      const podStatus = status?.phase || 'Unknown'

      return {
        name: pod.metadata?.name || '',
        namespace: pod.metadata?.namespace || namespace,
        status: podStatus,
        ready: `${readyCount}/${containers.length}`,
        restarts: containerStatuses.reduce((sum, cs) => sum + (cs.restartCount || 0), 0),
        age: getAge(pod.metadata?.creationTimestamp),
        node: pod.spec?.nodeName || '',
        ip: status?.podIP || '',
        containers: containerStatuses.map((cs) => ({
          name: cs.name,
          image: containers.find((c) => c.name === cs.name)?.image || '',
          ready: cs.ready,
          restartCount: cs.restartCount || 0,
          state: Object.keys(cs.state || {})[0] || 'unknown',
          reason: (cs.state?.waiting?.reason || cs.state?.terminated?.reason),
          message: (cs.state?.waiting?.message || cs.state?.terminated?.message)
        })),
        labels: pod.metadata?.labels || {},
        createdAt: pod.metadata?.creationTimestamp?.toISOString() || ''
      }
    })
  }

  async getDeployments(contextName: string, namespace = 'default'): Promise<DeploymentInfo[]> {
    const kc = this.getClientForContext(contextName)
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const { body } = namespace === 'all'
      ? await appsApi.listDeploymentForAllNamespaces()
      : await appsApi.listNamespacedDeployment(namespace)

    return (body.items || []).map((dep) => {
      const spec = dep.spec
      const status = dep.status
      const containers = spec?.template.spec?.containers || []
      return {
        name: dep.metadata?.name || '',
        namespace: dep.metadata?.namespace || namespace,
        ready: `${status?.readyReplicas || 0}/${spec?.replicas || 0}`,
        upToDate: status?.updatedReplicas || 0,
        available: status?.availableReplicas || 0,
        age: getAge(dep.metadata?.creationTimestamp),
        image: containers[0]?.image || '',
        replicas: spec?.replicas || 0
      }
    })
  }

  async getStatefulSets(contextName: string, namespace = 'default'): Promise<StatefulSetInfo[]> {
    const kc = this.getClientForContext(contextName)
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const { body } = namespace === 'all'
      ? await appsApi.listStatefulSetForAllNamespaces()
      : await appsApi.listNamespacedStatefulSet(namespace)

    return (body.items || []).map((ss) => {
      const containers = ss.spec?.template.spec?.containers || []
      return {
        name: ss.metadata?.name || '',
        namespace: ss.metadata?.namespace || namespace,
        ready: `${ss.status?.readyReplicas || 0}/${ss.spec?.replicas || 0}`,
        age: getAge(ss.metadata?.creationTimestamp),
        image: containers[0]?.image || '',
        replicas: ss.spec?.replicas || 0,
        serviceName: ss.spec?.serviceName || ''
      }
    })
  }

  async getDaemonSets(contextName: string, namespace = 'default'): Promise<DaemonSetInfo[]> {
    const kc = this.getClientForContext(contextName)
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const { body } = namespace === 'all'
      ? await appsApi.listDaemonSetForAllNamespaces()
      : await appsApi.listNamespacedDaemonSet(namespace)

    return (body.items || []).map((ds) => {
      const containers = ds.spec?.template.spec?.containers || []
      return {
        name: ds.metadata?.name || '',
        namespace: ds.metadata?.namespace || namespace,
        desired: ds.status?.desiredNumberScheduled || 0,
        current: ds.status?.currentNumberScheduled || 0,
        ready: ds.status?.numberReady || 0,
        upToDate: ds.status?.updatedNumberScheduled || 0,
        age: getAge(ds.metadata?.creationTimestamp),
        image: containers[0]?.image || ''
      }
    })
  }

  async getJobs(contextName: string, namespace = 'default'): Promise<JobInfo[]> {
    const kc = this.getClientForContext(contextName)
    const batchApi = kc.makeApiClient(k8s.BatchV1Api)

    const { body } = namespace === 'all'
      ? await batchApi.listJobForAllNamespaces()
      : await batchApi.listNamespacedJob(namespace)

    return (body.items || []).map((job) => {
      const conditions = job.status?.conditions || []
      const isComplete = conditions.some((c) => c.type === 'Complete' && c.status === 'True')
      const isFailed = conditions.some((c) => c.type === 'Failed' && c.status === 'True')
      const isSuspended = job.spec?.suspend === true

      let status: JobInfo['status'] = 'Running'
      if (isComplete) status = 'Complete'
      else if (isFailed) status = 'Failed'
      else if (isSuspended) status = 'Suspended'

      const startTime = job.status?.startTime
      const completionTime = job.status?.completionTime
      const duration = startTime && completionTime
        ? getDuration(startTime, completionTime)
        : startTime ? `${getAge(startTime)} (running)` : '—'

      const spec = job.spec?.completions
      const succeeded = job.status?.succeeded || 0

      return {
        name: job.metadata?.name || '',
        namespace: job.metadata?.namespace || namespace,
        completions: `${succeeded}/${spec || 1}`,
        duration,
        age: getAge(job.metadata?.creationTimestamp),
        status
      }
    })
  }

  async getCronJobs(contextName: string, namespace = 'default'): Promise<CronJobInfo[]> {
    const kc = this.getClientForContext(contextName)
    const batchApi = kc.makeApiClient(k8s.BatchV1Api)

    const { body } = namespace === 'all'
      ? await batchApi.listCronJobForAllNamespaces()
      : await batchApi.listNamespacedCronJob(namespace)

    return (body.items || []).map((cj) => {
      const lastSchedule = cj.status?.lastScheduleTime
      return {
        name: cj.metadata?.name || '',
        namespace: cj.metadata?.namespace || namespace,
        schedule: cj.spec?.schedule || '',
        suspend: cj.spec?.suspend || false,
        active: (cj.status?.active || []).length,
        lastSchedule: lastSchedule ? getAge(lastSchedule) + ' ago' : 'never',
        age: getAge(cj.metadata?.creationTimestamp)
      }
    })
  }

  async getServices(contextName: string, namespace = 'default'): Promise<ServiceInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listServiceForAllNamespaces()
      : await coreApi.listNamespacedService(namespace)

    return (body.items || []).map((svc) => {
      const spec = svc.spec
      const ports = (spec?.ports || [])
        .map((p) => `${p.port}${p.targetPort ? ':' + p.targetPort : ''}/${p.protocol || 'TCP'}`)
        .join(', ')
      const externalIPs = svc.status?.loadBalancer?.ingress?.map((i) => i.ip || i.hostname).join(', ') || '<none>'
      return {
        name: svc.metadata?.name || '',
        namespace: svc.metadata?.namespace || namespace,
        type: spec?.type || 'ClusterIP',
        clusterIP: spec?.clusterIP || '',
        externalIP: externalIPs,
        ports,
        age: getAge(svc.metadata?.creationTimestamp)
      }
    })
  }

  async getIngresses(contextName: string, namespace = 'default'): Promise<IngressInfo[]> {
    const kc = this.getClientForContext(contextName)
    const networkApi = kc.makeApiClient(k8s.NetworkingV1Api)

    const { body } = namespace === 'all'
      ? await networkApi.listIngressForAllNamespaces()
      : await networkApi.listNamespacedIngress(namespace)

    return (body.items || []).map((ing) => {
      const rules = ing.spec?.rules || []
      const hosts = rules.map((r) => r.host || '*').join(', ') || '*'
      const addresses = ing.status?.loadBalancer?.ingress?.map((i) => i.ip || i.hostname).join(', ') || ''
      const hasTLS = (ing.spec?.tls || []).length > 0
      const ports = hasTLS ? '80, 443' : '80'

      return {
        name: ing.metadata?.name || '',
        namespace: ing.metadata?.namespace || namespace,
        className: ing.spec?.ingressClassName || ing.metadata?.annotations?.['kubernetes.io/ingress.class'] || '',
        hosts,
        address: addresses,
        ports,
        age: getAge(ing.metadata?.creationTimestamp)
      }
    })
  }

  async getNodes(contextName: string): Promise<NodeInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = await coreApi.listNode()

    return (body.items || []).map((node) => {
      const conditions = node.status?.conditions || []
      const readyCondition = conditions.find((c) => c.type === 'Ready')
      const status = readyCondition?.status === 'True' ? 'Ready' : 'NotReady'
      const labels = node.metadata?.labels || {}
      const roles = Object.keys(labels)
        .filter((k) => k.startsWith('node-role.kubernetes.io/'))
        .map((k) => k.replace('node-role.kubernetes.io/', ''))
        .join(',') || 'worker'
      const allocatable = node.status?.allocatable || {}
      const capacity = node.status?.capacity || {}
      return {
        name: node.metadata?.name || '',
        status,
        roles,
        age: getAge(node.metadata?.creationTimestamp),
        version: node.status?.nodeInfo?.kubeletVersion || '',
        os: node.status?.nodeInfo?.osImage || '',
        kernelVersion: node.status?.nodeInfo?.kernelVersion || '',
        containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion || '',
        cpu: allocatable['cpu'] || capacity['cpu'] || '',
        memory: allocatable['memory'] || capacity['memory'] || ''
      }
    })
  }

  async getNamespaces(contextName: string): Promise<NamespaceInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)
    const { body } = await coreApi.listNamespace()
    return (body.items || []).map((ns) => ({
      name: ns.metadata?.name || '',
      status: ns.status?.phase || 'Active',
      age: getAge(ns.metadata?.creationTimestamp)
    }))
  }

  async getConfigMaps(contextName: string, namespace = 'default'): Promise<ConfigMapInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listConfigMapForAllNamespaces()
      : await coreApi.listNamespacedConfigMap(namespace)

    return (body.items || [])
      .filter((cm) => !cm.metadata?.name?.startsWith('kube-'))
      .map((cm) => ({
        name: cm.metadata?.name || '',
        namespace: cm.metadata?.namespace || namespace,
        dataKeys: Object.keys(cm.data || {}),
        age: getAge(cm.metadata?.creationTimestamp)
      }))
  }

  async getSecrets(contextName: string, namespace = 'default'): Promise<SecretInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listSecretForAllNamespaces()
      : await coreApi.listNamespacedSecret(namespace)

    return (body.items || [])
      .filter((s) => s.type !== 'kubernetes.io/service-account-token' || !s.metadata?.name?.startsWith('default-token'))
      .map((s) => ({
        name: s.metadata?.name || '',
        namespace: s.metadata?.namespace || namespace,
        type: s.type || 'Opaque',
        keyCount: Object.keys(s.data || {}).length,
        age: getAge(s.metadata?.creationTimestamp)
      }))
  }

  async getPersistentVolumeClaims(contextName: string, namespace = 'default'): Promise<PVCInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listPersistentVolumeClaimForAllNamespaces()
      : await coreApi.listNamespacedPersistentVolumeClaim(namespace)

    return (body.items || []).map((pvc) => ({
      name: pvc.metadata?.name || '',
      namespace: pvc.metadata?.namespace || namespace,
      status: pvc.status?.phase || 'Unknown',
      volume: pvc.spec?.volumeName || '',
      capacity: pvc.status?.capacity?.['storage'] || pvc.spec?.resources?.requests?.['storage'] || '',
      accessModes: (pvc.spec?.accessModes || []).join(', '),
      storageClass: pvc.spec?.storageClassName || '',
      age: getAge(pvc.metadata?.creationTimestamp)
    }))
  }

  async getEvents(contextName: string, namespace = 'default'): Promise<EventInfo[]> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)

    const { body } = namespace === 'all'
      ? await coreApi.listEventForAllNamespaces()
      : await coreApi.listNamespacedEvent(namespace)

    const events = body.items || []
    events.sort((a, b) => {
      const aTime = a.lastTimestamp?.getTime() || 0
      const bTime = b.lastTimestamp?.getTime() || 0
      return bTime - aTime
    })

    return events.slice(0, 200).map((evt) => ({
      name: evt.metadata?.name || '',
      namespace: evt.metadata?.namespace || namespace,
      type: evt.type || 'Normal',
      reason: evt.reason || '',
      object: `${evt.involvedObject.kind}/${evt.involvedObject.name}`,
      message: evt.message || '',
      count: evt.count || 1,
      firstTime: evt.firstTimestamp?.toISOString() || '',
      lastTime: evt.lastTimestamp?.toISOString() || ''
    }))
  }

  async getPodLogs(contextName: string, namespace: string, podName: string, container?: string, tail = 300): Promise<string> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)
    const { body } = await coreApi.readNamespacedPodLog(
      podName, namespace, container,
      undefined, undefined, undefined, undefined, undefined, undefined, tail
    )
    return body || ''
  }

  async getResourceYaml(contextName: string, namespace: string, kind: string, name: string): Promise<string> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)
    const batchApi = kc.makeApiClient(k8s.BatchV1Api)
    const networkApi = kc.makeApiClient(k8s.NetworkingV1Api)

    let obj: object | null = null

    switch (kind.toLowerCase()) {
      case 'pod': { const r = await coreApi.readNamespacedPod(name, namespace); obj = r.body; break }
      case 'deployment': { const r = await appsApi.readNamespacedDeployment(name, namespace); obj = r.body; break }
      case 'statefulset': { const r = await appsApi.readNamespacedStatefulSet(name, namespace); obj = r.body; break }
      case 'daemonset': { const r = await appsApi.readNamespacedDaemonSet(name, namespace); obj = r.body; break }
      case 'job': { const r = await batchApi.readNamespacedJob(name, namespace); obj = r.body; break }
      case 'cronjob': { const r = await batchApi.readNamespacedCronJob(name, namespace); obj = r.body; break }
      case 'service': { const r = await coreApi.readNamespacedService(name, namespace); obj = r.body; break }
      case 'ingress': { const r = await networkApi.readNamespacedIngress(name, namespace); obj = r.body; break }
      case 'configmap': { const r = await coreApi.readNamespacedConfigMap(name, namespace); obj = r.body; break }
      case 'secret': { const r = await coreApi.readNamespacedSecret(name, namespace); obj = r.body; break }
      case 'persistentvolumeclaim': { const r = await coreApi.readNamespacedPersistentVolumeClaim(name, namespace); obj = r.body; break }
      case 'namespace': { const r = await coreApi.readNamespace(name); obj = r.body; break }
      case 'node': { const r = await coreApi.readNode(name); obj = r.body; break }
      default: return '# Resource type not supported for YAML view'
    }

    return YAML.stringify(obj)
  }

  async getClusterMetrics(contextName: string): Promise<ClusterMetrics> {
    const kc = this.getClientForContext(contextName)
    const coreApi = kc.makeApiClient(k8s.CoreV1Api)
    const appsApi = kc.makeApiClient(k8s.AppsV1Api)

    const [pods, nodes, deployments, services, namespaces, configMaps, secrets] = await Promise.all([
      coreApi.listPodForAllNamespaces(),
      coreApi.listNode(),
      appsApi.listDeploymentForAllNamespaces(),
      coreApi.listServiceForAllNamespaces(),
      coreApi.listNamespace(),
      coreApi.listConfigMapForAllNamespaces().catch(() => ({ body: { items: [] } })),
      coreApi.listSecretForAllNamespaces().catch(() => ({ body: { items: [] } }))
    ])

    const podItems = pods.body.items || []

    const podsByStatus: Record<string, number> = {}
    const podsByNamespace: Record<string, number> = {}

    for (const pod of podItems) {
      const phase = pod.status?.phase || 'Unknown'
      podsByStatus[phase] = (podsByStatus[phase] || 0) + 1

      const ns = pod.metadata?.namespace || 'default'
      podsByNamespace[ns] = (podsByNamespace[ns] || 0) + 1
    }

    const healthyPods = podsByStatus['Running'] || 0
    const pendingPods = podsByStatus['Pending'] || 0
    const succeededPods = podsByStatus['Succeeded'] || 0
    const failedPods = podsByStatus['Failed'] || 0
    const unknownPods = podsByStatus['Unknown'] || 0
    const unhealthyPods = failedPods + unknownPods

    return {
      cpuUsage: 0,
      memoryUsage: 0,
      podCount: podItems.length,
      nodeCount: (nodes.body.items || []).length,
      deploymentCount: (deployments.body.items || []).length,
      serviceCount: (services.body.items || []).length,
      namespaceCount: (namespaces.body.items || []).length,
      configMapCount: (configMaps.body.items || []).filter((cm) => !cm.metadata?.name?.startsWith('kube-')).length,
      secretCount: (secrets.body.items || []).length,
      healthyPods,
      unhealthyPods,
      pendingPods,
      succeededPods,
      podsByNamespace,
      podsByStatus
    }
  }

  async applyYaml(contextName: string, yamlContent: string): Promise<{ success: boolean; message: string }> {
    try {
      const kc = this.getClientForContext(contextName)
      const documents = YAML.parseAllDocuments(yamlContent)
      const client = k8s.KubernetesObjectApi.makeApiClient(kc)

      for (const doc of documents) {
        const obj = doc.toJS() as k8s.KubernetesObject
        if (!obj || !obj.kind) continue
        try {
          await client.read(obj)
          await client.patch(obj, undefined, undefined, 'application/apply-patch+yaml', undefined, {
            headers: { 'Content-Type': 'application/apply-patch+yaml' }
          })
        } catch {
          await client.create(obj)
        }
      }

      return { success: true, message: 'Applied successfully' }
    } catch (err) {
      return { success: false, message: String(err) }
    }
  }
}

function getAge(timestamp: Date | undefined): string {
  if (!timestamp) return 'unknown'
  const now = Date.now()
  const created = new Date(timestamp).getTime()
  const diff = now - created
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

function getDuration(start: Date, end: Date): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

export const k8sManager = new K8sClientManager()
