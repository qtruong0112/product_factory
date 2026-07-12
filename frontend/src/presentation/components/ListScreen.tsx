import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import Icon from './Icon'
import PaginationFooter from './PaginationFooter'
import { STATUS_LABELS } from './StatusChip'

export interface ListColumn {
  label: string
  width?: string
  align?: 'left' | 'right' | 'center'
}

interface Props {
  columns: ListColumn[]
  rows: ReactNode[][] // mỗi row là mảng cell (ReactNode)
  searchPlaceholder?: string
  filters?: string[]
  actionLabel?: string
  onRowClick?: (index: number) => void
}

// Trích text thuần từ 1 ReactNode (đệ quy children) — dùng để search/filter không cần đổi
// signature `rows: ReactNode[][]` của mọi màn list hiện có. Component tùy biến không truyền
// children (StatusChip, chip label riêng) không tự render được nội dung con qua props.children
// (đó là props CỦA component, không phải cây render bên trong) — fallback đọc `status`
// (dịch qua STATUS_LABELS) hoặc `label`/`text` khi children rỗng.
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join(' ')
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; status?: string; label?: string; text?: string }
    if (props?.children != null) return extractText(props.children)
    if (typeof props?.status === 'string') return STATUS_LABELS[props.status] ?? props.status
    if (typeof props?.label === 'string') return props.label
    if (typeof props?.text === 'string') return props.text
    return ''
  }
  return ''
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Đoán cột khớp với 1 nút filter theo tên (không cần page khai báo thêm gì) —
// so khớp label filter với label cột, ưu tiên chứa trọn vẹn.
function guessColumnIndex(filterLabel: string, columns: ListColumn[]): number | null {
  const target = normalize(filterLabel)
  let best = -1
  let bestScore = 0
  columns.forEach((c, i) => {
    const label = normalize(c.label)
    if (!label) return
    let score = 0
    if (label === target) score = 3
    else if (label.includes(target) || target.includes(label)) score = 2
    else if (label.split(' ').some((w) => target.includes(w) && w.length > 2)) score = 1
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  })
  return bestScore > 0 ? best : null
}

// Màn danh sách chung — tái tạo pixel-perfect "GENERIC LIST" của prototype.
// Search + filter chạy client-side, trích text trực tiếp từ cell React đã render (mục 5.2 NEXT_WORK).
export default function ListScreen({
  columns,
  rows,
  searchPlaceholder = 'Tìm kiếm…',
  filters = [],
  actionLabel = 'Tạo mới',
  onRowClick,
}: Props) {
  const [search, setSearch] = useState('')
  const [openFilter, setOpenFilter] = useState<number | null>(null)
  const [selected, setSelected] = useState<Record<number, Set<string>>>({})

  const rowTexts = useMemo(() => rows.map((cells) => cells.map(extractText)), [rows])

  const filterColumns = useMemo(() => filters.map((f) => guessColumnIndex(f, columns)), [filters, columns])

  const filterOptions = useMemo(
    () =>
      filterColumns.map((colIdx) => {
        if (colIdx == null) return []
        const set = new Set<string>()
        rowTexts.forEach((cells) => {
          const v = cells[colIdx]?.trim()
          if (v) set.add(v)
        })
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
      }),
    [filterColumns, rowTexts]
  )

  const visibleIndexes = useMemo(() => {
    const q = normalize(search)
    return rows
      .map((_, ri) => ri)
      .filter((ri) => {
        if (q && !normalize(rowTexts[ri].join(' ')).includes(q)) return false
        for (let fi = 0; fi < filters.length; fi++) {
          const colIdx = filterColumns[fi]
          const sel = selected[fi]
          if (colIdx == null || !sel || sel.size === 0) continue
          if (!sel.has(rowTexts[ri][colIdx]?.trim())) return false
        }
        return true
      })
  }, [rows, rowTexts, search, filters, filterColumns, selected])

  const toggleFilterValue = (fi: number, value: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      const set = new Set(next[fi] ?? [])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      next[fi] = set
      return next
    })
  }
  const clearFilter = (fi: number) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[fi]
      return next
    })
  }

  return (
    <div style={{ padding: '22px 26px', animation: 'fadeUp .3s ease' }}>
      {/* toolbar: search + filters + action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid #E6ECE8',
            borderRadius: 9,
            padding: '8px 12px',
            width: 280,
          }}
        >
          <span style={{ display: 'flex', color: '#A7B5AC' }}>
            <Icon name="search" size={16} />
          </span>
          <input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
          />
        </div>
        {filters.map((f, i) => {
          const options = filterOptions[i]
          const activeCount = selected[i]?.size ?? 0
          const isOpen = openFilter === i
          return (
            <div key={i} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenFilter(isOpen ? null : i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: activeCount > 0 ? '#F4FBF7' : '#fff',
                  border: '1px solid ' + (activeCount > 0 ? '#0E8C5A' : '#E6ECE8'),
                  borderRadius: 9,
                  padding: '8px 13px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: activeCount > 0 ? '#0B7349' : '#41524A',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {f}{activeCount > 0 ? ` (${activeCount})` : ''} <Icon name="caret" size={13} color={activeCount > 0 ? '#0B7349' : '#8A998F'} />
              </button>
              {isOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 10,
                    background: '#fff',
                    border: '1px solid #E6ECE8',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(11,59,46,.12)',
                    padding: 8,
                    minWidth: 200,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  {options.length === 0 ? (
                    <div style={{ padding: '8px 10px', fontSize: 12, color: '#A7B5AC' }}>Không có giá trị để lọc</div>
                  ) : (
                    <>
                      {options.map((opt) => (
                        <label
                          key={opt}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12.5, color: '#243A30', cursor: 'pointer', borderRadius: 6 }}
                        >
                          <input
                            type="checkbox"
                            checked={selected[i]?.has(opt) ?? false}
                            onChange={() => toggleFilterValue(i, opt)}
                            style={{ accentColor: '#0E8C5A' }}
                          />
                          {opt}
                        </label>
                      ))}
                      {activeCount > 0 && (
                        <button
                          onClick={() => clearFilter(i)}
                          style={{ marginTop: 4, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#B23B3B', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 10px', fontFamily: 'inherit' }}
                        >
                          Xóa lọc
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div style={{ flex: 1 }} />
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: '#0E8C5A',
            color: '#fff',
            border: 'none',
            borderRadius: 9,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(14,140,90,.3)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Icon name="plus" size={15} /> {actionLabel}
        </button>
      </div>

      {/* table */}
      <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, overflow: 'hidden' }} onClick={() => openFilter !== null && setOpenFilter(null)}>
        <div style={{ display: 'table', borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
          {/* header */}
          <div style={{ display: 'table-header-group' }}>
            <div style={{ display: 'table-row', background: '#FBFDFC' }}>
              {columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    display: 'table-cell',
                    padding: '12px 16px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.4px',
                    color: '#8A998F',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #EEF2EF',
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </div>
              ))}
              <div style={{ display: 'table-cell', width: 42, borderBottom: '1px solid #EEF2EF' }} />
            </div>
          </div>
          {/* body */}
          <div style={{ display: 'table-row-group' }}>
            {visibleIndexes.length === 0 && (
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', padding: '24px 16px', color: '#A7B5AC', fontSize: 13 }}>
                  Không có dòng nào khớp bộ lọc/tìm kiếm.
                </div>
              </div>
            )}
            {visibleIndexes.map((ri) => {
              const cells = rows[ri]
              return (
                <div
                  key={ri}
                  onClick={() => onRowClick?.(ri)}
                  className="pf-row"
                  style={{ display: 'table-row', borderBottom: '1px solid #F1F5F2', cursor: 'pointer' }}
                >
                  {cells.map((cell, ci) => (
                    <div
                      key={ci}
                      style={{
                        display: 'table-cell',
                        padding: '13px 16px',
                        fontSize: 13,
                        color: '#243A30',
                        borderBottom: '1px solid #F1F5F2',
                        verticalAlign: 'middle',
                        textAlign: columns[ci]?.align ?? 'left',
                      }}
                    >
                      {cell}
                    </div>
                  ))}
                  <div style={{ display: 'table-cell', borderBottom: '1px solid #F1F5F2', textAlign: 'center', color: '#C2D0C8' }}>
                    <Icon name="arrow" size={15} color="#C2D0C8" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <PaginationFooter total={visibleIndexes.length} />
    </div>
  )
}
