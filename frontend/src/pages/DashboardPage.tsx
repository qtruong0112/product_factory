import Icon from '../components/Icon'

// KPI data trích nguyên từ prototype (kdef)
const kc: Record<string, [string, string]> = {
  green: ['#DCF3E7', '#0B7349'],
  gold: ['#FBEFC7', '#8A6300'],
  review: ['#FEF3D6', '#9A6B00'],
  neutral: ['#EEF1EF', '#41524A'],
}
const KPIS = [
  ['Sản phẩm đang bán', '21', '+3', 'green', 'variant'],
  ['Pattern đang dựng', '8', '2 chờ duyệt', 'gold', 'pattern'],
  ['Config chờ phê duyệt', '5', 'maker–checker', 'review', 'config'],
  ['Catalog items', '18', '3 kênh', 'green', 'catalog'],
  ['Obligation Types', '14', '4 family', 'neutral', 'obligation'],
]

// pipeline (pdef)
const pdef = [
  ['Intent', '12', 'định hướng'],
  ['Pattern', '8', 'bản vẽ'],
  ['Template', '15', 'khung'],
  ['Config', '34', 'tham số'],
  ['Variant', '21', 'đóng gói'],
  ['Catalog', '18', 'trên kệ'],
]
const MAX = 34
const colorsP = ['#9ED9BC', '#5FC596', '#22A86F', '#0E8C5A', '#E8920C', '#0B7349']

// activities (adef)
const ACTS = [
  ['Trần Lan', 'gửi duyệt', 'CFG-0042 Vay nhanh Xe máy', '3 phút trước', 'config', 'review'],
  ['Lê Minh', 'phê duyệt', 'TPL-002 Vay cầm cố · DN', '15 phút trước', 'template', 'green'],
  ['Phạm An', 'tạo mới', 'PT-004 Khuôn vay hạn mức', '1 giờ trước', 'pattern', 'neutral'],
  ['Hệ thống', 'xuất bản', 'VAR-103 Vay xe máy thân thiết', '2 giờ trước', 'variant', 'green'],
  ['Lê Minh', 'cập nhật', 'base_rate · Block Lãi suất', '3 giờ trước', 'config', 'neutral'],
  ['Trần Lan', 'thu hồi', 'VAR-106 Vay cầm cố laptop', '5 giờ trước', 'variant', 'review'],
]
const actColor: Record<string, [string, string]> = {
  green: ['#DCF3E7', '#0B7349'],
  review: ['#FEF3D6', '#9A6B00'],
  neutral: ['#EEF1EF', '#41524A'],
}

// phân bố theo family (donut giả lập bằng thanh)
const FAMILIES = [
  ['Loan Obligation', 9, '#0E8C5A'],
  ['Facility', 3, '#5FC596'],
  ['Conditional', 2, '#9ED9BC'],
]

export default function DashboardPage() {
  const famTotal = FAMILIES.reduce((s, f) => s + (f[1] as number), 0)
  return (
    <div style={{ padding: '24px 26px', maxWidth: 1500, animation: 'fadeUp .3s ease' }}>
      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 20 }}>
        {KPIS.map((k, i) => {
          const [bg, fg] = kc[k[3]]
          const isGreen = k[3] === 'green'
          return (
            <div key={i} style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '17px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: fg }}>
                  <Icon name={k[4]} size={19} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: isGreen ? '#0B7349' : '#8A998F', background: isGreen ? '#DCF3E7' : '#F1F5F2', padding: '3px 8px', borderRadius: 99 }}>
                  {k[2]}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#122019', letterSpacing: '-1px', lineHeight: 1 }}>{k[1]}</div>
              <div style={{ fontSize: 12.5, color: '#5E6F66', fontWeight: 500, marginTop: 6 }}>{k[0]}</div>
            </div>
          )
        })}
      </div>

      {/* PIPELINE */}
      <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#122019' }}>Pipeline sản phẩm</div>
            <div style={{ fontSize: 12, color: '#8A998F', marginTop: 2 }}>
              Luồng từ định hướng đến sản phẩm trên kệ — Intent → Pattern → Template → Config → Variant → Catalog
            </div>
          </div>
          <button style={{ fontSize: 12.5, color: '#0E8C5A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'none', cursor: 'pointer' }}>
            Xem chi tiết <Icon name="arrow" size={14} color="#0E8C5A" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {pdef.map((p, i) => {
            const barH = Math.round(34 + (parseInt(p[1]) / MAX) * 54)
            const numFg = i >= 4 || i === 3 ? '#fff' : '#06371F'
            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 88, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={{ width: 62, borderRadius: '9px 9px 0 0', background: colorsP[i], height: barH, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, transition: 'height .4s' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: numFg }}>{p[1]}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#41524A' }}>{p[0]}</div>
                  <div style={{ fontSize: 10.5, color: '#A7B5AC', marginTop: 1 }}>{p[2]}</div>
                </div>
                {i < 5 && <span style={{ color: '#C2D0C8', margin: '0 -4px 26px', flex: 'none' }}><Icon name="chevron" size={18} color="#C2D0C8" /></span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ACTIVITY + FAMILY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* activity */}
        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#122019', marginBottom: 4 }}>Hoạt động gần đây</div>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 16 }}>Nhật ký maker–checker &amp; vòng đời thực thể</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ACTS.map((a, i) => {
              const [bg, fg] = actColor[a[5]]
              return (
                <div key={i} style={{ display: 'flex', gap: 13, padding: '11px 0', borderBottom: '1px solid #F1F5F2' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: fg }}>
                    <Icon name={a[4]} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#243A30', lineHeight: 1.4 }}>
                      <b style={{ fontWeight: 600 }}>{a[0]}</b> {a[1]} <b style={{ fontWeight: 600 }}>{a[2]}</b>
                    </div>
                    <div style={{ fontSize: 11, color: '#A7B5AC', marginTop: 2 }}>{a[3]}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* family distribution */}
        <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#122019', marginBottom: 4 }}>Phân bố theo Obligation Family</div>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 18 }}>Số Obligation Type theo họ nghĩa vụ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAMILIES.map((f, i) => {
              const pct = Math.round(((f[1] as number) / famTotal) * 100)
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#243A30', fontWeight: 500 }}>{f[0]}</span>
                    <span style={{ fontSize: 12.5, color: '#5E6F66' }}>{f[1]} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#F1F5F2', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: f[2] as string, borderRadius: 99 }} />
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
