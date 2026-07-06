import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { getList } from '../../infrastructure/api/client'

const kc: Record<string, [string, string]> = {
  green: ['#DCF3E7', '#0B7349'],
  gold: ['#FBEFC7', '#8A6300'],
  review: ['#FEF3D6', '#9A6B00'],
  neutral: ['#EEF1EF', '#41524A'],
}
const actColor: Record<string, [string, string]> = {
  green: ['#DCF3E7', '#0B7349'],
  review: ['#FEF3D6', '#9A6B00'],
  neutral: ['#EEF1EF', '#41524A'],
}
const familyPalette = ['#0E8C5A', '#5FC596', '#9ED9BC', '#22A86F', '#E8920C']
const pipelineColors = ['#9ED9BC', '#5FC596', '#22A86F', '#0E8C5A', '#E8920C', '#0B7349']

const entityIcon: Record<string, string> = {
  ProductIntent: 'intent',
  BusinessIntent: 'target',
  ProductPattern: 'pattern',
  ProductTemplate: 'template',
  ProductConfig: 'config',
  ProductVariant: 'variant',
  ProductCatalog: 'catalog',
  ObligationType: 'obligation',
  Block: 'block',
}
function actionColor(action: string): keyof typeof actColor {
  if (action === 'approve' || action === 'publish' || action === 'sync') return 'green'
  if (action === 'submit_review' || action === 'retire') return 'review'
  return 'neutral'
}

interface StatusRow { status?: string }
interface VariantRow extends StatusRow { channels?: string }
interface ObligationTypeRow { familyCode?: string; familyName?: string }
interface ObligationFamilyRow { code: string; name: string }
interface ActivityRow {
  actor: string
  action: string
  actionLabel: string
  entityType: string
  entityCode: string
  detail?: string
  occurredAtLabel: string
}

interface Counts {
  intents: number
  patterns: number
  templates: number
  configs: number
  variants: number
  catalogs: number
  obligationTypes: number
  patternsReview: number
  configsReview: number
  variantsPublished: number
  channelCount: number
  families: { name: string; count: number }[]
  activities: ActivityRow[]
}

export default function DashboardPage() {
  const [data, setData] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getList('product-intents', 0, 500),
      getList<StatusRow>('product-patterns', 0, 500),
      getList('product-templates', 0, 500),
      getList<StatusRow>('product-configs', 0, 500),
      getList<VariantRow>('product-variants', 0, 500),
      getList('product-catalogs', 0, 500),
      getList<ObligationTypeRow>('obligation-types', 0, 500),
      getList<ObligationFamilyRow>('obligation-families', 0, 500),
      getList<ActivityRow>('activity-logs', 0, 6),
    ])
      .then(([intents, patterns, templates, configs, variants, catalogs, obligationTypes, obligationFamilies, activities]) => {
        if (cancelled) return
        const channelSet = new Set<string>()
        for (const c of catalogs.content as VariantRow[]) {
          (c.channels || '').split('·').map((s) => s.trim()).filter(Boolean).forEach((ch) => channelSet.add(ch))
        }
        const familyCountByCode = new Map<string, number>()
        for (const ot of obligationTypes.content) {
          if (!ot.familyCode) continue
          familyCountByCode.set(ot.familyCode, (familyCountByCode.get(ot.familyCode) || 0) + 1)
        }
        const families = obligationFamilies.content
          .map((f) => ({ name: f.name, count: familyCountByCode.get(f.code) || 0 }))
          .filter((f) => f.count > 0)

        setData({
          intents: intents.totalElements,
          patterns: patterns.totalElements,
          templates: templates.totalElements,
          configs: configs.totalElements,
          variants: variants.totalElements,
          catalogs: catalogs.totalElements,
          obligationTypes: obligationTypes.totalElements,
          patternsReview: patterns.content.filter((p) => p.status === 'review').length,
          configsReview: configs.content.filter((c) => c.status === 'review').length,
          variantsPublished: variants.content.filter((v) => v.status === 'published').length,
          channelCount: channelSet.size,
          families,
          activities: activities.content,
        })
      })
      .catch((e) => !cancelled && setError(String(e)))
    return () => { cancelled = true }
  }, [])

  if (error) return <div style={{ padding: 26, color: '#B4232C' }}>Lỗi tải dữ liệu: {error}</div>
  if (!data) return <div style={{ padding: 26, color: '#8A998F' }}>Đang tải…</div>

  const KPIS: [string, number, string, string, string][] = [
    ['Catalog items', data.catalogs, `${data.variantsPublished} đã xuất bản`, 'green', 'catalog'],
    ['Pattern đang dựng', data.patterns, `${data.patternsReview} chờ duyệt`, 'gold', 'pattern'],
    ['Config chờ phê duyệt', data.configsReview, 'maker–checker', 'review', 'config'],
    ['Kênh phân phối', data.channelCount, `${data.catalogs} sản phẩm`, 'green', 'variant'],
    ['Obligation Types', data.obligationTypes, `${data.families.length} family`, 'neutral', 'obligation'],
  ]

  const pdef: [string, number, string][] = [
    ['Intent', data.intents, 'định hướng'],
    ['Pattern', data.patterns, 'bản vẽ'],
    ['Template', data.templates, 'khung'],
    ['Config', data.configs, 'tham số'],
    ['Variant', data.variants, 'đóng gói'],
    ['Catalog', data.catalogs, 'trên kệ'],
  ]
  const MAX = Math.max(1, ...pdef.map((p) => p[1]))
  const famTotal = data.families.reduce((s, f) => s + f.count, 0) || 1

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
            const barH = Math.round(34 + (p[1] / MAX) * 54)
            const numFg = i >= 3 ? '#fff' : '#06371F'
            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 88, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={{ width: 62, borderRadius: '9px 9px 0 0', background: pipelineColors[i], height: barH, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, transition: 'height .4s' }}>
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
            {data.activities.length === 0 && <div style={{ fontSize: 12.5, color: '#A7B5AC', padding: '11px 0' }}>Chưa có hoạt động nào.</div>}
            {data.activities.map((a, i) => {
              const [bg, fg] = actColor[actionColor(a.action)]
              const icon = entityIcon[a.entityType] || 'activity'
              return (
                <div key={i} style={{ display: 'flex', gap: 13, padding: '11px 0', borderBottom: '1px solid #F1F5F2' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: fg }}>
                    <Icon name={icon} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#243A30', lineHeight: 1.4 }}>
                      <b style={{ fontWeight: 600 }}>{a.actor}</b> {a.actionLabel.toLowerCase()} <b style={{ fontWeight: 600 }}>{a.entityCode}</b>
                      {a.detail ? <span style={{ color: '#8A998F' }}> · {a.detail}</span> : null}
                    </div>
                    <div style={{ fontSize: 11, color: '#A7B5AC', marginTop: 2 }}>{a.occurredAtLabel}</div>
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
            {data.families.map((f, i) => {
              const pct = Math.round((f.count / famTotal) * 100)
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#243A30', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: 12.5, color: '#5E6F66' }}>{f.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#F1F5F2', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: familyPalette[i % familyPalette.length], borderRadius: 99 }} />
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
