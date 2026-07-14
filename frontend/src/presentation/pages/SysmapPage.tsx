import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'

// 7 tầng pipeline sản phẩm — nav key thật (một số chưa dựng pixel-perfect, click vẫn điều
// hướng đúng, GenericView tự hiện placeholder "sẽ được dựng ở bước tiếp theo" — không crash).
// Màu bg/fg trích đúng nguyên bản prototype (sysMapModel().pipeline) — mỗi tầng 1 tông riêng.
const PIPELINE = [
  { key: 'businessintent', label: 'Business Intent', sub: 'Mục tiêu kinh doanh', bg: '#E5EEF9', fg: '#2F73C4' },
  { key: 'intent', label: 'Product Intent', sub: 'Gắn Archetype · OT lõi', bg: '#DCF3E7', fg: '#0B7349' },
  { key: 'pattern', label: 'Product Pattern', sub: 'Khuôn + Block', bg: '#DCF3E7', fg: '#0B7349' },
  { key: 'template', label: 'Product Template', sub: 'Theo đối tượng KH', bg: '#DCF3E7', fg: '#0B7349' },
  { key: 'config', label: 'Product Config', sub: 'Gán Fragment', bg: '#EFE6F8', fg: '#7A4FB0' },
  { key: 'variant', label: 'Product Variant', sub: 'Đóng gói bán', bg: '#FBEFC7', fg: '#9A6B00' },
  { key: 'catalog', label: 'Product Catalog', sub: 'Lên kệ kênh', bg: '#FBEFC7', fg: '#9A6B00' },
]

// 7 thư viện nền tảng nuôi vào pipeline — "feeds" mô tả cấu trúc FK/join thật đã dựng
// (vd Obligation Type dùng trong pattern_obligation_type -> nuôi Product Pattern).
// Màu trích đúng nguyên bản prototype (sysMapModel().foundations).
const FOUNDATIONS = [
  { key: 'archetype', label: 'Financial Obligation Archetype', feeds: 'Product Intent', color: '#2F73C4' },
  { key: 'obligation', label: 'Obligation Library', feeds: 'Product Pattern', color: '#0B7349' },
  { key: 'block', label: 'Block & Answer Slot', feeds: 'Product Pattern', color: '#0B7349' },
  { key: 'attribute', label: 'Attribute', feeds: 'Block & Answer Slot', color: '#1F5FAF' },
  { key: 'matrix', label: 'Ma trận ràng buộc', feeds: 'Product Pattern', color: '#B23B3B' },
  { key: 'lifecycle', label: 'Lifecycle & State', feeds: 'Pattern · Config', color: '#9A6B00' },
  { key: 'domain', label: 'Domain', feeds: 'Attribute', color: '#5E6F66' },
]

// Quan hệ thực thể — mô tả cấu trúc FK thật của schema (đã xác minh trong V1__schema.sql),
// không phải data hàng — giống bảng "sysMapModel().relations" của prototype.
const RELATIONS: { source: string; verb: string; target: string; card: string }[] = [
  { source: 'Obligation Element Type', verb: 'phân loại', target: 'Obligation Element', card: '1:N' },
  { source: 'Obligation Element', verb: 'cấu thành', target: 'Obligation Type (lõi)', card: 'N:1' },
  { source: 'Obligation Type (lõi)', verb: 'gộp thành', target: 'Obligation Type Family (OTF)', card: 'N:1' },
  { source: 'Obligation Type Family (OTF)', verb: 'thuộc', target: 'Financial Obligation Archetype', card: 'N:1' },
  { source: 'Financial Obligation Archetype', verb: 'quy định', target: 'Obligation Element', card: 'N:N' },
  { source: 'Domain', verb: 'sở hữu', target: 'Attribute Group', card: '1:N' },
  { source: 'Attribute Group', verb: 'sở hữu', target: 'Attribute', card: '1:N' },
  { source: 'Attribute', verb: 'định nghĩa bởi', target: 'Data Type', card: 'N:1' },
  { source: 'Block', verb: 'chứa', target: 'Answer Slot', card: '1:N' },
  { source: 'Answer Slot', verb: 'định nghĩa bởi', target: 'Attribute', card: 'N:1' },
  { source: 'Constraint Matrix', verb: 'chứa', target: 'Matrix Cell', card: '1:N' },
  { source: 'Lifecycle', verb: 'có', target: 'Lifecycle State', card: '1:N' },
  { source: 'Business Intent', verb: 'định hướng', target: 'Product Intent', card: '1:N' },
  { source: 'Product Pattern', verb: 'gán', target: 'Obligation Type Family (OTF)', card: 'N:N' },
  { source: 'Product Pattern', verb: 'chứa', target: 'Block', card: 'N:N' },
]

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

export default function SysmapPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px 26px', animation: 'fadeUp .3s ease', maxWidth: 1500 }}>
      {/* Khối 1: luồng pipeline sản phẩm */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Luồng pipeline sản phẩm</div>
        <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 16 }}>
          Business Intent → Product Intent → Product Pattern → Product Template → Product Config → Product Variant → Product Catalog.
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: 0 }}>
          {PIPELINE.map((p, i) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'stretch' }}>
              <button
                onClick={() => navigate(`/${p.key}`)}
                style={{
                  border: `1.5px solid ${p.fg}`,
                  background: p.bg,
                  borderRadius: 12,
                  padding: '14px 17px',
                  minWidth: 140,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 800, color: p.fg, lineHeight: 1.15 }}>{p.label}</div>
                <div style={{ fontSize: 11.5, color: '#5E6F66', marginTop: 5 }}>{p.sub}</div>
              </button>
              {i < PIPELINE.length - 1 && (
                <div style={{ flex: 'none', width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="arrow" size={17} color="#C2D0C8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Khối 2: thư viện nền tảng nuôi vào pipeline */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>Thư viện nền tảng nuôi vào pipeline</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>
          {FOUNDATIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => navigate(`/${f.key}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                border: '1px solid #E6ECE8',
                borderRadius: 12,
                padding: '15px 17px',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <span style={{ width: 11, height: 11, borderRadius: 4, background: f.color, flex: 'none' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#243A30' }}>{f.label}</div>
                <div style={{ fontSize: 12, color: '#8A998F', marginTop: 3 }}>nuôi vào {f.feeds}</div>
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: f.color,
                  background: '#F4F7F5',
                  padding: '4px 11px',
                  borderRadius: 99,
                  flex: 'none',
                }}
              >
                feeds
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Khối 3: bảng quan hệ thực thể */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>Bảng quan hệ thực thể</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'table', width: '100%', minWidth: 640 }}>
            <div style={{ display: 'table-header-group' }}>
              <div style={{ display: 'table-row' }}>
                {['NGUỒN', 'QUAN HỆ', 'ĐÍCH', 'CARDINALITY'].map((h) => (
                  <div
                    key={h}
                    style={{
                      display: 'table-cell',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '.4px',
                      color: '#8A998F',
                      padding: '9px 12px',
                      borderBottom: '1px solid #EEF2EF',
                      textAlign: 'left',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'table-row-group' }}>
              {RELATIONS.map((r, i) => (
                <div key={i} style={{ display: 'table-row', borderBottom: '1px solid #F1F5F2' }}>
                  <div style={{ display: 'table-cell', padding: '9px 12px', fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{r.source}</div>
                  <div style={{ display: 'table-cell', padding: '9px 12px', fontSize: 12, color: '#5E6F66' }}>— {r.verb} →</div>
                  <div style={{ display: 'table-cell', padding: '9px 12px', fontSize: 12.5, fontWeight: 600, color: '#0B7349' }}>{r.target}</div>
                  <div
                    style={{
                      display: 'table-cell',
                      padding: '9px 12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      color: '#9A6B00',
                    }}
                  >
                    {r.card}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
