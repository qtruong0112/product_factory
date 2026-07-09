import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import Layout from './presentation/components/Layout'
import DashboardPage from './presentation/pages/DashboardPage'
import BusinessIntentPage from './presentation/pages/businessintent/BusinessIntentPage'
import BusinessIntentDetailPage from './presentation/pages/businessintent/BusinessIntentDetailPage'
import ProductIntentPage from './presentation/pages/intent/ProductIntentPage'
import ProductIntentDetailPage from './presentation/pages/intent/ProductIntentDetailPage'
import ProductPatternPage from './presentation/pages/pattern/ProductPatternPage'
import ProductPatternDetailPage from './presentation/pages/pattern/ProductPatternDetailPage'
import BlockPage from './presentation/pages/block/BlockPage'
import BlockDetailPage from './presentation/pages/block/BlockDetailPage'
import MatrixPage from './presentation/pages/MatrixPage'
import AttributePage from './presentation/pages/attribute/AttributePage'
import AttributeUsageDetailPage from './presentation/pages/attribute/AttributeUsageDetailPage'
import ObligationPage from './presentation/pages/obligation/ObligationPage'
import ObligationTypeDetailPage from './presentation/pages/obligation/ObligationTypeDetailPage'
import ArchetypePage from './presentation/pages/archetype/ArchetypePage'
import ArchetypeDetailPage from './presentation/pages/archetype/ArchetypeDetailPage'
import DomainPage from './presentation/pages/domain/DomainPage'
import DomainDetailPage from './presentation/pages/domain/DomainDetailPage'
import LifecyclePage from './presentation/pages/lifecycle/LifecyclePage'
import LifecycleDetailPage from './presentation/pages/lifecycle/LifecycleDetailPage'
import OntologyPage from './presentation/pages/OntologyPage'
import SysmapPage from './presentation/pages/SysmapPage'
import ProductTemplatePage from './presentation/pages/template/ProductTemplatePage'
import ProductTemplateDetailPage from './presentation/pages/template/ProductTemplateDetailPage'
import ProductConfigPage from './presentation/pages/config/ProductConfigPage'
import ProductConfigDetailPage from './presentation/pages/config/ProductConfigDetailPage'
import ProductVariantPage from './presentation/pages/variant/ProductVariantPage'
import ProductVariantDetailPage from './presentation/pages/variant/ProductVariantDetailPage'
import ProductCatalogPage from './presentation/pages/ProductCatalogPage'
import ReleasePage from './presentation/pages/ReleasePage'
import ActivityPage from './presentation/pages/activity/ActivityPage'
import ActivityDetailPage from './presentation/pages/activity/ActivityDetailPage'
import SimulationPage from './presentation/pages/SimulationPage'
import DataTable from './presentation/components/DataTable'
import { TABLES } from './infrastructure/tables'
import { UserProvider } from './infrastructure/user/UserContext'

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
    <UserProvider>
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
            <Route path="/attribute/:code" element={<AttributeUsageDetailPage />} />
            <Route path="/block/:id" element={<BlockDetailPage />} />
            <Route path="/lifecycle/:code" element={<LifecycleDetailPage />} />
            <Route path="/domain/:code" element={<DomainDetailPage />} />
            <Route path="/variant/:code" element={<ProductVariantDetailPage />} />
            <Route path="/release/:variantCode" element={<ReleasePage />} />
            <Route path="/activity/:id" element={<ActivityDetailPage />} />
            <Route path="/obligation-type/:code" element={<ObligationTypeDetailPage />} />
            <Route path="/:view" element={<GenericView />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </UserProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
