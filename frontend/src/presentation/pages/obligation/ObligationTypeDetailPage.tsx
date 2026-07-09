import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface Otf {
  code: string
  name: string
  archetypeCode: string
  status: string
}

interface PatternRow {
  patternCode: string
  patternName: string
  role: string
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

interface Detail {
  otf: Otf
  archetypeName: string
  patterns: PatternRow[]
  otCores: OtCoreGroup[]
}

const LEG_LABEL: Record<string, string> = { default: '', receive: 'nhận', release: 'trả' }

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 5 }}>{label}</div>
    </div>
  )
}

export default function ObligationTypeDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    getDetail<Detail>('obligation-types', code)
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

  const t = data.otf
  const elementCount = data.otCores.reduce((sum, g) => sum + g.elements.length, 0)

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(120deg,#7A3FA0,#5C2E7A)', padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/obligation')}
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
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Obligation Library
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
            <Icon name="layers" size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{t.name}</span>
              <StatusChip status={t.status} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {t.code} · {data.archetypeName}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Obligation Type (lõi)" value={data.otCores.length} />
          <StatCard label="Obligation Element" value={elementCount} />
          <StatCard label="Product Pattern" value={data.patterns.length} />
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 4 }}>Cấu trúc OTF</div>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 14 }}>
            1 OTF = tổ hợp nhiều Obligation Type lõi, mỗi OT lõi đủ 6 OET (Party/Value/Activation/Time/Fulfillment/Recovery).
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.otCores.map((g) => (
              <div key={g.otCoreCode + g.leg}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#243A30' }}>{g.otCoreName}</span>
                  {LEG_LABEL[g.leg] && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7A3FA0', background: '#F3E9F9', padding: '2px 8px', borderRadius: 99 }}>
                      {LEG_LABEL[g.leg]}
                    </span>
                  )}
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#8A998F' }}>
                    {g.groupKind === 'core' ? 'Cốt lõi' : 'Phụ trợ'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8 }}>
                  {g.elements.map((el) => (
                    <div key={el.elementTypeCode} style={{ background: '#F7F9F8', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8A998F', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                        {el.elementTypeName}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', marginTop: 2 }}>{el.elementName}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Product Pattern dùng OTF này</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
              {data.patterns.length}
            </span>
          </div>
          {data.patterns.length === 0 ? (
            <div style={{ color: '#8A998F', fontSize: 13 }}>Chưa có Pattern nào gán OTF này.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {data.patterns.map((p) => (
                <div
                  key={p.patternCode}
                  onClick={() => navigate(`/pattern/${p.patternCode}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{p.patternName}</div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{p.patternCode}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: p.role === 'Primary' ? '#0B7349' : '#2F73C4',
                      background: p.role === 'Primary' ? '#DCF3E7' : '#E5EEF9',
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
