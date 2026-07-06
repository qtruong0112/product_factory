import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import Layout from './presentation/components/Layout'
import DashboardPage from './presentation/pages/DashboardPage'
import BusinessIntentPage from './presentation/pages/BusinessIntentPage'
import BusinessIntentDetailPage from './presentation/pages/BusinessIntentDetailPage'
import ProductIntentPage from './presentation/pages/ProductIntentPage'
import ProductIntentDetailPage from './presentation/pages/ProductIntentDetailPage'
import ProductPatternPage from './presentation/pages/ProductPatternPage'
import ProductPatternDetailPage from './presentation/pages/ProductPatternDetailPage'
import BlockPage from './presentation/pages/BlockPage'
import MatrixPage from './presentation/pages/MatrixPage'
import AttributePage from './presentation/pages/AttributePage'
import ObligationPage from './presentation/pages/ObligationPage'
import ArchetypePage from './presentation/pages/ArchetypePage'
import ArchetypeDetailPage from './presentation/pages/ArchetypeDetailPage'
import DomainPage from './presentation/pages/DomainPage'
import LifecyclePage from './presentation/pages/LifecyclePage'
import OntologyPage from './presentation/pages/OntologyPage'
import SysmapPage from './presentation/pages/SysmapPage'
import ProductTemplatePage from './presentation/pages/ProductTemplatePage'
import ProductTemplateDetailPage from './presentation/pages/ProductTemplateDetailPage'
import ProductConfigPage from './presentation/pages/ProductConfigPage'
import ProductConfigDetailPage from './presentation/pages/ProductConfigDetailPage'
import ProductVariantPage from './presentation/pages/ProductVariantPage'
import ProductCatalogPage from './presentation/pages/ProductCatalogPage'
import ReleasePage from './presentation/pages/ReleasePage'
import ActivityPage from './presentation/pages/ActivityPage'
import SimulationPage from './presentation/pages/SimulationPage'
import DataTable from './presentation/components/DataTable'
import { TABLES } from './infrastructure/tables'

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
  variant: <ProductVariantPage />,
  catalog: <ProductCatalogPage />,
  release: <ReleasePage />,
  activity: <ActivityPage />,
  simulation: <SimulationPage />,
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
          <Route path="/businessintent/:id" element={<BusinessIntentDetailPage />} />
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
