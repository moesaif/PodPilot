import { create } from 'zustand'
import type { ClusterConfig, NamespaceInfo } from '@shared/types'

interface ClusterStore {
  clusters: ClusterConfig[]
  activeCluster: string | null
  activeNamespace: string
  namespaces: NamespaceInfo[]
  setClusters: (clusters: ClusterConfig[]) => void
  setActiveCluster: (id: string | null) => void
  setActiveNamespace: (ns: string) => void
  setNamespaces: (ns: NamespaceInfo[]) => void
}

export const useClusterStore = create<ClusterStore>((set) => ({
  clusters: [],
  activeCluster: null,
  activeNamespace: 'default',
  namespaces: [],
  setClusters: (clusters) => set({ clusters }),
  setActiveCluster: (id) => set({ activeCluster: id }),
  setActiveNamespace: (ns) => set({ activeNamespace: ns }),
  setNamespaces: (namespaces) => set({ namespaces })
}))
