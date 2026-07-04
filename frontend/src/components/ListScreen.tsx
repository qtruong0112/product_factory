import { type ReactNode } from 'react'
import Icon from './Icon'

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

// Màn danh sách chung — tái tạo pixel-perfect "GENERIC LIST" của prototype.
export default function ListScreen({
  columns,
  rows,
  searchPlaceholder = 'Tìm kiếm…',
  filters = [],
  actionLabel = 'Tạo mới',
  onRowClick,
}: Props) {
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
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
          />
        </div>
        {filters.map((f, i) => (
          <button
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: '#fff',
              border: '1px solid #E6ECE8',
              borderRadius: 9,
              padding: '8px 13px',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#41524A',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f} <Icon name="caret" size={13} color="#8A998F" />
          </button>
        ))}
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
      <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, overflow: 'hidden' }}>
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
            {rows.map((cells, ri) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
