import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import ScoreSlider from '../components/ScoreSlider'

export default function RateCourse() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [serviceScore, setServiceScore] = useState(7)
  const [courseScore, setCourseScore] = useState(7)
  const [priceScore, setPriceScore] = useState(7)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      setCourse(courseData)

      const { data: existing } = await supabase
        .from('ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        setServiceScore(existing.service_score)
        setCourseScore(existing.course_score)
        setPriceScore(existing.price_score)
        setComment(existing.comment || '')
      }
      setLoading(false)
    }
    load()
  }, [courseId, user.id])

  const average = ((serviceScore + courseScore + priceScore) / 3).toFixed(2)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { error } = await supabase.from('ratings').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        service_score: serviceScore,
        course_score: courseScore,
        price_score: priceScore,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    )
    if (error) {
      setSaving(false)
      setError(error.message)
      return
    }

    // Once you've actually played and rated it, it's no longer "want to play".
    await supabase.from('wishlist').delete().eq('user_id', user.id).eq('course_id', courseId)

    setSaving(false)
    navigate(`/course/${courseId}`)
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Rate this course" back />
        <p className="text-center text-gray-400 mt-8">Loading…</p>
      </div>
    )
  }

  return (
    <div>
      <TopBar title={course?.name || 'Rate this course'} back />
      <form onSubmit={handleSave} className="p-4">
        <p className="text-sm text-gray-500 mb-4">
          Rate three things about your round. We'll average them into one overall score.
        </p>

        <ScoreSlider
          label="Course"
          description="Layout, conditions, greens, overall design"
          value={courseScore}
          onChange={setCourseScore}
        />
        <ScoreSlider
          label="Service"
          description="Staff, pace of play, pro shop, amenities"
          value={serviceScore}
          onChange={setServiceScore}
        />
        <ScoreSlider
          label="Price"
          description="Value for what you paid"
          value={priceScore}
          onChange={setPriceScore}
        />

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex items-center justify-between">
          <span className="font-semibold text-emerald-900">Overall average</span>
          <span className="text-2xl font-bold text-emerald-800">{average}</span>
        </div>

        <label className="block font-semibold text-gray-800 mb-1">
          Why'd you rate it this way?
        </label>
        <textarea
          rows={4}
          placeholder="Great conditions but slow pace of play today…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save rating'}
        </button>
      </form>
    </div>
  )
}
