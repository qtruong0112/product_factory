import type { CSSProperties } from 'react'
import Icon from './Icon'

interface Props {
  total: number
  pageSize?: number
  unit?: string
}

// Thanh phân trang THUẦN MINH HỌA — không có màn nào trong dự án thực sự phân trang server-side
// (mọi list đều fetch 1 lần với size lớn, size=200/500). Theo yêu cầu user: chỉ cần demo giao diện,
// không cần bấm chuyển trang được. Số liệu hiển thị (tổng dòng, số trang) tính THẬT từ dữ liệu đã
// tải, chỉ riêng hành vi chuyển trang là no-op (giữ đúng tinh thần nút CUD "giữ giao diện, no-op,
// tooltip read-only" đã áp dụng khắp dự án).
export default function PaginationFooter({ total, pageSize = 20, unit = 'dòng' }: Props) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const shown = Math.min(pageSize, total)
  // Số nút trang tối thiểu 5 (thuần trang trí — nếu dữ liệu thật ít hơn 5 trang vẫn hiện đủ
  // cho đẹp mắt), tối đa 7; không đại diện cho totalPages thật khi totalPages < 5.
  const pageButtonCount = Math.min(Math.max(totalPages, 5), 7)
  const pages = Array.from({ length: pageButtonCount }, (_, i) => i + 1)

  const navBtnStyle = (enabled: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid #E6ECE8',
    background: '#fff',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.4,
    flex: 'none',
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '13px 18px',
        marginTop: 14,
        background: '#fff',
        border: '1px solid #E6ECE8',
        borderRadius: 13,
        flexWrap: 'wrap',
      }}
      title="Phân trang minh họa — chưa nối dữ liệu thật"
    >
      <span style={{ fontSize: 12.5, color: '#5E6F66' }}>
        Hiển thị <b style={{ color: '#243A30' }}>{shown}</b> trên tổng <b style={{ color: '#243A30' }}>{total}</b> {unit}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={navBtnStyle(totalPages > 1)} disabled>
          <span style={{ display: 'flex', transform: 'rotate(180deg)' }}>
            <Icon name="chevron" size={13} color="#8A998F" />
          </span>
        </button>
        {pages.map((p) => (
          <button
            key={p}
            disabled
            style={{
              minWidth: 28,
              height: 28,
              padding: '0 8px',
              borderRadius: 8,
              border: '1px solid ' + (p === 1 ? '#0E8C5A' : '#E6ECE8'),
              background: p === 1 ? '#0E8C5A' : '#fff',
              color: p === 1 ? '#fff' : '#5E6F66',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'default',
              fontFamily: 'inherit',
            }}
          >
            {p}
          </button>
        ))}
        {totalPages > pages.length && <span style={{ fontSize: 12.5, color: '#A7B5AC', padding: '0 2px' }}>…</span>}
        <button style={navBtnStyle(totalPages > 1)} disabled>
          <span style={{ display: 'flex' }}>
            <Icon name="chevron" size={13} color="#8A998F" />
          </span>
        </button>
      </div>
    </div>
  )
}
