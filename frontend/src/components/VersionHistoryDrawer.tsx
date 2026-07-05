import { useEffect, useState } from 'react'
import { getVersionHistory } from '../api/client'
import { STATUS_COLORS, STATUS_LABELS } from './StatusChip'
import Icon from './Icon'

interface VersionRow {
  version: string
  status: string
  active: boolean
  head: boolean
  author: string
  createdAtLabel: string
  title: string
  changes: string[]
}

const ENTITY_LABEL: Record<string, string> = {
  pattern: 'Product Pattern',
  template: 'Product Template',
  config: 'Product Config',
}

const READONLY = 'Hệ thống read-only'

export default function VersionHistoryDrawer({
  open,
  onClose,
  entityType,
  entityCode,
  entityName,
}: {
  open: boolean
  onClose: () => void
  entityType: 'pattern' | 'template' | 'config'
  entityCode: string
  entityName: string
}) {
  const [versions, setVersions] = useState<VersionRow[] | null>(null)

  useEffect(() => {
    if (!open) return
    setVersions(null)
    getVersionHistory<VersionRow>(entityType, entityCode)
      .then(setVersions)
      .catch(() => setVersions([]))
  }, [open, entityType, entityCode])

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,42,32,.35)', zIndex: 55 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 460, height: '100vh', background: '#fff', zIndex: 56, boxShadow: '-8px 0 30px rgba(8,42,32,.16)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #EEF2EF', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F' }}>
              LỊCH SỬ PHIÊN BẢN · {ENTITY_LABEL[entityType] ?? entityType}
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#122019', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entityName}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8A998F', marginTop: 2 }}>
              {entityCode} · {versions ? versions.length : '…'} phiên bản
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E6ECE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41524A', flex: 'none', background: '#fff', cursor: 'pointer' }}>
            <Icon name="x" size={16} color="#41524A" />
          </button>
        </div>

        <div style={{ padding: '13px 22px', background: '#FBFDFC', borderBottom: '1px solid #EEF2EF', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0E8C5A' }} />
            <span style={{ fontSize: 11, color: '#5E6F66', fontWeight: 500 }}>Đang hoạt động</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E8920C' }} />
            <span style={{ fontSize: 11, color: '#5E6F66', fontWeight: 500 }}>HEAD (mới nhất)</span>
          </span>
          <span style={{ fontSize: 11, color: '#A7B5AC' }}>· vX.Y = major.minor</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {versions === null && <div style={{ fontSize: 13, color: '#8A998F' }}>Đang tải…</div>}
          {versions !== null && versions.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#A7B5AC', border: '1.5px dashed #C7D5CC', borderRadius: 12, fontSize: 12.5 }}>
              Chưa có lịch sử phiên bản nào cho {entityCode}.
            </div>
          )}
          {versions?.map((v, i) => {
            const nodeColor = v.active ? '#0E8C5A' : v.head ? '#E8920C' : '#C2D0C8'
            const restorable = !v.active && !v.head
            const sc = STATUS_COLORS[v.status] ?? STATUS_COLORS.draft
            return (
              <div key={v.version} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 4 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: nodeColor, border: '3px solid #fff', boxShadow: `0 0 0 2px ${nodeColor}` }} />
                  {i < versions.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 54, background: '#E6ECE8', margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: 18 }}>
                  <div style={{ border: '1.5px solid #E6ECE8', borderRadius: 12, padding: '13px 15px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#122019' }}>{v.version}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: sc.bg, color: sc.fg }}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </span>
                      {v.active && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: '#DCF3E7', color: '#0B7349' }}>● Đang hoạt động</span>
                      )}
                      {v.head && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: '#FEF3D6', color: '#9A6B00' }}>HEAD</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#243A30', marginTop: 9, lineHeight: 1.45 }}>{v.title}</div>
                    {v.changes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, padding: '9px 11px', background: '#F8FBF9', borderRadius: 9 }}>
                        {v.changes.map((c, j) => (
                          <div key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5E6F66' }}>{c}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
                      <div style={{ fontSize: 11, color: '#A7B5AC' }}>{v.author} · {v.createdAtLabel}</div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button title={READONLY} style={{ fontSize: 11, fontWeight: 600, color: '#41524A', border: '1px solid #E6ECE8', borderRadius: 7, padding: '5px 10px', background: '#fff', cursor: 'not-allowed' }}>So sánh</button>
                        <button title={READONLY} style={{ fontSize: 11, fontWeight: 600, color: '#41524A', border: '1px solid #E6ECE8', borderRadius: 7, padding: '5px 10px', background: '#fff', cursor: 'not-allowed' }}>Xem</button>
                        {restorable && (
                          <button title={READONLY} style={{ fontSize: 11, fontWeight: 600, color: '#0B7349', border: '1px solid #CDE9DA', background: '#F4FBF7', borderRadius: 7, padding: '5px 10px', cursor: 'not-allowed' }}>Khôi phục</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #EEF2EF', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ flex: 1, fontSize: 11.5, color: '#8A998F' }}>Chọn "So sánh" trên một phiên bản để đối chiếu thay đổi</div>
          <button title={READONLY} style={{ fontSize: 13, fontWeight: 600, color: '#41524A', border: '1px solid #E6ECE8', borderRadius: 9, padding: '9px 15px', background: '#fff', cursor: 'not-allowed' }}>Tạo nhánh phiên bản</button>
        </div>
      </div>
    </>
  )
}
