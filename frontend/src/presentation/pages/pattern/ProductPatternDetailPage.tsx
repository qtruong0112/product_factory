import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail, getList } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { STATUS_COLORS, STATUS_LABELS } from '../../components/StatusChip'
import VersionHistoryDrawer from '../../components/VersionHistoryDrawer'
import ApprovalHistory from '../../components/ApprovalHistory'
import PatternPreviewModal from './PatternPreviewModal'

// ---- kiểu dữ liệu từ API /product-patterns/{code}/detail (đã wire DB thật, mục 2.7) ----
interface Pattern {
  code: string
  name: string
  productIntentId: number | null
  status: string
}
interface ApiSlot {
  code: string
  name: string
  type: string | null
  required: boolean
  def: string | null
  rule: string | null
  attrCode: string
  attrName: string
}
interface ApiBlock {
  blockId: string
  position: number
  usage: string
  name: string
  bizGroup: string | null
  gov: string | null
  status: string | null
  slots: ApiSlot[]
}
interface ApiOT {
  code: string
  name: string
  role: string
  archetype: string | null
}
interface ApiCoverage {
  blockId: string
  label: string
  verdict: 'req' | 'pos' | 'na'
  inCanvas: boolean
}
interface Detail {
  pattern: Pattern
  productIntentName: string | null
  assignedOTs: ApiOT[]
  blocks: ApiBlock[]
  coverage: ApiCoverage[]
}

// Thư viện Block đầy đủ (cho palette bên trái) — /api/blocks (làm giàu slotCount/gov, Giai đoạn 6).
interface BlockLibRow {
  id: string
  code: string
  name: string
  bizGroup: string
  gov: string | null
  slotCount: number
  status: string
}

const mono = (t: string, extra: React.CSSProperties = {}) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", ...extra }}>{t}</span>
)

// no-op cho các nút CUD (hệ thống read-only) — giữ nguyên giao diện, không thao tác dữ liệu.
const READONLY = 'Hệ thống read-only'

export default function ProductPatternDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [blockLib, setBlockLib] = useState<BlockLibRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // state builder (view-only)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [paletteTab, setPaletteTab] = useState<'block' | 'ot'>('block')
  const [paletteQuery, setPaletteQuery] = useState('')
  const [versionOpen, setVersionOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Promise.all([getDetail<Detail>('product-patterns', code), getList<BlockLibRow>('blocks', 0, 200)])
      .then(([d, lib]) => {
        setData(d)
        setBlockLib(lib.content)
        const ordered = [...d.blocks].sort((a, b) => a.position - b.position)
        setSelectedBlockId(ordered[0]?.blockId ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  // canvas = block thật của pattern (order theo position, đã enrich sẵn từ API).
  const canvas = useMemo(() => {
    if (!data) return []
    return [...data.blocks].sort((a, b) => a.position - b.position)
  }, [data])

  const canvasIds = useMemo(() => new Set(canvas.map((b) => b.blockId)), [canvas])
  const blockLibById = useMemo(() => Object.fromEntries(blockLib.map((b) => [b.id, b])), [blockLib])

  // độ phủ theo ma trận OT × Block — đã tính sẵn ở backend (ProductPatternController#detail),
  // chỉ còn map verdict → nhãn/màu hiển thị ở FE.
  const coverage = useMemo(() => {
    const M: Record<string, { label: string; bg: string; fg: string; dot: string; mark: string }> = {
      covered: { label: 'Bắt buộc · đã có', bg: '#DCF3E7', fg: '#0B7349', dot: '#0E8C5A', mark: '✓' },
      missing: { label: 'Bắt buộc · THIẾU', bg: '#FBE3E3', fg: '#B23B3B', dot: '#B23B3B', mark: '!' },
      'covered-opt': { label: 'Tùy chọn · đã có', bg: '#E5EEF9', fg: '#2F73C4', dot: '#2F73C4', mark: '✓' },
      suggest: { label: 'Tùy chọn', bg: '#F1F5F2', fg: '#8A998F', dot: '#C2D0C8', mark: '+' },
    }
    const rows = (data?.coverage ?? [])
      .filter((c) => c.verdict !== 'na')
      .map((c) => {
        const status =
          c.verdict === 'req' ? (c.inCanvas ? 'covered' : 'missing') : c.inCanvas ? 'covered-opt' : 'suggest'
        const m = M[status]
        return {
          key: c.blockId,
          blockId: c.blockId,
          blockLabel: c.label,
          status,
          inCanvas: c.inCanvas,
          chipLabel: m.label,
          bg: m.bg,
          fg: m.fg,
          dot: m.dot,
          mark: m.mark,
          showAdd: status === 'missing' || status === 'suggest',
        }
      })

    const missing = rows.filter((r) => r.status === 'missing')
    const reqTotal = (data?.coverage ?? []).filter((c) => c.verdict === 'req').length
    const reqCovered = rows.filter((r) => r.status === 'covered').length
    const assignedCount = data?.assignedOTs.length ?? 0
    const verdict =
      assignedCount === 0
        ? { label: 'Chưa gán Obligation Type — gán trước để kiểm tra độ phủ', bg: '#FEF3D6', fg: '#9A6B00' }
        : missing.length > 0
        ? { label: '⚠ Thiếu ' + missing.length + ' Block bắt buộc theo ma trận', bg: '#FBE3E3', fg: '#B23B3B' }
        : { label: '✓ Đủ Block bắt buộc theo ma trận Obligation Type × Block', bg: '#DCF3E7', fg: '#0B7349' }
    return { rows, missing, reqTotal, reqCovered, verdict, pctLabel: reqCovered + '/' + reqTotal }
  }, [data])

  // palette block (lọc theo query) — thư viện block thật /api/blocks.
  const paletteBlocks = useMemo(() => {
    const q = paletteQuery.toLowerCase()
    return blockLib.filter((b) => !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
  }, [paletteQuery, blockLib])

  const selBlock = selectedBlockId ? canvas.find((b) => b.blockId === selectedBlockId) : undefined

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !data)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const pt = data.pattern
  const statusColor = STATUS_COLORS[pt.status] ?? STATUS_COLORS.draft
  const piCode = pt.productIntentId != null ? `PI-${String(pt.productIntentId).padStart(3, '0')}` : null

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 0',
    borderRadius: 7,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12.5,
    fontWeight: active ? 700 : 600,
    color: active ? '#0B7349' : '#8A998F',
    background: active ? '#fff' : 'transparent',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
  })

  const hdrBtn: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#41524A',
    border: '1px solid #E6ECE8',
    borderRadius: 9,
    padding: '9px 15px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    cursor: 'default',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeUp .3s ease' }}>
      {/* ===== builder header ===== */}
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #E6ECE8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/pattern')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E6ECE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41524A', flex: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <Icon name="back" size={17} color="#41524A" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#122019' }}>{pt.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8A998F', background: '#F1F5F2', padding: '2px 7px', borderRadius: 6 }}>{pt.code}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: statusColor.bg, color: statusColor.fg }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor.fg, display: 'block' }} />
              {STATUS_LABELS[pt.status] ?? pt.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#8A998F', marginTop: 3 }}>
            Product Pattern
            {piCode && (
              <>
                {' · từ Product Intent '}
                <b style={{ color: '#0B7349', fontWeight: 600 }}>
                  {piCode}
                  {data.productIntentName ? ` · ${data.productIntentName}` : ''}
                </b>
              </>
            )}
          </div>
        </div>
        <button style={{ ...hdrBtn, cursor: 'pointer' }} onClick={() => setVersionOpen(true)}>
          <Icon name="activity" size={15} color="#41524A" /> Phiên bản
        </button>
        <button style={{ ...hdrBtn, cursor: 'pointer' }} onClick={() => setPreviewOpen(true)}>
          <Icon name="eye" size={15} color="#41524A" /> Xem trước
        </button>
        <button style={{ ...hdrBtn, padding: '9px 15px' }} title={READONLY}>
          Lưu nháp
        </button>
        <button
          title={READONLY}
          style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#0E8C5A', border: 'none', borderRadius: 9, padding: '9px 17px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(14,140,90,.3)', cursor: 'default', fontFamily: 'inherit' }}
        >
          <Icon name="send" size={15} color="#fff" /> Gửi duyệt
        </button>
      </div>

      {/* ===== 3 columns ===== */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* ---------- LEFT PALETTE ---------- */}
        <div style={{ width: 288, flex: 'none', background: '#fff', borderRight: '1px solid #E6ECE8', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '14px 16px 0', flex: 'none' }}>
            <div style={{ display: 'flex', background: '#F1F5F2', borderRadius: 9, padding: 3, marginBottom: 13 }}>
              <button style={tabBtn(paletteTab === 'block')} onClick={() => setPaletteTab('block')}>Block</button>
              <button style={tabBtn(paletteTab === 'ot')} onClick={() => setPaletteTab('ot')}>Obligation Type</button>
            </div>
          </div>

          {paletteTab === 'block' ? (
            <>
              <div style={{ padding: '0 16px 6px', flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4F7F5', border: '1px solid #E6ECE8', borderRadius: 8, padding: '7px 10px' }}>
                  <span style={{ display: 'flex', color: '#A7B5AC' }}><Icon name="search" size={15} /></span>
                  <input
                    value={paletteQuery}
                    onChange={(e) => setPaletteQuery(e.target.value)}
                    placeholder="Tìm block…"
                    style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, width: '100%', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#A7B5AC', margin: '11px 2px 6px', fontWeight: 600, letterSpacing: '.3px' }}>KÉO BLOCK VÀO CẤU TRÚC →</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paletteBlocks.map((b) => {
                  const inC = canvasIds.has(b.id)
                  return (
                    <div
                      key={b.id}
                      title={READONLY}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid ' + (inC ? '#CDE9DA' : '#E6ECE8'), borderRadius: 10, background: inC ? '#F4FBF7' : '#fff', cursor: 'grab' }}
                    >
                      <span style={{ display: 'flex', color: '#A7B5AC', flex: 'none' }}><Icon name="grip" size={15} /></span>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ECF6F1', color: '#0B7349', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        <Icon name="block" size={15} color="#0B7349" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                        <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 1 }}>{b.bizGroup} · {b.slotCount} slot</div>
                      </div>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flex: 'none', background: inC ? '#DCF3E7' : '#F1F5F2', color: inC ? '#0B7349' : '#5E6F66' }}>
                        {inC ? '✓' : '+'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '0 16px 10px', flex: 'none' }}>
                <div style={{ fontSize: 11, color: '#A7B5AC', margin: '4px 2px 0', fontWeight: 600, letterSpacing: '.3px' }}>GÁN OBLIGATION TYPE VÀO KHUÔN</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(data.assignedOTs ?? []).map((o) => {
                  const on = true // các OT thật của pattern đều đang gán
                  return (
                    <div key={o.code} title={READONLY} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, border: '1px solid ' + (on ? '#9ED9BC' : '#E6ECE8'), borderRadius: 11, background: on ? '#F4FBF7' : '#fff', cursor: 'pointer' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{o.name}</div>
                        <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>{mono(o.code)}</div>
                        <div style={{ marginTop: 7 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#9A6B00', background: '#FBEFC7', padding: '2px 8px', borderRadius: 99 }}>Archetype: {o.archetype ?? '—'}</span>
                        </div>
                      </div>
                      <span style={{ width: 22, height: 22, borderRadius: 7, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: '1.5px solid ' + (on ? '#0E8C5A' : '#D7E1DB'), background: on ? '#0E8C5A' : '#fff', color: '#fff' }}>
                        {on ? '✓' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ---------- CENTER CANVAS ---------- */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 26px', background: '#F4F7F5' }}>
          {/* assigned OT zone */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', color: '#8A998F', marginBottom: 9 }}>OBLIGATION TYPE ĐÃ GÁN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {(data.assignedOTs ?? []).map((a) => (
                <div key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #B7E6CE', borderRadius: 10, padding: '9px 11px 9px 13px', boxShadow: '0 1px 2px rgba(11,59,46,.04)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E8C5A', flex: 'none' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{a.name}</div>
                    <div style={{ fontSize: 10.5, color: '#8A998F', marginTop: 1 }}>{a.role} · {a.archetype ?? '—'}</div>
                  </div>
                  <button title={READONLY} style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A7B5AC', border: 'none', background: 'none', cursor: 'default' }}>
                    <Icon name="x" size={13} color="#A7B5AC" />
                  </button>
                </div>
              ))}
              <button onClick={() => setPaletteTab('ot')} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1.5px dashed #C2D0C8', borderRadius: 10, padding: '9px 14px', color: '#5E6F66', fontSize: 12.5, fontWeight: 600, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Icon name="plus" size={14} color="#5E6F66" /> Gán thêm
              </button>
            </div>
          </div>

          {/* coverage matrix */}
          <div style={{ marginBottom: 20, background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: coverage.verdict.bg }}>
              <span style={{ display: 'flex', width: 15, height: 15, flex: 'none' }}><Icon name="matrix" size={15} color={coverage.verdict.fg} /></span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: coverage.verdict.fg }}>{coverage.verdict.label}</span>
              {(data.assignedOTs?.length ?? 0) > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: coverage.verdict.fg, background: 'rgba(255,255,255,.5)', padding: '2px 9px', borderRadius: 99 }}>Bắt buộc {coverage.pctLabel}</span>
              )}
            </div>
            {coverage.rows.length > 0 && (
              <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {coverage.rows.map((c) => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', border: '1px solid #EEF2EF', borderRadius: 9 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: c.dot }}>{c.mark}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{c.blockLabel}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: c.fg, background: c.bg, padding: '3px 9px', borderRadius: 99 }}>{c.chipLabel}</span>
                    {c.showAdd && (
                      <button title={READONLY} style={{ fontSize: 11, fontWeight: 700, color: '#0B7349', background: '#DCF3E7', borderRadius: 7, padding: '5px 11px', flex: 'none', border: 'none', cursor: 'default', fontFamily: 'inherit' }}>+ Thêm Block</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* structure */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', color: '#8A998F' }}>CẤU TRÚC BLOCK · {canvas.length} block</div>
            <div style={{ fontSize: 11.5, color: '#A7B5AC' }}>Kéo để sắp xếp · click để xem chi tiết</div>
          </div>
          <div>
            {canvas.map((b) => {
              const seld = selectedBlockId === b.blockId
              const reqd = b.slots.some((s) => s.required)
              const preview = b.slots.slice(0, 2).map((s) => s.name).join(', ')
              return (
                <div
                  key={b.blockId}
                  onClick={() => setSelectedBlockId(b.blockId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, background: '#fff', border: '1.5px solid ' + (seld ? '#0E8C5A' : '#E6ECE8'), boxShadow: seld ? '0 4px 14px rgba(14,140,90,.14)' : '0 1px 2px rgba(11,59,46,.04)', cursor: 'pointer', marginBottom: 10 }}
                >
                  <span style={{ display: 'flex', color: '#C2D0C8', flex: 'none', cursor: 'grab' }}><Icon name="grip" size={15} color="#C2D0C8" /></span>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: seld ? '#0E8C5A' : '#ECF6F1', color: seld ? '#fff' : '#0B7349', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name="block" size={16} color={seld ? '#fff' : '#0B7349'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#243A30' }}>{b.name}</span>
                      {mono(blockLibById[b.blockId]?.code ?? b.blockId, { fontSize: 10.5, color: '#A7B5AC' })}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 3 }}>{b.slots.length} answer slot{preview ? ` · ${preview}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, flex: 'none', background: reqd ? '#FBEFC7' : '#EEF1EF', color: reqd ? '#8A6300' : '#5E6F66' }}>{reqd ? 'Bắt buộc' : 'Tùy chọn'}</span>
                  <button title={READONLY} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2A0A0', flex: 'none', border: 'none', background: 'none', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                    <Icon name="trash" size={15} color="#C2A0A0" />
                  </button>
                </div>
              )
            })}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 16, border: '1.5px dashed #C7D5CC', borderRadius: 11, color: '#A7B5AC', fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>
              <Icon name="plus" size={15} color="#A7B5AC" /> Thả block vào đây hoặc chọn từ thư viện bên trái
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <ApprovalHistory entityType="ProductPattern" entityCode={pt.code} />
          </div>
        </div>

        {/* ---------- RIGHT PROPERTIES ---------- */}
        <div style={{ width: 340, flex: 'none', background: '#fff', borderLeft: '1px solid #E6ECE8', overflowY: 'auto', minHeight: 0 }}>
          {selBlock ? (
            <>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #EEF2EF' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 8 }}>THUỘC TÍNH BLOCK</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECF6F1', color: '#0B7349', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name="block" size={18} color="#0B7349" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019' }}>{selBlock.name}</div>
                    {mono(blockLibById[selBlock.blockId]?.code ?? selBlock.blockId, { fontSize: 11, color: '#8A998F', marginTop: 2, display: 'block' })}
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8A998F' }}>Nhóm nghiệp vụ</span>
                    <span style={{ fontWeight: 600, color: '#243A30' }}>{selBlock.bizGroup}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8A998F' }}>Chi phối bởi Obligation Element</span>
                    <span style={{ fontWeight: 600, color: '#0B7349', textAlign: 'right', maxWidth: 170 }}>{selBlock.gov ?? '—'}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#122019' }}>Answer Slots</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#0B7349', background: '#DCF3E7', padding: '2px 9px', borderRadius: 99 }}>{selBlock.slots.length} slot</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selBlock.slots.map((s) => (
                    <div key={s.code} style={{ border: '1px solid #EEF2EF', borderRadius: 10, padding: '11px 12px', background: '#FBFDFC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: s.required ? '#FBEFC7' : '#EEF1EF', color: s.required ? '#8A6300' : '#5E6F66' }}>{s.required ? 'Bắt buộc' : 'Tùy chọn'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#2F73C4', background: '#E5EEF9', padding: '2px 8px', borderRadius: 6 }}>{s.type ?? '—'}</span>
                        {mono(s.code, { fontSize: 10.5, color: '#A7B5AC' })}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#5E6F66', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#A7B5AC' }}>Mặc định</span>
                        <span style={{ fontWeight: 500, textAlign: 'right' }}>{s.def ?? '—'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8A998F', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#A7B5AC' }}>Ràng buộc</span>
                        {mono(s.rule ?? '—', { color: '#9A6B00' })}
                      </div>
                      <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px dashed #E6ECE8', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', color: '#1F5FAF', flex: 'none' }}><Icon name="tag" size={14} color="#1F5FAF" /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC' }}>ĐỊNH NGHĨA BỞI ATTRIBUTE</div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1F5FAF', marginTop: 1 }}>{s.attrName} · {s.attrCode}</div>
                        </div>
                        <button onClick={() => navigate('/attribute')} style={{ fontSize: 10.5, fontWeight: 600, color: '#1F5FAF', background: '#E5EEF9', padding: '3px 9px', borderRadius: 7, flex: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Mở →</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button title={READONLY} style={{ marginTop: 13, width: '100%', border: '1.5px dashed #C2D0C8', borderRadius: 9, padding: 10, color: '#5E6F66', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', cursor: 'default', fontFamily: 'inherit' }}>
                  <Icon name="plus" size={14} color="#5E6F66" /> Thêm Answer Slot
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 30px', textAlign: 'center', color: '#A7B5AC' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon name="block" size={40} color="#C7D5CC" /></div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5E6F66' }}>Chọn một block</div>
              <div style={{ fontSize: 12, marginTop: 5 }}>Click vào block trong cấu trúc để xem answer slot</div>
            </div>
          )}
        </div>
      </div>
      <VersionHistoryDrawer
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        entityType="pattern"
        entityCode={pt.code}
        entityName={pt.name}
      />
      {previewOpen && (
        <PatternPreviewModal
          pattern={pt}
          productIntentLabel={piCode ? `${piCode}${data.productIntentName ? ' · ' + data.productIntentName : ''}` : null}
          assignedOTs={data.assignedOTs}
          canvas={canvas}
          coverageRows={coverage.rows}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
