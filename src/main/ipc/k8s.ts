import { ipcMain } from 'electron'
import { k8sManager } from '../k8s/client'

export function registerK8sHandlers(): void {
  ipcMain.handle('k8s:getContexts', async () => {
    try { return { data: k8sManager.getContexts(), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:setContext', async (_, contextName: string) => {
    try { k8sManager.setContext(contextName); return { data: true, error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:testConnection', async (_, contextName: string) => {
    try { return { data: await k8sManager.testConnection(contextName), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:importKubeconfig', async (_, content: string) => {
    try {
      const contexts = k8sManager.addKubeconfigContent(content)
      return { data: { contexts, allContexts: k8sManager.getContexts() }, error: null }
    } catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getPods', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getPods(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getDeployments', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getDeployments(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getStatefulSets', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getStatefulSets(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getDaemonSets', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getDaemonSets(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getJobs', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getJobs(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getCronJobs', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getCronJobs(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getServices', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getServices(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getIngresses', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getIngresses(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getNodes', async (_, ctx: string) => {
    try { return { data: await k8sManager.getNodes(ctx), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getNamespaces', async (_, ctx: string) => {
    try { return { data: await k8sManager.getNamespaces(ctx), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getConfigMaps', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getConfigMaps(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getSecrets', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getSecrets(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getPersistentVolumeClaims', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getPersistentVolumeClaims(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getEvents', async (_, ctx: string, ns: string) => {
    try { return { data: await k8sManager.getEvents(ctx, ns), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getPodLogs', async (_, ctx: string, ns: string, pod: string, container?: string) => {
    try { return { data: await k8sManager.getPodLogs(ctx, ns, pod, container), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getResourceYaml', async (_, ctx: string, ns: string, kind: string, name: string) => {
    try { return { data: await k8sManager.getResourceYaml(ctx, ns, kind, name), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:getClusterMetrics', async (_, ctx: string) => {
    try { return { data: await k8sManager.getClusterMetrics(ctx), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })

  ipcMain.handle('k8s:applyYaml', async (_, ctx: string, yaml: string) => {
    try { return { data: await k8sManager.applyYaml(ctx, yaml), error: null } }
    catch (err) { return { data: null, error: String(err) } }
  })
}
