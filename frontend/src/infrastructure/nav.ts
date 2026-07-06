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

// `count` để null — số đếm thật được nạp lúc runtime từ API (xem `Layout.tsx`,
// `NAV_COUNT_RESOURCES`) thay vì hardcode, vì số dòng thật trong DB thay đổi theo seed.
export const NAV: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ key: 'dashboard', label: 'Bảng điều khiển', icon: 'dashboard', count: null }],
  },
  {
    label: 'Pipeline sản phẩm',
    items: [
      { key: 'businessintent', label: 'Business Intent', icon: 'target', count: null },
      { key: 'intent', label: 'Product Intent', icon: 'intent', count: null },
      { key: 'pattern', label: 'Product Pattern', icon: 'pattern', count: null },
      { key: 'template', label: 'Product Template', icon: 'template', count: null },
      { key: 'config', label: 'Product Config', icon: 'config', count: null },
      { key: 'variant', label: 'Product Variant', icon: 'variant', count: null },
      { key: 'catalog', label: 'Product Catalog', icon: 'catalog', count: null },
    ],
  },
  {
    label: 'Thư viện nền tảng',
    items: [
      { key: 'obligation', label: 'Obligation Library', icon: 'obligation', count: null },
      { key: 'ontology', label: 'Sơ đồ Ontology', icon: 'network', count: null },
      { key: 'sysmap', label: 'Sơ đồ quan hệ tổng thể', icon: 'matrix', count: null },
      { key: 'archetype', label: 'Financial Obligation Archetype', icon: 'layers', count: null },
      { key: 'attribute', label: 'Attribute', icon: 'tag', count: null },
      { key: 'block', label: 'Block & Answer Slot', icon: 'block', count: null },
      { key: 'matrix', label: 'Ma trận ràng buộc', icon: 'matrix', count: null },
      { key: 'lifecycle', label: 'Lifecycle & State', icon: 'lifecycle', count: null },
      { key: 'domain', label: 'Domain', icon: 'domain', count: null },
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
