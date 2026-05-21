import { create } from 'zustand'

export type ActiveView =
  | 'overview'
  | 'pods' | 'deployments' | 'statefulsets' | 'daemonsets' | 'jobs' | 'cronjobs'
  | 'services' | 'ingresses'
  | 'configmaps' | 'secrets'
  | 'pvcs'
  | 'nodes' | 'namespaces' | 'events'
  | 'terminal' | 'ai' | 'settings'

interface PanelDetail {
  kind: string
  name: string
  namespace: string
}

interface UIStore {
  activeView: ActiveView
  sidebarCollapsed: boolean
  detailPanel: PanelDetail | null
  aiPanelOpen: boolean
  collapsedSections: Record<string, boolean>
  setActiveView: (view: ActiveView) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  openDetail: (detail: PanelDetail) => void
  closeDetail: () => void
  setAIPanelOpen: (open: boolean) => void
  toggleSection: (section: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'overview',
  sidebarCollapsed: false,
  detailPanel: null,
  aiPanelOpen: false,
  collapsedSections: {},
  setActiveView: (activeView) => set({ activeView }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  openDetail: (detail) => set({ detailPanel: detail }),
  closeDetail: () => set({ detailPanel: null }),
  setAIPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
  toggleSection: (section) => set((s) => ({
    collapsedSections: { ...s.collapsedSections, [section]: !s.collapsedSections[section] }
  }))
}))
