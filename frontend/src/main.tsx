import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import BusinessIntentPage from './pages/BusinessIntentPage'
import ProductIntentPage from './pages/ProductIntentPage'
import ProductIntentDetailPage from './pages/ProductIntentDetailPage'
import ProductPatternPage from './pages/ProductPatternPage'
import ProductPatternDetailPage from './pages/ProductPatternDetailPage'
import BlockPage from './pages/BlockPage'
import MatrixPage from './pages/MatrixPage'
import AttributePage from './pages/AttributePage'
import ObligationPage from './pages/ObligationPage'
import ArchetypePage from './pages/ArchetypePage'
import ArchetypeDetailPage from './pages/ArchetypeDetailPage'
import DomainPage from './pages/DomainPage'
import LifecyclePage from './pages/LifecyclePage'
import OntologyPage from './pages/OntologyPage'
import SysmapPage from './pages/SysmapPage'
import ProductTemplatePage from './pages/ProductTemplatePage'
import ProductTemplateDetailPage from './pages/ProductTemplateDetailPage'
import ProductConfigPage from './pages/ProductConfigPage'
import ProductConfigDetailPage from './pages/ProductConfigDetailPage'
import DataTable from './components/DataTable'
import { TABLES } from './tables'

// Các view đã dựng pixel-perfect (đọc API thật)
const CUSTOM: Record<string, React.ReactNode> = {
  dashboard: <DashboardPage />,
  businessintent: <BusinessIntentPage />,
  intent: <ProductIntentPage />,
  pattern: <ProductPatternPage />,
  block: <BlockPage />,
  matrix: <MatrixPage />,
  attribute: <AttributePage />,
  obligation: <ObligationPage />,
  archetype: <ArchetypePage />,
  domain: <DomainPage />,
  lifecycle: <LifecyclePage />,
  ontology: <OntologyPage />,
  sysmap: <SysmapPage />,
  template: <ProductTemplatePage />,
  config: <ProductConfigPage />,
}

function GenericView() {
  const { view } = useParams()
  const key = view ?? 'dashboard'
  if (CUSTOM[key]) return <>{CUSTOM[key]}</>
  const def = TABLES.find((t) => t.key === key || t.resource === key)
  if (def) {
    return (
      <div style={{ padding: '24px 26px', maxWidth: 1500 }}>
        <DataTable title={def.title} subtitle={def.subtitle} resource={def.resource} columns={def.columns} />
      </div>
    )
  }
  return (
    <div style={{ padding: '24px 26px' }}>
      <p style={{ color: '#5E6F66' }}>Màn "{key}" sẽ được dựng pixel-perfect ở bước tiếp theo.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/intent/:id" element={<ProductIntentDetailPage />} />
          <Route path="/pattern/:code" element={<ProductPatternDetailPage />} />
          <Route path="/archetype/:code" element={<ArchetypeDetailPage />} />
          <Route path="/template/:code" element={<ProductTemplateDetailPage />} />
          <Route path="/config/:code" element={<ProductConfigDetailPage />} />
          <Route path="/:view" element={<GenericView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
