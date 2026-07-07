import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchGlobal } from '../../infrastructure/api/client'
import Icon from './Icon'
import { StatusChip } from './StatusChip'

interface SearchResult {
  type: string
  code: string | null
  name: string
  status: string | null
  path: string
}

const TYPE_ICON: Record<string, string> = {
  'Business Intent': 'target',
  'Product Intent': 'intent',
  'Product Pattern': 'pattern',
  'Product Template': 'template',
  'Product Config': 'config',
  'Product Variant': 'variant',
  'Obligation Type': 'obligation',
  'Financial Obligation Archetype': 'layers',
  Block: 'block',
  Attribute: 'tag',
  Domain: 'domain',
  Lifecycle: 'lifecycle',
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      searchGlobal<SearchResult>(q)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function goTo(r: SearchResult) {
    setOpen(false)
    setQuery('')
    setResults([])
    navigate(r.path)
  }

  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={rootRef} style={{ position: 'relative', flex: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F4F7F5',
          border: '1px solid #E6ECE8',
          borderRadius: 9,
          padding: '8px 12px',
          width: 300,
        }}
      >
        <span style={{ display: 'flex', color: '#8A998F' }}>
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Tìm mã, sản phẩm, obligation…"
          style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#122019', width: '100%', fontFamily: 'inherit' }}
        />
        {query ? (
          <span
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
            style={{ display: 'flex', color: '#A7B5AC', cursor: 'pointer', flex: 'none' }}
          >
            <Icon name="x" size={14} />
          </span>
        ) : (
          <span
            style={{
              fontSize: 10.5,
              color: '#A7B5AC',
              border: '1px solid #DCE5DF',
              borderRadius: 5,
              padding: '1px 5px',
              fontWeight: 600,
              flex: 'none',
            }}
          >
            ⌘K
          </span>
        )}
      </div>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 420,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #E6ECE8',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(11,59,46,.12)',
            zIndex: 50,
            animation: 'fadeUp .15s ease',
          }}
        >
          {loading && <div style={{ padding: '14px 16px', fontSize: 12.5, color: '#8A998F' }}>Đang tìm…</div>}
          {!loading && results.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12.5, color: '#8A998F' }}>
              Không tìm thấy kết quả nào cho "{query}".
            </div>
          )}
          {!loading &&
            results.map((r, i) => (
              <div
                key={r.type + r.path + i}
                onClick={() => goTo(r)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #F1F5F2' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F4FBF7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#F1F5F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon name={TYPE_ICON[r.type] ?? 'search'} size={15} color="#41524A" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#243A30', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8A998F' }}>{r.type}</span>
                    {r.code && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A7B5AC' }}>{r.code}</span>
                    )}
                  </div>
                </div>
                {r.status && <StatusChip status={r.status} />}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
