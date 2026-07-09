import { useEffect, useState } from 'react'

// ---- Bảng màu legend trích NGUYÊN từ prototype (LEG). Key 'no' ứng verdict DB 'na'. ----
type LegKind = 'rpn'
type Tone = [string, string, string, string] // [label, bg, fg, border]
const LEG: Record<LegKind, Record<'req' | 'pos' | 'no', Tone>> = {
  rpn: {
    req: ['Bắt buộc', '#DCF3E7', '#0B7349', '#B7E6CE'],
    pos: ['Được phép', '#E5EEF9', '#2F73C4', '#BBD4F2'],
    no: ['Không', '#F4F7F5', '#B8C5BD', '#E2E8E4'],
  },
}

// Nhãn tab ngắn — Giai đoạn 58: chỉ còn đúng 2 ma trận (bỏ "OET × OET" và
// "Pattern × Block (độ phủ)" khỏi màn Ma trận theo yêu cầu user).
const TAB_LABELS = ['FOA × Obligation Element', 'Obligation Element × Block']

interface Grid {
  title: string
  desc: string
  legend: LegKind
  rowHead: string
  cols: { code: string; label: string }[]
  rows: { code: string; label: string; cells: string[] }[]
}

interface MatrixResp {
  rowHead: string
  legend: LegKind
  cols: { code: string; label: string }[]
  rows: { code: string; label: string; cells: string[] }[]
}

// verdict DB (req|pos|na) -> key legend (req|pos|no)
const legKey = (v: string): 'req' | 'pos' | 'no' => (v === 'req' ? 'req' : v === 'pos' ? 'pos' : 'no')

export default function MatrixPage() {
  const [tabs, setTabs] = useState<Grid[] | null>(null)
  const [tab, setTab] = useState(0)
  // Override hiển thị CỤC BỘ (giống prototype matrixOverrides) — KHÔNG ghi DB, reset khi tải lại.
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const foaOeRes = await fetch('/api/constraint-matrices/foa-oe-matrix')
      if (!foaOeRes.ok) throw new Error(`GET foa-oe-matrix ${foaOeRes.status}`)
      const foaOe: MatrixResp = await foaOeRes.json()

      const oeBlockRes = await fetch('/api/constraint-matrices/oe-block-matrix')
      if (!oeBlockRes.ok) throw new Error(`GET oe-block-matrix ${oeBlockRes.status}`)
      const oeBlock: MatrixResp = await oeBlockRes.json()

      const g: Grid[] = [
        {
          title: 'Ma trận 1: FOA × Obligation Element',
          desc: 'Quy định Obligation Element nào bắt buộc / được phép với từng Financial Obligation Archetype (FOA). Nguồn duy nhất: foa_element.',
          legend: foaOe.legend,
          rowHead: foaOe.rowHead,
          cols: foaOe.cols,
          rows: foaOe.rows,
        },
        {
          title: 'Ma trận 2: Obligation Element × Block',
          desc: 'Block nào được Obligation Element chi phối (governed_by_element_code) — dùng để đối chiếu độ phủ Block khi dựng Pattern. Nguồn duy nhất: block.governed_by_element_code.',
          legend: oeBlock.legend,
          rowHead: oeBlock.rowHead,
          cols: oeBlock.cols,
          rows: oeBlock.rows,
        },
      ]
      setTabs(g)
    }
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '24px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error)
    return (
      <div style={{ padding: '24px 26px', color: '#B23B3B' }}>
        Lỗi: {error}. Kiểm tra backend đã chạy chưa.
      </div>
    )
  if (!tabs) return null

  const g = tabs[tab]
  const leg = LEG[g.legend]

  // verdict hiệu dụng = override cục bộ ?? verdict DB.
  const eff = (ri: number, ci: number, base: string) => overrides[`${tab}:${ri}:${ci}`] ?? base

  // Click ô: cycle req → pos → na (tương đương prototype req→pos→no). Chỉ đổi state, không ghi DB.
  const ORDER = ['req', 'pos', 'na']
  const cycle = (ri: number, ci: number, base: string) => {
    const cur = overrides[`${tab}:${ri}:${ci}`] ?? base
    const next = ORDER[(ORDER.indexOf(cur) + 1) % 3]
    setOverrides((o) => ({ ...o, [`${tab}:${ri}:${ci}`]: next }))
  }

  // Thống kê req/pos/no + tổng (theo verdict hiệu dụng — cập nhật realtime khi click).
  const counts = { req: 0, pos: 0, no: 0 }
  g.rows.forEach((r, ri) => r.cells.forEach((v, ci) => (counts[legKey(eff(ri, ci, v))] += 1)))
  const stats = [
    { label: leg.req[0], count: counts.req, color: leg.req[2] },
    { label: leg.pos[0], count: counts.pos, color: leg.pos[2] },
    { label: leg.no[0], count: counts.no, color: '#B8C5BD' },
    { label: 'Tổng ô', count: counts.req + counts.pos + counts.no, color: '#0E8C5A' },
  ]

  return (
    <div style={{ padding: '24px 26px', animation: 'fadeUp .3s ease' }}>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {TAB_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              fontSize: 12.5,
              fontWeight: i === tab ? 700 : 500,
              color: i === tab ? '#fff' : '#41524A',
              background: i === tab ? '#0E8C5A' : '#fff',
              border: i === tab ? 'none' : '1px solid #E6ECE8',
              padding: '8px 14px',
              borderRadius: 9,
              boxShadow: i === tab ? '0 2px 8px rgba(14,140,90,.25)' : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #E6ECE8',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ width: 11, height: 11, borderRadius: 4, background: s.color, flex: 'none' }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* main card */}
      <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, color: '#122019' }}>{g.title}</div>
            <div style={{ fontSize: 12, color: '#8A998F', lineHeight: 1.5 }}>{g.desc}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 'none', paddingTop: 2 }}>
            <span style={{ fontSize: 11, color: '#A7B5AC', fontWeight: 600 }}>Click ô để đổi:</span>
            {(['req', 'pos', 'no'] as const).map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 13, height: 13, borderRadius: 4, background: leg[k][1], border: `1px solid ${leg[k][3]}` }} />
                <span style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 500 }}>{leg[k][0]}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'table', borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            {/* header */}
            <div style={{ display: 'table-header-group' }}>
              <div style={{ display: 'table-row' }}>
                <div
                  style={{
                    display: 'table-cell',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#243A30',
                    padding: '11px 14px',
                    borderBottom: '2px solid #EEF2EF',
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    zIndex: 1,
                  }}
                >
                  {g.rowHead}
                </div>
                {g.cols.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'table-cell',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#243A30',
                      padding: '11px 10px',
                      borderBottom: '2px solid #EEF2EF',
                      textAlign: 'center',
                      minWidth: 120,
                    }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
            {/* body */}
            <div style={{ display: 'table-row-group' }}>
              {g.rows.map((r, ri) => (
                <div key={ri} style={{ display: 'table-row', borderBottom: '1px solid #F1F5F2' }}>
                  <div style={{ display: 'table-cell', padding: '11px 14px', position: 'sticky', left: 0, background: '#fff' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{r.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A7B5AC', marginTop: 2 }}>{r.code}</div>
                  </div>
                  {r.cells.map((v, ci) => {
                    const ev = eff(ri, ci, v)
                    const m = leg[legKey(ev)]
                    return (
                      <div key={ci} style={{ display: 'table-cell', padding: '7px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => cycle(ri, ci, v)}
                          title="Click để đổi Bắt buộc / Tùy chọn / Không (chỉ trong phiên, không lưu)"
                          style={{
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '7px 8px',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: m[1],
                            color: m[2],
                            border: `1px solid ${m[3]}`,
                            cursor: 'pointer',
                            transition: 'transform .1s',
                            fontFamily: 'inherit',
                          }}
                        >
                          {m[0]}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
