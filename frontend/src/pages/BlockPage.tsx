import { useEffect, useState } from 'react'
import { getList, type Page } from '../api/client'
import ListScreen from '../components/ListScreen'
import { StatusChip } from '../components/StatusChip'

// Phần tử list do backend làm giàu: slotCount (đếm answer_slot) + gov (governed_by element/aspect).
interface BlockRow {
  id: string
  code: string
  name: string
  bizGroup: string
  gov: string | null
  slotCount: number
  status: string
}

// Chip "NHÓM nghiệp vụ" — tone neutral, trích nguyên style prototype (chip(x,'neutral')).
function GroupChip({ label }: { label: string }) {
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

export default function BlockPage() {
  const [data, setData] = useState<Page<BlockRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<BlockRow>('blocks', 0, 200)
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
    { label: 'Mã', width: '190px' },
    { label: 'Tên Block' },
    { label: 'Nhóm', width: '140px' },
    { label: 'Answer Slot', width: '120px' },
    { label: 'Chi phối bởi', width: '210px' },
    { label: 'Trạng thái', width: '120px' },
  ]

  const list = data?.content ?? []

  const rows = list.map((b) => [
    mono(b.code),
    <span style={{ fontWeight: 600, color: '#122019' }}>{b.name}</span>,
    <GroupChip label={b.bizGroup} />,
    <span style={{ color: '#41524A' }}>{b.slotCount} slot</span>,
    mono(b.gov ?? '—'),
    <StatusChip status={b.status} />,
  ])

  return (
    <ListScreen
      columns={columns}
      rows={rows}
      searchPlaceholder="Tìm Block…"
      filters={['Nhóm nghiệp vụ', 'Trạng thái']}
      actionLabel="Tạo Block"
    />
  )
}
