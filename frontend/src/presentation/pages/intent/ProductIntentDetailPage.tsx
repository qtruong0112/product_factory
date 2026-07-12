import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'
import ApprovalHistory from '../../components/ApprovalHistory'

interface Intent {
  id: number
  code: string | null
  name: string
  businessIntentId: number
  archetypeCode: string
  status: string
}

interface ElementRow {
  elementTypeCode: string
  elementTypeName: string
  elementCode: string
  elementName: string
}

interface OtCoreGroup {
  otCoreCode: string
  otCoreName: string
  groupKind: string | null
  leg: string
  elements: ElementRow[]
}

interface ActivationRule {
  triggerElementCode: string
  triggerElementName: string
  activatedOtCoreCode: string
  activatedOtCoreName: string
  isTriggered: boolean
}

interface Detail {
  intent: Intent
  businessIntentName: string | null
  archetypeName: string | null
  otCores: OtCoreGroup[]
  activationRules: ActivationRule[]
}

const LEG_LABEL: Record<string, string> = { default: '', receive: 'nhận', release: 'trả' }

const mono = (t: string, color = '#5E6F66') => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color, fontWeight: 600 }}>{t}</span>
)

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px', background: '#fff' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: '#243A30', fontWeight: 500 }}>{children}</div>
    </div>
  )
}

export default function ProductIntentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDetail<Detail>('product-intents', id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !data)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const pi = data.intent
  const code = pi.code ?? `PI-${String(pi.id).padStart(3, '0')}`

  return (
    <div style={{ padding: '22px 26px', animation: 'fadeUp .3s ease', maxWidth: 1100 }}>
      {/* back */}
      <button
        onClick={() => navigate('/intent')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: '#5E6F66',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 14,
          fontFamily: 'inherit',
        }}
      >
        <Icon name="back" size={16} color="#5E6F66" /> Danh sách Product Intent
      </button>

      {/* header gradient */}
      <div
        style={{
          background: 'linear-gradient(120deg,#0B7349,#0E8C5A)',
          borderRadius: 16,
          padding: '22px 24px',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(14,140,90,.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              background: 'rgba(255,255,255,.18)',
              padding: '3px 10px',
              borderRadius: 8,
            }}
          >
            {code}
          </span>
          <StatusChip status={pi.status} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.3px' }}>{pi.name}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
          Định hướng sản phẩm thuộc {data.businessIntentName ?? `BI #${pi.businessIntentId}`}
        </div>
      </div>

      {/* info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginTop: 18 }}>
        <InfoCard label="Định hướng kinh doanh (cha)">
          <span style={{ color: '#122019', fontWeight: 600 }}>{data.businessIntentName ?? '—'}</span>
          <span style={{ marginLeft: 8 }}>{mono(`BI-${String(pi.businessIntentId).padStart(2, '0')}`)}</span>
        </InfoCard>
        <InfoCard label="Archetype">
          <span style={{ color: '#122019', fontWeight: 600 }}>{data.archetypeName ?? '—'}</span>
          <div style={{ marginTop: 4 }}>{mono(pi.archetypeCode)}</div>
        </InfoCard>
      </div>

      {/* cấu trúc OT lõi */}
      <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 4 }}>Cấu trúc OT lõi</div>
        <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 14 }}>
          OE đã điền cho 3 OT lõi Cốt lõi (Giải ngân / Hoàn trả gốc / Trả lãi) và các OT lõi Phụ trợ đã được kích hoạt —
          đầu vào để hoàn thành 1 Obligation Type Family (OTF) khi Pattern gán ở bước kế tiếp.
        </div>
        {data.otCores.length === 0 ? (
          <div style={{ color: '#8A998F', fontSize: 13 }}>Product Intent này chưa điền OE cho OT lõi nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.otCores.map((g) => (
              <div key={g.otCoreCode + g.leg} style={{ border: '1px solid #EEF1EF', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#F7F9F8' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#243A30' }}>{g.otCoreName}</span>
                  {LEG_LABEL[g.leg] && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0B7349', background: '#DCF3E7', padding: '2px 8px', borderRadius: 99 }}>
                      {LEG_LABEL[g.leg]}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      marginLeft: 'auto',
                      color: g.groupKind === 'core' ? '#0B7349' : '#8A6300',
                      background: g.groupKind === 'core' ? '#DCF3E7' : '#FBEFC7',
                      padding: '2px 9px',
                      borderRadius: 99,
                    }}
                  >
                    {g.groupKind === 'core' ? 'Cốt lõi' : 'Phụ trợ'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#8A998F',
                    textTransform: 'uppercase',
                    letterSpacing: '.3px',
                    padding: '7px 14px',
                    borderBottom: '1px solid #EEF1EF',
                  }}
                >
                  <span>OET</span>
                  <span>Obligation Element</span>
                </div>
                {g.elements.map((el, i) => (
                  <div
                    key={el.elementTypeCode}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr',
                      alignItems: 'center',
                      padding: '9px 14px',
                      borderBottom: i < g.elements.length - 1 ? '1px solid #F4F7F5' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#5E6F66', fontWeight: 600 }}>{el.elementTypeName}</span>
                    <span style={{ fontSize: 12.5, color: '#243A30', fontWeight: 600 }}>{el.elementName}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quy tắc kích hoạt OT lõi phụ trợ */}
      <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 4 }}>Quy tắc kích hoạt OT lõi Phụ trợ</div>
        <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 14 }}>
          Intent có Obligation Element kích hoạt (cột trái) → OT lõi Phụ trợ tương ứng được bật, đối chiếu ngay với dữ liệu của Intent này.
        </div>
        {data.activationRules.length === 0 ? (
          <div style={{ color: '#8A998F', fontSize: 13 }}>Chưa có quy tắc kích hoạt nào trong hệ thống.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.activationRules.map((r) => (
              <div key={r.triggerElementCode + r.activatedOtCoreCode} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="layers" size={13} color="#8A998F" />
                <span style={{ fontSize: 12.5, color: '#243A30', fontWeight: 600 }}>{r.triggerElementName}</span>
                <span style={{ color: '#C4CFC8', fontSize: 12 }}>→</span>
                <span style={{ fontSize: 12.5, color: '#243A30', fontWeight: 600 }}>{r.activatedOtCoreName}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: r.isTriggered ? '#0B7349' : '#8A998F',
                    background: r.isTriggered ? '#DCF3E7' : '#F1F5F2',
                    padding: '3px 10px',
                    borderRadius: 99,
                  }}
                >
                  {r.isTriggered ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <ApprovalHistory entityType="ProductIntent" entityCode={code} />
      </div>
    </div>
  )
}
