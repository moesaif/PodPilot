/// <reference types="vite/client" />

interface Window {
  api: {
    window: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
      onMaximized: (cb: (maximized: boolean) => void) => () => void
    }
    k8s: {
      getContexts: () => Promise<{ data: import('@shared/types').ClusterConfig[]; error: string | null }>
      setContext: (ctx: string) => Promise<{ data: boolean; error: string | null }>
      getPods: (ctx: string, ns: string) => Promise<{ data: import('@shared/types').PodInfo[]; error: string | null }>
      getDeployments: (ctx: string, ns: string) => Promise<{ data: import('@shared/types').DeploymentInfo[]; error: string | null }>
      getServices: (ctx: string, ns: string) => Promise<{ data: import('@shared/types').ServiceInfo[]; error: string | null }>
      getNodes: (ctx: string) => Promise<{ data: import('@shared/types').NodeInfo[]; error: string | null }>
      getNamespaces: (ctx: string) => Promise<{ data: import('@shared/types').NamespaceInfo[]; error: string | null }>
      getEvents: (ctx: string, ns: string) => Promise<{ data: import('@shared/types').EventInfo[]; error: string | null }>
      getPodLogs: (ctx: string, ns: string, pod: string, container?: string) => Promise<{ data: string; error: string | null }>
      getResourceYaml: (ctx: string, ns: string, kind: string, name: string) => Promise<{ data: string; error: string | null }>
      getClusterMetrics: (ctx: string) => Promise<{ data: import('@shared/types').ClusterMetrics; error: string | null }>
      applyYaml: (ctx: string, yaml: string) => Promise<{ data: { success: boolean; message: string }; error: string | null }>
    }
    ai: {
      getApiKey: () => Promise<string>
      setApiKey: (key: string) => Promise<boolean>
      chat: (messages: unknown[], context: unknown) => Promise<{ success?: boolean; error?: string }>
      diagnose: (context: unknown) => Promise<{ success?: boolean; error?: string }>
      clusterHealth: (summary: string) => Promise<{ success?: boolean; error?: string }>
      onStream: (cb: (data: { delta: string; done: boolean }) => void) => () => void
      onDiagnoseStream: (cb: (data: { delta: string; done: boolean }) => void) => () => void
      onHealthStream: (cb: (data: { delta: string; done: boolean }) => void) => () => void
    }
    terminal: {
      create: (id: string, context?: string) => Promise<{ success: boolean }>
      write: (id: string, data: string) => Promise<void>
      resize: (id: string, cols: number, rows: number) => Promise<void>
      destroy: (id: string) => Promise<void>
      onData: (id: string, cb: (data: string) => void) => () => void
      onExit: (id: string, cb: () => void) => () => void
    }
  }
}
