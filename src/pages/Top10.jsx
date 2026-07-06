import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import ScoreBadge from '../components/ScoreBadge'
import RankedList from '../components/RankedList'

export default function Top10() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('played')

  const [ratings, setRatings] = useState([])
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [shared, setShared] = useState(false)

  const [wishlist, setWishlist] = useState([])
  const [loadingWishlist, setLoadingWishlist] = useState(true)

  useEffect(() => {
    async function load() {
      setLoadingRatings(true)
      const { data } = await supabase
        .from('ratings')
        .select('*, courses(id, name, city, state)')
        .eq('user_id', user.id)
        .order('average_score', { ascending: false })
      setRatings(data || [])
      setLoadingRatings(false)
    }
    load()
  }, [user.id])

  async function loadWishlist() {
    setLoadingWishlist(true)
    const { data } = await supabase
      .from('wishlist')
      .select('id, created_at, courses(id, name, city, state)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWishlist(data || [])
    setLoadingWishlist(false)
  }

  useEffect(() => {
    loadWishlist()
  }, [user.id])

  async function removeFromWishlist(wishlistId) {
    await supabase.from('wishlist').delete().eq('id', wishlistId)
    setWishlist((prev) => prev.filter((w) => w.id !== wishlistId))
  }

  async function handleShare() {
    const top10 = ratings.slice(0, 10)
    const text = [
      `${profile?.username || 'My'} Top ${top10.length} Golf Courses 🏌️`,
      ...top10.map(
        (r, i) => `${i + 1}. ${r.courses?.name} — ${r.average_score.toFixed(1)}/10`
      ),
      '\nRanked on Fairway Ranks',
    ].join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // user cancelled share sheet — ignore
      }
    } else {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  return (
    <div>
      <TopBar title="My Courses" />
      <div className="p-4">
        <div className="flex bg-gray-200 rounded-lg p-1 mb-4 w-fit mx-auto">
          <button
            onClick={() => setTab('played')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
              tab === 'played' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Played / Top 10
          </button>
          <button
            onClick={() => setTab('wishlist')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
              tab === 'wishlist' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            ⭐ Want to Play
          </button>
        </div>

        {tab === 'played' ? (
          loadingRatings ? (
            <p className="text-center text-gray-400 mt-8">Loading…</p>
          ) : ratings.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-500 mb-4">You haven't rated any courses yet.</p>
              <button
                onClick={() => navigate('/courses')}
                className="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg"
              >
                Find a course to rate
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleShare}
                className="w-full mb-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl"
              >
                {shared ? 'Copied to clipboard ✓' : '📤 Share my Top 10 with friends'}
              </button>

              <RankedList
                ratings={ratings}
                onSelect={(courseId) => navigate(`/course/${courseId}`)}
              />
            </>
          )
        ) : loadingWishlist ? (
          <p className="text-center text-gray-400 mt-8">Loading…</p>
        ) : wishlist.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 mb-4">
              No courses starred yet. Tap the ⭐ on any course page to save it here.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Find a course
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {wishlist.map((w) => (
              <div
                key={w.id}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
              >
                <button
                  className="flex-1 min-w-0 text-left flex items-center gap-3"
                  onClick={() => navigate(`/course/${w.courses?.id}`)}
                >
                  <ScoreBadge score={null} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{w.courses?.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[w.courses?.city, w.courses?.state].filter(Boolean).join(', ') ||
                        'Location not set'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => removeFromWishlist(w.id)}
                  className="text-amber-500 text-xl shrink-0"
                  title="Remove from wishlist"
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
