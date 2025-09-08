export type RouteStatus = 'pending' | 'in_progress' | 'completed'

export interface Route {
  id: string
  title: string
  date: string   
  start: string
  end: string
  capacity: number
  status: RouteStatus
}
