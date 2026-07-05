import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDetail } from '../api/client'
import Icon from '../components/Icon'

// ---- kiểu dữ liệu từ API /product-configs/{code}/detail ----
interface ConfigMeta {
  code: string
  name: string
  fromTemplateCode: string
  status: string
}
interface FragmentRow {
  scopeCode: string
  scopeName: string
  priority: number
  scopeValue: string | null
  value: string
  isWarning: boolean
  validationMsg: string | null
}
interface SlotRow {
  blockId: string
  blockName: string
  slotCode: string
  slotName: string
  fragments: FragmentRow[]
}
interface Detail {
  config: ConfigMeta
  templateName: string
  slots: SlotRow[]
}

export default function ProductConfigDetailPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getDetail<Detail>('product-configs', code)
      .then((d) => {
        setData(d)
        setSelectedKey(d.slots[0] ? `${d.slots[0].blockId}·${d.slots[0].slotCode}` : null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  const selectedSlot = useMemo(
    () => data?.slots.find((s) => `${s.blockId}·${s.slotCode}` === selectedKey),
    [data, selectedKey]
  )

  if (loading) return <div style={{ padding: '22px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error || !data)
    return (
      <div style={{ padding: '22px 26px', color: '#B23B3B' }}>
        Lỗi: {error ?? 'Không tìm thấy'}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeUp .3s ease' }}>
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #E6ECE8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/config')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E6ECE8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41524A', flex: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <Icon name="back" size={17} color="#41524A" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#122019' }}>{data.config.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#8A998F', background: '#F1F5F2', padding: '2px 7px', borderRadius: 6 }}>{data.config.code}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A998F', marginTop: 3 }}>Product Config · kế thừa từ Template {data.config.fromTemplateCode} · {data.templateName}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* ---------- LEFT: danh sách Answer Slot có fragment ---------- */}
        <div style={{ width: 300, flex: 'none', background: '#fff', borderRight: '1px solid #E6ECE8', overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', color: '#8A998F', marginBottom: 10 }}>
            ANSWER SLOT CÓ FRAGMENT · {data.slots.length}
          </div>
          {data.slots.length === 0 && (
            <div style={{ padding: '14px 4px', color: '#A7B5AC', fontSize: 12.5 }}>Config này chưa có fragment nào trong `fragment`.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.slots.map((s) => {
              const key = `${s.blockId}·${s.slotCode}`
              const seld = key === selectedKey
              const hasWarning = s.fragments.some((f) => f.isWarning)
              return (
                <div
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', border: '1.5px solid ' + (seld ? '#0E8C5A' : '#E6ECE8'), background: seld ? '#F4FBF7' : '#fff' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: seld ? '#0B7349' : '#243A30' }}>{s.slotName}</span>
                    {hasWarning && <Icon name="bolt" size={13} color="#B23B3B" />}
                  </div>
                  <div style={{ fontSize: 11, color: '#A7B5AC', marginTop: 2 }}>{s.blockName} · {s.fragments.length} fragment</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ---------- RIGHT: fragment theo bối cảnh của slot đã chọn ---------- */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 26px', background: '#F4F7F5' }}>
          {selectedSlot ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 6 }}>{selectedSlot.blockName.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#122019', marginBottom: 4 }}>{selectedSlot.slotName}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#A7B5AC', marginBottom: 18 }}>{selectedSlot.slotCode}</div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 9 }}>
                GIÁ TRỊ THEO BỐI CẢNH (ưu tiên tăng dần: default → time → place → people)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedSlot.fragments.map((f, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid ' + (f.isWarning ? '#F3C6C6' : '#E6ECE8'), borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0B7349', background: '#DCF3E7', padding: '2px 9px', borderRadius: 99 }}>{f.scopeName}</span>
                      {f.scopeValue && <span style={{ fontSize: 12, fontWeight: 600, color: '#41524A' }}>{f.scopeValue}</span>}
                      {f.isWarning && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#B23B3B', background: '#FBE3E3', padding: '2px 9px', borderRadius: 99, marginLeft: 'auto' }}>
                          <Icon name="bolt" size={12} color="#B23B3B" /> Cảnh báo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#122019' }}>{f.value}</div>
                    {f.validationMsg && <div style={{ fontSize: 11.5, color: '#B23B3B', marginTop: 6 }}>{f.validationMsg}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 30px', textAlign: 'center', color: '#A7B5AC' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon name="config" size={40} color="#C7D5CC" /></div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5E6F66' }}>Chưa có fragment nào để xem</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
