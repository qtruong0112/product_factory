import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import ListScreen from '../../components/ListScreen'
import { StatusChip } from '../../components/StatusChip'

// Lifecycle — làm giàu: stateCount (đếm lifecycle_state theo lifecycle_code).
interface LifecycleRow {
  code: string
  name: string
  governs: string
  status: string
  stateCount: number
}

export default function LifecyclePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<LifecycleRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<LifecycleRow>('lifecycles', 0, 200)
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
    { label: 'Mã', width: '220px' },
    { label: 'Lifecycle' },
    { label: 'Áp dụng cho', width: '220px' },
    { label: 'Số State', width: '110px' },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((l) => [
    mono(l.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{l.name}</span>,
    <span style={{ color: '#8A998F' }}>{l.governs}</span>,
    <span style={{ color: '#41524A' }}>{l.stateCount}</span>,
    <StatusChip status={l.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Lifecycle…"
      filters={['Đối tượng']}
      actionLabel="Tạo Lifecycle"
      onRowClick={(i) => navigate(`/lifecycle/${list[i].code}`)}
    />
  )
}
