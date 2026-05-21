import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (cb: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximized', (_, v) => cb(v))
      return () => ipcRenderer.removeAllListeners('window:maximized')
    }
  },

  k8s: {
    getContexts: () => ipcRenderer.invoke('k8s:getContexts'),
    setContext: (ctx: string) => ipcRenderer.invoke('k8s:setContext', ctx),
    testConnection: (ctx: string) => ipcRenderer.invoke('k8s:testConnection', ctx),
    importKubeconfig: (content: string) => ipcRenderer.invoke('k8s:importKubeconfig', content),
    getPods: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getPods', ctx, ns),
    getDeployments: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getDeployments', ctx, ns),
    getStatefulSets: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getStatefulSets', ctx, ns),
    getDaemonSets: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getDaemonSets', ctx, ns),
    getJobs: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getJobs', ctx, ns),
    getCronJobs: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getCronJobs', ctx, ns),
    getServices: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getServices', ctx, ns),
    getIngresses: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getIngresses', ctx, ns),
    getNodes: (ctx: string) => ipcRenderer.invoke('k8s:getNodes', ctx),
    getNamespaces: (ctx: string) => ipcRenderer.invoke('k8s:getNamespaces', ctx),
    getConfigMaps: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getConfigMaps', ctx, ns),
    getSecrets: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getSecrets', ctx, ns),
    getPersistentVolumeClaims: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getPersistentVolumeClaims', ctx, ns),
    getEvents: (ctx: string, ns: string) => ipcRenderer.invoke('k8s:getEvents', ctx, ns),
    getPodLogs: (ctx: string, ns: string, pod: string, container?: string) =>
      ipcRenderer.invoke('k8s:getPodLogs', ctx, ns, pod, container),
    getResourceYaml: (ctx: string, ns: string, kind: string, name: string) =>
      ipcRenderer.invoke('k8s:getResourceYaml', ctx, ns, kind, name),
    getClusterMetrics: (ctx: string) => ipcRenderer.invoke('k8s:getClusterMetrics', ctx),
    applyYaml: (ctx: string, yaml: string) => ipcRenderer.invoke('k8s:applyYaml', ctx, yaml)
  },

  ai: {
    getApiKey: () => ipcRenderer.invoke('ai:getApiKey'),
    setApiKey: (key: string) => ipcRenderer.invoke('ai:setApiKey', key),
    chat: (messages: unknown[], context: unknown) => ipcRenderer.invoke('ai:chat', messages, context),
    diagnose: (context: unknown) => ipcRenderer.invoke('ai:diagnose', context),
    clusterHealth: (summary: string) => ipcRenderer.invoke('ai:clusterHealth', summary),
    onStream: (cb: (data: { delta: string; done: boolean }) => void) => {
      ipcRenderer.on('ai:stream', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('ai:stream')
    },
    onDiagnoseStream: (cb: (data: { delta: string; done: boolean }) => void) => {
      ipcRenderer.on('ai:diagnose-stream', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('ai:diagnose-stream')
    },
    onHealthStream: (cb: (data: { delta: string; done: boolean }) => void) => {
      ipcRenderer.on('ai:health-stream', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('ai:health-stream')
    },
    onToolCall: (cb: (data: { id: string; name: string; input: Record<string, unknown>; status: 'running' | 'done' }) => void) => {
      ipcRenderer.on('ai:tool-call', (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners('ai:tool-call')
    }
  },

  terminal: {
    create: (id: string, context?: string) => ipcRenderer.invoke('terminal:create', id, context),
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    destroy: (id: string) => ipcRenderer.invoke('terminal:destroy', id),
    onData: (id: string, cb: (data: string) => void) => {
      ipcRenderer.on(`terminal:data:${id}`, (_, data) => cb(data))
      return () => ipcRenderer.removeAllListeners(`terminal:data:${id}`)
    },
    onExit: (id: string, cb: () => void) => {
      ipcRenderer.on(`terminal:exit:${id}`, () => cb())
      return () => ipcRenderer.removeAllListeners(`terminal:exit:${id}`)
    }
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error
  window.electron = electronAPI
  // @ts-expect-error
  window.api = api
}
