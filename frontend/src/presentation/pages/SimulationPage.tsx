import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'

// ---- kiểu dữ liệu API ----
interface VariantOption {
  code: string
  name: string
  status: string
  fromConfigCode: string
  templateName: string | null
  limitRange: string | null
  displayRate: string | null
}
interface Scenario {
  variantCode: string
  configCode: string
  amount: number
  amountMin: number
  amountMax: number
  months: number
  monthsMin: number
  monthsMax: number
  termLimit: number
  baseRatePct: number
  assetValue: number
  segmentCode: string
  startDate: string
  appraisalFee: number
  periodicFeePct: number
  penaltyOn: boolean
  penaltyPeriod: number
  penaltyDays: number
  prepayOn: boolean
  prepayPeriod: number
  prepayAmount: number
  graceOn: boolean
  graceMonths: number
  earlyOn: boolean
  earlyPeriod: number
  earlyPenaltyPct: number
}
interface CheckItem {
  title: string
  detail: string
  value: string
  passed: boolean
}
interface ChartBar {
  period: number
  label: number
  showLabel: boolean
  priH: string
  intH: string
  feeH: string
}
interface ScheduleRow {
  periodNo: number
  periodStart: string
  periodEnd: string
  openingBalance: number
  principal: number
  interest: number
  fee: number
  penalty: number
  payment: number
  closingBalance: number
  hasTag: boolean
  tagText: string | null
  tagColor: string | null
  rowBg: string
}
interface RunResult {
  effectiveRatePct: number
  monthlyPayment: number
  totalInterest: number
  totalFee: number
  periodicFeeOnly: number
  totalPrincipal: number
  totalPenalty: number
  totalPrepay: number
  totalEarlyPenalty: number
  appraisalFee: number
  totalPayment: number
  grossInflow: number
  ltvPct: number | null
  breakevenPeriod: number | null
  periodsUsed: number
  valid: boolean
  checks: CheckItem[]
  schedule: ScheduleRow[]
  chart: ChartBar[]
  cumPoints: string
  capitalLineY: string
  breakevenX: string | null
  hasBreakeven: boolean
}
interface PinnedScenario {
  label: string
  color: string
  form: Scenario
  result: RunResult
}

const SEGMENTS = [
  { code: 'SEG_STANDARD', label: 'Khách hàng tiêu chuẩn', sub: 'Base Rate mặc định' },
  { code: 'SEG_LOYALTY', label: 'Khách hàng thân thiết', sub: 'Ưu đãi −0,5%/tháng' },
  { code: 'SEG_VIP', label: 'Khách hàng VIP', sub: 'Ưu đãi −0,3%/tháng' },
]
const SCEN_COLORS = ['#0E8C5A', '#2F73C4', '#9A6B00', '#7A4FC7']
const SCEN_LABELS = ['A', 'B', 'C', 'D']

const vnd = (n: number | null | undefined) => (n == null ? '—' : Math.round(n).toLocaleString('vi-VN') + 'đ')
const fmt1 = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
const fmt2 = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

async function postRun(form: Scenario): Promise<RunResult> {
  const res = await fetch('/api/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) throw new Error(`POST simulation/run thất bại: ${res.status}`)
  return res.json()
}

export default function SimulationPage() {
  const [variants, setVariants] = useState<VariantOption[]>([])
  const [form, setForm] = useState<Scenario | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [pinned, setPinned] = useState<PinnedScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/simulation/variants').then((r) => r.json()),
      fetch('/api/simulation/default').then((r) => r.json()),
    ])
      .then(([vs, d]: [VariantOption[], { scenario: Scenario; result: RunResult }]) => {
        setVariants(vs)
        setForm(d.scenario)
        setResult(d.result)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // real-time: mỗi khi form đổi (kéo slider, gõ số, đổi toggle) → debounce 220ms rồi tự chạy lại.
  useEffect(() => {
    if (!form) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      postRun(form).then(setResult).catch((e) => setError(e.message))
    }, 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const handleVariantChange = (code: string) => {
    fetch(`/api/simulation/default?variantCode=${code}`)
      .then((r) => r.json())
      .then((d: { scenario: Scenario; result: RunResult }) => {
        setForm(d.scenario)
        setResult(d.result)
      })
      .catch((e) => setError(e.message))
  }

  const handlePin = () => {
    if (!form || !result || pinned.length >= 3) return
    setPinned([...pinned, { label: SCEN_LABELS[pinned.length + 1], color: SCEN_COLORS[pinned.length + 1], form, result }])
  }
  const clearPin = (i: number) => setPinned(pinned.filter((_, idx) => idx !== i))

  const set = <K extends keyof Scenario>(k: K, v: Scenario[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const currentVariant = useMemo(() => variants.find((v) => v.code === form?.variantCode) ?? null, [variants, form])

  const csvCell = (v: string | number) => {
    const s = String(v)
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  const handleExportCsv = () => {
    if (!form || !result) return
    const rows: (string | number)[][] = []
    rows.push(['Lịch trả nợ (Amortization Schedule) — Product Factory'])
    rows.push(['Sản phẩm', currentVariant?.name ?? form.variantCode])
    rows.push(['Mã sản phẩm (Variant)', form.variantCode])
    rows.push(['Mã cấu hình (Config)', form.configCode])
    rows.push(['Số tiền vay (đ)', Math.round(form.amount)])
    rows.push(['Kỳ hạn (tháng)', form.months])
    rows.push(['Ngày bắt đầu kỳ đầu tiên', form.startDate])
    rows.push(['Lãi suất Base Rate (%/tháng)', fmt2(form.baseRatePct)])
    rows.push(['Lãi suất hiệu dụng (%/tháng)', fmt2(result.effectiveRatePct)])
    rows.push(['Giá trị tài sản đảm bảo (đ)', Math.round(form.assetValue)])
    rows.push(['Phân khúc khách hàng', SEGMENTS.find((s) => s.code === form.segmentCode)?.label ?? form.segmentCode])
    rows.push(['Phí thẩm định (1 lần, đ)', Math.round(form.appraisalFee)])
    rows.push(['Phí quản lý theo kỳ (%/kỳ)', fmt2(form.periodicFeePct)])
    rows.push(['Tình huống phạt trễ hạn', form.penaltyOn ? `Kỳ ${form.penaltyPeriod}, trễ ${form.penaltyDays} ngày` : 'Không có'])
    rows.push(['Tình huống trả bớt gốc', form.prepayOn ? `Kỳ ${form.prepayPeriod}, trả thêm ${Math.round(form.prepayAmount)}đ` : 'Không có'])
    rows.push(['Tình huống ân hạn', form.graceOn ? `${form.graceMonths} kỳ chỉ trả lãi` : 'Không có'])
    rows.push(['Tình huống đóng sớm (tất toán)', form.earlyOn ? `Kỳ ${form.earlyPeriod}, phạt ${fmt2(form.earlyPenaltyPct)}% dư nợ` : 'Không có'])
    rows.push(['Kỳ trả định kỳ (đ)', Math.round(result.monthlyPayment)])
    rows.push(['Tổng gốc (đ)', Math.round(result.totalPrincipal)])
    rows.push(['Tổng lãi (đ)', Math.round(result.totalInterest)])
    rows.push(['Tổng phí (đ)', Math.round(result.totalFee)])
    rows.push(['Tổng phạt trễ hạn + tất toán sớm (đ)', Math.round(result.totalPenalty + result.totalEarlyPenalty)])
    rows.push(['Tổng phải trả (đ)', Math.round(result.totalPayment)])
    rows.push(['Số kỳ thực trả', `${result.periodsUsed}/${form.months}`])
    rows.push(['Tỷ lệ LTV (%)', result.ltvPct != null ? fmt1(result.ltvPct) : '—'])
    rows.push(['Điểm hòa vốn', result.breakevenPeriod != null ? `Kỳ ${result.breakevenPeriod}` : '—'])
    rows.push(['Trạng thái ràng buộc', result.valid ? 'Hợp lệ' : 'Có cảnh báo'])
    rows.push([])
    rows.push(['Kỳ', 'Từ ngày', 'Đến ngày', 'Dư đầu kỳ', 'Gốc', 'Lãi', 'Phí', 'Phạt', 'Kỳ trả', 'Dư cuối kỳ', 'Ghi chú'])
    result.schedule.forEach((row) => {
      rows.push([
        row.periodNo,
        row.periodStart,
        row.periodEnd,
        Math.round(row.openingBalance),
        Math.round(row.principal),
        Math.round(row.interest),
        Math.round(row.fee),
        Math.round(row.penalty),
        Math.round(row.payment),
        Math.round(row.closingBalance),
        row.hasTag ? row.tagText ?? '' : '',
      ])
    })
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lich-tra-no_${form.variantCode}_${form.startDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading || !form) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error && !result)
    return <div style={{ padding: '22px 26px', color: '#B23B3B' }}>Lỗi: {error}. Kiểm tra backend đã chạy chưa.</div>

  const sliderRow = (label: string, valueLabel: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, accent = '#0E8C5A', minMaxLabels?: [string, string]) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#41524A' }}>{label}</label>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: accent === '#0E8C5A' ? '#0B7349' : accent }}>{valueLabel}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: accent }} />
      {minMaxLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#A7B5AC', marginTop: 3 }}>
          <span>{minMaxLabels[0]}</span><span>{minMaxLabels[1]}</span>
        </div>
      )}
    </div>
  )

  const smallInput = (value: number, onChange: (v: number) => void, placeholder?: string) => (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ border: '1px solid #E0E7E2', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' }}
    />
  )

  const toggleSwitch = (on: boolean, onColor: string, onClick: () => void) => (
    <div onClick={onClick} style={{ width: 38, height: 22, borderRadius: 99, background: on ? onColor : '#D7E1DB', position: 'relative', flex: 'none', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
    </div>
  )

  const scenarioBlock = (title: string, sub: string, on: boolean, onColor: string, onToggle: () => void, children: React.ReactNode) => (
    <div style={{ borderTop: '1px solid #EEF2EF', paddingTop: 15 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#122019' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#8A998F', marginTop: 1 }}>{sub}</div>
        </div>
        {toggleSwitch(on, onColor, onToggle)}
      </div>
      {on && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )

  const kpiCard3 = (label: string, value: string, color: string, sub: string) => (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: '#A7B5AC', fontWeight: 600, letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 7, letterSpacing: '-.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8A998F', marginTop: 4 }}>{sub}</div>
    </div>
  )

  const kpiCardSmall = (icon: string, label: string, value: string, color: string, sub: string) => (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={16} color={color} />
        <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 700, letterSpacing: '.2px', lineHeight: 1.2 }}>{label}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-.3px' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8A998F', marginTop: 4 }}>{sub}</div>
    </div>
  )

  const r = result

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, animation: 'fadeUp .3s ease' }}>
      {/* ---------- FORM TRÁI ---------- */}
      <div style={{ width: 360, flex: 'none', background: '#fff', borderRight: '1px solid #E6ECE8', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #EEF2EF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#14B870,#0E8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: '#fff' }}>
              <Icon name="bolt" size={19} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#122019' }}>Kịch bản mô phỏng</div>
              <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 1 }}>Nhập điều kiện khoản vay để chạy thử</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 17 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#41524A', display: 'block', marginBottom: 7 }}>Sản phẩm (Variant)</label>
            <select
              value={form.variantCode}
              onChange={(e) => handleVariantChange(e.target.value)}
              style={{ width: '100%', border: '1px solid #E0E7E2', borderRadius: 9, padding: '11px 13px', fontSize: 13, color: '#243A30', background: '#FBFDFC', outline: 'none', fontFamily: 'inherit' }}
            >
              {variants.map((v) => (
                <option key={v.code} value={v.code}>{v.name}</option>
              ))}
            </select>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC', marginTop: 5 }}>
              {form.variantCode} · {currentVariant?.templateName ?? form.configCode}
            </div>
          </div>

          {sliderRow('Số tiền vay', vnd(form.amount), form.amount, form.amountMin, form.amountMax, 1_000_000, (v) => set('amount', v), '#0E8C5A', [vnd(form.amountMin), vnd(form.amountMax)])}
          {sliderRow('Kỳ hạn', form.months + ' tháng', form.months, form.monthsMin, form.monthsMax, 1, (v) => set('months', v), '#0E8C5A', [String(form.monthsMin), String(form.monthsMax)])}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#41524A', display: 'block', marginBottom: 7 }}>Ngày bắt đầu kỳ đầu tiên</label>
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} style={{ width: '100%', border: '1px solid #E0E7E2', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#243A30' }} />
            <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 4 }}>Mỗi kỳ kéo dài 1 tháng, ngày đến hạn theo lịch</div>
          </div>

          {sliderRow('Lãi suất (Base Rate)', fmt1(form.baseRatePct) + '%/tháng', form.baseRatePct, 0.5, 2, 0.05, (v) => set('baseRatePct', v), '#0E8C5A', ['0,5%', '2,0% · trần'])}
          {sliderRow('Giá trị tài sản ĐB', vnd(form.assetValue), form.assetValue, 10_000_000, Math.max(120_000_000, form.assetValue), 1_000_000, (v) => set('assetValue', v))}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#41524A', display: 'block', marginBottom: 8 }}>Phân khúc khách hàng (Selector Scope)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SEGMENTS.map((s) => {
                const on = form.segmentCode === s.code
                return (
                  <button
                    key={s.code}
                    onClick={() => set('segmentCode', s.code)}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '1.5px solid ' + (on ? '#0E8C5A' : '#E6ECE8'), background: on ? '#F4FBF7' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: on ? '#0B7349' : '#A7B5AC', fontWeight: on ? 600 : 400 }}>{s.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #EEF2EF', paddingTop: 15 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', marginBottom: 11 }}>PHÍ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {sliderRow('Phí thẩm định (1 lần · tại giải ngân)', vnd(form.appraisalFee), form.appraisalFee, 0, 2_000_000, 100_000, (v) => set('appraisalFee', v), '#2F73C4')}
              {sliderRow('Phí quản lý theo kỳ (% dư nợ)', fmt2(form.periodicFeePct) + '%/kỳ', form.periodicFeePct, 0, 0.5, 0.05, (v) => set('periodicFeePct', v), '#2F73C4')}
            </div>
          </div>

          {scenarioBlock('Tình huống phạt trễ hạn', 'Phạt = 150% lãi suất trên kỳ trả', form.penaltyOn, '#B23B3B', () => set('penaltyOn', !form.penaltyOn), (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Trễ tại kỳ</label>{smallInput(form.penaltyPeriod, (v) => set('penaltyPeriod', v))}</div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Số ngày trễ</label>{smallInput(form.penaltyDays, (v) => set('penaltyDays', v))}</div>
            </div>
          ))}

          {scenarioBlock('Tình huống trả bớt gốc', 'Tái phân bổ kỳ trả sau khi trả trước', form.prepayOn, '#0E8C5A', () => set('prepayOn', !form.prepayOn), (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 'none', width: 90 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Tại kỳ</label>{smallInput(form.prepayPeriod, (v) => set('prepayPeriod', v))}</div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Số tiền trả thêm (đ)</label>{smallInput(form.prepayAmount, (v) => set('prepayAmount', v))}</div>
            </div>
          ))}

          {scenarioBlock('Tình huống ân hạn', 'Kỳ đầu chỉ trả lãi, hoãn gốc', form.graceOn, '#E8920C', () => set('graceOn', !form.graceOn), (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66' }}>Số kỳ ân hạn (chỉ trả lãi)</label>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#9A6B00' }}>{form.graceMonths} kỳ</span>
              </div>
              <input type="range" min={1} max={6} step={1} value={form.graceMonths} onChange={(e) => set('graceMonths', Number(e.target.value))} style={{ width: '100%', accentColor: '#E8920C' }} />
            </div>
          ))}

          {scenarioBlock('Tình huống đóng sớm (tất toán)', 'Đóng toàn bộ dư nợ + phạt tất toán', form.earlyOn, '#B23B3B', () => set('earlyOn', !form.earlyOn), (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 'none', width: 90 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Tất toán tại kỳ</label>{smallInput(form.earlyPeriod, (v) => set('earlyPeriod', v))}</div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Phạt tất toán (% dư nợ)</label>{smallInput(form.earlyPenaltyPct, (v) => set('earlyPenaltyPct', v))}</div>
            </div>
          ))}

          <button
            onClick={() => form && postRun(form).then(setResult)}
            style={{ marginTop: 4, width: '100%', background: '#0E8C5A', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 3px 10px rgba(14,140,90,.32)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="play" size={15} color="#fff" /> Chạy mô phỏng
          </button>
          <button
            onClick={handlePin}
            disabled={pinned.length >= 3 || !result}
            style={{ width: '100%', border: 'none', borderRadius: 10, padding: 11, fontSize: 12.5, fontWeight: 700, color: '#fff', background: pinned.length < 3 ? '#243A30' : '#B4C4BB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: pinned.length < 3 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            <Icon name="target" size={14} color="#fff" /> Ghim phương án ({pinned.length}/3)
          </button>
          <div style={{ display: 'flex', gap: 9 }}>
            <button
              onClick={handleExportCsv}
              disabled={!result}
              title={result ? 'Xuất lịch trả nợ ra file CSV (mở được bằng Excel)' : undefined}
              style={{ flex: 1, border: '1px solid #C2D0C8', borderRadius: 10, padding: 11, fontSize: 12.5, fontWeight: 600, color: result ? '#0B7349' : '#41524A', background: '#fff', cursor: result ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >Xuất CSV</button>
            <button title="read-only" style={{ flex: 1, border: '1px solid #C2D0C8', borderRadius: 10, padding: 11, fontSize: 12.5, fontWeight: 600, color: '#41524A', background: '#fff', cursor: 'not-allowed', fontFamily: 'inherit' }}>Xuất PDF</button>
          </div>

          {pinned.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC' }}>PHƯƠNG ÁN ĐÃ GHIM</div>
              {pinned.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: '#F4F7F5', border: '1px solid #E6ECE8', borderRadius: 10 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: p.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flex: 'none' }}>{p.label}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: '#5E6F66' }}>{vnd(p.form.amount)} · {p.form.months} tháng · {fmt1(p.form.baseRatePct)}%</div>
                  <button onClick={() => clearPin(i)} style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A7B5AC', flex: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Icon name="x" size={12} color="#A7B5AC" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- KẾT QUẢ PHẢI ---------- */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 26px', background: '#F4F7F5' }}>
        {pinned.length > 0 && r && (
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019', marginBottom: 3 }}>So sánh {pinned.length + 1} phương án</div>
            <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 15 }}>Ô nền xanh là giá trị tốt nhất (thấp nhất) của mỗi chỉ số. P/A A là kịch bản đang chỉnh trực tiếp.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A998F', padding: '9px 12px', borderBottom: '2px solid #EEF2EF' }}>CHỈ SỐ</th>
                    <th style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '2px solid #EEF2EF' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: SCEN_COLORS[0] }}>P/A A</div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: '#A7B5AC', marginTop: 1 }}>{vnd(form.amount)}·{form.months}th</div>
                    </th>
                    {pinned.map((p) => (
                      <th key={p.label} style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '2px solid #EEF2EF' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: p.color }}>P/A {p.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#A7B5AC', marginTop: 1 }}>{vnd(p.form.amount)}·{p.form.months}th</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['Kỳ trả hàng tháng', (x: RunResult) => x.monthlyPayment, vnd],
                      ['Tổng lãi', (x: RunResult) => x.totalInterest, vnd],
                      ['Tổng phải trả', (x: RunResult) => x.totalPayment, vnd],
                      ['Lãi suất hiệu dụng/tháng', (x: RunResult) => x.effectiveRatePct, (v: number) => fmt1(v) + '%'],
                      ['Điểm hòa vốn (kỳ)', (x: RunResult) => x.breakevenPeriod ?? 999, (v: number, x: RunResult) => (x.breakevenPeriod != null ? 'Kỳ ' + x.breakevenPeriod : '—')],
                      ['Tỷ lệ LTV', (x: RunResult) => x.ltvPct ?? 0, (v: number) => fmt1(v) + '%'],
                    ] as const
                  ).map(([label, num, fmtFn]) => {
                    const all = [r, ...pinned.map((p) => p.result)]
                    const nums = all.map(num)
                    const best = Math.min(...nums)
                    const worst = Math.max(...nums)
                    return (
                      <tr key={label} style={{ borderBottom: '1px solid #F1F5F2' }}>
                        <td style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', padding: '10px 12px' }}>{label}</td>
                        {all.map((x, i) => {
                          const isBest = nums.length > 1 && nums[i] === best && best !== worst
                          return (
                            <td key={i} style={{ padding: '7px 8px', textAlign: 'right' }}>
                              <span style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: isBest ? 700 : 600, color: isBest ? '#0B7349' : '#243A30', background: isBest ? '#ECF6F1' : 'transparent' }}>
                                {(fmtFn as (v: number, x: RunResult) => string)(nums[i], x)}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {r && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
              {kpiCard3('KỲ TRẢ ĐỊNH KỲ', vnd(r.monthlyPayment), '#122019', 'Gốc + lãi (chưa phí)')}
              {kpiCard3('TỔNG LÃI', vnd(r.totalInterest), '#9A6B00', 'Trên toàn kỳ hạn')}
              {kpiCard3('TỔNG PHÍ', vnd(r.totalFee), '#2F73C4', 'Thẩm định + phí theo kỳ')}
              {kpiCard3('TỔNG PHẢI TRẢ', vnd(r.totalPayment), '#0B7349', 'Gốc + lãi + phí + phạt')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
              {kpiCardSmall('tag', 'PHÍ THẨM ĐỊNH (1 LẦN)', vnd(r.appraisalFee), '#2F73C4', 'Thu tại thời điểm giải ngân')}
              {kpiCardSmall('config', 'PHÍ QUẢN LÝ THEO KỲ', fmt2(form.periodicFeePct) + '%/kỳ', '#2F73C4', 'Trên dư nợ đầu kỳ · ' + vnd(r.periodicFeeOnly))}
              {kpiCardSmall('bell', 'TỔNG PHẠT TRỄ HẠN', vnd(r.totalPenalty), r.totalPenalty > 0 ? '#B23B3B' : '#A7B5AC', form.penaltyOn ? `Kỳ ${form.penaltyPeriod} · trễ ${form.penaltyDays} ngày` : 'Không có')}
              {kpiCardSmall('variant', 'ĐÃ TRẢ BỚT GỐC', vnd(r.totalPrepay), r.totalPrepay > 0 ? '#0B7349' : '#A7B5AC', form.prepayOn ? `Kỳ ${form.prepayPeriod} · còn ${r.periodsUsed} kỳ` : 'Không có')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
              {kpiCardSmall('lifecycle', 'KỲ ÂN HẠN (CHỈ TRẢ LÃI)', form.graceOn ? `${form.graceMonths} kỳ` : '0 kỳ', form.graceOn ? '#9A6B00' : '#A7B5AC', form.graceOn ? `Gốc phân bổ từ kỳ ${form.graceMonths + 1}` : 'Không có')}
              {kpiCardSmall('bolt', 'TẤT TOÁN TRƯỚC HẠN', form.earlyOn && r.periodsUsed < form.months ? `Kỳ ${r.periodsUsed}` : '—', form.earlyOn && r.periodsUsed < form.months ? '#B23B3B' : '#A7B5AC', form.earlyOn && r.periodsUsed < form.months ? `Đóng sớm ${form.months - r.periodsUsed} kỳ` : 'Không có')}
              {kpiCardSmall('bell', 'PHẠT TẤT TOÁN SỚM', vnd(r.totalEarlyPenalty), r.totalEarlyPenalty > 0 ? '#B23B3B' : '#A7B5AC', form.earlyOn ? fmt1(form.earlyPenaltyPct) + '% dư nợ tất toán' : 'Không có')}
              {kpiCardSmall('config', 'KỲ THỰC TRẢ', `${r.periodsUsed} / ${form.months} kỳ`, '#122019', r.periodsUsed < form.months ? 'Kết thúc sớm' : 'Đủ kỳ hạn')}
            </div>

            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019' }}>Kiểm tra ràng buộc (Constraint Validation)</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: r.valid ? '#DCF3E7' : '#FBEFC7', color: r.valid ? '#0B7349' : '#9A6B00' }}>
                  {r.valid ? '✓ Hợp lệ — sẵn sàng đóng gói' : '! Có cảnh báo ràng buộc'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {r.checks.map((c) => (
                  <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid ' + (c.passed ? '#D5EEE0' : '#F2D4D4'), borderRadius: 10, background: c.passed ? '#F4FBF7' : '#FEF6F6' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: c.passed ? '#0E8C5A' : '#D9893B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontWeight: 700, fontSize: 13 }}>{c.passed ? '✓' : '!'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{c.title}</div>
                      <div style={{ fontSize: 11.5, color: '#5E6F66', marginTop: 2 }}>{c.detail}</div>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 600, color: c.passed ? '#0B7349' : '#B26B1B' }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019' }}>Dòng tiền (Cashflow) — góc nhìn bên cho vay</div>
                  <div style={{ fontSize: 12, color: '#8A998F', marginTop: 2 }}>Cơ cấu Gốc/Lãi mỗi kỳ &amp; đường thu hồi lũy kế so với vốn giải ngân</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none', paddingTop: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#0E8C5A' }} /><span style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 500 }}>Gốc</span></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#E8920C' }} /><span style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 500 }}>Lãi</span></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#2F73C4' }} /><span style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 500 }}>Phí/Phạt</span></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 0, borderTop: '2px solid #0E8C5A' }} /><span style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 500 }}>Thu hồi lũy kế (A)</span></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
                <div style={{ border: '1px solid #EEF2EF', borderRadius: 11, padding: '12px 14px', background: '#FBFDFC' }}>
                  <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 600, letterSpacing: '.3px' }}>VỐN GIẢI NGÂN (T0)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#B23B3B', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>−{vnd(form.amount)}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 3 }}>Dòng tiền ra</div>
                </div>
                <div style={{ border: '1px solid #EEF2EF', borderRadius: 11, padding: '12px 14px', background: '#FBFDFC' }}>
                  <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 600, letterSpacing: '.3px' }}>TỔNG THU VỀ</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0B7349', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>+{vnd(r.grossInflow)}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 3 }}>{r.periodsUsed} kỳ · gồm phí &amp; phạt</div>
                </div>
                <div style={{ border: '1px solid #EEF2EF', borderRadius: 11, padding: '12px 14px', background: '#FBFDFC' }}>
                  <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 600, letterSpacing: '.3px' }}>LÃI RÒNG</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0B7349', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>+{vnd(r.totalInterest + r.totalFee + r.totalPenalty)}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 3 }}>Lãi + phí + phạt</div>
                </div>
                <div style={{ border: '1px solid #EEF2EF', borderRadius: 11, padding: '12px 14px', background: '#FBFDFC' }}>
                  <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 600, letterSpacing: '.3px' }}>ĐIỂM HÒA VỐN</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#122019', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>{r.breakevenPeriod != null ? 'Kỳ ' + r.breakevenPeriod : '—'}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 3 }}>Thu hồi đủ vốn gốc</div>
                </div>
              </div>

              <div style={{ position: 'relative', height: 210, padding: '0 2px', marginBottom: 6 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: r.capitalLineY, borderTop: '1.5px dashed #C2A56B', zIndex: 2, pointerEvents: 'none' }}>
                  <span style={{ position: 'absolute', right: 0, top: -9, fontSize: 10, fontWeight: 600, color: '#9A6B00', background: '#FBEFC7', padding: '1px 7px', borderRadius: 6 }}>Vốn giải ngân</span>
                </div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none', overflow: 'visible' }}>
                  {pinned.map((p, i) => (
                    <polyline key={i} points={p.result.cumPoints} fill="none" stroke={p.color} strokeWidth={0.7} strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
                  ))}
                  <polyline points={r.cumPoints} fill="none" stroke="#0E8C5A" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
                </svg>
                {r.hasBreakeven && r.breakevenX && (
                  <div style={{ position: 'absolute', top: 0, bottom: 18, left: r.breakevenX, width: 0, borderLeft: '1.5px dotted #0E8C5A', zIndex: 2 }}>
                    <span style={{ position: 'absolute', top: -2, left: 5, fontSize: 10, fontWeight: 700, color: '#0B7349', whiteSpace: 'nowrap', background: '#DCF3E7', padding: '1px 7px', borderRadius: 6 }}>
                      Hòa vốn · kỳ {r.breakevenPeriod}
                    </span>
                  </div>
                )}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, top: 0, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                  {r.chart.map((b) => (
                    <div key={b.period} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: '100%', maxWidth: 26, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                        <div style={{ width: '100%', height: b.feeH, background: '#2F73C4', borderRadius: '3px 3px 0 0' }} />
                        <div style={{ width: '100%', height: b.intH, background: '#E8920C' }} />
                        <div style={{ width: '100%', height: b.priH, background: '#0E8C5A' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, display: 'flex', gap: 3 }}>
                  {r.chart.map((b) => (
                    <div key={b.period} style={{ flex: 1, textAlign: 'center', minWidth: 0, fontSize: 9.5, color: '#A7B5AC', overflow: 'hidden' }}>
                      {b.showLabel && <span>{b.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#A7B5AC', textAlign: 'center' }}>
                Trục X: kỳ trả · Trục Y: tỷ trọng trong kỳ trả niên kim · Đường xanh dương leo dần thể hiện tiền thu về cộng dồn
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019' }}>Lịch trả nợ (Amortization Schedule)</div>
                  <div style={{ fontSize: 12, color: '#8A998F', marginTop: 2 }}>Dư nợ giảm dần · {form.months} kỳ · {vnd(form.amount)} gốc</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0B7349', background: '#DCF3E7', padding: '4px 11px', borderRadius: 99 }}>
                  Lãi {vnd(r.totalInterest)} · Phí {vnd(r.periodicFeeOnly)}{r.totalPenalty > 0 ? ` · Phạt ${vnd(r.totalPenalty)}` : ''}
                </span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                      {['KỲ', 'TỪ NGÀY', 'ĐẾN NGÀY', 'DƯ ĐẦU KỲ', 'GỐC', 'LÃI', 'PHÍ', 'PHẠT', 'KỲ TRẢ', 'DƯ CUỐI KỲ'].map((h, i) => (
                        <th key={h} style={{ textAlign: i <= 2 ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: h === 'PHÍ' ? '#2F73C4' : h === 'PHẠT' ? '#B23B3B' : '#8A998F', padding: '9px 12px', borderBottom: '2px solid #EEF2EF', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.schedule.map((row) => (
                      <tr key={row.periodNo} style={{ borderBottom: '1px solid #F1F5F2', background: row.rowBg }}>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>
                          <div>Kỳ {row.periodNo}</div>
                          {row.hasTag && <div style={{ fontSize: 9.5, fontWeight: 700, color: row.tagColor ?? undefined, marginTop: 2 }}>● {row.tagText}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#5E6F66', fontFamily: "'JetBrains Mono', monospace" }}>{row.periodStart}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#5E6F66', fontFamily: "'JetBrains Mono', monospace" }}>{row.periodEnd}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#5E6F66', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{vnd(row.openingBalance)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#0B7349', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{row.principal > 0 ? vnd(row.principal) : '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#9A6B00', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{vnd(row.interest)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#2F73C4', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{vnd(row.fee)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#B23B3B', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{row.penalty > 0 ? vnd(row.penalty) : '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#122019', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{vnd(row.payment)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#5E6F66', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{vnd(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
