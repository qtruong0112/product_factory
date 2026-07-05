import { useEffect, useState } from 'react'

// ---- kiểu dữ liệu API ----
interface DefaultScenario {
  id: number
  configCode: string | null
  variantCode: string | null
  amount: number
  months: number
  baseRatePct: number
  assetValue: number | null
  segmentCode: string | null
  startDate: string | null
  appraisalFee: number | null
  periodicFeePct: number | null
  graceMonths: number | null
  pinnedLabel: string | null
}
interface ScheduleRow {
  periodNo: number
  dueDate: string
  openingBalance: number
  principal: number
  interest: number
  fee: number
  penalty: number
  payment: number
  closingBalance: number
}
interface CheckItem {
  label: string
  passed: boolean
}
interface RunResult {
  effectiveRatePct: number
  monthlyPayment: number
  totalInterest: number
  totalFee: number
  totalPrincipal: number
  totalPenalty: number
  totalPrepay: number
  totalEarlyPenalty: number
  totalPayment: number
  ltvPct: number | null
  breakevenPeriod: number
  valid: boolean
  checks: CheckItem[]
  schedule: ScheduleRow[]
}
interface FormState {
  amount: number
  months: number
  baseRatePct: number
  assetValue: number
  segmentCode: string
  startDate: string
  appraisalFee: number
  periodicFeePct: number
  graceMonths: number
  penaltyOn: boolean
  penaltyPeriod: number
  penaltyDays: number
  prepayOn: boolean
  prepayPeriod: number
  prepayAmount: number
  earlyOn: boolean
  earlyPeriod: number
  earlyPenaltyPct: number
}
interface PinnedScenario {
  label: string
  form: FormState
  result: RunResult
}

const SEGMENTS = [
  { code: 'SEG_STANDARD', label: 'Tiêu chuẩn' },
  { code: 'SEG_LOYALTY', label: 'Thân thiết (−0,5%/tháng)' },
  { code: 'SEG_VIP', label: 'VIP (−0,3%/tháng)' },
]

const vnd = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ')

async function postRun(form: FormState): Promise<RunResult> {
  const res = await fetch('/api/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) throw new Error(`POST simulation/run thất bại: ${res.status}`)
  return res.json()
}

export default function SimulationPage() {
  const [form, setForm] = useState<FormState | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [pinned, setPinned] = useState<PinnedScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ configCode: string | null; variantCode: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/simulation/default')
      .then((r) => {
        if (!r.ok) throw new Error(`GET simulation/default thất bại: ${r.status}`)
        return r.json()
      })
      .then((d: { scenario: DefaultScenario }) => {
        const s = d.scenario
        const f: FormState = {
          amount: s.amount,
          months: s.months,
          baseRatePct: s.baseRatePct,
          assetValue: s.assetValue ?? 0,
          segmentCode: s.segmentCode ?? 'SEG_STANDARD',
          startDate: s.startDate ?? new Date().toISOString().slice(0, 10),
          appraisalFee: s.appraisalFee ?? 0,
          periodicFeePct: s.periodicFeePct ?? 0,
          graceMonths: s.graceMonths ?? 0,
          penaltyOn: false,
          penaltyPeriod: 1,
          penaltyDays: 5,
          prepayOn: false,
          prepayPeriod: 6,
          prepayAmount: 5000000,
          earlyOn: false,
          earlyPeriod: 12,
          earlyPenaltyPct: 2,
        }
        setForm(f)
        setMeta({ configCode: s.configCode, variantCode: s.variantCode })
        return postRun(f)
      })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRun = async (f: FormState) => {
    setRunning(true)
    try {
      const r = await postRun(f)
      setResult(r)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const handlePin = () => {
    if (!form || !result || pinned.length >= 3) return
    const label = ['B', 'C', 'D'][pinned.length]
    setPinned([...pinned, { label, form, result }])
  }

  if (loading || !form) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error && !result)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const field = (label: string, node: React.ReactNode) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#5E6F66', marginBottom: 6 }}>{label}</div>
      {node}
    </div>
  )
  const rangeInput = (value: number, min: number, max: number, step: number, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#0E8C5A' }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B7349', width: 92, textAlign: 'right' }}>
        {value.toLocaleString('vi-VN')}
      </span>
    </div>
  )
  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #E6ECE8',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: '#122019',
  }
  const toggleRow = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#243A30', cursor: 'pointer', marginBottom: 8 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: '#0E8C5A' }} />
      {label}
    </label>
  )

  const kpiCard = (label: string, value: string, warn = false) => (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '13px 15px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#8A998F', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: warn ? '#B23B3B' : '#122019' }}>{value}</div>
    </div>
  )

  return (
    <div style={{ padding: '22px 26px', animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 22, alignItems: 'start' }}>
        {/* ---------- CỘT TRÁI: form tham số ---------- */}
        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '18px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Kịch bản mô phỏng</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#A7B5AC', marginBottom: 16 }}>
            {meta?.configCode ?? '—'} → {meta?.variantCode ?? '—'}
          </div>

          {field('Số tiền vay', rangeInput(form.amount, 3_000_000, 50_000_000, 1_000_000, (v) => setForm({ ...form, amount: v })))}
          {field('Kỳ hạn (tháng)', rangeInput(form.months, 3, 36, 1, (v) => setForm({ ...form, months: v })))}
          {field('Ngày giải ngân kỳ đầu', <input type="date" style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />)}
          {field('Lãi suất Base Rate (%/tháng)', rangeInput(form.baseRatePct, 0.5, 2, 0.05, (v) => setForm({ ...form, baseRatePct: v })))}
          {field('Giá trị tài sản đảm bảo', rangeInput(form.assetValue, 10_000_000, 120_000_000, 1_000_000, (v) => setForm({ ...form, assetValue: v })))}
          {field(
            'Phân khúc khách hàng',
            <select style={inputStyle} value={form.segmentCode} onChange={(e) => setForm({ ...form, segmentCode: e.target.value })}>
              {SEGMENTS.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          )}
          {field('Phí thẩm định (1 lần)', rangeInput(form.appraisalFee, 0, 2_000_000, 100_000, (v) => setForm({ ...form, appraisalFee: v })))}
          {field('Phí quản lý theo kỳ (% dư nợ)', rangeInput(form.periodicFeePct, 0, 0.5, 0.01, (v) => setForm({ ...form, periodicFeePct: v })))}
          {field('Số kỳ ân hạn', rangeInput(form.graceMonths, 0, 6, 1, (v) => setForm({ ...form, graceMonths: v })))}

          <div style={{ borderTop: '1px solid #EEF2EF', margin: '14px 0', paddingTop: 14 }}>
            {toggleRow(form.penaltyOn, (v) => setForm({ ...form, penaltyOn: v }), 'Tình huống: Phạt trễ hạn')}
            {form.penaltyOn && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" style={inputStyle} placeholder="Kỳ trễ" value={form.penaltyPeriod} onChange={(e) => setForm({ ...form, penaltyPeriod: Number(e.target.value) })} />
                <input type="number" style={inputStyle} placeholder="Số ngày trễ" value={form.penaltyDays} onChange={(e) => setForm({ ...form, penaltyDays: Number(e.target.value) })} />
              </div>
            )}
            {toggleRow(form.prepayOn, (v) => setForm({ ...form, prepayOn: v }), 'Tình huống: Trả bớt gốc')}
            {form.prepayOn && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" style={inputStyle} placeholder="Kỳ" value={form.prepayPeriod} onChange={(e) => setForm({ ...form, prepayPeriod: Number(e.target.value) })} />
                <input type="number" style={inputStyle} placeholder="Số tiền" value={form.prepayAmount} onChange={(e) => setForm({ ...form, prepayAmount: Number(e.target.value) })} />
              </div>
            )}
            {toggleRow(form.earlyOn, (v) => setForm({ ...form, earlyOn: v }), 'Tình huống: Tất toán sớm')}
            {form.earlyOn && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" style={inputStyle} placeholder="Kỳ" value={form.earlyPeriod} onChange={(e) => setForm({ ...form, earlyPeriod: Number(e.target.value) })} />
                <input type="number" style={inputStyle} placeholder="% phạt" value={form.earlyPenaltyPct} onChange={(e) => setForm({ ...form, earlyPenaltyPct: Number(e.target.value) })} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleRun(form)}
              disabled={running}
              style={{ flex: 1, background: '#0E8C5A', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: running ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(14,140,90,.3)' }}
            >
              {running ? 'Đang chạy…' : 'Chạy mô phỏng'}
            </button>
            <button
              onClick={handlePin}
              disabled={pinned.length >= 3 || !result}
              title={pinned.length >= 3 ? 'Tối đa 3 phương án ghim' : undefined}
              style={{ flex: 'none', border: '1.5px solid #E6ECE8', color: '#41524A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 600, background: '#fff', cursor: pinned.length >= 3 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              Ghim phương án
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button title="read-only" style={{ flex: 1, border: '1px solid #E6ECE8', color: '#8A998F', borderRadius: 10, padding: '9px', fontSize: 12.5, fontWeight: 600, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Xuất CSV</button>
            <button title="read-only" style={{ flex: 1, border: '1px solid #E6ECE8', color: '#8A998F', borderRadius: 10, padding: '9px', fontSize: 12.5, fontWeight: 600, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Xuất PDF</button>
          </div>
        </div>

        {/* ---------- CỘT PHẢI: kết quả ---------- */}
        <div>
          {result && (
            <>
              {pinned.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '16px 18px', marginBottom: 18, overflowX: 'auto' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#122019', marginBottom: 12 }}>So sánh phương án</div>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', fontSize: 11, color: '#8A998F', padding: '4px 10px' }}></th>
                        <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#0B7349', padding: '4px 10px' }}>A (hiện tại)</th>
                        {pinned.map((p) => (
                          <th key={p.label} style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#41524A', padding: '4px 10px' }}>{p.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Trả góp/kỳ', (r: RunResult) => vnd(r.monthlyPayment)],
                        ['Tổng lãi', (r: RunResult) => vnd(r.totalInterest)],
                        ['Tổng phải trả', (r: RunResult) => vnd(r.totalPayment)],
                        ['LTV', (r: RunResult) => (r.ltvPct != null ? r.ltvPct + '%' : '—')],
                      ].map(([label, fmt]) => (
                        <tr key={label as string} style={{ borderTop: '1px solid #F1F5F2' }}>
                          <td style={{ fontSize: 12, color: '#5E6F66', padding: '7px 10px' }}>{label as string}</td>
                          <td style={{ fontSize: 12.5, fontWeight: 600, color: '#122019', textAlign: 'right', padding: '7px 10px' }}>{(fmt as (r: RunResult) => string)(result)}</td>
                          {pinned.map((p) => (
                            <td key={p.label} style={{ fontSize: 12.5, color: '#41524A', textAlign: 'right', padding: '7px 10px' }}>{(fmt as (r: RunResult) => string)(p.result)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
                {kpiCard('Trả góp/kỳ', vnd(result.monthlyPayment))}
                {kpiCard('Tổng lãi', vnd(result.totalInterest))}
                {kpiCard('Tổng phải trả', vnd(result.totalPayment))}
                {kpiCard('LTV', result.ltvPct != null ? result.ltvPct + '%' : '—', result.ltvPct != null && result.ltvPct > 80)}
                {kpiCard('Phí quản lý', vnd(result.totalFee))}
                {kpiCard('Phạt trễ hạn', vnd(result.totalPenalty), result.totalPenalty > 0)}
                {kpiCard('Đã trả bớt gốc', vnd(result.totalPrepay))}
                {kpiCard('Phạt tất toán sớm', vnd(result.totalEarlyPenalty), result.totalEarlyPenalty > 0)}
              </div>

              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: result.valid ? '#0B7349' : '#B23B3B',
                      background: result.valid ? '#DCF3E7' : '#FBE3E3',
                      padding: '4px 11px',
                      borderRadius: 99,
                    }}
                  >
                    {result.valid ? 'Hợp lệ' : 'Không hợp lệ'}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#122019' }}>Kiểm tra ràng buộc</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.checks.map((c) => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
                      <span style={{ color: c.passed ? '#0E8C5A' : '#B23B3B', fontWeight: 800 }}>{c.passed ? '✓' : '✗'}</span>
                      <span style={{ color: '#41524A' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '16px 18px', overflowX: 'auto' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#122019', marginBottom: 12 }}>Lịch trả nợ chi tiết</div>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: '#FBFDFC' }}>
                      {['Kỳ', 'Ngày', 'Dư nợ đầu kỳ', 'Gốc', 'Lãi', 'Phí', 'Phạt', 'Phải trả', 'Dư nợ cuối kỳ'].map((h) => (
                        <th key={h} style={{ textAlign: 'right', fontSize: 10.5, fontWeight: 700, color: '#8A998F', padding: '8px 10px', borderBottom: '1px solid #EEF2EF', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr key={row.periodNo} style={{ borderBottom: '1px solid #F1F5F2' }}>
                        <td style={{ fontSize: 12, color: '#243A30', padding: '7px 10px', textAlign: 'right' }}>{row.periodNo}</td>
                        <td style={{ fontSize: 11.5, color: '#8A998F', padding: '7px 10px', textAlign: 'right' }}>{row.dueDate}</td>
                        <td style={{ fontSize: 12, color: '#41524A', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.openingBalance)}</td>
                        <td style={{ fontSize: 12, color: '#41524A', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.principal)}</td>
                        <td style={{ fontSize: 12, color: '#41524A', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.interest)}</td>
                        <td style={{ fontSize: 12, color: '#41524A', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.fee)}</td>
                        <td style={{ fontSize: 12, color: row.penalty > 0 ? '#B23B3B' : '#41524A', padding: '7px 10px', textAlign: 'right' }}>{row.penalty > 0 ? vnd(row.penalty) : '—'}</td>
                        <td style={{ fontSize: 12, fontWeight: 700, color: '#122019', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.payment)}</td>
                        <td style={{ fontSize: 12, color: '#41524A', padding: '7px 10px', textAlign: 'right' }}>{vnd(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
