import { useEffect, useState } from 'react'
import { getList, type Page } from '../../infrastructure/api/client'
import ListScreen from '../components/ListScreen'

// Backend làm giàu: actionLabel dịch từ action code, channel suy ra từ hậu tố "· kênh X" thật
// trong detail (activity_log không có cột channel riêng).
interface ActivityRow {
  occurredAtLabel: string
  actor: string
  actionLabel: string
  entityType: string
  entityCode: string | null
  channel: string | null
}

export default function ActivityPage() {
  const [data, setData] = useState<Page<ActivityRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<ActivityRow>('activity-logs', 0, 50)
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

  const channelChip = (channel: string | null) => {
    if (!channel) return <span style={{ color: '#C2D0C8' }}>—</span>
    const info = channel === 'API'
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 99,
          color: info ? '#2F73C4' : '#41524A',
          background: info ? '#E5EEF9' : '#F1F5F2',
        }}
      >
        {channel}
      </span>
    )
  }

  const columns = [
    { label: 'Thời gian', width: '130px' },
    { label: 'Actor', width: '140px' },
    { label: 'Hành động', width: '150px' },
    { label: 'Đối tượng', width: '260px' },
    { label: 'Kênh', width: '100px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((a) => [
    <span style={{ color: '#8A998F' }}>{a.occurredAtLabel}</span>,
    <span style={{ fontWeight: 600, color: '#122019' }}>{a.actor}</span>,
    <span style={{ color: '#243A30' }}>{a.actionLabel}</span>,
    mono(a.entityType + (a.entityCode ? ' · ' + a.entityCode : '')),
    channelChip(a.channel),
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm hoạt động…"
      filters={['Actor', 'Loại', 'Kênh']}
      actionLabel="Xuất nhật ký"
    />
  )
}
