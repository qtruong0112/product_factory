import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../api/client'
import Icon from '../components/Icon'

// ---- kiểu dữ liệu từ API /product-templates/{code}/detail ----
interface TemplateMeta {
  code: string
  name: string
  fromPatternCode: string
  status: string
}
interface SlotRow {
  code: string
  name: string
  frameValue: string | null
}
interface BlockRow {
  blockId: string
  name: string
  bizGroup: string | null
  active: boolean
  slots: SlotRow[]
}
interface Detail {
  template: TemplateMeta
  patternName: string
  segmentCode: string | null
  segmentName: string | null
  audience: string | null
  blocks: BlockRow[]
}

const STEPS = [
  { title: 'Chọn đối tượng khách hàng', sub: 'Cá nhân / Doanh nghiệp', icon: 'domain' },
  { title: 'Cấu trúc Block kế thừa', sub: 'Block nào đang có giá trị khung', icon: 'block' },
  { title: 'Giá trị khung Answer Slot', sub: 'Giá trị mặc định của template', icon: 'config' },
]

// no-op cho các nút CUD (hệ thống read-only) — giữ nguyên giao diện, không thao tác dữ liệu.
const READONLY = 'Hệ thống read-only'

export default function ProductTemplateDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getDetail<Detail>('product-templates', code)
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

  const activeBlocks = data.blocks.filter((b) => b.active)
  const activeCount = activeBlocks.length
  const emptyCount = data.blocks.length - activeCount

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #E6ECE8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/template')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E6ECE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41524A', flex: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <Icon name="back" size={17} color="#41524A" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#122019' }}>{data.template.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8A998F', background: '#F1F5F2', padding: '2px 7px', borderRadius: 6 }}>{data.template.code}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A998F', marginTop: 3 }}>Product Template · kế thừa từ Pattern {data.template.fromPatternCode} · {data.patternName}</div>
        </div>
      </div>

      <div style={{ padding: '22px 26px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* ---------- LEFT ---------- */}
        <div style={{ width: 320, flex: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '16px 18px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', marginBottom: 9 }}>KẾ THỪA TỪ PATTERN</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#ECF6F1', color: '#0B7349', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="pattern" size={16} color="#0B7349" />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#122019' }}>{data.template.fromPatternCode} · {data.patternName}</div>
                <div style={{ fontSize: 11, color: '#8A998F', marginTop: 3 }}>Template kế thừa cấu trúc Block từ Pattern nguồn.</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', margin: '2px 0 10px' }}>3 PHẦN CỦA PRODUCT TEMPLATE</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map((s, i) => (
                <div key={s.title}>
                  <div
                    onClick={() => setStep(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', borderRadius: 12, cursor: 'pointer', background: i === step ? '#F4FBF7' : 'transparent', border: '1.5px solid ' + (i === step ? '#0E8C5A' : 'transparent') }}
                  >
                    <span style={{ width: 40, height: 40, borderRadius: 11, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === step ? '#0E8C5A' : '#F1F5F2', border: i === step ? 'none' : '1px solid #E6ECE8' }}>
                      <Icon name={s.icon} size={17} color={i === step ? '#fff' : '#A7B5AC'} />
                    </span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: i === step ? '#0B7349' : '#243A30' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: '#8A998F', marginTop: 1 }}>{s.sub}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: 1, height: 14, background: '#E6ECE8', marginLeft: 33 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 6 }}>PHẦN {step + 1} / 3</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#122019', marginBottom: 6 }}>{STEPS[step].title}</div>

          {step === 0 && (
            <>
              <div style={{ fontSize: 13, color: '#5E6F66', marginBottom: 18 }}>Đối tượng KH định hình điều kiện tham gia, hồ sơ pháp lý và khung giá trị mặc định cho template.</div>
              <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5E6F66', marginBottom: 8 }}>Tên Product Template</div>
                <div style={{ border: '1px solid #E6ECE8', borderRadius: 9, padding: '10px 13px', fontSize: 13.5, fontWeight: 600, color: '#122019', background: '#FBFDFC' }}>{data.template.name}</div>
              </div>
              {['individual', 'business'].map((aud) => {
                const on = data.audience === aud
                const name = aud === 'individual' ? 'Khách hàng cá nhân' : 'Khách hàng doanh nghiệp'
                const desc = aud === 'individual'
                  ? 'Vay tiêu dùng, cầm cố tài sản cá nhân — hồ sơ đơn giản, giải ngân nhanh.'
                  : 'Hộ kinh doanh, doanh nghiệp nhỏ — hạn mức lớn hơn, yêu cầu pháp lý chặt hơn hơn.'
                return (
                  <div key={aud} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '16px 18px', border: '1.5px solid ' + (on ? '#0E8C5A' : '#E6ECE8'), borderRadius: 13, background: on ? '#F4FBF7' : '#fff', marginBottom: 12 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', flex: 'none', border: '2px solid ' + (on ? '#0E8C5A' : '#D7E1DB'), display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: on ? '#0E8C5A' : 'transparent' }} />
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#122019' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#5E6F66', marginTop: 4 }}>{desc}</div>
                      {on && <div style={{ fontSize: 11, color: '#0B7349', marginTop: 6, fontWeight: 600 }}>Đối tượng thật của template này (customer_segment {data.segmentCode ?? '—'}: {data.segmentName ?? '—'}).</div>}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ fontSize: 13, color: '#5E6F66', marginBottom: 18 }}>
                Cấu trúc Block kế thừa từ Pattern {data.template.fromPatternCode}. Đang áp dụng {activeCount} · chưa thiết lập giá trị khung {emptyCount}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.blocks.map((b) => (
                  <div key={b.blockId} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', border: '1px solid ' + (b.active ? '#CDE9DA' : '#E6ECE8'), borderRadius: 11, background: b.active ? '#fff' : '#F8F9F8', opacity: b.active ? 1 : 0.75 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: b.active ? '#ECF6F1' : '#EEF1EF', color: b.active ? '#0B7349' : '#A7B5AC' }}>
                      <Icon name="block" size={15} color={b.active ? '#0B7349' : '#A7B5AC'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#A7B5AC', marginTop: 1 }}>{b.bizGroup}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: b.active ? '#DCF3E7' : '#EEF1EF', color: b.active ? '#0B7349' : '#8A998F' }}>
                      {b.active ? 'Đang áp dụng' : 'Chưa có giá trị khung'}
                    </span>
                    <span title={READONLY} style={{ width: 38, height: 22, borderRadius: 99, position: 'relative', flex: 'none', background: b.active ? '#0E8C5A' : '#D7E1DB' }}>
                      <span style={{ position: 'absolute', top: 2, left: b.active ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: '#5E6F66', marginBottom: 18 }}>Giá trị khung là mặc định cấp template, sẽ được Product Config kế thừa và có thể tinh chỉnh theo Selector Scope sau.</div>
              {activeBlocks.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#A7B5AC', border: '1.5px dashed #C7D5CC', borderRadius: 12, fontSize: 12.5 }}>
                  Template này chưa có giá trị khung nào trong `template_frame`.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeBlocks.map((b) => (
                  <div key={b.blockId} style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#122019', marginBottom: 12 }}>{b.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {b.slots.map((s) => (
                        <div key={s.code}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#41524A' }}>{s.name}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#A7B5AC', marginBottom: 5 }}>{s.code}</div>
                          <div style={{ border: '1px solid #E6ECE8', borderRadius: 9, padding: '9px 13px', fontSize: 13, color: s.frameValue ? '#122019' : '#B8C5BD', background: '#FBFDFC' }}>
                            {s.frameValue ?? '— chưa đặt giá trị khung —'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
