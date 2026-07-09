import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getList, type Page } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'

// Card do backend làm giàu: typeCount (obligation_type theo archetype),
// elementCount (foa_element theo archetype), productCount (số pattern khác nhau
// dùng 1 trong các obligation_type của archetype, qua pattern_obligation_type).
interface ArchetypeRow {
  code: string
  name: string
  nature: string | null
  valueStructure: string | null
  typeCount: number
  elementCount: number
  productCount: number
}

// Màu header card — thuần chrome (không có nguồn DB), giữ đúng tinh thần 3 archetype gốc của prototype.
const HEAD_BG: Record<string, string> = {
  FOA_TERM_LOAN: 'linear-gradient(135deg,#0E8C5A,#0B6B45)',
  FOA_REVOLVING: 'linear-gradient(135deg,#E8920C,#C9740A)',
  FOA_CONDITIONAL: 'linear-gradient(135deg,#1F8A6B,#0E5C44)',
}
const DEFAULT_HEAD_BG = 'linear-gradient(135deg,#41524A,#243A30)'

export default function ArchetypePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Page<ArchetypeRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<ArchetypeRow>('archetypes', 0, 50)
      .then(setData)
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

  const list = data?.content ?? []

  return (
    <div style={{ padding: '24px 26px', animation: 'fadeUp .3s ease' }}>
      <div style={{ maxWidth: 680, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#5E6F66', lineHeight: 1.55 }}>
          {list.length} <b style={{ color: '#0B7349' }}>Financial Obligation Archetype</b> — khuôn nghĩa vụ gốc, quy định
          Element nào Bắt buộc/Possible cho từng OTF con.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {list.map((a) => (
          <div
            key={a.code}
            onClick={() => navigate(`/archetype/${a.code}`)}
            style={{
              background: '#fff',
              border: '1px solid #E6ECE8',
              borderRadius: 14,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform .1s',
            }}
          >
            <div
              style={{
                background: HEAD_BG[a.code] ?? DEFAULT_HEAD_BG,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon name="layers" size={20} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: '#fff' }}>{a.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,.85)' }}>
                  {a.code}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 3 }}>Obligation Nature</div>
              <div style={{ fontSize: 13, color: '#243A30', fontWeight: 600, marginBottom: 10 }}>{a.nature ?? '—'}</div>
              <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 3 }}>Value Structure</div>
              <div style={{ fontSize: 13, color: '#243A30', fontWeight: 600, marginBottom: 14 }}>{a.valueStructure ?? '—'}</div>

              <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #F1F5F2', paddingTop: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#122019' }}>{a.typeCount}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F' }}>Obligation Type Family (OTF)</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#122019' }}>{a.elementCount}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F' }}>Element</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#122019' }}>{a.productCount}</div>
                  <div style={{ fontSize: 10.5, color: '#8A998F' }}>Product</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
