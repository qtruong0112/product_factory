import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface DomainMeta {
  code: string
  name: string
  description: string | null
  entityCount: number | null
  status: string
}
interface GroupRow {
  code: string
  name: string
  attributeCount: number
}
interface Detail {
  domain: DomainMeta
  groups: GroupRow[]
  groupCount: number
  totalAttributeCount: number
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 5 }}>{label}</div>
    </div>
  )
}

export default function DomainDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getDetail<Detail>('domains', code)
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

  const { domain: d, groups } = data
  const maxCount = Math.max(1, ...groups.map((g) => g.attributeCount))

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)', padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/domain')}
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
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Danh sách Domain
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
            <Icon name="domain" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{d.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {d.code}
            </div>
          </div>
          <StatusChip status={d.status} />
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Attribute Group" value={data.groupCount} />
          <StatCard label="Tổng Attribute" value={data.totalAttributeCount} />
          <StatCard label="Thực thể liên quan" value={d.entityCount ?? 0} />
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 6 }}>
            Mô tả
          </div>
          <div style={{ fontSize: 13.5, color: '#41524A', lineHeight: 1.6 }}>{d.description ?? '—'}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Attribute Group thuộc Domain này</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
              {groups.length}
            </span>
          </div>

          {groups.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Domain này chưa có Attribute Group nào.</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map((g, i) => {
              const pct = Math.round((g.attributeCount / maxCount) * 100)
              return (
                <div
                  key={g.code}
                  style={{
                    border: '1px solid #EEF2EF',
                    borderRadius: 11,
                    padding: '12px 14px',
                    animation: `fadeUp .4s ease ${i * 0.05}s both`,
                    transition: 'border-color .15s ease, box-shadow .15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#CDE9DA'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,59,46,.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#EEF2EF'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{g.name}</div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{g.code}</span>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0B7349', background: '#DCF3E7', padding: '3px 10px', borderRadius: 99, flex: 'none' }}>
                      {g.attributeCount} attribute
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: '#F1F5F2', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: pct + '%', background: 'linear-gradient(90deg,#19C079,#0E8C5A)', transition: 'width .5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
