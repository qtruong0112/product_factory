import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../infrastructure/api/client'
import ListScreen from '../components/ListScreen'
import { StatusChip } from '../components/StatusChip'

interface BusinessIntent {
  id: number
  name: string
  owner: string
  period: string
  objective: string | null
  status: string
}

export default function BusinessIntentPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<BusinessIntent> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<BusinessIntent>('business-intents', 0, 200)
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
    { label: 'Mã', width: '90px' },
    { label: 'Định hướng kinh doanh' },
    { label: 'Mục tiêu' },
    { label: 'Chủ sở hữu', width: '160px' },
    { label: 'Kỳ', width: '110px' },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((bi) => [
    mono(`BI-${String(bi.id).padStart(2, '0')}`),
    <span style={{ fontWeight: 600, color: '#122019' }}>{bi.name}</span>,
    <span style={{ color: '#5E6F66', fontSize: 12.5 }}>{bi.objective ?? '—'}</span>,
    <span style={{ color: '#41524A' }}>{bi.owner}</span>,
    <span style={{ color: '#41524A' }}>{bi.period}</span>,
    <StatusChip status={bi.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm định hướng kinh doanh…"
      filters={['Trạng thái', 'Chủ sở hữu']}
      actionLabel="Tạo Business Intent"
      onRowClick={(i) => navigate(`/businessintent/${list[i].id}`)}
    />
  )
}
