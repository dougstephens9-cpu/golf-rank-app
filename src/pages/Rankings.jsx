import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { US_STATES } from '../lib/usStates'
import ScoreBadge from './ScoreBadge'

const medal = ['🥇', '🥈', '🥉']

function RankedRow({ course, rank, onSelect }) {
  return (
    <button
      onClick={() => onSelect(course.course_id)}
      className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm text-left hover:bg-gray-50"
    >
      <span className="w-7 text-center font-bold text-gray-400 shrink-0">
        {medal[rank] || `#${rank + 1}`}
      </span>
      <ScoreBadge score={course.avg_overall} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{course.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {[course.city, course.state].filter(Boolean).join(', ') || 'Location not set'}
          {' · '}
          {course.review_count} review{course.review_count === 1 ? '' : 's'}
        </p>
      </div>
    </button>
  )
}

export default function Rankings({ onSelectCourse }) {
  const [topUS, setTopUS] = useState([])
  const [loadingUS, setLoadingUS] = useState(true)

  const [selectedState, setSelectedState] = useState('')
  const [topState, setTopState] = useState([])
  const [loadingState, setLoadingState] = useState(false)

  useEffect(() => {
    supabase
      .from('course_aggregates')
      .select('*')
      .not('avg_overall', 'is', null)
      .order('avg_overall', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTopUS(data || [])
        setLoadingUS(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedState) {
      setTopState([])
      return
    }
    setLoadingState(true)
    supabase
      .from('course_aggregates')
      .select('*')
      .eq('state', selectedState)
      .not('avg_overall', 'is', null)
      .order('avg_overall', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTopState(data || [])
        setLoadingState(false)
      })
  }, [selectedState])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-bold text-gray-800 mb-2">🏆 Top 10 in the U.S.</h2>
        {loadingUS ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : topUS.length === 0 ? (
          <p className="text-sm text-gray-500">
            No rated courses yet — be the first to rate one!
          </p>
        ) : (
          <div className="space-y-2">
            {topUS.map((c, i) => (
              <RankedRow key={c.course_id} course={c} rank={i} onSelect={onSelectCourse} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-gray-800 mb-2">Top 10 by state</h2>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">Choose a state…</option>
          {US_STATES.map(([abbr, name]) => (
            <option key={abbr} value={abbr}>
              {name}
            </option>
          ))}
        </select>

        {selectedState &&
          (loadingState ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : topState.length === 0 ? (
            <p className="text-sm text-gray-500">
              No rated courses in that state yet — be the first!
            </p>
          ) : (
            <div className="space-y-2">
              {topState.map((c, i) => (
                <RankedRow key={c.course_id} course={c} rank={i} onSelect={onSelectCourse} />
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
