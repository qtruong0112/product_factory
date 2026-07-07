import Icon from '../../components/Icon'
import { STATUS_COLORS, STATUS_LABELS } from '../../components/StatusChip'

interface Pattern {
  code: string
  name: string
  status: string
}
interface ApiSlot {
  code: string
  name: string
  type: string | null
  required: boolean
  def: string | null
  rule: string | null
  attrName: string
}
interface ApiBlock {
  blockId: string
  position: number
  name: string
  bizGroup: string | null
  slots: ApiSlot[]
}
interface ApiOT {
  code: string
  name: string
  role: string
  archetype: string | null
}
interface CoverageRow {
  key: string
  blockLabel: string
  chipLabel: string
  bg: string
  fg: string
}

interface Props {
  pattern: Pattern
  productIntentLabel: string | null
  assignedOTs: ApiOT[]
  canvas: ApiBlock[]
  coverageRows: CoverageRow[]
  onClose: () => void
}

const ROLE_LABEL: Record<string, string> = { Primary: 'Chính', Support: 'Phụ' }

export default function PatternPreviewModal({ pattern, productIntentLabel, assignedOTs, canvas, coverageRows, onClose }: Props) {
  const statusColor = STATUS_COLORS[pattern.status] ?? STATUS_COLORS.draft
  const totalSlots = canvas.reduce((s, b) => s + b.slots.length, 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F4F7F5',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeUp .2s ease',
      }}
    >
      {/* header */}
      <div
        style={{
          flex: 'none',
          background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#7FD8AE', letterSpacing: '.4px', marginBottom: 4 }}>
            XEM TRƯỚC · BẢN GHI CHỈ ĐỌC
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>{pattern.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'rgba(255,255,255,.85)' }}>{pattern.code}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: statusColor.bg,
                color: statusColor.fg,
              }}
            >
              {STATUS_LABELS[pattern.status] ?? pattern.status}
            </span>
          </div>
          {productIntentLabel && <div style={{ fontSize: 12, color: '#A9CFBE', marginTop: 5 }}>Từ Product Intent · {productIntentLabel}</div>}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: 'none',
            background: 'rgba(255,255,255,.15)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 'none',
          }}
        >
          <Icon name="x" size={17} color="#fff" />
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#122019' }}>{canvas.length}</div>
              <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 4 }}>Block</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#122019' }}>{totalSlots}</div>
              <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 4 }}>Answer Slot</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#122019' }}>{assignedOTs.length}</div>
              <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 4 }}>Obligation Type</div>
            </div>
          </div>

          {/* obligation types */}
          {assignedOTs.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>Nghĩa vụ tài chính</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {assignedOTs.map((o) => (
                  <div key={o.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{o.name}</span>
                      <span style={{ fontSize: 11, color: '#8A998F', marginLeft: 8 }}>{ROLE_LABEL[o.role] ?? o.role}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9A6B00', background: '#FBEFC7', padding: '3px 9px', borderRadius: 99, flex: 'none' }}>
                      {o.archetype ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* coverage */}
          {coverageRows.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>Độ phủ theo ma trận Obligation Type × Block</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {coverageRows.map((r) => (
                  <span
                    key={r.key}
                    style={{ fontSize: 11, fontWeight: 700, color: r.fg, background: r.bg, padding: '5px 11px', borderRadius: 99 }}
                  >
                    {r.blockLabel} · {r.chipLabel}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* structure */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', margin: '4px 2px 12px' }}>
            Cấu trúc theo thứ tự lắp ráp
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {canvas.map((b, bi) => (
              <div
                key={b.blockId}
                style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', animation: `fadeUp .35s ease ${bi * 0.05}s both` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: '#F1F5F2',
                      color: '#5E6F66',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {b.position}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{b.name}</span>
                  {b.bizGroup && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#41524A', background: '#EEF1EF', padding: '2px 8px', borderRadius: 99 }}>{b.bizGroup}</span>
                  )}
                  <span style={{ fontSize: 11, color: '#A7B5AC', marginLeft: 'auto' }}>{b.slots.length} slot</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {b.slots.map((s) => (
                    <div
                      key={s.code}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', border: '1px solid #F1F5F2', borderRadius: 9 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: '#8A998F', marginLeft: 8 }}>{s.attrName}</span>
                        {s.def && <span style={{ fontSize: 11, color: '#A7B5AC', marginLeft: 8 }}>· mặc định {s.def}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}>
                        {s.type && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2F73C4', background: '#E5EEF9', padding: '2px 8px', borderRadius: 99 }}>{s.type}</span>
                        )}
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: s.required ? '#0B7349' : '#8A998F',
                            background: s.required ? '#DCF3E7' : '#F1F5F2',
                            padding: '2px 8px',
                            borderRadius: 99,
                          }}
                        >
                          {s.required ? 'Bắt buộc' : 'Tùy chọn'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {b.slots.length === 0 && <div style={{ fontSize: 12, color: '#A7B5AC' }}>Block này chưa có Answer Slot nào.</div>}
                </div>
              </div>
            ))}
            {canvas.length === 0 && (
              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '24px', textAlign: 'center', color: '#A7B5AC', fontSize: 13 }}>
                Pattern này chưa lắp Block nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
