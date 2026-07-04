// Cấu trúc menu trích nguyên từ Product_Factory_5_1.html (hàm nav)
export interface NavItem {
  key: string
  label: string
  icon: string
  count: string | null
}
export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ key: 'dashboard', label: 'Bảng điều khiển', icon: 'dashboard', count: null }],
  },
  {
    label: 'Pipeline sản phẩm',
    items: [
      { key: 'businessintent', label: 'Business Intent', icon: 'target', count: '7' },
      { key: 'intent', label: 'Product Intent', icon: 'intent', count: '12' },
      { key: 'pattern', label: 'Product Pattern', icon: 'pattern', count: '8' },
      { key: 'template', label: 'Product Template', icon: 'template', count: '15' },
      { key: 'config', label: 'Product Config', icon: 'config', count: '34' },
      { key: 'variant', label: 'Product Variant', icon: 'variant', count: '21' },
      { key: 'catalog', label: 'Product Catalog', icon: 'catalog', count: '18' },
    ],
  },
  {
    label: 'Thư viện nền tảng',
    items: [
      { key: 'obligation', label: 'Obligation Library', icon: 'obligation', count: '47' },
      { key: 'ontology', label: 'Sơ đồ Ontology', icon: 'network', count: null },
      { key: 'sysmap', label: 'Sơ đồ quan hệ tổng thể', icon: 'matrix', count: null },
      { key: 'archetype', label: 'Financial Obligation Archetype', icon: 'layers', count: '3' },
      { key: 'attribute', label: 'Attribute', icon: 'tag', count: '64' },
      { key: 'block', label: 'Block & Answer Slot', icon: 'block', count: '26' },
      { key: 'matrix', label: 'Ma trận ràng buộc', icon: 'matrix', count: '9' },
      { key: 'lifecycle', label: 'Lifecycle & State', icon: 'lifecycle', count: '6' },
      { key: 'domain', label: 'Domain', icon: 'domain', count: '5' },
    ],
  },
  {
    label: 'Công cụ',
    items: [
      { key: 'release', label: 'Quy trình phát hành', icon: 'rocket', count: null },
      { key: 'simulation', label: 'Simulation Engine', icon: 'sim', count: null },
    ],
  },
  {
    label: 'Hệ thống',
    items: [{ key: 'activity', label: 'Nhật ký hoạt động', icon: 'activity', count: null }],
  },
]

// Tiêu đề + breadcrumb cho từng view (từ prototype)
export const VIEW_TITLES: Record<string, [string, string]> = {
  dashboard: ['Bảng điều khiển', 'Tổng quan'],
  businessintent: ['Business Intent', 'Pipeline'],
  intent: ['Product Intent', 'Pipeline'],
  pattern: ['Product Pattern', 'Pipeline'],
  template: ['Product Template', 'Pipeline'],
  config: ['Product Config', 'Pipeline'],
  variant: ['Product Variant', 'Pipeline'],
  catalog: ['Product Catalog', 'Pipeline'],
  obligation: ['Obligation Library', 'Thư viện'],
  ontology: ['Sơ đồ Ontology nghĩa vụ', 'Thư viện'],
  sysmap: ['Sơ đồ quan hệ tổng thể', 'Tổng quan'],
  archetype: ['Financial Obligation Archetype', 'Thư viện'],
  attribute: ['Attribute', 'Thư viện'],
  block: ['Block & Answer Slot', 'Thư viện'],
  matrix: ['Ma trận ràng buộc', 'Thư viện'],
  lifecycle: ['Lifecycle & State', 'Thư viện'],
  domain: ['Domain', 'Thư viện'],
  release: ['Quy trình phát hành', 'Công cụ'],
  simulation: ['Simulation Engine', 'Công cụ'],
  activity: ['Nhật ký hoạt động', 'Hệ thống'],
}
