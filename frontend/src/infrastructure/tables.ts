import type { Column } from '../presentation/components/DataTable'

export interface TableDef {
  key: string // route path segment
  resource: string // API resource
  title: string
  subtitle: string
  layer: 'I' | 'II' | 'III' | 'IV'
  columns: Column[]
}

// Registry mọi bảng — thêm bảng mới chỉ cần thêm 1 mục ở đây.
export const TABLES: TableDef[] = [
  // ---------- Lớp II (đã có từ Giai đoạn 0) ----------
  {
    key: 'attributes',
    resource: 'attributes',
    title: 'Attributes',
    subtitle: 'Từ điển thuộc tính dùng chung (Layer II)',
    layer: 'II',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'groupCode', label: 'Nhóm', mono: true },
      { key: 'dataTypeCode', label: 'Kiểu DL', mono: true },
      { key: 'required', label: 'Bắt buộc', bool: true },
      { key: 'unit', label: 'Đơn vị' },
    ],
  },

  // ---------- Lớp I — Obligation Ontology ----------
  {
    key: 'obligation-element-types',
    resource: 'obligation-element-types',
    title: 'Obligation Element Type (OET)',
    subtitle: 'Các chiều phân loại nghĩa vụ (6 chiều chuẩn)',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'shortName', label: 'Tên ngắn' },
      { key: 'identify', label: 'Định danh', bool: true },
      { key: 'description', label: 'Mô tả' },
    ],
  },
  {
    key: 'obligation-elements',
    resource: 'obligation-elements',
    title: 'Obligation Element',
    subtitle: 'Giá trị cụ thể của mỗi chiều',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'elementTypeCode', label: 'Thuộc chiều', mono: true },
    ],
  },
  {
    key: 'archetypes',
    resource: 'archetypes',
    title: 'Financial Obligation Archetype',
    subtitle: 'Khuôn nghĩa vụ gốc (Term Loan / Revolving / Conditional)',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'nature', label: 'Bản chất' },
      { key: 'valueStructure', label: 'Cấu trúc giá trị' },
    ],
  },
  {
    key: 'foa-elements',
    resource: 'foa-elements',
    title: 'FOA × Element (Ma trận 1)',
    subtitle: 'Archetype × Element kèm mức yêu cầu',
    layer: 'I',
    columns: [
      { key: 'archetypeCode', label: 'Archetype', mono: true },
      { key: 'elementCode', label: 'Element', mono: true },
      { key: 'requirement', label: 'Yêu cầu', mono: true },
    ],
  },
  {
    key: 'obligation-type-cores',
    resource: 'obligation-type-cores',
    title: 'Obligation Type (lõi)',
    subtitle: 'Giai đoạn 51 — tập đóng 7 OT lõi (3 cốt lõi + 4 phụ trợ)',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'groupKind', label: 'Nhóm', mono: true },
      { key: 'description', label: 'Mô tả' },
    ],
  },
  {
    key: 'ot-activation-rules',
    resource: 'ot-activation-rules',
    title: 'OT Activation Rule',
    subtitle: 'Giai đoạn 51 — OE → bật OT phụ trợ, độc lập FOA',
    layer: 'I',
    columns: [
      { key: 'triggerElementCode', label: 'Trigger Element', mono: true },
      { key: 'activatedOtCoreCode', label: 'OT phụ trợ bật', mono: true },
    ],
  },
  {
    key: 'obligation-types',
    resource: 'obligation-types',
    title: 'Obligation Type Family (OTF)',
    subtitle: 'Khuôn nghĩa vụ hoàn chỉnh — obligation_type_code không đổi (Giai đoạn 51 bỏ family_code)',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'archetypeCode', label: 'Archetype (FOA)', mono: true },
      { key: 'status', label: 'Trạng thái', mono: true },
    ],
  },
  {
    key: 'obligation-type-compositions',
    resource: 'obligation-type-compositions',
    title: 'Obligation Type Composition',
    subtitle: 'Tổ hợp Element cho mỗi OT lõi trong 1 OTF (Giai đoạn 51: thêm ot_core_code/leg)',
    layer: 'I',
    columns: [
      { key: 'obligationTypeCode', label: 'OTF', mono: true },
      { key: 'otCoreCode', label: 'OT lõi', mono: true },
      { key: 'elementTypeCode', label: 'OET', mono: true },
      { key: 'elementCode', label: 'Element', mono: true },
      { key: 'leg', label: 'Leg', mono: true },
    ],
  },
  {
    key: 'lifecycles',
    resource: 'lifecycles',
    title: 'Lifecycle',
    subtitle: 'Định nghĩa vòng đời / máy trạng thái',
    layer: 'I',
    columns: [
      { key: 'code', label: 'Code', mono: true },
      { key: 'name', label: 'Tên' },
      { key: 'governs', label: 'Quản trị' },
      { key: 'status', label: 'Trạng thái', mono: true },
    ],
  },
  {
    key: 'lifecycle-states',
    resource: 'lifecycle-states',
    title: 'Lifecycle State',
    subtitle: 'Các trạng thái có thứ tự của vòng đời',
    layer: 'I',
    columns: [
      { key: 'lifecycleCode', label: 'Lifecycle', mono: true },
      { key: 'sortOrder', label: 'Thứ tự' },
      { key: 'name', label: 'Tên state' },
    ],
  },
]

export const LAYER_NAMES: Record<string, string> = {
  I: 'Lớp I — Ontology',
  II: 'Lớp II — Cấu trúc dữ liệu',
  III: 'Lớp III — Pipeline',
  IV: 'Lớp IV — Quản trị',
}
