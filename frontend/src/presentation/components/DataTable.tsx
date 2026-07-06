import { useEffect, useState } from 'react'
import { getList, type Page } from '../../infrastructure/api/client'

export interface Column {
  key: string
  label: string
  mono?: boolean
  bool?: boolean
}

interface Props {
  title: string
  subtitle: string
  resource: string
  columns: Column[]
}

// Bảng dữ liệu read-only dùng chung cho mọi màn danh sách.
export default function DataTable({ title, subtitle, resource, columns }: Props) {
  const [data, setData] = useState<Page<Record<string, unknown>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getList<Record<string, unknown>>(resource, 0, 200)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [resource])

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ color: '#5E6F66' }}>
        {subtitle} — {data?.totalElements ?? 0} bản ghi.
      </p>

      {loading && <p>Đang tải dữ liệu…</p>}
      {error && (
        <p style={{ color: '#B23B3B' }}>
          Lỗi: {error}. Kiểm tra backend đã chạy chưa.
        </p>
      )}

      {!loading && !error && (
        <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#0E8C5A', color: '#fff', textAlign: 'left' }}>
              {columns.map((c) => (
                <th key={c.key} style={th}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.content.map((row, i) => (
              <tr key={i} style={{ background: i % 2 ? '#fff' : '#EAF6F0' }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ ...td, fontFamily: c.mono ? 'monospace' : 'inherit' }}>
                    {renderCell(row[c.key], c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function renderCell(value: unknown, col: Column): string {
  if (value === null || value === undefined) return ''
  if (col.bool) return value ? '✓' : ''
  return String(value)
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: 13 }
const td: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid #E2E8E5',
}
