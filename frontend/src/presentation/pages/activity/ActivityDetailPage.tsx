import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../../../infrastructure/api/client'
import Icon from '../../components/Icon'
import { STATUS_COLORS } from '../../components/StatusChip'
import ApprovalHistory from '../../components/ApprovalHistory'

interface ActivityDetail {
  id: number
  occurredAt: string
  occurredAtLabel: string
  actor: string
  action: string
  actionLabel: string
  entityType: string
  entityCode: string | null
  channel: string | null
  detail: string
}

// Nhãn tiếng Việt cho entityType — dữ liệu thật trong activity_log là PascalCase (ProductConfig,
// AnswerSlot...), chưa từng có cột "nhãn" riêng nên dịch cứng ở đây (giống ACTION_LABEL backend).
const ENTITY_TYPE_LABEL: Record<string, string> = {
  BusinessIntent: 'Business Intent',
  ProductIntent: 'Product Intent',
  ProductPattern: 'Product Pattern',
  ProductTemplate: 'Product Template',
  ProductConfig: 'Product Config',
  ProductVariant: 'Product Variant',
  AnswerSlot: 'Answer Slot',
  ConstraintMatrix: 'Ma trận ràng buộc',
}

// Màu badge hành động tái dùng đúng bảng màu STATUS_COLORS (không bịa màu mới) — mượn theo ý
// nghĩa gần nhất: create~draft, submit_review~review, approve~approved, publish~published,
// retire~retired; các action còn lại (assign/sync/update) dùng màu trung tính của draft.
const ACTION_STATUS_ALIAS: Record<string, string> = {
  create: 'draft',
  submit_review: 'review',
  approve: 'approved',
  publish: 'published',
  retire: 'retired',
}

// Route chi tiết đã có sẵn của từng loại entity (đúng convention mã/route toàn app) — không phải
// mọi entityType đều có detail (AnswerSlot/ConstraintMatrix không có màn riêng) nên trả null.
function entityPath(entityType: string, entityCode: string | null): string | null {
  if (!entityCode) return null
  switch (entityType) {
    case 'BusinessIntent': {
      const n = parseInt(entityCode.replace('BI-', ''), 10)
      return Number.isFinite(n) ? `/businessintent/${n}` : null
    }
    case 'ProductIntent': {
      const n = parseInt(entityCode.replace('PI-', ''), 10)
      return Number.isFinite(n) ? `/intent/${n}` : null
    }
    case 'ProductPattern':
      return `/pattern/${entityCode}`
    case 'ProductTemplate':
      return `/template/${entityCode}`
    case 'ProductConfig':
      return `/config/${entityCode}`
    case 'ProductVariant':
      return `/variant/${entityCode}`
    default:
      return null
  }
}

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

export default function ActivityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ActivityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDetail<ActivityDetail>('activity-logs', id)
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

  const entityLabel = ENTITY_TYPE_LABEL[data.entityType] ?? data.entityType
  const path = entityPath(data.entityType, data.entityCode)
  const actionColor = STATUS_COLORS[ACTION_STATUS_ALIAS[data.action] ?? 'draft']

  return (
    <div style={{ padding: '22px 26px', animation: 'fadeUp .3s ease', maxWidth: 1100 }}>
      <button
        onClick={() => navigate('/activity')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#5E6F66', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'inherit' }}
      >
        <Icon name="back" size={16} color="#5E6F66" /> Nhật ký hoạt động
      </button>

      <div style={{ background: 'linear-gradient(120deg,#0B7349,#0E8C5A)', borderRadius: 16, padding: '22px 24px', color: '#fff', boxShadow: '0 6px 20px rgba(14,140,90,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 7,
              color: actionColor.fg,
              background: actionColor.bg,
            }}
          >
            {data.actionLabel}
          </span>
          {data.channel && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.18)' }}>
              {data.channel}
            </span>
          )}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.3px' }}>
          {data.actor} · {entityLabel}
          {data.entityCode ? ` · ${data.entityCode}` : ''}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{data.detail}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginTop: 18 }}>
        <InfoCard label="Actor">{data.actor}</InfoCard>
        <InfoCard label="Thời gian">{data.occurredAtLabel}</InfoCard>
        <InfoCard label="Kênh">{data.channel ?? '—'}</InfoCard>
        <InfoCard label="Đối tượng liên quan">
          <span>{entityLabel}{data.entityCode ? ` · ${data.entityCode}` : ''}</span>
          {path && (
            <button
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                background: 'none',
                border: 'none',
                color: '#0B7349',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              Xem chi tiết <Icon name="arrow" size={13} color="#0B7349" />
            </button>
          )}
        </InfoCard>
      </div>

      {data.entityCode && (
        <div style={{ marginTop: 20 }}>
          <ApprovalHistory entityType={data.entityType} entityCode={data.entityCode} title="Hoạt động liên quan của đối tượng này" />
        </div>
      )}
    </div>
  )
}
