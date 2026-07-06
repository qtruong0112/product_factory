import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDetail, getList } from '../../infrastructure/api/client'
import Icon from '../components/Icon'

// ---- kiểu dữ liệu từ API /release-processes, /release-processes/{id}/detail ----
interface ProcessRow {
  id: number
  productName: string
  productCode: string | null
  doneCount: number
  totalSteps: number
}
interface ChecklistItem {
  sortOrder: number
  item: string
  done: boolean
}
interface StepRow {
  stepNo: number
  title: string
  role: string
  status: string // done | current | upcoming (thật từ process_step.step_status)
  inputDesc: string | null
  outputDesc: string | null
  desc: string | null
  tip: string | null
  icon: string | null
  nav: string | null
  checklist: ChecklistItem[]
}
interface ProcessMeta {
  id: number
  productName: string
  productCode: string | null
  doneCount: number
  totalSteps: number
}
interface Detail {
  process: ProcessMeta
  steps: StepRow[]
}

const ROLE_COLORS: Record<string, [string, string]> = {
  'Product Owner': ['#FBEFC7', '#8A6300'],
  'Product Designer': ['#ECF6F1', '#0B7349'],
  'Product Designer / QA': ['#E5EEF9', '#2F73C4'],
  'Checker / Approver': ['#EAE3F7', '#6A45B0'],
  Operations: ['#FDE7D6', '#B5651A'],
}
const ROLE_SHORT: Record<string, string> = {
  'Product Owner': 'Product Owner',
  'Product Designer': 'Product Designer',
  'Product Designer / QA': 'Designer / QA',
  'Checker / Approver': 'Checker / Approver',
  Operations: 'Vận hành',
}
const ROLE_ORDER = ['Product Owner', 'Product Designer', 'Product Designer / QA', 'Checker / Approver', 'Operations']
const STATUS_CHIP: Record<string, { t: string; bg: string; fg: string }> = {
  done: { t: 'Hoàn thành', bg: '#DCF3E7', fg: '#0B7349' },
  current: { t: 'Đang làm', bg: '#FEF3D6', fg: '#9A6B00' },
  upcoming: { t: 'Chưa tới', bg: '#F1F5F2', fg: '#A7B5AC' },
}

export default function ReleasePage() {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStepNo, setSelectedStepNo] = useState<number | null>(null)
  const [view, setView] = useState<'stepper' | 'swimlane'>('stepper')

  useEffect(() => {
    getList<ProcessRow>('release-processes', 0, 5)
      .then((page) => {
        const first = page.content[0]
        if (!first) throw new Error('Không có quy trình phát hành nào')
        return getDetail<Detail>('release-processes', first.id)
      })
      .then((d) => {
        setDetail(d)
        const current = d.steps.find((s) => s.status === 'current') ?? d.steps[0]
        setSelectedStepNo(current?.stepNo ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const selectedStep = useMemo(
    () => detail?.steps.find((s) => s.stepNo === selectedStepNo) ?? null,
    [detail, selectedStepNo]
  )

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !detail)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const { process, steps } = detail
  const pct = Math.round((process.doneCount / process.totalSteps) * 100)

  const tabBtnStyle = (active: boolean) => ({
    fontSize: 12.5,
    fontWeight: active ? 700 : 500,
    color: active ? '#fff' : '#41524A',
    background: active ? '#0E8C5A' : '#fff',
    border: active ? 'none' : '1px solid #E6ECE8',
    padding: '8px 15px',
    borderRadius: 9,
    cursor: 'pointer',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ padding: '24px 26px', maxWidth: 1240, animation: 'fadeUp .3s ease' }}>
      {/* banner */}
      <div
        style={{
          background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)',
          borderRadius: 16,
          padding: '22px 26px',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7FD8AE', letterSpacing: '.4px' }}>ĐANG PHÁT HÀNH</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 4 }}>{process.productName}</div>
          {process.productCode && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#A9CFBE', marginTop: 4 }}>
              {process.productCode}
            </div>
          )}
        </div>
        <div style={{ flex: 'none', width: 280 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: '#C9E6D9', fontWeight: 500 }}>Tiến độ quy trình</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
              {process.doneCount}/{process.totalSteps} bước
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: pct + '%', background: 'linear-gradient(90deg,#19C079,#7FD8AE)', transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 11.5, color: '#7FD8AE', marginTop: 7 }}>{pct}% hoàn thành · còn lại trước khi lên kệ</div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
        <button style={tabBtnStyle(view === 'stepper')} onClick={() => setView('stepper')}>
          Hướng dẫn từng bước
        </button>
        <button style={tabBtnStyle(view === 'swimlane')} onClick={() => setView('swimlane')}>
          Sơ đồ Swimlane
        </button>
      </div>

      {view === 'stepper' && (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 22, alignItems: 'start' }}>
          {/* timeline */}
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', padding: '4px 8px 12px' }}>
              {steps.length} BƯỚC PHÁT HÀNH SẢN PHẨM
            </div>
            {steps.map((s, i) => {
              const rc = ROLE_COLORS[s.role] ?? ['#EEF1EF', '#41524A']
              const chip = STATUS_CHIP[s.status] ?? STATUS_CHIP.upcoming
              const isSel = s.stepNo === selectedStepNo
              return (
                <div key={s.stepNo}>
                  <div
                    onClick={() => setSelectedStepNo(s.stepNo)}
                    style={{
                      display: 'flex',
                      gap: 13,
                      padding: '13px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: isSel ? '#F4FBF7' : 'transparent',
                      border: '1.5px solid ' + (isSel ? '#0E8C5A' : 'transparent'),
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          flex: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13.5,
                          fontWeight: 700,
                          background: s.status === 'done' ? '#0E8C5A' : s.status === 'current' ? '#FEF3D6' : '#F1F5F2',
                          color: s.status === 'done' ? '#fff' : s.status === 'current' ? '#9A6B00' : '#A7B5AC',
                          border: s.status === 'current' ? '2px solid #E8920C' : 'none',
                        }}
                      >
                        {s.status === 'done' ? '✓' : s.stepNo}
                      </div>
                      {i < steps.length - 1 && (
                        <div style={{ width: 2, height: 20, background: i < process.doneCount ? '#0E8C5A' : '#E0E7E2', marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 5 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: isSel ? '#0B7349' : s.status === 'upcoming' ? '#8A998F' : '#243A30',
                          lineHeight: 1.3,
                        }}
                      >
                        {s.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: rc[1], background: rc[0], padding: '2px 8px', borderRadius: 99 }}>
                          {s.role}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: chip.fg,
                        background: chip.bg,
                        padding: '3px 9px',
                        borderRadius: 99,
                        height: 'fit-content',
                        marginTop: 5,
                        flex: 'none',
                      }}
                    >
                      {chip.t}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* detail */}
          {selectedStep && (
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, overflow: 'hidden' }}>
              <div
                style={{
                  background:
                    selectedStep.status === 'done'
                      ? 'linear-gradient(135deg,#0E8C5A,#0B6B45)'
                      : selectedStep.status === 'current'
                      ? 'linear-gradient(135deg,#E8920C,#C9740A)'
                      : 'linear-gradient(135deg,#5E6F66,#41524A)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 15,
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 13, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={selectedStep.icon ?? 'target'} size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.82)' }}>
                    BƯỚC {selectedStep.stepNo} / {steps.length} ·{' '}
                    {selectedStep.status === 'done' ? 'Đã hoàn thành' : selectedStep.status === 'current' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 3 }}>{selectedStep.title}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.2)', padding: '5px 12px', borderRadius: 99, flex: 'none' }}>
                  {selectedStep.role}
                </span>
              </div>

              <div style={{ padding: '22px 24px' }}>
                {selectedStep.desc && <div style={{ fontSize: 13.5, color: '#41524A', lineHeight: 1.6, marginBottom: 20 }}>{selectedStep.desc}</div>}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ flex: 1, border: '1px solid #EEF2EF', borderRadius: 11, padding: '12px 14px', background: '#FBFDFC' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC' }}>ĐẦU VÀO</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30', marginTop: 4 }}>{selectedStep.inputDesc ?? '—'}</div>
                  </div>
                  <span style={{ color: '#0E8C5A', flex: 'none' }}>
                    <Icon name="arrow" size={13} color="#8A998F" />
                  </span>
                  <div style={{ flex: 1, border: '1px solid #CDE9DA', borderRadius: 11, padding: '12px 14px', background: '#F4FBF7' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#0B7349' }}>ĐẦU RA</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0B7349', marginTop: 4 }}>{selectedStep.outputDesc ?? '—'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', marginBottom: 11 }}>VIỆC CẦN LÀM</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {selectedStep.checklist.map((c) => (
                    <div key={c.sortOrder} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid #EEF2EF', borderRadius: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          flex: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          border: '1.5px solid ' + (c.done ? '#0E8C5A' : '#D7E1DB'),
                          background: c.done ? '#0E8C5A' : '#fff',
                          color: '#fff',
                        }}
                      >
                        {c.done ? '✓' : ''}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: c.done ? '#243A30' : '#5E6F66' }}>{c.item}</span>
                    </div>
                  ))}
                </div>

                {selectedStep.tip && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FFFBF0', border: '1px solid #F2E6C2', borderRadius: 11, padding: '12px 14px', marginBottom: 22 }}>
                    <span style={{ fontSize: 15, flex: 'none' }}>💡</span>
                    <div style={{ fontSize: 12.5, color: '#8A6300', lineHeight: 1.5 }}>{selectedStep.tip}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 11 }}>
                  <button
                    onClick={() => selectedStep.nav && navigate(`/${selectedStep.nav}`)}
                    disabled={!selectedStep.nav}
                    style={{
                      flex: 1,
                      background: selectedStep.nav ? '#0E8C5A' : '#C7D5CC',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: 13,
                      fontSize: 13.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: selectedStep.nav ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    Mở màn liên quan →
                  </button>
                  {selectedStep.status === 'current' && (
                    <button
                      title="read-only"
                      style={{ flex: 'none', border: '1.5px solid #0E8C5A', color: '#0B7349', borderRadius: 10, padding: '13px 18px', fontSize: 13.5, fontWeight: 700, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ✓ Hoàn thành bước
                    </button>
                  )}
                  {selectedStep.status === 'done' && (
                    <button
                      title="read-only"
                      style={{ flex: 'none', border: '1.5px solid #E6ECE8', color: '#41524A', borderRadius: 10, padding: '13px 18px', fontSize: 13.5, fontWeight: 600, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Mở lại bước
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'swimlane' && <SwimlaneView steps={steps} onSelect={(no) => { setSelectedStepNo(no); setView('stepper') }} />}
    </div>
  )
}

function SwimlaneView({ steps, onSelect }: { steps: StepRow[]; onSelect: (stepNo: number) => void }) {
  const lanes = ROLE_ORDER.filter((r) => steps.some((s) => s.role === r))
  const colW = 170

  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Sơ đồ Swimlane theo vai trò</div>
      <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 16 }}>
        Luồng phát hành chảy trái → phải; mỗi lane là một vai trò. Click một bước để xem chi tiết.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${steps.length}, ${colW}px)`,
            gridTemplateRows: `38px repeat(${lanes.length}, 96px)`,
            border: '1px solid #EEF2EF',
            borderRadius: 12,
            overflow: 'hidden',
            minWidth: 160 + steps.length * colW,
          }}
        >
          <div style={{ gridColumn: 1, gridRow: 1, borderBottom: '1px solid #F1F5F2', borderRight: '1px solid #EEF2EF' }} />
          {steps.map((s, i) => (
            <div
              key={'h' + s.stepNo}
              style={{ gridColumn: i + 2, gridRow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#8A998F', borderBottom: '1px solid #F1F5F2' }}
            >
              Bước {s.stepNo}
            </div>
          ))}
          {lanes.map((role, r) => {
            const rc = ROLE_COLORS[role] ?? ['#EEF1EF', '#41524A']
            return (
              <div
                key={'lane' + role}
                style={{
                  gridColumn: 1,
                  gridRow: r + 2,
                  borderRight: '1px solid #EEF2EF',
                  borderBottom: '1px solid #F1F5F2',
                  background: r % 2 === 0 ? '#FBFDFC' : '#F4F7F5',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 13px',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: rc[1], background: rc[0], padding: '4px 9px', borderRadius: 8, lineHeight: 1.2 }}>{ROLE_SHORT[role] ?? role}</span>
              </div>
            )
          })}
          {lanes.map((role, r) =>
            steps.map((s, i) => (
              <div
                key={'bg' + role + s.stepNo}
                style={{ gridColumn: i + 2, gridRow: r + 2, background: r % 2 === 0 ? '#FBFDFC' : '#F4F7F5', borderBottom: '1px solid #F1F5F2' }}
              />
            ))
          )}
          {steps.map((s, i) => {
            const r = lanes.indexOf(s.role)
            const dot = s.status === 'done' ? '#0E8C5A' : s.status === 'current' ? '#E8920C' : '#C2D0C8'
            const bg = s.status === 'current' ? '#FFFBF0' : '#fff'
            const bd = s.status === 'done' ? '#CDE9DA' : s.status === 'current' ? '#F2DE9E' : '#E6ECE8'
            return (
              <div key={'n' + s.stepNo} style={{ gridColumn: i + 2, gridRow: r + 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                <div
                  onClick={() => onSelect(s.stepNo)}
                  style={{
                    width: '100%',
                    background: bg,
                    border: '1.5px solid ' + bd,
                    borderRadius: 11,
                    padding: '9px 11px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(11,59,46,.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: '#F1F5F2', color: '#5E6F66', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      {s.stepNo}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#243A30', lineHeight: 1.2 }}>{s.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 25 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: dot }}>
                      {s.status === 'done' ? 'Hoàn thành' : s.status === 'current' ? 'Đang làm' : 'Chưa tới'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#A7B5AC', fontWeight: 600 }}>CHÚ GIẢI:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, borderRadius: 2, background: '#0E8C5A' }} />
          <span style={{ fontSize: 11.5, color: '#5E6F66' }}>Đã hoàn thành</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, borderRadius: 2, background: '#E8920C' }} />
          <span style={{ fontSize: 11.5, color: '#5E6F66' }}>Đang thực hiện</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, borderRadius: 2, background: '#D7E1DB' }} />
          <span style={{ fontSize: 11.5, color: '#5E6F66' }}>Chưa tới</span>
        </span>
      </div>
    </div>
  )
}
