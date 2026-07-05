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
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('ratings')
        .select('*, courses(id, name, city, state)')
        .eq('user_id', user.id)
        .order('average_score', { ascending: false })
      setRatings(data || [])
      setLoading(false)
    }
    load()
  }, [user.id])

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

  if (loading) {
    return (
      <div>
        <TopBar title="My Top 10" />
        <p className="text-center text-gray-400 mt-8">Loading…</p>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="My Top 10" />
      <div className="p-4">
        {ratings.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 mb-4">You haven't rated any courses yet.</p>
            <button
              onClick={() => navigate('/')}
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
        )}
      </div>
    </div>
  )
}
