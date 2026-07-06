import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../infrastructure/api/client'
import ListScreen from '../components/ListScreen'
import { StatusChip } from '../components/StatusChip'

interface ProductIntent {
  id: number
  code: string | null
  name: string
  businessIntentId: number
  natureElementCode: string
  archetypeCode: string
  status: string
}

// Nhãn hiển thị archetype (khớp prototype) + tone chip.
const ARCHETYPE_LABELS: Record<string, string> = {
  FOA_TERM_LOAN: 'Term Loan',
  FOA_REVOLVING: 'Revolving',
  FOA_CONDITIONAL: 'Conditional',
}

function ArchetypeChip({ code }: { code: string }) {
  const label = ARCHETYPE_LABELS[code] ?? code
  // gold cho Revolving, info cho phần còn lại — theo prototype
  const tone = label === 'Revolving' ? { bg: '#FBEFC7', fg: '#8A6300' } : { bg: '#E5EEF9', fg: '#2F73C4' }
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
        background: tone.bg,
        color: tone.fg,
      }}
    >
      {label}
    </span>
  )
}

export default function ProductIntentPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<ProductIntent> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<ProductIntent>('product-intents', 0, 200)
      .then(setData)
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

  const mono = (t: string) => (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#5E6F66', fontWeight: 600 }}>{t}</span>
  )

  const columns = [
    { label: 'Mã', width: '120px' },
    { label: 'Tên Product Intent' },
    { label: 'Archetype', width: '150px' },
    { label: 'Obligation nature', width: '230px' },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((pi) => [
    mono(pi.code ?? `PI-${String(pi.id).padStart(3, '0')}`),
    <span style={{ fontWeight: 600, color: '#122019' }}>{pi.name}</span>,
    <ArchetypeChip code={pi.archetypeCode} />,
    mono(pi.natureElementCode),
    <StatusChip status={pi.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm product intent…"
      filters={['Trạng thái', 'Archetype']}
      actionLabel="Tạo Product Intent"
      onRowClick={(i) => navigate(`/intent/${list[i].id}`)}
    />
  )
}
