// app/(protected)/profile.tsx  (or wherever you keep pages/components)
// Renders the current user's profile from public.users
'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type DBUser = {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string | null
  role: 'staff' | 'volunteer'
  location: string | null
  latitude: number | null
  longitude: number | null
}

type AuthUserLite = {
  id: string
  email?: string
}

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState<AuthUserLite | null>(null)
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        if (!userRes.user) {
          setError('You must be signed in to view your profile.')
          setLoading(false)
          return
        }

        const authLite: AuthUserLite = {
          id: userRes.user.id,
          email: userRes.user.email ?? undefined,
        }
        if (!alive) return
        setAuthUser(authLite)

        const { data, error: dbErr } = await supabase
          .from('users')
          .select(
            'id, full_name, phone, created_at, role, location, latitude, longitude'
          )
          .eq('id', userRes.user.id)
          .maybeSingle()

        if (dbErr) throw dbErr
        if (!alive) return

        setDbUser(data as DBUser | null)
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? 'Failed to load profile.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const initials = useMemo(() => {
    const name = dbUser?.full_name ?? authUser?.email ?? ''
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  }, [dbUser, authUser])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="animate-pulse">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="mt-4 h-6 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-200" />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-16 rounded-lg bg-gray-200" />
            <div className="h-16 rounded-lg bg-gray-200" />
            <div className="h-16 rounded-lg bg-gray-200" />
            <div className="h-16 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
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

  // If the users row doesn't exist yet (Auth user exists), show empty/CTA
  if (!dbUser) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border p-6">
          <h1 className="text-xl font-semibold">My Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            We couldn’t find your profile record. Please complete your profile.
          </p>
          <div className="mt-4">
            <a
              href="/complete-profile"
              className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-white"
            >
              Complete Profile
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold">
          {initials || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            {dbUser.full_name || authUser?.email || 'My Profile'}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
              Role: {dbUser.role}
            </span>
            {authUser?.email && (
              <span className="text-sm text-gray-600">{authUser.email}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard label="Full name" value={dbUser.full_name ?? '—'} />
        <InfoCard label="Phone" value={dbUser.phone ?? '—'} />
        <InfoCard label="Location" value={dbUser.location ?? '—'} />
        <InfoCard
          label="Coordinates"
          value={
            dbUser.latitude && dbUser.longitude
              ? `${dbUser.latitude.toFixed(6)}, ${dbUser.longitude.toFixed(6)}`
              : '—'
          }
        />
        <InfoCard
          label="Member since"
          value={dbUser.created_at ? new Date(dbUser.created_at).toLocaleString() : '—'}
        />
        <InfoCard label="User ID" value={dbUser.id} mono />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => location.reload()}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Refresh
        </button>
        <a
          href="/profile/edit"
          className="rounded-lg bg-black px-3 py-2 text-sm text-white"
        >
          Edit Profile
        </a>
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 ${mono ? 'font-mono text-sm' : ''}`}>{value}</div>
    </div>
  )
}