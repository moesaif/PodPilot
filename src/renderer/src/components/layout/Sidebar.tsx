import React from 'react'
import {
  LayoutDashboard, Box, Layers, Database, Cpu, PlayCircle, Clock,
  Network, Globe, FileCode2, KeyRound, HardDrive, Server, Folder,
  AlertCircle, Terminal, Bot, Settings, ChevronLeft, ChevronRight, ChevronDown, Plus
} from 'lucide-react'
import { useUIStore, type ActiveView } from '../../stores/uiStore'
import { ClusterSwitcher } from '../k8s/ClusterSwitcher'
import { NamespacePicker } from '../k8s/NamespacePicker'
import { cn } from '../../lib/utils'

interface NavItem {
  id: ActiveView
  label: string
  icon: React.ComponentType<{ size?: number }>
  accent?: boolean
}

interface SidebarSection {
  id: string
  label: string
  items: NavItem[]
}

const SECTIONS: SidebarSection[] = [
  {
    id: 'workloads',
    label: 'Workloads',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'pods', label: 'Pods', icon: Box },
      { id: 'deployments', label: 'Deployments', icon: Layers },
      { id: 'statefulsets', label: 'StatefulSets', icon: Database },
      { id: 'daemonsets', label: 'DaemonSets', icon: Cpu },
      { id: 'jobs', label: 'Jobs', icon: PlayCircle },
      { id: 'cronjobs', label: 'CronJobs', icon: Clock },
    ]
  },
  {
    id: 'network',
    label: 'Network',
    items: [
      { id: 'services', label: 'Services', icon: Network },
      { id: 'ingresses', label: 'Ingresses', icon: Globe },
    ]
  },
  {
    id: 'config',
    label: 'Config',
    items: [
      { id: 'configmaps', label: 'ConfigMaps', icon: FileCode2 },
      { id: 'secrets', label: 'Secrets', icon: KeyRound },
    ]
  },
  {
    id: 'storage',
    label: 'Storage',
    items: [
      { id: 'pvcs', label: 'PV Claims', icon: HardDrive },
    ]
  },
  {
    id: 'cluster',
    label: 'Cluster',
    items: [
      { id: 'nodes', label: 'Nodes', icon: Server },
      { id: 'namespaces', label: 'Namespaces', icon: Folder },
      { id: 'events', label: 'Events', icon: AlertCircle },
    ]
  },
]

const TOOL_ITEMS: NavItem[] = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'ai', label: 'AI Assistant', icon: Bot, accent: true },
]

export function Sidebar(): React.ReactElement {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, collapsedSections, toggleSection } = useUIStore()

  return (
    <div
      className={cn(
        'flex flex-col bg-surface border-r border-border transition-all duration-200 flex-shrink-0',
        sidebarCollapsed ? 'w-12' : 'w-[192px]'
      )}
    >
      {/* Cluster + Namespace pickers */}
      {!sidebarCollapsed && (
        <div className="p-2 border-b border-border space-y-1">
          <ClusterSwitcher />
          <NamespacePicker />
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5">
        {SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.id]
          return (
            <div key={section.id} className="mb-1">
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-text-muted hover:text-text-secondary transition-colors"
                >
                  <span className="text-2xs uppercase tracking-[0.12em] font-semibold">{section.label}</span>
                  <ChevronDown
                    size={10}
                    className={cn('transition-transform duration-150', isCollapsed && '-rotate-90')}
                  />
                </button>
              )}
              {!isCollapsed && section.items.map(({ id, label, icon: Icon }) => (
                <NavButton
                  key={id}
                  active={activeView === id}
                  collapsed={sidebarCollapsed}
                  icon={<Icon size={14} />}
                  label={label}
                  onClick={() => setActiveView(id)}
                />
              ))}
            </div>
          )
        })}

        {/* Separator */}
        <div className="my-1.5 border-t border-border/60" />

        {/* Tools */}
        {!sidebarCollapsed && (
          <p className="text-text-muted text-2xs uppercase tracking-[0.12em] px-2 py-1 font-semibold">Tools</p>
        )}
        {TOOL_ITEMS.map(({ id, label, icon: Icon, accent }) => (
          <NavButton
            key={id}
            active={activeView === id}
            collapsed={sidebarCollapsed}
            icon={<Icon size={14} />}
            label={label}
            onClick={() => setActiveView(id)}
            accent={accent}
          />
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="border-t border-border py-2 px-1 space-y-0.5">
        <NavButton
          active={activeView === 'settings'}
          collapsed={sidebarCollapsed}
          icon={<Settings size={14} />}
          label="Settings"
          onClick={() => setActiveView('settings')}
        />
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors text-xs"
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>
    </div>
  )
}

interface NavButtonProps {
  active: boolean
  collapsed: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}

function NavButton({ active, collapsed, icon, label, onClick, accent }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'relative w-full flex items-center gap-2 py-1.5 rounded text-xs font-medium transition-all duration-150',
        collapsed ? 'justify-center px-0' : 'px-2.5',
        active
          ? 'bg-accent/[0.08] text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-hover',
        accent && !active && 'text-purple hover:text-purple'
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r-full" />
      )}
      <span className={cn('flex-shrink-0', active && 'text-accent', accent && !active && 'text-purple')}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}
