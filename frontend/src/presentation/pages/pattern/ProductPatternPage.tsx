import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import ListScreen from '../../components/ListScreen'
import { StatusChip } from '../../components/StatusChip'

// Phần tử list do backend làm giàu (blockCount + tên obligation type Primary).
interface PatternRow {
  code: string
  name: string
  productIntentId: number | null
  status: string
  blockCount: number
  primaryObligationTypeName: string | null
}

export default function ProductPatternPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<PatternRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<PatternRow>('product-patterns', 0, 200)
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
    { label: 'Tên Pattern' },
    { label: 'Obligation Type Family', width: '220px' },
    { label: 'Số Block', width: '100px', align: 'center' as const },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((p) => [
    mono(p.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{p.name}</span>,
    <span style={{ color: '#41524A' }}>{p.primaryObligationTypeName ?? '—'}</span>,
    <span style={{ fontWeight: 700, color: '#122019' }}>{p.blockCount}</span>,
    <StatusChip status={p.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Product Pattern…"
      filters={['Obligation Type Family', 'Trạng thái']}
      actionLabel="Tạo Pattern"
      onRowClick={(i) => navigate(`/pattern/${list[i].code}`)}
    />
  )
}
