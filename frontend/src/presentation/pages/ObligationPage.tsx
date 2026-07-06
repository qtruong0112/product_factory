import { useEffect, useState } from 'react'
import { getList, type Page } from '../../infrastructure/api/client'
import ListScreen, { type ListColumn } from '../components/ListScreen'
import { StatusChip } from '../components/StatusChip'

// Obligation Type — làm giàu: familyName/archetypeName (join), elementCount (đếm obligation_type_composition).
interface ObTypeRow {
  code: string
  name: string
  familyName: string
  archetypeName: string
  elementCount: number
  status: string
}

// Obligation Element — làm giàu: elementTypeName (join), isIdentify (join obligation_element_type).
interface ObElementRow {
  code: string
  name: string
  elementTypeName: string
  isIdentify: boolean
}

// Element Type — làm giàu: elementCount (đếm obligation_element).
interface ObElementTypeRow {
  code: string
  name: string
  description: string | null
  elementCount: number
}

const mono = (t: string) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#5E6F66', fontWeight: 600 }}>{t}</span>
)

// Chip tông 'neutral' — trích nguyên style prototype (chip(x,'neutral')).
function NeutralChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
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

// Chip tông 'info'/'gold' (Archetype) — 'gold' khi archetype là Revolving, còn lại 'info'.
function ArchetypeChip({ label }: { label: string }) {
  const gold = label.toLowerCase().includes('revolving')
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        background: gold ? '#FEF3D6' : '#E5EEF9',
        color: gold ? '#9A6B00' : '#2F73C4',
      }}
    >
      {label}
    </span>
  )
}

// Chip true/false (IS_IDENTIFY).
function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 700,
        background: value ? '#DCF3E7' : '#F4F7F5',
        color: value ? '#0B7349' : '#B8C5BD',
      }}
    >
      {value ? 'true' : 'false'}
    </span>
  )
}

const TABS = ['Obligation Type', 'Obligation Element', 'Element Type']

export default function ObligationPage() {
  const [types, setTypes] = useState<Page<ObTypeRow> | null>(null)
  const [elements, setElements] = useState<Page<ObElementRow> | null>(null)
  const [elementTypes, setElementTypes] = useState<Page<ObElementTypeRow> | null>(null)
  const [tab, setTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getList<ObTypeRow>('obligation-types', 0, 200),
      getList<ObElementRow>('obligation-elements', 0, 200),
      getList<ObElementTypeRow>('obligation-element-types', 0, 200),
    ])
      .then(([t, e, et]) => {
        setTypes(t)
        setElements(e)
        setElementTypes(et)
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
      { label: 'Mã', width: '230px' },
      { label: 'Obligation Type' },
      { label: 'Archetype', width: '160px' },
      { label: 'Family', width: '190px' },
      { label: 'Element', width: '100px', align: 'center' },
      { label: 'Trạng thái', width: '130px' },
    ]
    rows = (types?.content ?? []).map((t) => [
      mono(t.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{t.name}</span>,
      <ArchetypeChip label={t.archetypeName} />,
      <span style={{ color: '#8A998F' }}>{t.familyName}</span>,
      <span style={{ color: '#41524A' }}>{t.elementCount}</span>,
      <StatusChip status={t.status} />,
    ])
    searchPlaceholder = 'Tìm trong thư viện nghĩa vụ…'
    actionLabel = 'Thêm mục'
  } else if (tab === 1) {
    columns = [
      { label: 'Mã', width: '360px' },
      { label: 'Obligation Element' },
      { label: 'Element Type', width: '210px' },
      { label: 'Is_identify', width: '120px' },
    ]
    rows = (elements?.content ?? []).map((e) => [
      mono(e.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{e.name}</span>,
      <NeutralChip label={e.elementTypeName} />,
      <BoolChip value={e.isIdentify} />,
    ])
    searchPlaceholder = 'Tìm trong thư viện nghĩa vụ…'
    actionLabel = 'Thêm mục'
  } else {
    columns = [
      { label: 'Mã', width: '210px' },
      { label: 'Element Type' },
      { label: 'Mô tả' },
      { label: 'Số Element', width: '120px' },
    ]
    rows = (elementTypes?.content ?? []).map((t) => [
      mono(t.code),
      <span style={{ fontWeight: 600, color: '#122019' }}>{t.name}</span>,
      <span style={{ color: '#8A998F' }}>{t.description ?? '—'}</span>,
      <span style={{ color: '#41524A' }}>{t.elementCount}</span>,
    ])
    searchPlaceholder = 'Tìm trong thư viện nghĩa vụ…'
    actionLabel = 'Thêm mục'
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
        filters={['Trạng thái']}
        actionLabel={actionLabel}
      />
    </div>
  )
}
