import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import ListScreen from '../../components/ListScreen'
import { StatusChip } from '../../components/StatusChip'

// Phần tử list do backend làm giàu (tên Pattern nguồn + tên Đối tượng KH qua template_segment).
interface TemplateRow {
  code: string
  name: string
  fromPatternCode: string
  patternName: string
  segmentCode: string | null
  segmentName: string | null
  status: string
}

export default function ProductTemplatePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<TemplateRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<TemplateRow>('product-templates', 0, 200)
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
    { label: 'Tên Template' },
    { label: 'Pattern nguồn', width: '230px' },
    { label: 'Đối tượng KH', width: '150px' },
    { label: 'Trạng thái', width: '130px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((t) => [
    mono(t.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{t.name}</span>,
    <span style={{ color: '#8A998F' }}>{t.patternName}</span>,
    <span style={{ color: '#41524A' }}>{t.segmentName ?? '—'}</span>,
    <StatusChip status={t.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Product Template…"
      filters={['Pattern nguồn', 'Đối tượng']}
      actionLabel="Tạo Template"
      onRowClick={(i) => navigate(`/template/${list[i].code}`)}
    />
  )
}
