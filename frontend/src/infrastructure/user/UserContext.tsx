import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUsers } from '../api/client'
import type { UserRole } from '../nav'

export interface AppUser {
  id: number
  code: string
  name: string
  role: UserRole
  status: string
}

interface UserContextValue {
  users: AppUser[]
  currentUser: AppUser | null
  setCurrentUser: (u: AppUser) => void
  loading: boolean
}

const STORAGE_KEY = 'pf.currentUserId'

const UserContext = createContext<UserContextValue | null>(null)

// Giai đoạn 42 — bộ chọn "đổi vai trò" kiểu demo (không mật khẩu, không session/JWT), lọc menu
// thuần phía frontend. Mặc định lần đầu = user role Admin để không ai bị ẩn menu khi mới vào.
export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsers<AppUser>()
      .then((list) => {
        setUsers(list)
        const savedId = Number(localStorage.getItem(STORAGE_KEY))
        const saved = list.find((u) => u.id === savedId)
        const admin = list.find((u) => u.role === 'Admin')
        setCurrentUserState(saved ?? admin ?? list[0] ?? null)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const setCurrentUser = (u: AppUser) => {
    setCurrentUserState(u)
    localStorage.setItem(STORAGE_KEY, String(u.id))
  }

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser phải dùng trong UserProvider')
  return ctx
}
