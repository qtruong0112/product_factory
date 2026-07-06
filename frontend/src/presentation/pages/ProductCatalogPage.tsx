import { useEffect, useState } from 'react'
import { getList, type Page } from '../../infrastructure/api/client'
import Icon from '../components/Icon'
import { StatusChip } from '../components/StatusChip'

// Card do backend làm giàu — join product_variant (family/limitRange/displayRate/status)
// với catalog_listing→product_catalog.channel (distinct). 1 card / variant đã niêm yết catalog.
interface CatalogRow {
  variantCode: string
  name: string
  family: string | null
  limitRange: string | null
  displayRate: string | null
  channels: string
  status: string
}

export default function ProductCatalogPage() {
  const [data, setData] = useState<Page<CatalogRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getList<CatalogRow>('product-catalogs', 0, 50)
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
          {list.length} <b style={{ color: '#0B7349' }}>Product Variant</b> đã niêm yết lên ít nhất 1 kênh phân phối
          (App / Web / PGD).
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {list.map((c) => (
          <div key={c.variantCode} style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0E8C5A,#0B6B45)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="catalog" size={19} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{c.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,.85)' }}>{c.variantCode}</div>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 3 }}>Hạn mức</div>
                  <div style={{ fontSize: 13, color: '#243A30', fontWeight: 600 }}>{c.limitRange ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 3 }}>Lãi suất</div>
                  <div style={{ fontSize: 13, color: '#243A30', fontWeight: 600 }}>{c.displayRate ?? '—'}</div>
                </div>
              </div>

              {c.family && (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#41524A', background: '#F1F5F2', padding: '3px 9px', borderRadius: 99, marginRight: 8 }}>
                  {c.family}
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F2', paddingTop: 12, marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: '#5E6F66' }}>{c.channels || 'Chưa niêm yết'}</span>
                <StatusChip status={c.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
