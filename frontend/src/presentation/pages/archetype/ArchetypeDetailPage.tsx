import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'

interface Archetype {
  code: string
  name: string
  nature: string | null
  natureDesc: string | null
  valueStructure: string | null
  valueDesc: string | null
}

interface ElementRow {
  code: string
  name: string
  elementTypeName: string | null
  requirement: string // required | possible | na
}

interface TypeRow {
  code: string
  name: string
  status: string
  productCount: number
}

interface Detail {
  archetype: Archetype
  typeCount: number
  elementCount: number
  productCount: number
  elementRows: ElementRow[]
  typeRows: TypeRow[]
}

const HEAD_BG: Record<string, string> = {
  FOA_TERM_LOAN: 'linear-gradient(120deg,#0E8C5A,#0B6B45)',
  FOA_REVOLVING: 'linear-gradient(120deg,#E8920C,#C9740A)',
  FOA_CONDITIONAL: 'linear-gradient(120deg,#1F8A6B,#0E5C44)',
}
const DEFAULT_HEAD_BG = 'linear-gradient(120deg,#41524A,#243A30)'

const REQ_LABEL: Record<string, string> = { required: 'Bắt buộc', possible: 'Possible', na: 'Không áp dụng' }
const REQ_TONE: Record<string, [string, string]> = {
  required: ['#DCF3E7', '#0B7349'],
  possible: ['#E5EEF9', '#2F73C4'],
  na: ['#F4F7F5', '#B8C5BD'],
}

function ReqChip({ requirement }: { requirement: string }) {
  const [bg, fg] = REQ_TONE[requirement] ?? REQ_TONE.na
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: bg, color: fg }}>
      {REQ_LABEL[requirement] ?? requirement}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#122019', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#8A998F', fontWeight: 500, marginTop: 5 }}>{label}</div>
    </div>
  )
}

export default function ArchetypeDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    getDetail<Detail>('archetypes', code)
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

  const a = data.archetype

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ background: HEAD_BG[a.code] ?? DEFAULT_HEAD_BG, padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/archetype')}
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
          <Icon name="back" size={16} color="rgba(255,255,255,.9)" /> Danh sách Archetype
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
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{a.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>
              {a.code}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 26px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Obligation Type" value={data.typeCount} />
          <StatCard label="Element" value={data.elementCount} />
          <StatCard label="Product" value={data.productCount} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 6 }}>
              Obligation Nature
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 6 }}>{a.nature ?? '—'}</div>
            <div style={{ fontSize: 12.5, color: '#5E6F66', lineHeight: 1.55 }}>{a.natureDesc ?? '—'}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', textTransform: 'uppercase', marginBottom: 6 }}>
              Value Structure
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 6 }}>{a.valueStructure ?? '—'}</div>
            <div style={{ fontSize: 12.5, color: '#5E6F66', lineHeight: 1.55 }}>{a.valueDesc ?? '—'}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Obligation Element</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
              {data.elementRows.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {data.elementRows.map((el) => (
              <div key={el.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{el.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{el.code}</span>
                    <span style={{ fontSize: 11, color: '#8A998F' }}>{el.elementTypeName}</span>
                  </div>
                </div>
                <ReqChip requirement={el.requirement} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>Obligation Type thuộc Archetype này</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
              {data.typeRows.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {data.typeRows.map((t) => (
              <div key={t.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{t.name}</div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC' }}>{t.code}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                  <span style={{ fontSize: 11.5, color: '#8A998F' }}>{t.productCount} product</span>
                  <StatusChip status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
