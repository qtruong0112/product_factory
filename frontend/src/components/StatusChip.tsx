// Bảng màu status chip trích nguyên từ prototype
export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#EEF1EF', fg: '#5E6F66' },
  review: { bg: '#FEF3D6', fg: '#9A6B00' },
  approved: { bg: '#E1ECFB', fg: '#1F5FAF' },
  published: { bg: '#DCF3E7', fg: '#0B7349' },
  active: { bg: '#DCF3E7', fg: '#0B7349' },
  retired: { bg: '#FBE3E3', fg: '#B23B3B' },
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  review: 'Chờ duyệt',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  active: 'Hoạt động',
  retired: 'Thu hồi',
}

export function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        padding: '3px 9px',
        borderRadius: 7,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
