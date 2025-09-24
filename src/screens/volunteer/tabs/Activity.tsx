// app/(protected)/activity.tsx
// Shows route assignments for volunteers from public.route_participants
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type DBUser = {
  id: string
  role: 'staff' | 'volunteer'
  full_name: string | null
}

type ParticipantRow = {
  id: string
  route_id: string | null
  user_id: string | null
  role: 'staff' | 'volunteer'
  assigned_at: string | null
}

export default function ActivityPage() {
  const [me, setMe] = useState<DBUser | null>(null)
  const [rows, setRows] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // 1) Get auth user
        const { data: userRes, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        if (!userRes.user) {
          setError('You must be signed in to view activity.')
          setLoading(false)
          return
        }

        // 2) Load our role from public.users
        const { data: meRow, error: meErr } = await supabase
          .from('users')
          .select('id, role, full_name')
          .eq('id', userRes.user.id)
          .maybeSingle()
        if (meErr) throw meErr
        if (!meRow) {
          setError('No user record found. Complete your profile first.')
          setLoading(false)
          return
        }
        if (!alive) return
        setMe(meRow as DBUser)

        // 3) If volunteer, fetch assignments from public.route_participants
        if (meRow.role === 'volunteer') {
          const { data, error: rpErr } = await supabase
            .from('route_participants')
            .select('id, route_id, user_id, role, assigned_at')
            .eq('user_id', meRow.id)
            .order('assigned_at', { ascending: false })
          if (rpErr) throw rpErr
          if (!alive) return
          setRows((data ?? []) as ParticipantRow[])
        } else {
          // Non-volunteers can’t see this page per your requirement
          setRows([])
        }
      } catch (e: any) {
        console.error(e)
        if (alive) setError(e?.message ?? 'Failed to load activity.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="animate-pulse">
          <div className="h-6 w-56 rounded bg-gray-200" />
          <div className="mt-4 h-24 w-full rounded-lg bg-gray-200" />
          <div className="mt-3 h-24 w-full rounded-lg bg-gray-200" />
          <div className="mt-3 h-24 w-full rounded-lg bg-gray-200" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => location.reload()}
            className="mt-3 rounded-lg border bg-white px-3 py-1.5 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!me) return null

  if (me.role !== 'volunteer') {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Activity</h1>
          <p className="mt-2 text-gray-600">
            Only users with the <b>volunteer</b> role can view activity assignments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My Activity</h1>
        <button
          onClick={() => location.reload()}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-gray-700">No assignments yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border p-4 transition hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Route</div>
                  <div className="font-medium">
                    {r.route_id ?? '—'}
                    {/* If you later have route metadata, swap this for: route name/date */}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Assigned</div>
                  <div className="font-medium">
                    {r.assigned_at
                      ? new Date(r.assigned_at).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Role on route: <b>{r.role}</b>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
