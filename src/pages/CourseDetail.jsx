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

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: courseData }, { data: aggData }, { data: reviewData }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('course_aggregates').select('*').eq('course_id', courseId).single(),
        supabase
          .from('ratings')
          .select('*, profiles(username)')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false }),
      ])
      setCourse(courseData)
      setAggregate(aggData)
      setReviews(reviewData || [])
      setMyRating((reviewData || []).find((r) => r.user_id === user.id) || null)
      setLoading(false)
    }
    load()
  }, [courseId, user.id])

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
        <p className="text-sm text-gray-500 mb-4">
          {[course.city, course.state, course.country].filter(Boolean).join(', ')}
        </p>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
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

        <button
          onClick={() => navigate(`/course/${courseId}/rate`)}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl mb-6"
        >
          {myRating ? 'Edit your rating' : 'Rate this course'}
        </button>

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
