import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import ListScreen from '../../components/ListScreen'
import { StatusChip } from '../../components/StatusChip'

// Phần tử list do backend làm giàu (tên Template nguồn + số fragment thật).
interface ConfigRow {
  code: string
  name: string
  fromTemplateCode: string
  templateName: string
  fragmentCount: number
  status: string
}

export default function ProductConfigPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<ConfigRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<ConfigRow>('product-configs', 0, 200)
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
    { label: 'Mã', width: '110px' },
    { label: 'Tên Config' },
    { label: 'Template', width: '240px' },
    { label: 'Fragment', width: '100px', align: 'center' as const },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((c) => [
    mono(c.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{c.name}</span>,
    <span style={{ color: '#8A998F' }}>{c.templateName}</span>,
    <span style={{ fontWeight: 700, color: '#122019' }}>{c.fragmentCount}</span>,
    <StatusChip status={c.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Product Config…"
      filters={['Template', 'Trạng thái']}
      actionLabel="Tạo Config"
      onRowClick={(i) => navigate(`/config/${list[i].code}`)}
    />
  )
}
