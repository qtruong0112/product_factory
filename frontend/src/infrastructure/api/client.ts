// API client mỏng — mọi màn hình đọc dữ liệu qua đây.
// Kiểu Page khớp với Spring Data Page<T>.
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const BASE = '/api'

export async function getList<T>(resource: string, page = 0, size = 50): Promise<Page<T>> {
  const res = await fetch(`${BASE}/${resource}?page=${page}&size=${size}`)
  if (!res.ok) throw new Error(`GET ${resource} thất bại: ${res.status}`)
  return res.json()
}

export async function getById<T>(resource: string, id: string | number): Promise<T> {
  const res = await fetch(`${BASE}/${resource}/${id}`)
  if (!res.ok) throw new Error(`GET ${resource}/${id} thất bại: ${res.status}`)
  return res.json()
}

// Chi tiết mở rộng: GET /api/<resource>/<id>/<suffix> (mặc định 'detail').
// Trả object gồm entity chính + dữ liệu join (vd { intent, elements, ... }).
export async function getDetail<T>(resource: string, id: string | number, suffix = 'detail'): Promise<T> {
  const res = await fetch(`${BASE}/${resource}/${id}/${suffix}`)
  if (!res.ok) throw new Error(`GET ${resource}/${id}/${suffix} thất bại: ${res.status}`)
  return res.json()
}

// Lịch sử phiên bản (nút "Phiên bản" ở Pattern/Config): GET /api/version-entries?entityType=&entityCode=
export async function getVersionHistory<T>(entityType: string, entityCode: string): Promise<T[]> {
  const res = await fetch(`${BASE}/version-entries?entityType=${entityType}&entityCode=${encodeURIComponent(entityCode)}`)
  if (!res.ok) throw new Error(`GET version-entries thất bại: ${res.status}`)
  return res.json()
}

// Tìm kiếm toàn hệ thống (thanh tìm kiếm ở topbar): GET /api/search?q=
export async function searchGlobal<T>(q: string): Promise<T[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`GET search thất bại: ${res.status}`)
  return res.json()
}

// Danh sách người dùng thật cho bộ chọn "đổi vai trò" ở sidebar: GET /api/users
export async function getUsers<T>(): Promise<T[]> {
  const res = await fetch(`${BASE}/users`)
  if (!res.ok) throw new Error(`GET users thất bại: ${res.status}`)
  return res.json()
}

// Lịch sử duyệt của 1 sản phẩm (Config/Pattern/Template...): GET /api/activity-logs/entity?type=&code=
export async function getActivityForEntity<T>(type: string, code: string): Promise<T[]> {
  const res = await fetch(`${BASE}/activity-logs/entity?type=${encodeURIComponent(type)}&code=${encodeURIComponent(code)}`)
  if (!res.ok) throw new Error(`GET activity-logs/entity thất bại: ${res.status}`)
  return res.json()
}
