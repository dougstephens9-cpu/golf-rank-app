import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/courses', label: 'Courses', icon: '⛳' },
  { to: '/top10', label: 'My Courses', icon: '🏆' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '⚙️' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  async function loadPendingCount() {
    if (!user) return
    const { count } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  useEffect(() => {
    loadPendingCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname])

  // Friends.jsx fires this the moment a request is accepted/declined, so the
  // badge updates instantly without waiting for a route change.
  useEffect(() => {
    window.addEventListener('friendships-changed', loadPendingCount)
    return () => window.removeEventListener('friendships-changed', loadPendingCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-stretch pb-[env(safe-area-inset-bottom)] z-40">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 text-xs font-medium ${
              isActive ? 'text-emerald-700' : 'text-gray-400'
            }`
          }
        >
          <span className="relative">
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.to === '/friends' && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
