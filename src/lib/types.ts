export type Role = 'volunteer' | 'staff'

export interface User {
  id: string
  email: string
  role: Role
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}
