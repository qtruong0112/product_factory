import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDetail, getList, type Page } from '../../../infrastructure/api/client'
import ListScreen, { type ListColumn } from '../../components/ListScreen'
import Icon from '../../components/Icon'

// Attribute — làm giàu: dataTypeName (join), usedInSlots (join answer_slot),
// constraintCount/constraintSummary (join attribute_constraint).
interface AttrRow {
  code: string
  name: string
  groupCode: string
  dataTypeCode: string
  dataTypeName: string
  usedInSlots: string[]
  constraintCount: number
  constraintSummary: string | null
  required: boolean
  overridable: boolean
  templateCustomizable: boolean
  defaultValue: string | null
}

// Attribute Group — làm giàu: domainName (join domain), attributeCount (đếm).
interface AttrGroupRow {
  code: string
  name: string
  domainCode: string
  domainName: string
  attributeCount: number
}

// Data Type — làm giàu: attributeCount (đếm).
interface DataTypeRow {
  code: string
  name: string
  attributeCount: number
}

// Chi tiết 1 attribute (xem-chỉ-đọc, drill từ popup Group/Data Type) — tái dùng nguyên
// GET /api/attributes/{code}/usage đã có từ Giai đoạn 29 (Attribute Usage), chỉ lấy phần
// attribute+constraints+enumValues, bỏ qua slots/usedInVariants (không cần ở đây).
interface AttrConstraint {
  kind: string
  minValue: number | null
  maxValue: number | null
  stepValue: number | null
  expression: string | null
  dependsOnAttributeCode: string | null
  message: string | null
}

interface AttrDetail {
  attribute: {
    code: string
    name: string
    dataTypeCode: string
    required: boolean
    unique: boolean
    nullable: boolean
    overridable: boolean
    templateCustomizable: boolean
    defaultValue: string | null
    unit: string | null
    groupName: string
    domainName: string | null
  }
  constraints: AttrConstraint[]
  enumValues: { value: string }[]
}

// Nhãn/màu ràng buộc — cùng bảng CK dùng ở AttributeUsageDetailPage.tsx.
const CONSTRAINT_KIND: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  regulatory: { label: 'Trần / Pháp lý', color: '#B23B3B', bg: '#FBE3E3', icon: '!' },
  range: { label: 'Miền giá trị', color: '#1F5FAF', bg: '#E5EEF9', icon: '↔' },
  enum: { label: 'Enum', color: '#7A4FB0', bg: '#EFE6F8', icon: '≡' },
  required: { label: 'Bắt buộc', color: '#9A6B00', bg: '#FBEFC7', icon: '*' },
  dependency: { label: 'Phụ thuộc', color: '#0B7349', bg: '#DCF3E7', icon: '⇄' },
  format: { label: 'Định dạng', color: '#5E6F66', bg: '#EEF1EF', icon: '#' },
}

function constraintRule(c: AttrConstraint): string {
  if (c.expression) return c.expression
  if (c.minValue != null && c.maxValue != null) return `${c.minValue} – ${c.maxValue}`
  if (c.maxValue != null) return `≤ ${c.maxValue}`
  if (c.minValue != null) return `≥ ${c.minValue}`
  if (c.dependsOnAttributeCode) return `Phụ thuộc ${c.dependsOnAttributeCode}`
  return c.kind
}

const mono = (t: string) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#5E6F66', fontWeight: 600 }}>{t}</span>
)

// Chip tông 'neutral' — trích nguyên style prototype (chip(x,'neutral')), giống GroupChip của BlockPage.
function NeutralChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        background: '#EEF1EF',
        color: '#41524A',
      }}
    >
      {label}
    </span>
  )
}

// Chip tông 'info' (Data Type) — cùng cặp màu xanh dương dùng ở MatrixPage (LEG.rpn.pos).
function InfoChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        background: '#E5EEF9',
        color: '#2F73C4',
      }}
    >
      {label}
    </span>
  )
}

// Chip "Bắt buộc" (gold) / "Tùy chọn" (muted) — cùng cặp màu dùng ở MatrixPage (LEG.compat.pos / LEG.rpn.no).
function RequiredChip({ required }: { required: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 700,
        background: required ? '#FEF3D6' : '#F4F7F5',
        color: required ? '#9A6B00' : '#B8C5BD',
      }}
    >
      {required ? 'Bắt buộc' : 'Tùy chọn'}
    </span>
  )
}

// Chip "Cho phép" (xanh) / "Khóa" (xám) — cờ is_overridable, cùng kiểu RequiredChip.
function OverrideChip({ overridable }: { overridable: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 700,
        background: overridable ? '#DCF3E7' : '#F1F5F2',
        color: overridable ? '#0B7349' : '#8A998F',
      }}
    >
      {overridable ? 'Cho phép' : 'Khóa'}
    </span>
  )
}

// Chip "Chính gốc" (tím, cần Template tự khai báo) / "Đơn giản" (xám, tự lấy default từ Attribute).
function TemplateChip({ templateCustomizable }: { templateCustomizable: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 700,
        background: templateCustomizable ? '#EFE6F8' : '#F1F5F2',
        color: templateCustomizable ? '#7A4FB0' : '#8A998F',
      }}
    >
      {templateCustomizable ? 'Chính gốc' : 'Đơn giản'}
    </span>
  )
}

// Popup xem-chỉ-đọc (không phải modal tạo/sửa CUD) — bấm dòng Attribute Group / Data Type
// để xem nhanh thông tin + danh sách attribute liên quan, không điều hướng, không tác động dữ liệu.
function InfoModal({ icon, title, subtitle, onClose, children }: { icon: string; title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,15,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid #EEF2EF' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E5EEF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Icon name={icon} size={18} color="#2F73C4" />
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#122019' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#8A998F', marginTop: 2 }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A998F', padding: 4, display: 'flex' }}>
            <Icon name="x" size={18} color="#8A998F" />
          </button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>{children}</div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #EEF2EF', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: '#F1F5F2', color: '#41524A', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function AttrRefRow({ code, name, tag, onClick }: { code: string; name: string; tag: ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', border: '1px solid #EEF2EF', borderRadius: 9, cursor: 'pointer' }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{name}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC', marginTop: 2 }}>{code}</div>
      </div>
      {tag}
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#8A998F', marginBottom: 5 }}>{label}</div>
      <div style={{ border: '1px solid #E6ECE8', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: '#243A30', background: '#FBFDFC' }}>{value}</div>
    </div>
  )
}

function BoolBadge({ label, hint, value }: { label: string; hint: string; value: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #EEF2EF', borderRadius: 9 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#8A998F', marginTop: 2 }}>{hint}</div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 99,
          background: value ? '#DCF3E7' : '#F1F5F2',
          color: value ? '#0B7349' : '#8A998F',
          flex: 'none',
        }}
      >
        {value ? 'Có' : 'Không'}
      </span>
    </div>
  )
}

const SECTION_LABEL_STYLE = { fontSize: 11, fontWeight: 700, color: '#8A998F', letterSpacing: '.4px', marginBottom: 10, textTransform: 'uppercase' as const }

const backButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#5E6F66',
  fontSize: 12,
  fontWeight: 600,
  padding: 0,
  marginBottom: 14,
  fontFamily: 'inherit',
} as const

// Chi tiết attribute xem-chỉ-đọc (bố cục khung mượn từ mockup "Tạo Attribute mới" của prototype,
// nhưng CHỈ hiển thị trường có nguồn DB thật — bỏ hẳn "số chữ số thập phân"/"cho phép giá trị âm"/
// "căn cứ pháp lý"/"scope ưu tiên override" vì không có cột tương ứng, không bịa).
function AttrDetailBody({ detail, dataTypes }: { detail: AttrDetail; dataTypes: DataTypeRow[] }) {
  const a = detail.attribute
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={SECTION_LABEL_STYLE}>Thông tin cơ bản</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ReadField label="Mã (code)" value={<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.code}</span>} />
          <ReadField label="Attribute Group" value={a.groupName} />
          <ReadField label="Domain" value={a.domainName ?? '—'} />
          <ReadField label="Đơn vị" value={a.unit ?? '—'} />
        </div>
      </div>

      <div>
        <div style={SECTION_LABEL_STYLE}>Data Type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {dataTypes.map((dt) => {
            const active = dt.code === a.dataTypeCode
            return (
              <span
                key={dt.code}
                style={{
                  padding: '7px 14px',
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: '1.5px solid ' + (active ? '#0E8C5A' : '#E6ECE8'),
                  background: active ? '#0E8C5A' : '#fff',
                  color: active ? '#fff' : '#41524A',
                }}
              >
                {dt.name}
              </span>
            )
          })}
        </div>
      </div>

      <div>
        <div style={SECTION_LABEL_STYLE}>Ràng buộc chung</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <BoolBadge label="Bắt buộc (Required)" hint="Giá trị không được để trống khi resolve" value={a.required} />
          <BoolBadge label="Duy nhất (Unique)" hint="Không trùng giá trị trong cùng phạm vi" value={a.unique} />
          <BoolBadge label="Cho phép Null (Nullable)" hint="Chấp nhận chưa có giá trị (override sau)" value={a.nullable} />
          <BoolBadge label="Cho phép ghi đè (Overridable)" hint="Fragment ở Config có được ghi đè giá trị hay luôn dùng Template" value={a.overridable} />
          <BoolBadge label="Cấu hình riêng ở Template" hint="Có/Không cần Template tự khai báo giá trị khung — nếu không, tự động lấy default từ Attribute" value={a.templateCustomizable} />
        </div>
        {a.defaultValue && (
          <div style={{ marginTop: 10 }}>
            <ReadField label="Giá trị mặc định" value={a.defaultValue} />
          </div>
        )}
      </div>

      {detail.constraints.length > 0 && (
        <div>
          <div style={SECTION_LABEL_STYLE}>Ràng buộc theo kiểu dữ liệu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detail.constraints.map((c, i) => {
              const m = CONSTRAINT_KIND[c.kind] ?? CONSTRAINT_KIND.format
              return (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                      background: m.bg,
                      color: m.color,
                    }}
                  >
                    {m.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#243A30' }}>{m.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#0B7349', marginTop: 3 }}>{constraintRule(c)}</div>
                    {c.message && <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 2 }}>{c.message}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {detail.enumValues.length > 0 && (
        <div>
          <div style={SECTION_LABEL_STYLE}>Giá trị Enum</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {detail.enumValues.map((ev, i) => (
              <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: '#7A4FB0', background: '#EFE6F8', padding: '3px 10px', borderRadius: 99 }}>
                {ev.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = ['Attribute', 'Attribute Group', 'Data Type']

export default function AttributePage() {
  const navigate = useNavigate()
  const [attrs, setAttrs] = useState<Page<AttrRow> | null>(null)
  const [groups, setGroups] = useState<Page<AttrGroupRow> | null>(null)
  const [dataTypes, setDataTypes] = useState<Page<DataTypeRow> | null>(null)
  const [tab, setTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openGroup, setOpenGroup] = useState<AttrGroupRow | null>(null)
  const [openDataType, setOpenDataType] = useState<DataTypeRow | null>(null)
  const [drillCode, setDrillCode] = useState<string | null>(null)
  const [drillData, setDrillData] = useState<AttrDetail | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillError, setDrillError] = useState<string | null>(null)

  const openDrill = (code: string) => {
    setDrillCode(code)
    setDrillData(null)
    setDrillError(null)
    setDrillLoading(true)
    getDetail<AttrDetail>('attributes', code, 'usage')
      .then(setDrillData)
      .catch((e) => setDrillError(e.message))
      .finally(() => setDrillLoading(false))
  }
  const closeDrill = () => {
    setDrillCode(null)
    setDrillData(null)
    setDrillError(null)
  }

  useEffect(() => {
    Promise.all([
      getList<AttrRow>('attributes', 0, 200),
      getList<AttrGroupRow>('attribute-groups', 0, 200),
      getList<DataTypeRow>('data-types', 0, 200),
    ])
      .then(([a, g, d]) => {
        setAttrs(a)
        setGroups(g)
        setDataTypes(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  let columns: ListColumn[]
  let rows: React.ReactNode[][]
  let searchPlaceholder: string
  let actionLabel: string

  if (tab === 0) {
    columns = [
      { label: 'Mã', width: '160px' },
      { label: 'Attribute' },
      { label: 'Data Type', width: '120px' },
      { label: 'Giá trị gốc', width: '160px' },
      { label: 'Dùng trong Answer Slot', width: '250px' },
      { label: 'Ràng buộc', width: '170px' },
      { label: 'Bắt buộc', width: '100px' },
      { label: 'Ghi đè', width: '100px' },
      { label: 'Cấu hình Template', width: '130px' },
    ]
    rows = (attrs?.content ?? []).map((a) => [
      mono(a.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{a.name}</span>,
      <InfoChip label={a.dataTypeName} />,
      a.templateCustomizable ? (
        <span style={{ color: '#A7B5AC', fontSize: 12, fontStyle: 'italic' }} title="Attribute chính gốc — giá trị thật khác nhau theo từng Template, xem ở Template tương ứng">
          Theo Template
        </span>
      ) : a.defaultValue ? (
        <span style={{ color: '#243A30', fontWeight: 600, fontSize: 12.5 }}>{a.defaultValue}</span>
      ) : (
        <span style={{ color: '#A7B5AC' }}>—</span>
      ),
      a.usedInSlots.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {a.usedInSlots.map((s, i) => (
            <NeutralChip key={i} label={s} />
          ))}
        </div>
      ) : (
        <span style={{ color: '#A7B5AC' }}>—</span>
      ),
      a.constraintSummary ? (
        <span style={{ color: '#41524A', fontSize: 12.5 }}>
          {a.constraintSummary}
          {a.constraintCount > 1 ? ` +${a.constraintCount - 1}` : ''}
        </span>
      ) : (
        <span style={{ color: '#A7B5AC' }}>—</span>
      ),
      <RequiredChip required={a.required} />,
      <OverrideChip overridable={a.overridable} />,
      <TemplateChip templateCustomizable={a.templateCustomizable} />,
    ])
    searchPlaceholder = 'Tìm Attribute…'
    actionLabel = 'Tạo Attribute'
  } else if (tab === 1) {
    columns = [
      { label: 'Mã', width: '150px' },
      { label: 'Attribute Group' },
      { label: 'Số Attribute', width: '130px' },
      { label: 'Domain', width: '140px' },
    ]
    rows = (groups?.content ?? []).map((g) => [
      mono(g.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{g.name}</span>,
      <span style={{ color: '#41524A' }}>{g.attributeCount} attr</span>,
      <NeutralChip label={g.domainName} />,
    ])
    searchPlaceholder = 'Tìm Attribute Group…'
    actionLabel = 'Tạo Nhóm'
  } else {
    columns = [
      { label: 'Mã', width: '150px' },
      { label: 'Data Type' },
      { label: 'Số Attribute', width: '120px' },
    ]
    rows = (dataTypes?.content ?? []).map((d) => [
      mono(d.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{d.name}</span>,
      <span style={{ color: '#41524A' }}>{d.attributeCount} attr</span>,
    ])
    searchPlaceholder = 'Tìm Data Type…'
    actionLabel = 'Tạo Data Type'
  }

  return (
    <div style={{ paddingTop: 22 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 26, flexWrap: 'wrap' }}>
        {TABS.map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              fontSize: 12.5,
              fontWeight: i === tab ? 700 : 500,
              color: i === tab ? '#fff' : '#41524A',
              background: i === tab ? '#0E8C5A' : '#fff',
              border: i === tab ? 'none' : '1px solid #E6ECE8',
              padding: '8px 14px',
              borderRadius: 9,
              boxShadow: i === tab ? '0 2px 8px rgba(14,140,90,.25)' : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ListScreen
        columns={columns}
        rows={rows}
        searchPlaceholder={searchPlaceholder}
        actionLabel={actionLabel}
        onRowClick={
          tab === 0
            ? (i) => navigate(`/attribute/${(attrs?.content ?? [])[i].code}`)
            : tab === 1
              ? (i) => setOpenGroup((groups?.content ?? [])[i])
              : (i) => setOpenDataType((dataTypes?.content ?? [])[i])
        }
      />

      {openGroup && (
        <InfoModal
          icon={drillCode ? 'tag' : 'domain'}
          title={drillCode ? (drillData?.attribute.name ?? 'Đang tải…') : openGroup.name}
          subtitle={drillCode ? drillCode : `${openGroup.code} · Domain ${openGroup.domainName}`}
          onClose={() => {
            setOpenGroup(null)
            closeDrill()
          }}
        >
          {drillCode ? (
            <div>
              <button onClick={closeDrill} style={backButtonStyle}>
                <Icon name="back" size={14} color="#5E6F66" /> Quay lại danh sách nhóm
              </button>
              {drillLoading && <div style={{ color: '#5E6F66', fontSize: 12.5 }}>Đang tải…</div>}
              {drillError && <div style={{ color: '#B23B3B', fontSize: 12.5 }}>Lỗi: {drillError}</div>}
              {drillData && <AttrDetailBody detail={drillData} dataTypes={dataTypes?.content ?? []} />}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 12 }}>{openGroup.attributeCount} attribute thuộc nhóm này</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(attrs?.content ?? [])
                  .filter((a) => a.groupCode === openGroup.code)
                  .map((a) => (
                    <AttrRefRow key={a.code} code={a.code} name={a.name} tag={<InfoChip label={a.dataTypeName} />} onClick={() => openDrill(a.code)} />
                  ))}
              </div>
            </>
          )}
        </InfoModal>
      )}

      {openDataType && (
        <InfoModal
          icon={drillCode ? 'tag' : 'block'}
          title={drillCode ? (drillData?.attribute.name ?? 'Đang tải…') : openDataType.name}
          subtitle={drillCode ? drillCode : openDataType.code}
          onClose={() => {
            setOpenDataType(null)
            closeDrill()
          }}
        >
          {drillCode ? (
            <div>
              <button onClick={closeDrill} style={backButtonStyle}>
                <Icon name="back" size={14} color="#5E6F66" /> Quay lại danh sách Data Type
              </button>
              {drillLoading && <div style={{ color: '#5E6F66', fontSize: 12.5 }}>Đang tải…</div>}
              {drillError && <div style={{ color: '#B23B3B', fontSize: 12.5 }}>Lỗi: {drillError}</div>}
              {drillData && <AttrDetailBody detail={drillData} dataTypes={dataTypes?.content ?? []} />}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 12 }}>{openDataType.attributeCount} attribute dùng kiểu dữ liệu này</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(attrs?.content ?? [])
                  .filter((a) => a.dataTypeCode === openDataType.code)
                  .map((a) => (
                    <AttrRefRow key={a.code} code={a.code} name={a.name} tag={<RequiredChip required={a.required} />} onClick={() => openDrill(a.code)} />
                  ))}
              </div>
            </>
          )}
        </InfoModal>
      )}
    </div>
  )
}
