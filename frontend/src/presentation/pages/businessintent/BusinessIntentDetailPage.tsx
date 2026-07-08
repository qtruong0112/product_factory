import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'
import ApprovalHistory from '../../components/ApprovalHistory'

interface Intent {
  id: number
  name: string
  owner: string
  period: string
  objective: string | null
  status: string
}
interface Kpi {
  sortOrder: number
  metric: string
  target: string
  unit: string | null
}
interface Detail {
  intent: Intent
  kpis: Kpi[]
}

export default function BusinessIntentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDetail<Detail>('business-intents', id)
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

  const bi = data.intent
  const code = `BI-${String(bi.id).padStart(2, '0')}`

  return (
    <div style={{ padding: '22px 26px', animation: 'fadeUp .3s ease', maxWidth: 1100 }}>
      <button
        onClick={() => navigate('/businessintent')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#5E6F66', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'inherit' }}
      >
        <Icon name="back" size={16} color="#5E6F66" /> Danh sách Business Intent
      </button>

      <div style={{ background: 'linear-gradient(120deg,#0B7349,#0E8C5A)', borderRadius: 16, padding: '22px 24px', color: '#fff', boxShadow: '0 6px 20px rgba(14,140,90,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 8 }}>{code}</span>
          <StatusChip status={bi.status} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.3px' }}>{bi.name}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{bi.objective ?? 'Chưa khai báo mục tiêu'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginTop: 18 }}>
        <div style={{ border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px', background: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 7 }}>Chủ sở hữu</div>
          <div style={{ fontSize: 13.5, color: '#243A30', fontWeight: 600 }}>{bi.owner}</div>
        </div>
        <div style={{ border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px', background: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 7 }}>Kỳ áp dụng</div>
          <div style={{ fontSize: 13.5, color: '#243A30', fontWeight: 600 }}>{bi.period}</div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#122019', marginBottom: 10 }}>
          KPI đo lường <span style={{ color: '#8A998F', fontWeight: 600, fontSize: 12.5 }}>({data.kpis.length})</span>
        </div>
        {data.kpis.length === 0 ? (
          <div style={{ color: '#8A998F', fontSize: 13 }}>Business Intent này chưa khai báo KPI nào.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {data.kpis.map((k) => (
              <div key={k.sortOrder} style={{ border: '1px solid #E6ECE8', borderRadius: 12, padding: '15px 17px', background: '#fff' }}>
                <div style={{ fontSize: 11.5, color: '#5E6F66', fontWeight: 600, marginBottom: 8 }}>{k.metric}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#0B7349' }}>{k.target}</span>
                  {k.unit && <span style={{ fontSize: 12, color: '#8A998F', fontWeight: 600 }}>{k.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <ApprovalHistory entityType="BusinessIntent" entityCode={code} />
      </div>
    </div>
  )
}
