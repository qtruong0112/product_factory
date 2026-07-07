import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface LifecycleMeta {
  code: string
  name: string
  governs: string
  status: string
}
interface StateRow {
  sortOrder: number
  name: string
}
interface Detail {
  lifecycle: LifecycleMeta
  states: StateRow[]
  stateCount: number
}

// Dải màu xanh thương hiệu, sáng → đậm — tô theo vị trí state trong chuỗi (chỉ để phân biệt
// trực quan thứ tự, không mang nghĩa done/undone vì đây là định nghĩa state machine, không phải
// tiến độ 1 thực thể cụ thể).
const NODE_TONES = ['#7FD8AE', '#3DBE86', '#19A06B', '#0E8C5A', '#0E5C44', '#0B3B2E']

function toneFor(i: number, total: number) {
  if (total <= 1) return NODE_TONES[0]
  const idx = Math.round((i / (total - 1)) * (NODE_TONES.length - 1))
  return NODE_TONES[idx]
}

export default function LifecycleDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getDetail<Detail>('lifecycles', code)
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

  const { lifecycle: l, states } = data

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)', padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/lifecycle')}
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
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Danh sách Lifecycle
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
            <Icon name="lifecycle" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{l.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {l.code}
            </div>
          </div>
          <StatusChip status={l.status} />
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 22 }}>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{data.stateCount}</div>
            <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 5 }}>State trong chuỗi</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 5 }}>
              Áp dụng cho
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{l.governs}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '22px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Chuỗi vòng đời (State Machine)</div>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 20 }}>
            Thứ tự thật lấy từ <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>lifecycle_state.sort_order</code> — mỗi thực thể thuộc "{l.governs}" đi qua đúng chuỗi này.
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, flexWrap: 'wrap', rowGap: 22 }}>
            {states.map((s, i) => {
              const tone = toneFor(i, states.length)
              return (
                <div key={s.sortOrder} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 116,
                      animation: `fadeUp .45s ease ${i * 0.07}s both`,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: tone,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                        boxShadow: `0 3px 10px ${tone}55`,
                        transition: 'transform .15s ease',
                        flex: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#243A30',
                        textAlign: 'center',
                        lineHeight: 1.35,
                      }}
                    >
                      {s.name}
                    </div>
                  </div>
                  {i < states.length - 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 40,
                        width: 40,
                        flex: 'none',
                        animation: `fadeUp .45s ease ${i * 0.07 + 0.03}s both`,
                      }}
                    >
                      <Icon name="arrow" size={16} color="#C2D0C8" />
                    </div>
                  )}
                </div>
              )
            })}
            {states.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Chưa có state nào được định nghĩa.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
