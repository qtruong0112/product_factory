import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail, getList, type Page } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'

interface AttributeInfo {
  code: string
  name: string
  dataTypeCode: string
  required: boolean
  overridable: boolean
  templateCustomizable: boolean
  defaultValue: string | null
  unit: string | null
  groupCode: string
  groupName: string
  domainCode: string | null
  domainName: string | null
}

interface ConstraintRow {
  kind: string
  minValue: number | null
  maxValue: number | null
  stepValue: number | null
  expression: string | null
  dependsOnAttributeCode: string | null
  message: string | null
}

interface EnumValueRow {
  value: string
}

interface TemplateUsageRow {
  templateCode: string
  templateName: string
  frameValue: string
}

interface FragmentUsageRow {
  configCode: string
  configName: string
  scopeCode: string
  scopeValue: string | null
  value: string
  isWarning: boolean
}

interface SlotRow {
  blockId: string
  blockName: string
  slotCode: string
  slotName: string
  usedInTemplates: TemplateUsageRow[]
  usedInFragments: FragmentUsageRow[]
}

interface VariantUsageRow {
  code: string
  name: string
  fromConfigCode: string
  status: string
}

interface Usage {
  attribute: AttributeInfo
  constraints: ConstraintRow[]
  enumValues: EnumValueRow[]
  slots: SlotRow[]
  usedInVariants: VariantUsageRow[]
}

interface AttrListRow {
  code: string
  name: string
  dataTypeCode: string
  dataTypeName: string
}

// Nhãn/màu theo đúng bảng CK trong prototype (attrUsageModel → constraints).
const CONSTRAINT_KIND: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  regulatory: { label: 'Trần / Pháp lý', color: '#B23B3B', bg: '#FBE3E3', icon: '!' },
  range: { label: 'Miền giá trị', color: '#1F5FAF', bg: '#E5EEF9', icon: '↔' },
  enum: { label: 'Enum', color: '#7A4FB0', bg: '#EFE6F8', icon: '≡' },
  required: { label: 'Bắt buộc', color: '#9A6B00', bg: '#FBEFC7', icon: '*' },
  dependency: { label: 'Phụ thuộc', color: '#0B7349', bg: '#DCF3E7', icon: '⇄' },
  format: { label: 'Định dạng', color: '#5E6F66', bg: '#EEF1EF', icon: '#' },
}

// Nhãn/màu theo đúng bảng SCOPE trong prototype.
const SCOPE_TONE: Record<string, { label: string; color: string; bg: string }> = {
  default: { label: 'Mặc định', color: '#5E6F66', bg: '#EEF1EF' },
  people: { label: 'People', color: '#0B7349', bg: '#DCF3E7' },
  place: { label: 'Place', color: '#1F5FAF', bg: '#E5EEF9' },
  time: { label: 'Time', color: '#9A6B00', bg: '#FBEFC7' },
}

function constraintRule(c: ConstraintRow): string {
  if (c.expression) return c.expression
  if (c.minValue != null && c.maxValue != null) return `${c.minValue} – ${c.maxValue}`
  if (c.maxValue != null) return `≤ ${c.maxValue}`
  if (c.minValue != null) return `≥ ${c.minValue}`
  if (c.dependsOnAttributeCode) return `Phụ thuộc ${c.dependsOnAttributeCode}`
  return c.kind
}

export default function AttributeUsageDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Usage | null>(null)
  const [attrList, setAttrList] = useState<Page<AttrListRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Promise.all([
      getDetail<Usage>('attributes', code, 'usage'),
      getList<AttrListRow>('attributes', 0, 200),
    ])
      .then(([usage, list]) => {
        setData(usage)
        setAttrList(list)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !data)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const a = data.attribute
  const templateCodes = new Set(data.slots.flatMap((s) => s.usedInTemplates.map((t) => t.templateCode)))
  const configCodes = new Set(data.slots.flatMap((s) => s.usedInFragments.map((f) => f.configCode)))
  const slotLabel = data.slots.length ? data.slots.map((s) => s.slotName).join(', ') : '—'
  const blockLabel = data.slots.length ? data.slots.map((s) => s.blockName).join(', ') : ''

  const lineage = [
    { stage: 'Attribute', label: a.name, sub: `${a.dataTypeCode} · ${a.groupName}`, color: '#2F73C4', bg: '#E5EEF9', badge: 'Định nghĩa' },
    { stage: 'Answer Slot', label: slotLabel, sub: blockLabel ? `trong Block "${blockLabel}"` : '—', color: '#0B7349', bg: '#DCF3E7', badge: 'Khai báo' },
    { stage: 'Template', label: `${templateCodes.size} template`, sub: 'đặt giá trị khung / khóa', color: '#9A6B00', bg: '#FBEFC7', badge: 'Khung' },
    { stage: 'Config', label: `${configCodes.size} config`, sub: 'Fragment theo Selector Scope', color: '#7A4FB0', bg: '#EFE6F8', badge: 'Gán giá trị' },
    { stage: 'Variant', label: `${data.usedInVariants.length} variant`, sub: 'giải quyết giá trị cuối cùng', color: '#0E8C5A', bg: '#DCF3E7', badge: 'Giải quyết' },
  ]

  return (
    <div style={{ padding: '22px 26px', maxWidth: 1500, animation: 'fadeUp .3s ease' }}>
      <button
        onClick={() => navigate('/attribute')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: '#5E6F66',
          marginBottom: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        <Icon name="back" size={16} color="#5E6F66" /> Về danh sách Attribute
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', gap: 20 }}>
        {/* Chọn Attribute (rail) */}
        <div style={{ alignSelf: 'start', background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '15px 15px 9px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 11 }}>
            CHỌN ATTRIBUTE
          </div>
          {(attrList?.content ?? []).map((s) => {
            const on = s.code === a.code
            return (
              <button
                key={s.code}
                onClick={() => navigate(`/attribute/${s.code}`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 12px',
                  borderRadius: 10,
                  marginBottom: 5,
                  border: `1.5px solid ${on ? '#0E8C5A' : '#EEF2EF'}`,
                  background: on ? '#F4FBF7' : '#fff',
                  cursor: 'pointer',
                  display: 'block',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: on ? 700 : 600, color: on ? '#0B3B2E' : '#243A30' }}>{s.name}</div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#2F73C4',
                    background: '#E5EEF9',
                    padding: '1px 7px',
                    borderRadius: 99,
                    marginTop: 6,
                    display: 'inline-block',
                  }}
                >
                  {s.dataTypeName}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ minWidth: 0 }}>
          {/* Header định nghĩa */}
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#E5EEF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="tag" size={17} color="#1F5FAF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#122019' }}>{a.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8A998F', background: '#F1F5F2', padding: '2px 8px', borderRadius: 6 }}>
                    {a.code}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2F73C4', background: '#E5EEF9', padding: '3px 10px', borderRadius: 7 }}>
                    Data Type · {a.dataTypeCode}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', background: '#F1F5F2', padding: '3px 10px', borderRadius: 7 }}>
                    Group · {a.groupName}
                  </span>
                  {a.domainName && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#5E6F66', background: '#F1F5F2', padding: '3px 10px', borderRadius: 7 }}>
                      Domain · {a.domainName}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 7,
                      background: a.required ? '#FBEFC7' : '#EEF1EF',
                      color: a.required ? '#8A6300' : '#5E6F66',
                    }}
                  >
                    {a.required ? 'Bắt buộc' : 'Tùy chọn'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 7,
                      background: a.overridable ? '#DCF3E7' : '#F1F5F2',
                      color: a.overridable ? '#0B7349' : '#8A998F',
                    }}
                  >
                    {a.overridable ? 'Cho phép ghi đè' : 'Khóa ghi đè'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 7,
                      background: a.templateCustomizable ? '#EFE6F8' : '#F1F5F2',
                      color: a.templateCustomizable ? '#7A4FB0' : '#8A998F',
                    }}
                  >
                    {a.templateCustomizable ? 'Chính gốc · cấu hình ở Template' : 'Đơn giản · default từ Attribute'}
                  </span>
                  {a.templateCustomizable ? (
                    <span
                      style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 7, background: '#F1F5F2', color: '#A7B5AC', fontStyle: 'italic' }}
                      title="Giá trị thật khác nhau theo từng Template — xem khung riêng ở bảng Where-used hoặc màn Template tương ứng"
                    >
                      Giá trị gốc · Theo Template
                    </span>
                  ) : a.defaultValue ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: '#DCF3E7', color: '#0B7349' }}>
                      Giá trị gốc · {a.defaultValue}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Lineage pipeline */}
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122019', marginBottom: 3 }}>
              Vòng đời sử dụng Attribute trong pipeline
            </div>
            <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 18 }}>
              Một Attribute được định nghĩa một lần, rồi dùng lại qua từng tầng: khai báo ở Answer Slot → đặt khung ở
              Template → gán giá trị ở Config (theo Selector Scope) → giải quyết ở Variant.
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {lineage.map((l, i) => (
                <div key={l.stage} style={{ flex: 1, display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
                  <div style={{ flex: 1, border: `1.5px solid ${l.color}`, borderRadius: 12, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.4px', color: l.color, textTransform: 'uppercase' }}>{l.stage}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: l.bg, color: l.color, flex: 'none' }}>{l.badge}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#243A30', lineHeight: 1.15 }}>{l.label}</div>
                    <div style={{ fontSize: 10.5, color: '#8A998F', lineHeight: 1.35 }}>{l.sub}</div>
                  </div>
                  {i < lineage.length - 1 && (
                    <div style={{ flex: 'none', width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="arrow" size={14} color="#C2D0C8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Constraint + Selector Scope */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Ràng buộc (Constraint)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
                  {data.constraints.length}
                </span>
              </div>
              {data.constraints.length === 0 ? (
                <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>—</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {data.constraints.map((c, i) => {
                    const m = CONSTRAINT_KIND[c.kind] ?? CONSTRAINT_KIND.format
                    return (
                      <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            flex: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            background: m.bg,
                            color: m.color,
                          }}
                        >
                          {m.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#243A30' }}>{m.label}</span>
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#0B7349', marginTop: 4 }}>
                            {constraintRule(c)}
                          </div>
                          {c.message && <div style={{ fontSize: 11, color: '#8A998F', marginTop: 3 }}>{c.message}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {a.dataTypeCode === 'DT_ENUM' && data.enumValues.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8A998F', marginBottom: 8 }}>GIÁ TRỊ ENUM</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {data.enumValues.map((ev, i) => (
                      <span
                        key={i}
                        style={{ fontSize: 11.5, fontWeight: 600, color: '#7A4FB0', background: '#EFE6F8', padding: '3px 10px', borderRadius: 99 }}
                      >
                        {ev.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Giá trị theo Selector Scope</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
                  {data.slots.reduce((n, s) => n + s.usedInFragments.length, 0)}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#8A998F', marginBottom: 13 }}>
                Cùng một Attribute nhận giá trị khác nhau theo People / Place / Time, gán qua Fragment của từng Config.
              </div>
              {!a.overridable && data.slots.some((s) => s.usedInFragments.length > 0) && (
                <div
                  style={{
                    border: '1px solid #F0DBA8',
                    background: '#FFFCF4',
                    borderRadius: 10,
                    padding: '10px 13px',
                    fontSize: 11.5,
                    color: '#9A6B00',
                    marginBottom: 12,
                  }}
                >
                  Attribute đã khóa ghi đè nhưng vẫn còn {data.slots.reduce((n, s) => n + s.usedInFragments.length, 0)} Fragment
                  bên dưới — các Fragment này bị bỏ qua khi resolve, cần rà soát lại dữ liệu.
                </div>
              )}
              {data.slots.every((s) => s.usedInFragments.length === 0) ? (
                <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>—</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {data.slots.flatMap((s) => s.usedInFragments).map((f, i) => {
                    const m = SCOPE_TONE[f.scopeCode] ?? SCOPE_TONE.default
                    return (
                      <div
                        key={i}
                        style={{
                          border: `1px solid ${f.isWarning ? '#F0DBA8' : '#EEF2EF'}`,
                          background: f.isWarning ? '#FFFCF4' : '#fff',
                          borderRadius: 10,
                          padding: '11px 13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: m.bg, color: m.color }}>
                            {m.label}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: f.isWarning ? '#9A6B00' : '#0B7349' }}>{f.value}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#5E6F66', marginTop: 6 }}>
                          {f.configName} ({f.configCode}){f.scopeValue ? ` · ${f.scopeValue}` : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Where-used */}
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Được dùng ở đâu (Where-used)</div>
            <div style={{ fontSize: 11.5, color: '#8A998F', marginBottom: 14 }}>
              Vị trí Attribute được tham chiếu và số thực thể đang dùng nó.
            </div>
            {data.slots.length === 0 ? (
              <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Chưa gắn vào Answer Slot nào.</div>
            ) : (
              <div style={{ display: 'table', borderCollapse: 'collapse', width: '100%' }}>
                <div style={{ display: 'table-header-group' }}>
                  <div style={{ display: 'table-row' }}>
                    {['BLOCK', 'ANSWER SLOT', 'TEMPLATE', 'CONFIG', 'VARIANT'].map((h) => (
                      <div
                        key={h}
                        style={{ display: 'table-cell', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A998F', padding: '10px 12px', borderBottom: '2px solid #EEF2EF' }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'table-row-group' }}>
                  {data.slots.map((s) => {
                    const variantsForSlot = data.usedInVariants.filter((v) => s.usedInFragments.some((f) => f.configCode === v.fromConfigCode))
                    return (
                      <div key={`${s.blockId}.${s.slotCode}`} style={{ display: 'table-row', borderBottom: '1px solid #F1F5F2' }}>
                        <div style={{ display: 'table-cell', padding: 12, fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{s.blockName}</div>
                        <div style={{ display: 'table-cell', padding: 12, fontSize: 12.5, color: '#0B7349', fontWeight: 600 }}>{s.slotName}</div>
                        <div style={{ display: 'table-cell', padding: 12, fontSize: 12.5, color: '#5E6F66' }}>{s.usedInTemplates.length} template</div>
                        <div style={{ display: 'table-cell', padding: 12, fontSize: 12.5, color: '#5E6F66' }}>
                          {new Set(s.usedInFragments.map((f) => f.configCode)).size} config
                        </div>
                        <div style={{ display: 'table-cell', padding: 12, fontSize: 12.5, color: '#5E6F66' }}>{variantsForSlot.length} variant</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
