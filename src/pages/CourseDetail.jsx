import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import ScoreBadge from '../components/ScoreBadge'

export default function CourseDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [aggregate, setAggregate] = useState(null)
  const [reviews, setReviews] = useState([])
  const [myRating, setMyRating] = useState(null)
  const [loading, setLoading] = useState(true)

  const [wishlisted, setWishlisted] = useState(false)
  const [wishlistId, setWishlistId] = useState(null)
  const [wishlistBusy, setWishlistBusy] = useState(false)

  const [showRecommend, setShowRecommend] = useState(false)
  const [friends, setFriends] = useState([])
  const [recipientId, setRecipientId] = useState('')
  const [recMessage, setRecMessage] = useState('')
  const [recSaving, setRecSaving] = useState(false)
  const [recNotice, setRecNotice] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: courseData }, { data: aggData }, { data: reviewData }, { data: wishData }] =
        await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('course_aggregates').select('*').eq('course_id', courseId).single(),
          supabase
            .from('ratings')
            .select('*, profiles(username)')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false }),
          supabase
            .from('wishlist')
            .select('id')
            .eq('course_id', courseId)
            .eq('user_id', user.id)
            .maybeSingle(),
        ])
      setCourse(courseData)
      setAggregate(aggData)
      setReviews(reviewData || [])
      setMyRating((reviewData || []).find((r) => r.user_id === user.id) || null)
      setWishlisted(!!wishData)
      setWishlistId(wishData?.id || null)
      setLoading(false)
    }
    load()
  }, [courseId, user.id])

  async function toggleWishlist() {
    setWishlistBusy(true)
    if (wishlisted) {
      await supabase.from('wishlist').delete().eq('id', wishlistId)
      setWishlisted(false)
      setWishlistId(null)
    } else {
      const { data } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, course_id: courseId })
        .select()
        .single()
      setWishlisted(true)
      setWishlistId(data?.id || null)
    }
    setWishlistBusy(false)
  }

  async function openRecommend() {
    setShowRecommend(true)
    setRecNotice('')
    const { data: rows } = await supabase
      .from('friendships')
      .select(
        '*, requester:profiles!friendships_requester_id_fkey(id, username), addressee:profiles!friendships_addressee_id_fkey(id, username)'
      )
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    const list = (rows || []).map((row) =>
      row.requester_id === user.id ? row.addressee : row.requester
    )
    setFriends(list)
    if (list.length > 0) setRecipientId(list[0].id)
  }

  async function sendRecommendation(e) {
    e.preventDefault()
    if (!recipientId) return
    setRecSaving(true)
    setRecNotice('')
    const { error } = await supabase.from('recommendations').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      course_id: courseId,
      message: recMessage.trim() || null,
    })
    setRecSaving(false)
    if (error) {
      setRecNotice(error.message)
      return
    }
    setRecMessage('')
    setShowRecommend(false)
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Course" back />
        <p className="text-center text-gray-400 mt-8">Loading…</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div>
        <TopBar title="Course" back />
        <p className="text-center text-gray-500 mt-8">Course not found.</p>
      </div>
    )
  }

  return (
    <div>
      <TopBar title={course.name} back />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm text-gray-500">
            {[course.city, course.state, course.country].filter(Boolean).join(', ')}
          </p>
          <button
            onClick={toggleWishlist}
            disabled={wishlistBusy}
            title={wishlisted ? 'Remove from Want to Play' : 'Add to Want to Play'}
            className={`text-2xl leading-none shrink-0 ${wishlisted ? 'text-amber-500' : 'text-gray-300'}`}
          >
            {wishlisted ? '★' : '☆'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 mt-3">
          <div className="flex items-center gap-4 mb-4">
            <ScoreBadge score={aggregate?.avg_overall} size="lg" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {aggregate?.avg_overall != null ? aggregate.avg_overall.toFixed(1) : 'Not yet rated'}
              </p>
              <p className="text-sm text-gray-500">
                {aggregate?.review_count || 0} review{aggregate?.review_count === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <BreakdownStat label="Course" value={aggregate?.avg_course} />
            <BreakdownStat label="Service" value={aggregate?.avg_service} />
            <BreakdownStat label="Price" value={aggregate?.avg_price} />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate(`/course/${courseId}/rate`)}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl"
          >
            {myRating ? 'Edit your rating' : 'Rate this course'}
          </button>
          <button
            onClick={openRecommend}
            className="px-4 bg-white border border-emerald-700 text-emerald-700 font-semibold py-3 rounded-xl"
          >
            Recommend
          </button>
        </div>

        {showRecommend && (
          <form
            onSubmit={sendRecommendation}
            className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-3"
          >
            <p className="font-semibold text-gray-800">Recommend to a friend</p>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">
                You don't have any friends added yet — add friends from the Friends tab first.
              </p>
            ) : (
              <>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.username}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  placeholder="Optional note — why they should play it"
                  value={recMessage}
                  onChange={(e) => setRecMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </>
            )}
            {recNotice && <p className="text-red-600 text-sm">{recNotice}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRecommend(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold"
              >
                Cancel
              </button>
              {friends.length > 0 && (
                <button
                  type="submit"
                  disabled={recSaving}
                  className="flex-1 py-2 rounded-lg bg-emerald-700 text-white font-semibold disabled:opacity-60"
                >
                  {recSaving ? 'Sending…' : 'Send'}
                </button>
              )}
            </div>
          </form>
        )}

        <h2 className="font-bold text-gray-800 mb-2">Reviews</h2>
        {reviews.length === 0 && (
          <p className="text-gray-500 text-sm">No reviews yet — be the first!</p>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex items-center gap-2 mb-1">
                <ScoreBadge score={r.average_score} size="sm" />
                <span className="font-semibold text-gray-800">
                  {r.profiles?.username || 'Golfer'}
                  {r.user_id === user.id && (
                    <span className="text-emerald-600 font-normal"> (you)</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                Course {r.course_score} · Service {r.service_score} · Price {r.price_score}
              </p>
              {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BreakdownStat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2">
      <p className="text-lg font-bold text-gray-800">{value != null ? value.toFixed(1) : '—'}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  )
}
