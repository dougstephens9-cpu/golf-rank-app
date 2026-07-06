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

  const [playedWith, setPlayedWith] = useState([]) // [{ id, username }]
  const [pmSearch, setPmSearch] = useState('')
  const [pmResults, setPmResults] = useState([])

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

        const { data: partners } = await supabase
          .from('rating_playmates')
          .select('partner_id, profiles(id, username)')
          .eq('rating_id', existing.id)
        setPlayedWith((partners || []).map((p) => p.profiles).filter(Boolean))
      }
      setLoading(false)
    }
    load()
  }, [courseId, user.id])

  useEffect(() => {
    const term = pmSearch.trim()
    if (term.length < 2) {
      setPmResults([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${term}%`)
        .neq('id', user.id)
        .limit(8)
      const alreadyAdded = new Set(playedWith.map((p) => p.id))
      setPmResults((data || []).filter((p) => !alreadyAdded.has(p.id)))
    }, 250)
    return () => clearTimeout(timer)
  }, [pmSearch, playedWith, user.id])

  function addPlaymate(p) {
    setPlayedWith((prev) => [...prev, p])
    setPmSearch('')
    setPmResults([])
  }

  function removePlaymate(id) {
    setPlayedWith((prev) => prev.filter((p) => p.id !== id))
  }

  const average = ((serviceScore + courseScore + priceScore) / 3).toFixed(2)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { data: savedRating, error } = await supabase
      .from('ratings')
      .upsert(
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
      .select()
      .single()

    if (error) {
      setSaving(false)
      setError(error.message)
      return
    }

    // Once you've actually played and rated it, it's no longer "want to play".
    await supabase.from('wishlist').delete().eq('user_id', user.id).eq('course_id', courseId)

    // Replace the tagged playmates with whatever's currently selected.
    await supabase.from('rating_playmates').delete().eq('rating_id', savedRating.id)
    if (playedWith.length > 0) {
      await supabase.from('rating_playmates').insert(
        playedWith.map((p) => ({ rating_id: savedRating.id, partner_id: p.id }))
      )
    }

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

        <label className="block font-semibold text-gray-800 mb-1">Who'd you play with?</label>
        <p className="text-xs text-gray-500 mb-2">
          Tag other Fairway Ranks users who joined your round.
        </p>

        {playedWith.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {playedWith.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {p.username}
                <button
                  type="button"
                  onClick={() => removePlaymate(p.id)}
                  className="text-emerald-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Search by username…"
          value={pmSearch}
          onChange={(e) => setPmSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1"
        />
        {pmResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
            {pmResults.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => addPlaymate(p)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                + {p.username}
              </button>
            ))}
          </div>
        )}
        {pmResults.length === 0 && <div className="mb-4" />}

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
