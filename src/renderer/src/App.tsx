import React from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { AIPanel } from './components/ai/AIPanel'
import { DetailPanel } from './components/k8s/DetailPanel'
import { useUIStore } from './stores/uiStore'
import { OverviewPage } from './pages/OverviewPage'
import { PodsPage } from './pages/PodsPage'
import { DeploymentsPage } from './pages/DeploymentsPage'
import { StatefulSetsPage } from './pages/StatefulSetsPage'
import { DaemonSetsPage } from './pages/DaemonSetsPage'
import { JobsPage } from './pages/JobsPage'
import { CronJobsPage } from './pages/CronJobsPage'
import { ServicesPage } from './pages/ServicesPage'
import { IngressesPage } from './pages/IngressesPage'
import { ConfigMapsPage } from './pages/ConfigMapsPage'
import { SecretsPage } from './pages/SecretsPage'
import { PVCsPage } from './pages/PVCsPage'
import { NodesPage } from './pages/NodesPage'
import { NamespacesPage } from './pages/NamespacesPage'
import { EventsPage } from './pages/EventsPage'
import { TerminalPage } from './pages/TerminalPage'
import { SettingsPage } from './pages/SettingsPage'
import { AIFullPage } from './pages/AIFullPage'

export default function App(): React.ReactElement {
  const { activeView, aiPanelOpen, setAIPanelOpen, detailPanel } = useUIStore()

  const renderPage = () => {
    switch (activeView) {
      case 'overview':      return <OverviewPage />
      case 'pods':          return <PodsPage />
      case 'deployments':   return <DeploymentsPage />
      case 'statefulsets':  return <StatefulSetsPage />
      case 'daemonsets':    return <DaemonSetsPage />
      case 'jobs':          return <JobsPage />
      case 'cronjobs':      return <CronJobsPage />
      case 'services':      return <ServicesPage />
      case 'ingresses':     return <IngressesPage />
      case 'configmaps':    return <ConfigMapsPage />
      case 'secrets':       return <SecretsPage />
      case 'pvcs':          return <PVCsPage />
      case 'nodes':         return <NodesPage />
      case 'namespaces':    return <NamespacesPage />
      case 'events':        return <EventsPage />
      case 'terminal':      return <TerminalPage />
      case 'ai':            return <AIFullPage />
      case 'settings':      return <SettingsPage />
      default:              return <OverviewPage />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-base overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-hidden">
            {renderPage()}
          </div>
          {detailPanel && activeView !== 'ai' && <DetailPanel />}
          {aiPanelOpen && activeView !== 'ai' && (
            <AIPanel onClose={() => setAIPanelOpen(false)} />
          )}
        </main>
      </div>
    </div>
  )
}
