import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'

const tiles = [
  {
    to: '/top10',
    icon: '🏆',
    title: 'My Courses',
    description: 'Your ranked Top 10 and courses you want to play',
  },
  {
    to: '/friends',
    icon: '👥',
    title: 'Friends',
    description: 'Requests, friend Top 10s, and course recommendations',
  },
  {
    to: '/profile',
    icon: '⚙️',
    title: 'Profile',
    description: 'Your account settings',
  },
]

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <TopBar title="Fairway Ranks" />
      <div className="p-4">
        <p className="text-gray-500 mb-6">
          Welcome back{profile?.username ? `, ${profile.username}` : ''} ⛳
        </p>

        <div className="space-y-3">
          {tiles.map((tile) => (
            <button
              key={tile.to}
              onClick={() => navigate(tile.to)}
              className="w-full flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm text-left hover:bg-gray-50"
            >
              <span className="text-3xl leading-none shrink-0">{tile.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{tile.title}</p>
                <p className="text-xs text-gray-500">{tile.description}</p>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/courses')}
          className="mt-6 w-full border-2 border-dashed border-emerald-600 text-emerald-700 font-semibold py-3 rounded-xl"
        >
          ⛳ Browse & search courses
        </button>
      </div>
    </div>
  )
}
