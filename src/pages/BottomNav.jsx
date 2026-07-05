import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Search', icon: '⛳' },
  { to: '/top10', label: 'My Courses', icon: '🏆' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-stretch pb-[env(safe-area-inset-bottom)] z-40">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 text-xs font-medium ${
              isActive ? 'text-emerald-700' : 'text-gray-400'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
