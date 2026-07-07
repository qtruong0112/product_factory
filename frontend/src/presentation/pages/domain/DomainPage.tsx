import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import ListScreen from '../../components/ListScreen'
import { StatusChip } from '../../components/StatusChip'

interface DomainRow {
  code: string
  name: string
  description: string | null
  entityCount: number | null
  status: string
}

export default function DomainPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<DomainRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<DomainRow>('domains', 0, 200)
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
    { label: 'Mã', width: '170px' },
    { label: 'Domain' },
    { label: 'Mô tả' },
    { label: 'Thực thể', width: '110px' },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((d) => [
    mono(d.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{d.name}</span>,
    <span style={{ color: '#8A998F' }}>{d.description ?? '—'}</span>,
    <span style={{ color: '#41524A' }}>{d.entityCount ?? '—'}</span>,
    <StatusChip status={d.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Domain…"
      actionLabel="Tạo Domain"
      onRowClick={(i) => navigate(`/domain/${list[i].code}`)}
    />
  )
}
