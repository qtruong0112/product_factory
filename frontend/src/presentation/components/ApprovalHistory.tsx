import { useEffect, useState } from 'react'
import { getActivityForEntity } from '../../infrastructure/api/client'

interface ActivityRow {
  occurredAt: string
  occurredAtLabel: string
  actor: string
  actionLabel: string
  detail: string
  channel: string | null
}

// Giai đoạn 42 — khối "Lịch sử duyệt" dùng chung cho Config/Pattern/Template detail: ai tạo,
// ai gửi duyệt, ai phê duyệt, ai xuất bản — dữ liệu thật từ activity_log (GET
// /api/activity-logs/entity), cùng style timeline chấm tròn với "Hoạt động gần đây" ở Variant.
export default function ApprovalHistory({
  entityType,
  entityCode,
  title = 'Lịch sử duyệt',
}: {
  entityType: string
  entityCode: string
  title?: string
}) {
  const [activity, setActivity] = useState<ActivityRow[] | null>(null)

  useEffect(() => {
    setActivity(null)
    getActivityForEntity<ActivityRow>(entityType, entityCode)
      .then(setActivity)
      .catch(() => setActivity([]))
  }, [entityType, entityCode])

  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>{title}</span>
        {activity && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', background: '#F1F5F2', padding: '2px 9px', borderRadius: 99 }}>
            {activity.length}
          </span>
        )}
      </div>
      {activity === null && <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Đang tải…</div>}
      {activity && activity.length === 0 && (
        <div style={{ color: '#A7B5AC', fontSize: 12.5 }}>Chưa có nhật ký hoạt động nào cho mục này.</div>
      )}
      {activity && activity.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activity.map((a, i) => (
            <div
              key={a.occurredAt + i}
              style={{
                display: 'flex',
                gap: 12,
                paddingBottom: i < activity.length - 1 ? 14 : 0,
                marginBottom: i < activity.length - 1 ? 14 : 0,
                borderBottom: i < activity.length - 1 ? '1px solid #F1F5F2' : 'none',
                animation: `fadeUp .4s ease ${i * 0.06}s both`,
              }}
            >
              <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E8C5A' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#243A30' }}>
                  <span style={{ fontWeight: 700 }}>{a.actor}</span> · {a.actionLabel}
                </div>
                <div style={{ fontSize: 11.5, color: '#8A998F', marginTop: 2 }}>{a.detail}</div>
                <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 3 }}>
                  {a.occurredAtLabel}
                  {a.channel ? ` · ${a.channel}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
