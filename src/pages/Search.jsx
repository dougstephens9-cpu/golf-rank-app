import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import ScoreBadge from '../components/ScoreBadge'
import MapView from '../components/MapView'
import Rankings from '../components/Rankings'

const RESULT_LIMIT = 100
const MIN_QUERY_LEN = 2
const DEBOUNCE_MS = 300

// PostgREST's `.or()` filter string treats commas/parens as syntax, so strip
// anything that could break the query before it's interpolated in.
function sanitizeTerm(term) {
  return term.replace(/[,()%]/g, ' ').trim()
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [searching, setSearching] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCourse, setNewCourse] = useState({ name: '', city: '', state: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('list')
  const { user } = useAuth()
  const navigate = useNavigate()

  // One lightweight count query on load, just for the placeholder text —
  // doesn't pull any rows.
  useEffect(() => {
    supabase
      .from('course_aggregates')
      .select('course_id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCount(count ?? 0))
  }, [])

  // Debounced server-side search — only queries Supabase (and only pulls up
  // to RESULT_LIMIT rows) once the user has typed a couple characters.
  useEffect(() => {
    const term = sanitizeTerm(query)
    if (term.length < MIN_QUERY_LEN) {
      setResults([])
      setTruncated(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      const { data, error, count } = await supabase
        .from('course_aggregates')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
        .order('name')
        .limit(RESULT_LIMIT)

      if (!error) {
        setResults(data || [])
        setTruncated((count || 0) > RESULT_LIMIT)
      }
      setSearching(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  async function handleAddCourse(e) {
    e.preventDefault()
    setError('')
    if (!newCourse.name.trim()) {
      setError('Course name is required.')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: newCourse.name.trim(),
        city: newCourse.city.trim() || null,
        state: newCourse.state.trim() || null,
        created_by: user.id,
      })
      .select()
      .single()
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowAddForm(false)
    setNewCourse({ name: '', city: '', state: '' })
    navigate(`/course/${data.id}`)
  }

  const term = sanitizeTerm(query)
  const showPrompt = term.length < MIN_QUERY_LEN

  return (
    <div>
      <TopBar title="Courses" />
      <div className="p-4">
        <input
          type="text"
          placeholder={
            totalCount != null
              ? `Search ${totalCount.toLocaleString()} courses by name, city, or state…`
              : 'Search by course, city, or state…'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />

        <div className="flex bg-gray-200 rounded-lg p-1 mb-4 w-fit mx-auto">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
              view === 'list' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
              view === 'map' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Map
          </button>
        </div>

        {view === 'map' ? (
          <MapView query={query} onSelectCourse={(id) => navigate(`/course/${id}`)} />
        ) : (
          <>
            {showPrompt && !searching && (
              <div className="mt-2 mb-6">
                <p className="text-center text-gray-500 mb-6">
                  Start typing above to search{totalCount != null ? ` ${totalCount.toLocaleString()}` : ''} courses,
                  or browse the rankings below.
                </p>
                <Rankings onSelectCourse={(id) => navigate(`/course/${id}`)} />
              </div>
            )}

            {!showPrompt && searching && (
              <p className="text-center text-gray-400 mt-8">Searching…</p>
            )}

            {!showPrompt && !searching && results.length === 0 && (
              <p className="text-center text-gray-500 mt-8">No courses found for "{query}".</p>
            )}

            <div className="space-y-2">
              {results.map((c) => (
                <button
                  key={c.course_id}
                  onClick={() => navigate(`/course/${c.course_id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm text-left hover:bg-gray-50"
                >
                  <ScoreBadge score={c.avg_overall} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[c.city, c.state].filter(Boolean).join(', ') || 'Location not set'}
                      {' · '}
                      {c.review_count} review{c.review_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-gray-300">›</span>
                </button>
              ))}
            </div>

            {truncated && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Showing first {RESULT_LIMIT} matches — refine your search to narrow it down.
              </p>
            )}
          </>
        )}

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 w-full border-2 border-dashed border-emerald-600 text-emerald-700 font-semibold py-3 rounded-xl"
          >
            + Add a course that's missing
          </button>
        ) : (
          <form
            onSubmit={handleAddCourse}
            className="mt-6 bg-white rounded-xl p-4 shadow-sm space-y-3"
          >
            <p className="font-semibold text-gray-800">Add a new course</p>
            <input
              type="text"
              placeholder="Course name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="City"
                value={newCourse.city}
                onChange={(e) => setNewCourse({ ...newCourse, city: e.target.value })}
                className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="State"
                value={newCourse.state}
                onChange={(e) => setNewCourse({ ...newCourse, state: e.target.value })}
                className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold disabled:opacity-60"
              >
                {saving ? 'Adding…' : 'Add course'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
