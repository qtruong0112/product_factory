import { useEffect, useState } from 'react'
import { getList, type Page } from '../api/client'
import ListScreen, { type ListColumn } from '../components/ListScreen'

// Attribute — làm giàu: dataTypeName (join), usedInSlots (join answer_slot),
// constraintCount/constraintSummary (join attribute_constraint).
interface AttrRow {
  code: string
  name: string
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

const TABS = ['Attribute', 'Attribute Group', 'Data Type']

export default function AttributePage() {
  const [attrs, setAttrs] = useState<Page<AttrRow> | null>(null)
  const [groups, setGroups] = useState<Page<AttrGroupRow> | null>(null)
  const [dataTypes, setDataTypes] = useState<Page<DataTypeRow> | null>(null)
  const [tab, setTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
      />
    </div>
  )
}
