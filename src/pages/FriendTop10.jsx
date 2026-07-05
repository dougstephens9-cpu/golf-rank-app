import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TopBar from '../components/TopBar'
import RankedList from '../components/RankedList'

export default function FriendTop10() {
  const { friendId } = useParams()
  const navigate = useNavigate()
  const [friendProfile, setFriendProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: profileData }, { data: ratingData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', friendId).single(),
        supabase
          .from('ratings')
          .select('*, courses(id, name, city, state)')
          .eq('user_id', friendId)
          .order('average_score', { ascending: false }),
      ])
      setFriendProfile(profileData)
      setRatings(ratingData || [])
      setLoading(false)
    }
    load()
  }, [friendId])

  return (
    <div>
      <TopBar title={friendProfile ? `${friendProfile.username}'s Top 10` : 'Top 10'} back />
      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-400 mt-8">Loading…</p>
        ) : ratings.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            {friendProfile?.username || 'This golfer'} hasn't rated any courses yet.
          </p>
        ) : (
          <RankedList ratings={ratings} onSelect={(courseId) => navigate(`/course/${courseId}`)} />
        )}
      </div>
    </div>
  )
}
