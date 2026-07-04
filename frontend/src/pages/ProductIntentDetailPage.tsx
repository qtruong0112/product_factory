import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../api/client'
import Icon from '../components/Icon'
import { StatusChip } from '../components/StatusChip'

interface Intent {
  id: number
  code: string | null
  name: string
  businessIntentId: number
  natureElementCode: string
  archetypeCode: string
  status: string
}

interface Detail {
  intent: Intent
  businessIntentName: string | null
  archetypeName: string | null
  elements: string[]
}

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
        <InfoCard label="Obligation nature">{mono(pi.natureElementCode, '#243A30')}</InfoCard>
      </div>

      {/* element nền */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#122019', marginBottom: 10 }}>
          Element nền{' '}
          <span style={{ color: '#8A998F', fontWeight: 600, fontSize: 12.5 }}>({data.elements.length})</span>
        </div>
        {data.elements.length === 0 ? (
          <div style={{ color: '#8A998F', fontSize: 13 }}>Product Intent này chưa khai báo element nền riêng.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.elements.map((el) => (
              <span
                key={el}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid #E6ECE8',
                  background: '#F8FBF9',
                  borderRadius: 8,
                  padding: '6px 11px',
                }}
              >
                <Icon name="layers" size={13} color="#0E8C5A" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#41524A', fontWeight: 600 }}>
                  {el}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
