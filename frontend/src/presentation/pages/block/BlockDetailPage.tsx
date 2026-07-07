import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface BlockMeta {
  id: string
  code: string
  name: string
  bizGroup: string
  status: string
  gov: string | null
}
interface SlotRow {
  code: string
  name: string
  required: boolean
  def: string | null
  rule: string | null
  attrCode: string
  attrName: string
  type: string | null
}
interface Detail {
  block: BlockMeta
  slots: SlotRow[]
}

function GroupChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        background: 'rgba(255,255,255,.18)',
        color: '#fff',
      }}
    >
      {label}
    </span>
  )
}

export default function BlockDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getDetail<Detail>('blocks', id)
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

  const { block: b, slots } = data

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: 'linear-gradient(120deg,#0B3B2E,#0E5C44)', padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/block')}
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
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Danh sách Block
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
            <Icon name="block" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{b.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {b.code}
            </div>
          </div>
          <GroupChip label={b.bizGroup} />
          <StatusChip status={b.status} />
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{slots.length}</div>
            <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 5 }}>Answer Slot</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 5 }}>
              Chi phối bởi
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{b.gov ?? '—'}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Answer Slot thuộc Block này</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
              {slots.length}
            </span>
          </div>

          {slots.length === 0 && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Block này chưa có Answer Slot nào.</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.map((s, i) => (
              <div
                key={s.code}
                style={{
                  border: '1px solid #EEF2EF',
                  borderRadius: 11,
                  padding: '13px 15px',
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{s.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{s.code}</span>
                      <span style={{ fontSize: 11, color: '#8A998F' }}>
                        {s.attrName} ({s.attrCode})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                    {s.type && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2F73C4', background: '#E5EEF9', padding: '3px 9px', borderRadius: 99 }}>
                        {s.type}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: s.required ? '#0B7349' : '#8A998F',
                        background: s.required ? '#DCF3E7' : '#F1F5F2',
                        padding: '3px 9px',
                        borderRadius: 99,
                      }}
                    >
                      {s.required ? 'Bắt buộc' : 'Tùy chọn'}
                    </span>
                  </div>
                </div>
                {(s.def || s.rule) && (
                  <div style={{ display: 'flex', gap: 20, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F4F7F5' }}>
                    {s.def && (
                      <div style={{ fontSize: 12, color: '#5E6F66' }}>
                        <span style={{ color: '#A7B5AC' }}>Mặc định: </span>
                        {s.def}
                      </div>
                    )}
                    {s.rule && (
                      <div style={{ fontSize: 12, color: '#5E6F66' }}>
                        <span style={{ color: '#A7B5AC' }}>Ràng buộc: </span>
                        {s.rule}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
