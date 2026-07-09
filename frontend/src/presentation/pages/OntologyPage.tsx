import { useEffect, useMemo, useState } from 'react'
import { getList, type Page } from '../../infrastructure/api/client'
import Icon from '../components/Icon'

interface TypeRow {
  code: string
  name: string
  archetypeName: string
  elementCount: number
  status: string
}
interface TypeCoreRow {
  code: string
  name: string
  groupKind: string
}
interface CompRow {
  obligationTypeCode: string
  otCoreCode: string
  elementTypeCode: string
  elementCode: string
  leg: string
}
interface ElementRow {
  code: string
  name: string
  elementTypeCode: string
  elementTypeName: string
  isIdentify: boolean
}
interface ElementTypeRow {
  code: string
  name: string
  shortName: string | null
  description: string | null
  isIdentify: boolean
  elementCount: number
}

// 4 khái niệm ER-chain + quan hệ nối giữa — mô tả cấu trúc FK thật của schema (không phải data),
// giống tinh thần khối 1 "ontology relationship map" của prototype.
const CONCEPT_RELATIONS = [
  { label: 'phân loại', cardinality: '1:N' },
  { label: 'cấu thành', cardinality: 'N:1' },
  { label: 'gộp thành', cardinality: 'N:1' },
]

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E6ECE8', borderRadius: 13, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

export default function OntologyPage() {
  const [types, setTypes] = useState<Page<TypeRow> | null>(null)
  const [typeCores, setTypeCores] = useState<Page<TypeCoreRow> | null>(null)
  const [compositions, setCompositions] = useState<Page<CompRow> | null>(null)
  const [elements, setElements] = useState<Page<ElementRow> | null>(null)
  const [elementTypes, setElementTypes] = useState<Page<ElementTypeRow> | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [openVocab, setOpenVocab] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getList<TypeRow>('obligation-types', 0, 200),
      getList<TypeCoreRow>('obligation-type-cores', 0, 20),
      getList<CompRow>('obligation-type-compositions', 0, 500),
      getList<ElementRow>('obligation-elements', 0, 200),
      getList<ElementTypeRow>('obligation-element-types', 0, 200),
    ])
      .then(([t, tc, c, e, et]) => {
        setTypes(t)
        setTypeCores(tc)
        setCompositions(c)
        setElements(e)
        setElementTypes(et)
        setSelectedType(t.content[0]?.code ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const typeList = types?.content ?? []
  const typeCoreList = typeCores?.content ?? []
  const compList = compositions?.content ?? []
  const elementList = elements?.content ?? []
  const elementTypeList = elementTypes?.content ?? []

  const typesByArchetype = useMemo(() => {
    const groups = new Map<string, TypeRow[]>()
    typeList.forEach((t) => {
      const arr = groups.get(t.archetypeName) ?? []
      arr.push(t)
      groups.set(t.archetypeName, arr)
    })
    return groups
  }, [typeList])

  const usedElementCodes = useMemo(() => new Set(compList.map((c) => c.elementCode)), [compList])

  // Giai đoạn 51: 1 OTF = tổ hợp NHIỀU OT lõi, mỗi OT lõi đủ 6 OET — nhóm decomposition
  // theo (ot_core_code, leg) trước, mỗi nhóm hiện các dòng OET bên trong.
  const decomposition = useMemo(() => {
    if (!selectedType) return []
    const groups = new Map<string, { otCoreName: string; leg: string; rows: { elementTypeName: string; elementName: string; isIdentify: boolean }[] }>()
    compList
      .filter((c) => c.obligationTypeCode === selectedType)
      .forEach((c) => {
        const key = c.otCoreCode + '::' + c.leg
        const otCore = typeCoreList.find((x) => x.code === c.otCoreCode)
        const et = elementTypeList.find((x) => x.code === c.elementTypeCode)
        const el = elementList.find((x) => x.code === c.elementCode)
        const g = groups.get(key) ?? { otCoreName: otCore?.name ?? c.otCoreCode, leg: c.leg, rows: [] }
        g.rows.push({
          elementTypeName: et?.name ?? c.elementTypeCode,
          elementName: el?.name ?? c.elementCode,
          isIdentify: et?.isIdentify ?? false,
        })
        groups.set(key, g)
      })
    return [...groups.values()]
  }, [selectedType, compList, elementTypeList, elementList, typeCoreList])

  if (loading) return <div style={{ padding: '24px 26px', color: '#5E6F66' }}>Đang tải dữ liệu…</div>
  if (error)
    return (
      <div style={{ padding: '24px 26px', color: '#B23B3B' }}>
        Lỗi: {error}. Kiểm tra backend đã chạy chưa.
      </div>
    )

  const concepts = [
    { label: 'Obligation Element Type (OET)', count: elementTypeList.length, color: '#0B7349' },
    { label: 'Obligation Element', count: elementList.length, color: '#2F73C4' },
    { label: 'Obligation Type (lõi)', count: typeCoreList.length, color: '#9A6B00' },
    { label: 'Obligation Type Family (OTF)', count: typeList.length, color: '#7A3FA0' },
  ]

  return (
    <div style={{ padding: '24px 26px', animation: 'fadeUp .3s ease', maxWidth: 1500 }}>
      {/* Khối 1: ER relationship chain */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 3 }}>Chuỗi khái niệm Ontology nghĩa vụ</div>
        <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 18 }}>
          OET phân loại Element; Element cấu thành nên Obligation Type (lõi); nhiều Obligation Type lõi gộp thành 1 Obligation Type Family (OTF).
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
          {concepts.map((c, i) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'stretch', flex: '1 1 160px', minWidth: 0 }}>
              <div
                style={{
                  flex: 1,
                  border: `1.5px solid ${c.color}33`,
                  borderRadius: 12,
                  padding: '13px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.4px', color: c.color, textTransform: 'uppercase' }}>
                  {c.label}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#122019' }}>{c.count}</span>
              </div>
              {i < CONCEPT_RELATIONS.length && (
                <div style={{ flex: 'none', width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#5E6F66', fontWeight: 600, textAlign: 'center' }}>{CONCEPT_RELATIONS[i].label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 24, height: 2, background: '#D7E1DB' }} />
                    <Icon name="arrow" size={13} color="#A7B5AC" />
                  </div>
                  <span style={{ fontSize: 9.5, color: '#A7B5AC', fontWeight: 600 }}>{CONCEPT_RELATIONS[i].cardinality}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Khối 2: family selector + decomposition */}
      <div style={{ display: 'grid', gridTemplateColumns: '268px 1fr', gap: 18, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: '#8A998F', marginBottom: 12 }}>
            OTF THEO ARCHETYPE (FOA)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...typesByArchetype.entries()].map(([archetypeName, ts]) => (
              <div key={archetypeName}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5E6F66', marginBottom: 6 }}>{archetypeName}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ts.map((t) => (
                    <button
                      key={t.code}
                      onClick={() => setSelectedType(t.code)}
                      style={{
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 10px',
                        fontSize: 12.5,
                        fontWeight: t.code === selectedType ? 700 : 500,
                        color: t.code === selectedType ? '#fff' : '#41524A',
                        background: t.code === selectedType ? '#0E8C5A' : '#F4F7F5',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#122019' }}>
              Cấu trúc {typeList.find((t) => t.code === selectedType)?.name ?? ''}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8A998F' }}>{selectedType}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A998F', marginBottom: 14 }}>
            1 OTF = tổ hợp nhiều Obligation Type lõi, mỗi OT lõi đủ 6 OET (Party/Value/Activation/Time/Fulfillment/Recovery).
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {decomposition.map((g) => (
              <div key={g.otCoreName + g.leg}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0B7349', marginBottom: 6 }}>
                  {g.otCoreName}
                  {g.leg !== 'default' && (
                    <span style={{ color: '#8A998F', fontWeight: 600 }}> · {g.leg === 'receive' ? 'nhận' : 'trả'}</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {g.rows.map((d) => (
                    <div
                      key={d.elementTypeName}
                      style={{
                        border: d.isIdentify ? '1.5px solid #0E8C5A' : '1px solid #E6ECE8',
                        borderRadius: 10,
                        padding: '10px 12px',
                        background: d.isIdentify ? '#F3FAF6' : '#fff',
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8A998F', textTransform: 'uppercase', marginBottom: 3 }}>
                        {d.elementTypeName}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30' }}>{d.elementName}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Khối 3: từ vựng OET -> Element (accordion) */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#122019', marginBottom: 14 }}>Từ vựng Ontology (OET → Element)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {elementTypeList.map((et) => {
            const open = openVocab === et.code
            const els = elementList.filter((e) => e.elementTypeCode === et.code)
            return (
              <div key={et.code} style={{ border: '1px solid #E6ECE8', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenVocab(open ? null : et.code)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    background: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#243A30' }}>{et.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#8A998F' }}>{els.length} element</span>
                    <Icon name="chevron" size={14} color="#8A998F" />
                  </span>
                </button>
                {open && (
                  <div style={{ padding: '4px 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {els.map((e) => (
                      <div
                        key={e.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: '1px solid #E6ECE8',
                          borderRadius: 8,
                          padding: '7px 10px',
                          background: '#F8FBF9',
                        }}
                      >
                        {usedElementCodes.has(e.code) && <Icon name="check" size={13} color="#0E8C5A" />}
                        <span style={{ fontSize: 12, color: '#41524A' }}>{e.name}</span>
                      </div>
                    ))}
                    {els.length === 0 && <span style={{ fontSize: 12, color: '#A7B5AC' }}>Chưa có Element nào.</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
