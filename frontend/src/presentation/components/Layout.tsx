import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import GlobalSearch from './GlobalSearch'
import { NAV, VIEW_TITLES, type NavGroup } from '../../infrastructure/nav'
import { getList } from '../../infrastructure/api/client'
import { useUser } from '../../infrastructure/user/UserContext'

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

// Mỗi nav key → 1 hoặc nhiều resource thật cần cộng totalElements để ra số đếm hiển thị.
const NAV_COUNT_RESOURCES: Record<string, string[]> = {
  businessintent: ['business-intents'],
  intent: ['product-intents'],
  pattern: ['product-patterns'],
  template: ['product-templates'],
  config: ['product-configs'],
  variant: ['product-variants'],
  catalog: ['product-catalogs'],
  obligation: ['obligation-types', 'obligation-elements', 'obligation-element-types'],
  archetype: ['archetypes'],
  attribute: ['attributes', 'attribute-groups', 'data-types'],
  block: ['blocks'],
  lifecycle: ['lifecycles'],
  domain: ['domains'],
}

// Layout tái tạo pixel-perfect từ Product_Factory_5_1.html: sidebar + topbar.
export default function Layout({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const { users, currentUser, setCurrentUser } = useUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Giai đoạn 42: lọc menu theo role người dùng hiện tại — Admin (hoặc chưa tải xong user) thấy
  // toàn bộ; mục không gán roles (dashboard, activity) luôn hiển thị cho mọi role.
  const visibleNav: NavGroup[] = NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || !currentUser || currentUser.role === 'Admin' || item.roles.includes(currentUser.role)
    ),
  })).filter((group) => group.items.length > 0)

  useEffect(() => {
    let cancelled = false
    Object.entries(NAV_COUNT_RESOURCES).forEach(([key, resources]) => {
      Promise.all(resources.map((r) => getList(r, 0, 1)))
        .then((pages) => {
          if (cancelled) return
          const total = pages.reduce((s, p) => s + p.totalElements, 0)
          setCounts((prev) => ({ ...prev, [key]: total }))
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  const loc = useLocation()
  const parts = loc.pathname.split('/').filter(Boolean)
  const active = parts[0] || 'dashboard'
  const isDetail = parts.length > 1
  // Tiêu đề riêng cho màn chi tiết/builder (khác màn danh sách).
  const DETAIL_TITLES: Record<string, string> = { pattern: 'Trình dựng Product Pattern' }
  const [listTitle, crumb] = VIEW_TITLES[active] ?? ['FINANCIAL OBLIGATION MANUFACTURING SYSTEM', '']
  const title = isDetail ? DETAIL_TITLES[active] ?? listTitle : listTitle

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#F4F7F5' }}>
      {/* ============ SIDEBAR ============ */}
      <aside
        style={{
          width: 250,
          flex: 'none',
          background: 'linear-gradient(180deg,#0B3B2E 0%,#082A20 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* logo */}
        <div
          style={{
            padding: '20px 18px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            borderBottom: '1px solid rgba(255,255,255,.07)',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#14B870,#0E8C5A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              boxShadow: '0 4px 12px rgba(14,140,90,.35)',
            }}
          >
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 11.5, letterSpacing: '-.3px' }}>FOMS</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, lineHeight: 1.3, letterSpacing: '.2px' }}>
              FINANCIAL OBLIGATION MANUFACTURING SYSTEM
            </div>
          </div>
        </div>

        {/* nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 20px' }}>
          {visibleNav.map((group) => (
            <div key={group.label} style={{ marginBottom: 14 }}>
              <div
                style={{
                  color: '#5E8C76',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.8px',
                  textTransform: 'uppercase',
                  padding: '8px 10px 6px',
                }}
              >
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = active === item.key
                const liveCount = counts[item.key]
                const displayCount = liveCount !== undefined ? String(liveCount) : item.count
                return (
                  <NavLink
                    key={item.key}
                    to={`/${item.key}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '9px 10px',
                      marginBottom: 2,
                      borderRadius: 9,
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(20,184,112,.15)' : 'transparent',
                      color: isActive ? '#fff' : '#B7D4C6',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <span style={{ display: 'flex', width: 18, height: 18, flex: 'none', color: isActive ? '#2AD98A' : '#6FA98E' }}>
                        <Icon name={item.icon} size={18} strokeWidth={2} />
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>
                    </span>
                    {displayCount && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: isActive ? '#0B3B2E' : '#8FBBA6',
                          background: isActive ? '#2AD98A' : 'rgba(255,255,255,.06)',
                          borderRadius: 6,
                          padding: '1px 7px',
                          flex: 'none',
                        }}
                      >
                        {displayCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* user — Giai đoạn 42: bộ chọn "đổi vai trò" thật (demo, không mật khẩu/session),
            lọc menu phía frontend theo role của user đang chọn (xem visibleNav ở trên). */}
        <div ref={userMenuRef} style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div
            onClick={() => setUserMenuOpen((o) => !o)}
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#F2B705,#E8920C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                color: '#1a1206',
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              {currentUser ? initialsOf(currentUser.name) : '…'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: '#E8F3EE',
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser?.name ?? 'Đang tải…'}
              </div>
              <div style={{ color: '#5E8C76', fontSize: 10.5 }}>{currentUser?.role ?? ''}</div>
            </div>
            <span style={{ display: 'flex', color: '#5E8C76', flex: 'none', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
              <Icon name="caret" size={14} />
            </span>
          </div>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 10,
                right: 10,
                background: '#0F4536',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,.3)',
                overflow: 'hidden',
                zIndex: 60,
              }}
            >
              <div style={{ padding: '9px 12px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '.4px', color: '#5E8C76', textTransform: 'uppercase' }}>
                Đổi vai trò (demo)
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u)
                    setUserMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: currentUser?.id === u.id ? 'rgba(255,255,255,.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = currentUser?.id === u.id ? 'rgba(255,255,255,.08)' : 'transparent')}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      color: '#E8F3EE',
                      fontWeight: 700,
                      fontSize: 10.5,
                    }}
                  >
                    {initialsOf(u.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#E8F3EE', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </div>
                    <div style={{ color: '#5E8C76', fontSize: 10 }}>{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        {/* topbar */}
        <header
          style={{
            height: 60,
            flex: 'none',
            background: '#fff',
            borderBottom: '1px solid #E6ECE8',
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            gap: 18,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#8A998F', fontSize: 11.5, fontWeight: 500 }}>
              <span>FINANCIAL OBLIGATION MANUFACTURING SYSTEM</span>
              <span style={{ color: '#C2D0C8' }}>/</span>
              <span style={{ color: '#0E8C5A', fontWeight: 600 }}>{crumb}</span>
            </div>
            <div
              style={{
                fontSize: 16.5,
                fontWeight: 700,
                color: '#122019',
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
          </div>
          <GlobalSearch />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#DCF3E7',
              border: '1px solid #B7E6CE',
              borderRadius: 8,
              padding: '6px 11px',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0E8C5A', display: 'block' }} />
            <span style={{ fontSize: 12, color: '#0B7349', fontWeight: 600 }}>PROD</span>
          </div>
        </header>

        {/* content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  )
}
