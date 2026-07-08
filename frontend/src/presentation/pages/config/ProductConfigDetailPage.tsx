import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'
import VersionHistoryDrawer from '../../components/VersionHistoryDrawer'
import ApprovalHistory from '../../components/ApprovalHistory'

// ---- kiểu dữ liệu từ API /product-configs/{code}/detail ----
interface ConfigMeta {
  code: string
  name: string
  fromTemplateCode: string
  status: string
}
interface FragmentRow {
  scopeCode: string
  scopeName: string
  priority: number
  scopeValue: string | null
  value: string
  isWarning: boolean
  validationMsg: string | null
}
interface SlotSummary {
  code: string
  name: string
  required: boolean
  filled: boolean
}
interface BlockGroup {
  blockId: string
  blockName: string
  reqFilled: number
  reqTotal: number
  slots: SlotSummary[]
}
interface MissingRequired {
  blockId: string
  slotCode: string
  slotName: string
}
interface ConstraintIssue {
  slotCode: string
  slotName: string
  scopeLabel: string
  scopeValue: string | null
  value: string
  message: string | null
}
interface SlotDetail {
  code: string
  name: string
  blockId: string
  blockName: string
  required: boolean
  attributeCode: string
  attributeName: string | null
  dataTypeName: string | null
  constraintText: string | null
  inheritedFrameValue: string | null
  fragmentCount: number
  fragments: FragmentRow[]
}
interface Completeness {
  reqFilled: number
  totalReq: number
  pct: number
}
interface Detail {
  config: ConfigMeta
  templateName: string
  completeness: Completeness
  sidebar: BlockGroup[]
  missingRequired: MissingRequired[]
  constraintIssues: ConstraintIssue[]
  slots: Record<string, SlotDetail>
  peopleOptions: string[]
  placeOptions: string[]
  timeOptions: string[]
}

// Selector Scope: màu + nhãn tra theo scopeCode thật (khớp selector_scope.name/priority).
const SCOPE_META: Record<string, { color: string; bg: string }> = {
  default: { color: '#5E6F66', bg: '#F1F5F2' },
  time: { color: '#9A6B00', bg: '#FBEFC7' },
  place: { color: '#0B7349', bg: '#DCF3E7' },
  people: { color: '#1F5FAF', bg: '#E5EEF9' },
}

const HIEN_TAI = 'Hiện tại'

export default function ProductConfigDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null)
  const [ctxPeople, setCtxPeople] = useState('')
  const [ctxPlace, setCtxPlace] = useState('')
  const [ctxTime, setCtxTime] = useState(HIEN_TAI)
  const [versionOpen, setVersionOpen] = useState(false)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getDetail<Detail>('product-configs', code)
      .then((d) => {
        setData(d)
        const allSlots = d.sidebar.flatMap((b) => b.slots.map((s) => ({ ...s, blockId: b.blockId })))
        const withFragments = allSlots.find((s) => (d.slots[s.code]?.fragmentCount ?? 0) > 0)
        setSelectedSlotCode((withFragments ?? allSlots[0])?.code ?? null)
        setCtxPeople(d.peopleOptions[0] ?? '')
        setCtxPlace(d.placeOptions[0] ?? '')
        setCtxTime(HIEN_TAI)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  const selectedSlot = useMemo(
    () => (selectedSlotCode && data ? data.slots[selectedSlotCode] : undefined),
    [data, selectedSlotCode]
  )

  // Thắng theo ngữ cảnh: default luôn khớp; people/time so khớp đúng giá trị chọn;
  // place khớp nếu giá trị chọn nằm trong danh sách "HCM, HN" tách theo dấu phẩy.
  const matches = (f: FragmentRow): boolean => {
    if (f.scopeCode === 'default') return true
    if (f.scopeCode === 'people') return f.scopeValue === ctxPeople
    if (f.scopeCode === 'place') return (f.scopeValue ?? '').split(',').map((x) => x.trim()).includes(ctxPlace)
    if (f.scopeCode === 'time') return f.scopeValue === ctxTime
    return false
  }

  const resolution = useMemo(() => {
    if (!selectedSlot) return null
    const matched = selectedSlot.fragments.filter(matches).sort((a, b) => b.priority - a.priority)
    const winner = matched[0] ?? null
    return { winner, explain: selectedSlot.fragments.map((f) => ({ f, matched: matches(f), isWin: winner === f })) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot, ctxPeople, ctxPlace, ctxTime])

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !data)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const { completeness, sidebar, missingRequired, constraintIssues } = data

  const reqVerdict = missingRequired.length > 0
    ? { label: `Còn ${missingRequired.length} Answer Slot bắt buộc chưa điền`, bg: '#FBEFC7', fg: '#9A6B00' }
    : { label: `Đã điền đủ ${completeness.totalReq} Answer Slot bắt buộc`, bg: '#DCF3E7', fg: '#0B7349' }
  const constraintVerdict = constraintIssues.length > 0
    ? { label: `${constraintIssues.length} cảnh báo ràng buộc — nên rà soát`, bg: '#FBEFC7', fg: '#9A6B00' }
    : { label: 'Mọi fragment đạt ràng buộc Attribute', bg: '#DCF3E7', fg: '#0B7349' }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #E0E7E2', borderRadius: 8, padding: '9px 11px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit',
  }
  const readonlyBtn: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#41524A', border: '1px solid #E6ECE8', borderRadius: 9, padding: '9px 15px', background: '#fff', cursor: 'not-allowed', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeUp .3s ease' }}>
      {/* header */}
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #E6ECE8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/config')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E6ECE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41524A', flex: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <Icon name="back" size={17} color="#41524A" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Config · {data.config.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8A998F', background: '#F1F5F2', padding: '2px 7px', borderRadius: 6 }}>{data.config.code}</span>
            <StatusChip status={data.config.status} />
          </div>
          <div style={{ fontSize: 12, color: '#8A998F', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC', background: '#F1F5F2', padding: '2px 7px', borderRadius: 6 }}>ĐẦU VÀO</span>
            Kế thừa từ Template <b style={{ color: '#0B7349', fontWeight: 600 }}>{data.config.fromTemplateCode} · {data.templateName}</b>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4F7F5', border: '1px solid #E6ECE8', borderRadius: 9, padding: '6px 12px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', background: `conic-gradient(#0E8C5A ${completeness.pct}%, #E6ECE8 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#122019', lineHeight: 1 }}>{completeness.pct}%</div>
            <div style={{ fontSize: 10.5, color: '#8A998F' }}>{completeness.reqFilled}/{completeness.totalReq} slot bắt buộc</div>
          </div>
        </div>
        <button style={{ ...readonlyBtn, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => setVersionOpen(true)}>
          <Icon name="lifecycle" size={15} color="#41524A" /> Phiên bản
        </button>
        <button title="read-only" style={readonlyBtn}>Lưu nháp</button>
        <button title="read-only" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#0E8C5A', border: 'none', borderRadius: 9, padding: '9px 17px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(14,140,90,.3)', cursor: 'not-allowed', fontFamily: 'inherit' }}>
          <Icon name="send" size={15} color="#fff" /> Trình duyệt
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT: cây slot theo block */}
        <div style={{ width: 280, flex: 'none', background: '#fff', borderRight: '1px solid #E6ECE8', overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 11 }}>ANSWER SLOT THEO BLOCK</div>
          {sidebar.map((g) => (
            <div key={g.blockId} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#243A30', padding: '8px 10px', background: '#F4F7F5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{g.blockName}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5E6F66' }}>{g.reqFilled}/{g.reqTotal}</span>
              </div>
              {g.slots.map((s) => {
                const isSel = s.code === selectedSlotCode
                const status = !s.required && !s.filled ? 'optional' : s.filled ? 'filled' : 'empty'
                return (
                  <div
                    key={s.code}
                    onClick={() => setSelectedSlotCode(s.code)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, marginTop: 2, cursor: 'pointer', background: isSel ? '#ECF6F1' : 'transparent', border: '1px solid ' + (isSel ? '#CDE9DA' : 'transparent') }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: isSel ? 600 : 500, color: isSel ? '#0B7349' : status === 'empty' ? '#B23B3B' : '#41524A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: status === 'filled' ? '#0E8C5A' : status === 'empty' ? '#E0A0A0' : '#D7E1DB' }} />
                  </div>
                )
              })}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <ApprovalHistory entityType="ProductConfig" entityCode={data.config.code} />
          </div>
        </div>

        {/* CENTER: fragment của slot đang chọn */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', background: '#F4F7F5', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', background: reqVerdict.bg, display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: reqVerdict.fg }}>2 · Điền Answer Slot bắt buộc</span>
              </div>
              <div style={{ padding: '12px 15px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', marginBottom: 9 }}>{reqVerdict.label}</div>
                {missingRequired.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {missingRequired.map((m) => (
                      <button
                        key={m.slotCode}
                        onClick={() => setSelectedSlotCode(m.slotCode)}
                        style={{ fontSize: 11, fontWeight: 600, color: '#9A6B00', background: '#FBEFC7', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {m.slotName} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', background: constraintVerdict.bg, display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: constraintVerdict.fg }}>4 · Kiểm tra ràng buộc Attribute</span>
              </div>
              <div style={{ padding: '12px 15px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', marginBottom: 9 }}>{constraintVerdict.label}</div>
                {constraintIssues.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {constraintIssues.map((iss, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedSlotCode(iss.slotCode)}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', border: '1px solid #EEF2EF', borderRadius: 8, cursor: 'pointer' }}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: 5, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', background: '#D9893B' }}>!</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#243A30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {iss.slotName} · {iss.scopeLabel}{iss.scopeValue ? ` = "${iss.scopeValue}"` : ''}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#A7B5AC' }}>{iss.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedSlot ? (
            <>
              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#122019' }}>{selectedSlot.name}</span>
                      {selectedSlot.required && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8A6300', background: '#FBEFC7', padding: '2px 8px', borderRadius: 99 }}>Bắt buộc</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#1F5FAF', background: '#E5EEF9', padding: '3px 9px', borderRadius: 7 }}>
                        <Icon name="tag" size={13} color="#1F5FAF" /> Attribute · {selectedSlot.attributeCode}
                      </span>
                      {selectedSlot.dataTypeName && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#2F73C4', background: '#E5EEF9', padding: '3px 9px', borderRadius: 7 }}>{selectedSlot.dataTypeName}</span>
                      )}
                      {selectedSlot.constraintText && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#9A6B00', background: '#FBEFC7', padding: '3px 9px', borderRadius: 7 }}>
                          Ràng buộc: {selectedSlot.constraintText}
                        </span>
                      )}
                    </div>
                    {selectedSlot.inheritedFrameValue && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 11, color: '#5E6F66', background: '#F4F7F5', border: '1px dashed #C7D5CC', padding: '4px 10px', borderRadius: 7 }}>
                        <Icon name="template" size={13} color="#0B7349" /> Kế thừa giá trị khung từ Template: <b style={{ color: '#0B7349', fontWeight: 600 }}>{selectedSlot.inheritedFrameValue}</b>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0B7349' }}>{selectedSlot.fragmentCount}</div>
                    <div style={{ fontSize: 10.5, color: '#A7B5AC', fontWeight: 600 }}>FRAGMENT</div>
                  </div>
                </div>
              </div>

              {/* Thêm Config Fragment — read-only, giữ giao diện */}
              <div title="read-only" style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '16px 18px', marginBottom: 16, opacity: 0.75 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#122019', marginBottom: 11 }}>Thêm Config Fragment</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#5E6F66', marginBottom: 7 }}>Loại Selector Scope</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 13 }}>
                  {['Mặc định', 'People', 'Place', 'Time'].map((label, i) => (
                    <span key={label} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: i === 1 ? 700 : 500, color: i === 1 ? '#fff' : '#41524A', background: i === 1 ? '#0E8C5A' : '#F1F5F2' }}>
                      {label}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1.2 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Giá trị Scope</label>
                    <input disabled placeholder="VD: Loyalty / HCM, HN / Khuyến mãi Tết" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', display: 'block', marginBottom: 5 }}>Giá trị gán</label>
                    <input disabled placeholder="VD: 1,0%/tháng" style={inputStyle} />
                  </div>
                  <button disabled style={{ flex: 'none', background: '#0E8C5A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'not-allowed', fontFamily: 'inherit' }}>
                    <Icon name="plus" size={15} color="#fff" /> Thêm
                  </button>
                </div>
              </div>

              {/* Bảng fragment */}
              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '6px 18px 14px' }}>
                {selectedSlot.fragments.length === 0 ? (
                  <div style={{ padding: '20px 4px', color: '#A7B5AC', fontSize: 12.5 }}>Slot này chưa có fragment nào.</div>
                ) : (
                  <div style={{ display: 'table', borderCollapse: 'collapse', width: '100%' }}>
                    <div style={{ display: 'table-header-group' }}>
                      <div style={{ display: 'table-row' }}>
                        <div style={{ display: 'table-cell', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#8A998F', letterSpacing: '.4px', padding: '12px 8px', borderBottom: '1px solid #EEF2EF', width: 60 }}>ƯU TIÊN</div>
                        <div style={{ display: 'table-cell', fontSize: 11, fontWeight: 700, color: '#8A998F', letterSpacing: '.4px', padding: '12px 10px', borderBottom: '1px solid #EEF2EF' }}>SELECTOR SCOPE</div>
                        <div style={{ display: 'table-cell', fontSize: 11, fontWeight: 700, color: '#8A998F', letterSpacing: '.4px', padding: '12px 10px', borderBottom: '1px solid #EEF2EF' }}>GIÁ TRỊ</div>
                        <div style={{ display: 'table-cell', fontSize: 11, fontWeight: 700, color: '#8A998F', letterSpacing: '.4px', padding: '12px 10px', borderBottom: '1px solid #EEF2EF', width: 130 }}>RÀNG BUỘC</div>
                      </div>
                    </div>
                    <div style={{ display: 'table-row-group' }}>
                      {selectedSlot.fragments.map((f, i) => {
                        const sm = SCOPE_META[f.scopeCode] ?? SCOPE_META.default
                        const scopeShort = f.scopeCode === 'default' ? 'null (áp cho mọi ngữ cảnh)' : `${f.scopeName} = "${f.scopeValue}"`
                        const chip = f.isWarning ? { bg: '#FBEFC7', fg: '#9A6B00', label: 'Cảnh báo' } : { bg: '#DCF3E7', fg: '#0B7349', label: 'Hợp lệ' }
                        return (
                          <div key={i} style={{ display: 'table-row', borderBottom: '1px solid #F1F5F2' }}>
                            <div style={{ display: 'table-cell', padding: '13px 8px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: '#F1F5F2', fontSize: 12.5, fontWeight: 800, color: '#5E6F66' }}>{f.priority}</span>
                            </div>
                            <div style={{ display: 'table-cell', padding: '13px 10px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: '3px 9px', borderRadius: 7 }}>{f.scopeName}</span>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8A998F', marginTop: 4 }}>{scopeShort}</div>
                            </div>
                            <div style={{ display: 'table-cell', padding: '13px 10px', fontSize: 13, fontWeight: 700, color: '#0B7349' }}>{f.value}</div>
                            <div style={{ display: 'table-cell', padding: '13px 10px' }}>
                              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, background: chip.bg, color: chip.fg, padding: '3px 9px', borderRadius: 99 }}>{chip.label}</span>
                              {f.validationMsg && <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 3 }}>{f.validationMsg}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 30px', textAlign: 'center', color: '#A7B5AC' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon name="config" size={40} color="#C7D5CC" /></div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5E6F66' }}>Chọn 1 Answer Slot ở bên trái để xem</div>
            </div>
          )}
        </div>

        {/* RIGHT: resolution preview */}
        <div style={{ width: 330, flex: 'none', background: '#fff', borderLeft: '1px solid #E6ECE8', overflowY: 'auto', minHeight: 0 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #EEF2EF' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#122019' }}>Xem trước Resolution</div>
            <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 3 }}>Chọn ngữ cảnh để xem giá trị Answer Slot được resolve theo Selector Scope</div>
          </div>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #EEF2EF', display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#1F5FAF', display: 'block', marginBottom: 6 }}>PEOPLE · Borrower Segment</label>
              <select value={ctxPeople} onChange={(e) => setCtxPeople(e.target.value)} style={inputStyle}>
                {data.peopleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#0B7349', display: 'block', marginBottom: 6 }}>PLACE · Khu vực</label>
              <select value={ctxPlace} onChange={(e) => setCtxPlace(e.target.value)} style={inputStyle}>
                {data.placeOptions.length === 0 && <option value="">—</option>}
                {data.placeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A6B00', display: 'block', marginBottom: 6 }}>TIME · Thời điểm hiệu lực</label>
              <select value={ctxTime} onChange={(e) => setCtxTime(e.target.value)} style={inputStyle}>
                <option value={HIEN_TAI}>{HIEN_TAI}</option>
                {data.timeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', marginBottom: 10 }}>GIÁ TRỊ RESOLVE</div>
            {resolution && (
              <div style={{ border: '1.5px solid #CDE9DA', borderRadius: 12, padding: 16, background: '#F4FBF7', marginBottom: 8 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#0B7349', letterSpacing: '-.5px', lineHeight: 1.15 }}>
                  {resolution.winner ? resolution.winner.value : '— chưa cấu hình —'}
                </div>
                {resolution.winner ? (
                  <>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: (SCOPE_META[resolution.winner.scopeCode] ?? SCOPE_META.default).color, background: (SCOPE_META[resolution.winner.scopeCode] ?? SCOPE_META.default).bg, padding: '3px 9px', borderRadius: 7 }}>
                        Thắng: {resolution.winner.scopeName}
                      </span>
                      <span style={{ fontSize: 11, color: '#8A998F' }}>ưu tiên {resolution.winner.priority}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#5E6F66', marginTop: 10, lineHeight: 1.5 }}>
                      {resolution.winner.scopeCode === 'default'
                        ? 'Không có fragment scope nào khớp ngữ cảnh → dùng giá trị mặc định'
                        : `${resolution.winner.scopeName} = "${resolution.winner.scopeValue}" khớp & có ưu tiên cao nhất (${resolution.winner.priority})`}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 11.5, color: '#5E6F66', marginTop: 10, lineHeight: 1.5 }}>
                    {selectedSlot?.required ? 'Answer Slot bắt buộc nhưng chưa có fragment nào' : 'Chưa có fragment nào cho slot này'}
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', margin: '16px 0 9px' }}>CÁCH RESOLVE (★ = thắng)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resolution?.explain.map(({ f, matched, isWin }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid #EEF2EF', borderRadius: 9, background: isWin ? '#ECF6F1' : '#fff' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: isWin ? '#0E8C5A' : matched ? '#C2D0C8' : '#E6ECE8' }}>
                    {isWin ? '★' : matched ? '✓' : '·'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#243A30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.scopeCode === 'default' ? 'Mặc định' : `${f.scopeName}: ${f.scopeValue}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0B7349', flex: 'none' }}>{f.value}</span>
                  <span style={{ fontSize: 10, color: '#A7B5AC', flex: 'none' }}>p{f.priority}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/simulation')}
              style={{ marginTop: 16, width: '100%', border: '1.5px solid #0E8C5A', color: '#0B7349', background: '#fff', borderRadius: 9, padding: 11, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Mô phỏng với cấu hình này →
            </button>
          </div>
        </div>
      </div>
      <VersionHistoryDrawer
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        entityType="config"
        entityCode={data.config.code}
        entityName={data.config.name}
      />
    </div>
  )
}
