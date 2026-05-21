export interface ClusterConfig {
  id: string
  name: string
  context: string
  server: string
  namespace: string
  isActive: boolean
  addedAt: number
}

export interface PodInfo {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  ip: string
  containers: ContainerInfo[]
  labels: Record<string, string>
  createdAt: string
}

export interface ContainerInfo {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
  reason?: string
  message?: string
}

export interface DeploymentInfo {
  name: string
  namespace: string
  ready: string
  upToDate: number
  available: number
  age: string
  image: string
  replicas: number
}

export interface StatefulSetInfo {
  name: string
  namespace: string
  ready: string
  age: string
  image: string
  replicas: number
  serviceName: string
}

export interface DaemonSetInfo {
  name: string
  namespace: string
  desired: number
  current: number
  ready: number
  upToDate: number
  age: string
  image: string
}

export interface JobInfo {
  name: string
  namespace: string
  completions: string
  duration: string
  age: string
  status: 'Complete' | 'Running' | 'Failed' | 'Suspended'
}

export interface CronJobInfo {
  name: string
  namespace: string
  schedule: string
  suspend: boolean
  active: number
  lastSchedule: string
  age: string
}

export interface ServiceInfo {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIP: string
  ports: string
  age: string
}

export interface IngressInfo {
  name: string
  namespace: string
  className: string
  hosts: string
  address: string
  ports: string
  age: string
}

export interface NodeInfo {
  name: string
  status: string
  roles: string
  age: string
  version: string
  os: string
  kernelVersion: string
  containerRuntime: string
  cpu: string
  memory: string
  cpuUsage?: number
  memoryUsage?: number
}

export interface NamespaceInfo {
  name: string
  status: string
  age: string
}

export interface ConfigMapInfo {
  name: string
  namespace: string
  dataKeys: string[]
  age: string
}

export interface SecretInfo {
  name: string
  namespace: string
  type: string
  keyCount: number
  age: string
}

export interface PVCInfo {
  name: string
  namespace: string
  status: string
  volume: string
  capacity: string
  accessModes: string
  storageClass: string
  age: string
}

export interface LogEntry {
  timestamp: string
  container: string
  message: string
}

export interface EventInfo {
  name: string
  namespace: string
  type: string
  reason: string
  object: string
  message: string
  count: number
  firstTime: string
  lastTime: string
}

export interface ClusterMetrics {
  cpuUsage: number
  memoryUsage: number
  podCount: number
  nodeCount: number
  deploymentCount: number
  serviceCount: number
  namespaceCount: number
  configMapCount: number
  secretCount: number
  healthyPods: number
  unhealthyPods: number
  pendingPods: number
  succeededPods: number
  podsByNamespace: Record<string, number>
  podsByStatus: Record<string, number>
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AIContext {
  clusterName?: string
  namespace?: string
  resourceType?: string
  resourceName?: string
  logs?: string
  events?: string
  yaml?: string
}

export type ResourceKind =
  | 'pods'
  | 'deployments'
  | 'statefulsets'
  | 'daemonsets'
  | 'jobs'
  | 'cronjobs'
  | 'services'
  | 'ingresses'
  | 'nodes'
  | 'namespaces'
  | 'configmaps'
  | 'secrets'
  | 'persistentvolumeclaims'
  | 'persistentvolumes'
