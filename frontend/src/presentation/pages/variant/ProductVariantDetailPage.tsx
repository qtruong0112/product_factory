import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface VariantMeta {
  code: string
  name: string
  family: string | null
  limitRange: string | null
  displayRate: string | null
  marketingContent: string | null
  status: string
  fromConfigCode: string
}
interface LineageNode {
  code: string
  name: string
  status: string
}
interface ListingRow {
  catalogId: number
  catalogName: string | null
  channel: string | null
  publishedDate: string | null
  status: string
}
interface ActivityRow {
  occurredAt: string
  occurredAtLabel: string
  actor: string
  actionLabel: string
  detail: string
  channel: string | null
}
interface Detail {
  variant: VariantMeta
  pattern: LineageNode | null
  template: LineageNode | null
  config: LineageNode | null
  listings: ListingRow[]
  activity: ActivityRow[]
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>{children}</div>
}

function LineageBox({
  label,
  node,
  icon,
  current,
  onClick,
}: {
  label: string
  node: LineageNode | null
  icon: string
  current?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={node && onClick ? onClick : undefined}
      style={{
        flex: 1,
        minWidth: 150,
        border: current ? '1.5px solid #0E8C5A' : '1px solid #E6ECE8',
        background: current ? '#F3FAF6' : '#fff',
        borderRadius: 12,
        padding: '13px 14px',
        cursor: node && onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease, transform .15s ease',
      }}
      onMouseEnter={(e) => {
        if (node && onClick) e.currentTarget.style.boxShadow = '0 3px 10px rgba(11,59,46,.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <Icon name={icon} size={14} color={current ? '#0B7349' : '#8A998F'} />
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', color: current ? '#0B7349' : '#8A998F', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      {node ? (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#243A30', lineHeight: 1.3 }}>{node.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC', marginTop: 4 }}>{node.code}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#C2D0C8' }}>—</div>
      )}
    </div>
  )
}

const CHANNEL_ICON: Record<string, string> = { Web: 'network' }

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
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

type Tab = 'overview' | 'config' | 'obligations'

export default function ProductVariantDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!code) return
    setLoading(true)
    setTab('overview')
    getDetail<Detail>('product-variants', code)
      .then(setData)
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

  const { variant: v, pattern, template, config, listings, activity } = data

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)', padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/variant')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,.9)',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 16,
            fontFamily: 'inherit',
          }}
        >
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Danh sách Product Variant
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: 'rgba(255,255,255,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <Icon name="variant" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{v.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {v.code}
            </div>
          </div>
          {v.family && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 99 }}>
              {v.family}
            </span>
          )}
          <StatusChip status={v.status} />
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1180 }}>
        <div style={{ display: 'flex', gap: 9, marginBottom: 20 }}>
          <button style={tabBtnStyle(tab === 'overview')} onClick={() => setTab('overview')}>
            Tổng quan
          </button>
          <button style={tabBtnStyle(tab === 'config')} onClick={() => setTab('config')} disabled={!config}>
            Giá trị cấu hình
          </button>
          <button style={tabBtnStyle(tab === 'obligations')} onClick={() => setTab('obligations')} disabled={!pattern}>
            Nghĩa vụ tài chính
          </button>
        </div>

        {tab === 'config' && config && <ConfigValuesTab configCode={config.code} />}
        {tab === 'obligations' && pattern && <ObligationsTab patternCode={pattern.code} />}

        {tab === 'overview' && (
        <>
        {/* Lineage chain */}
        <Card style={{ marginBottom: 20 }}>
          <CardTitle>Nguồn gốc sản phẩm</CardTitle>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap' }}>
            <LineageBox label="Pattern" node={pattern} icon="pattern" onClick={() => pattern && navigate(`/pattern/${pattern.code}`)} />
            <div style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
              <Icon name="arrow" size={14} color="#C2D0C8" />
            </div>
            <LineageBox label="Template" node={template} icon="template" onClick={() => template && navigate(`/template/${template.code}`)} />
            <div style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
              <Icon name="arrow" size={14} color="#C2D0C8" />
            </div>
            <LineageBox label="Config" node={config} icon="config" onClick={() => config && navigate(`/config/${config.code}`)} />
            <div style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
              <Icon name="arrow" size={14} color="#C2D0C8" />
            </div>
            <LineageBox label="Variant (hiện tại)" node={{ code: v.code, name: v.name, status: v.status }} icon="variant" current />
          </div>
        </Card>

        {/* Info + Release */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 20, alignItems: 'stretch' }}>
          <Card>
            <CardTitle>Thông tin sản phẩm</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: v.marketingContent ? 16 : 0 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC', textTransform: 'uppercase', marginBottom: 4 }}>
                  Hạn mức
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{v.limitRange ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC', textTransform: 'uppercase', marginBottom: 4 }}>
                  Lãi suất niêm yết
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{v.displayRate ?? '—'}</div>
              </div>
            </div>
            {v.marketingContent && (
              <div style={{ paddingTop: 14, borderTop: '1px solid #F1F5F2' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', color: '#A7B5AC', textTransform: 'uppercase', marginBottom: 5 }}>
                  Nội dung marketing
                </div>
                <div style={{ fontSize: 12.5, color: '#41524A', lineHeight: 1.6 }}>{v.marketingContent}</div>
              </div>
            )}
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <CardTitle>Quy trình phát hành</CardTitle>
            <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 14, flex: 1 }}>
              Xem tiến độ 8 bước maker–checker khớp đúng trạng thái hiện tại (<StatusChip status={v.status} />).
            </div>
            <button
              onClick={() => navigate(`/release/${v.code}`)}
              style={{
                background: '#0E8C5A',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                fontFamily: 'inherit',
              }}
            >
              Xem quy trình phát hành <Icon name="arrow" size={14} color="#fff" />
            </button>
          </Card>
        </div>

        {/* Listings + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Niêm yết Catalog</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
                {listings.length}
              </span>
            </div>
            {listings.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Chưa niêm yết ở Catalog nào.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listings.map((l, i) => (
                <div
                  key={l.catalogId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    border: '1px solid #EEF2EF',
                    borderRadius: 10,
                    padding: '11px 13px',
                    animation: `fadeUp .4s ease ${i * 0.06}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F1F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Icon name={CHANNEL_ICON[l.channel ?? ''] ?? 'catalog'} size={15} color="#41524A" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{l.catalogName ?? l.channel ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#8A998F', marginTop: 2 }}>
                        {l.publishedDate ? `Niêm yết ${l.publishedDate}` : 'Chưa có ngày niêm yết'}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Hoạt động gần đây</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
                {activity.length}
              </span>
            </div>
            {activity.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Chưa có nhật ký hoạt động nào cho variant này.</div>}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.map((a, i) => (
                <div
                  key={a.occurredAt + i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    paddingBottom: i < activity.length - 1 ? 14 : 0,
                    marginBottom: i < activity.length - 1 ? 14 : 0,
                    borderBottom: i < activity.length - 1 ? '1px solid #F1F5F2' : 'none',
                    animation: `fadeUp .4s ease ${i * 0.06}s both`,
                  }}
                >
                  <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E8C5A' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: '#243A30' }}>
                      <span style={{ fontWeight: 700 }}>{a.actor}</span> · {a.actionLabel}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 2 }}>{a.detail}</div>
                    <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 3 }}>
                      {a.occurredAtLabel}
                      {a.channel ? ` · ${a.channel}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  )
}

// ---- Tab "Giá trị cấu hình" — tái dùng GET /api/product-configs/{code}/resolved (Giai đoạn 46,
// khác /detail của màn builder Config: /resolved hiện ĐỦ mọi Answer Slot của Pattern, không lọc
// theo block đã có fragment — slot nào không có fragment sẽ lấy default Template/Answer Slot) ----
interface FragmentRow {
  scopeCode: string
  scopeName: string
  scopeValue: string | null
  value: string
  isWarning: boolean
}
interface SlotDetail {
  code: string
  name: string
  blockName: string
  required: boolean
  attributeName: string | null
  dataTypeName: string | null
  inheritedFrameValue: string | null
  slotDefaultValue: string | null
  fragments: FragmentRow[]
}
interface SlotSummary {
  code: string
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
interface Completeness {
  reqFilled: number
  totalReq: number
  pct: number
}
interface ConfigDetail {
  completeness: Completeness
  sidebar: BlockGroup[]
  slots: Record<string, SlotDetail>
}

function ConfigValuesTab({ configCode }: { configCode: string }) {
  const [data, setData] = useState<ConfigDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDetail<ConfigDetail>('product-configs', configCode, 'resolved')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [configCode])

  if (loading) return <div style={{ color: '#5E6F66', fontSize: 12.5 }}>Đang tải dữ liệu…</div>
  if (error || !data) return <div style={{ color: '#B23B3B', fontSize: 12.5 }}>Lỗi: {error ?? 'Không tìm thấy'}.</div>

  const { completeness: c, sidebar } = data

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <CardTitle>Độ hoàn thiện cấu hình</CardTitle>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#122019' }}>
            {c.reqFilled}/{c.totalReq} slot bắt buộc
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: '#F1F5F2', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: c.pct + '%', background: 'linear-gradient(90deg,#19C079,#0E8C5A)', transition: 'width .5s ease' }} />
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sidebar.map((b, bi) => (
          <Card key={b.blockId} style={{ animation: `fadeUp .4s ease ${bi * 0.06}s both` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#122019' }}>{b.blockName}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
                {b.reqFilled}/{b.reqTotal} bắt buộc
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {b.slots.map((s) => {
                const detail = data.slots[s.code]
                return (
                  <div key={s.code} style={{ border: '1px solid #EEF2EF', borderRadius: 10, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{detail?.name ?? s.code}</div>
                        <div style={{ fontSize: 11, color: '#8A998F', marginTop: 2 }}>
                          {detail?.attributeName} {detail?.dataTypeName ? `(${detail.dataTypeName})` : ''}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: s.required ? '#0B7349' : '#8A998F',
                          background: s.required ? '#DCF3E7' : '#F1F5F2',
                          padding: '3px 9px',
                          borderRadius: 99,
                          flex: 'none',
                        }}
                      >
                        {s.required ? 'Bắt buộc' : 'Tùy chọn'}
                      </span>
                    </div>
                    {detail && detail.fragments.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {detail.fragments.map((f, fi) => (
                          <span
                            key={fi}
                            title={f.scopeValue ? `${f.scopeName} = ${f.scopeValue}` : f.scopeName}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: f.isWarning ? '#9A6B00' : '#0B7349',
                              background: f.isWarning ? '#FBEFC7' : '#DCF3E7',
                              padding: '3px 9px',
                              borderRadius: 99,
                            }}
                          >
                            {f.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#A7B5AC', marginTop: 4 }}>
                        {detail?.inheritedFrameValue
                          ? `Kế thừa Template: ${detail.inheritedFrameValue}`
                          : detail?.slotDefaultValue
                            ? `Mặc định Answer Slot: ${detail.slotDefaultValue}`
                            : 'Chưa cấu hình giá trị'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Tab "Nghĩa vụ tài chính" — tái dùng GET /api/product-patterns/{code}/detail đã có sẵn ----
interface AssignedOT {
  code: string
  name: string
  role: string
  archetype: string | null
}
interface PatternDetail {
  assignedOTs: AssignedOT[]
}

const ROLE_LABEL: Record<string, string> = { Primary: 'Chính', Support: 'Phụ' }

function ObligationsTab({ patternCode }: { patternCode: string }) {
  const [data, setData] = useState<PatternDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDetail<PatternDetail>('product-patterns', patternCode)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [patternCode])

  if (loading) return <div style={{ color: '#5E6F66', fontSize: 12.5 }}>Đang tải dữ liệu…</div>
  if (error || !data) return <div style={{ color: '#B23B3B', fontSize: 12.5 }}>Lỗi: {error ?? 'Không tìm thấy'}.</div>

  const ots = data.assignedOTs ?? []

  return (
    <Card style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <CardTitle>Obligation Type gán cho Pattern nguồn</CardTitle>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>{ots.length}</span>
      </div>
      {ots.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Pattern nguồn chưa gán Obligation Type nào.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ots.map((o, i) => (
          <div
            key={o.code}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              border: '1px solid #EEF2EF',
              borderRadius: 10,
              padding: '12px 14px',
              animation: `fadeUp .4s ease ${i * 0.06}s both`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{o.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{o.code}</span>
                <span style={{ fontSize: 11, color: '#8A998F' }}>{ROLE_LABEL[o.role] ?? o.role}</span>
              </div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9A6B00', background: '#FBEFC7', padding: '3px 9px', borderRadius: 99, flex: 'none' }}>
              Archetype: {o.archetype ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
