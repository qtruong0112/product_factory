import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../infrastructure/api/client'
import ListScreen, { type ListColumn } from '../components/ListScreen'
import Icon from '../components/Icon'

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

function AttrRefRow({ code, name, tag }: { code: string; name: string; tag: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', border: '1px solid #EEF2EF', borderRadius: 9 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{name}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC', marginTop: 2 }}>{code}</div>
      </div>
      {tag}
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
      { label: 'Dùng trong Answer Slot', width: '250px' },
      { label: 'Ràng buộc', width: '170px' },
      { label: 'Bắt buộc', width: '110px' },
    ]
    rows = (attrs?.content ?? []).map((a) => [
      mono(a.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{a.name}</span>,
      <InfoChip label={a.dataTypeName} />,
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
        <InfoModal icon="domain" title={openGroup.name} subtitle={`${openGroup.code} · Domain ${openGroup.domainName}`} onClose={() => setOpenGroup(null)}>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 12 }}>{openGroup.attributeCount} attribute thuộc nhóm này</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(attrs?.content ?? [])
              .filter((a) => a.groupCode === openGroup.code)
              .map((a) => (
                <AttrRefRow key={a.code} code={a.code} name={a.name} tag={<InfoChip label={a.dataTypeName} />} />
              ))}
          </div>
        </InfoModal>
      )}

      {openDataType && (
        <InfoModal icon="block" title={openDataType.name} subtitle={openDataType.code} onClose={() => setOpenDataType(null)}>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 12 }}>{openDataType.attributeCount} attribute dùng kiểu dữ liệu này</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(attrs?.content ?? [])
              .filter((a) => a.dataTypeCode === openDataType.code)
              .map((a) => (
                <AttrRefRow key={a.code} code={a.code} name={a.name} tag={<RequiredChip required={a.required} />} />
              ))}
          </div>
        </InfoModal>
      )}
    </div>
  )
}
