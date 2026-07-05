import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { supabase } from '../lib/supabaseClient'

// Vite bundles Leaflet's default marker images under a hashed path, which
// breaks Leaflet's own lookup — point it at the bundled URLs directly.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const US_CENTER = [39.8283, -98.5795]
const US_ZOOM = 4
const RESULT_LIMIT = 200

function sanitizeTerm(term) {
  return term.replace(/[,()%]/g, ' ').trim()
}

function BoundsWatcher({ onChange }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      onChange({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      })
    },
  })
  return null
}

function FitToResults({ courses, active }) {
  const map = useMap()
  useEffect(() => {
    if (!active || courses.length === 0) return
    const bounds = L.latLngBounds(courses.map((c) => [c.latitude, c.longitude]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
  }, [active, courses, map])
  return null
}

export default function MapView({ query, onSelectCourse }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const boundsRef = useRef(null)

  const term = sanitizeTerm(query || '')
  const searchMode = term.length >= 2

  async function loadByBounds(bounds) {
    if (!bounds) return
    setLoading(true)
    const { data } = await supabase
      .from('course_aggregates')
      .select('*')
      .not('latitude', 'is', null)
      .gte('latitude', bounds.minLat)
      .lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng)
      .lte('longitude', bounds.maxLng)
      .limit(RESULT_LIMIT)
    setCourses(data || [])
    setLoading(false)
  }

  async function loadBySearch(term) {
    setLoading(true)
    const { data } = await supabase
      .from('course_aggregates')
      .select('*')
      .not('latitude', 'is', null)
      .or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`)
      .limit(RESULT_LIMIT)
    setCourses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (searchMode) {
      loadBySearch(term)
    } else if (boundsRef.current) {
      loadByBounds(boundsRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, searchMode])

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ height: '60vh' }}>
        <MapContainer center={US_CENTER} zoom={US_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsWatcher
            onChange={(b) => {
              boundsRef.current = b
              if (!searchMode) loadByBounds(b)
            }}
          />
          <FitToResults courses={courses} active={searchMode} />
          {courses.map((c) => (
            <Marker key={c.course_id} position={[c.latitude, c.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-gray-500">
                    {[c.city, c.state].filter(Boolean).join(', ') || 'Location unknown'}
                  </p>
                  <p className="text-gray-500 mb-1">
                    {c.avg_overall != null ? `${c.avg_overall.toFixed(1)}/10` : 'Not yet rated'} ·{' '}
                    {c.review_count} review{c.review_count === 1 ? '' : 's'}
                  </p>
                  <button
                    onClick={() => onSelectCourse(c.course_id)}
                    className="text-emerald-700 font-semibold"
                  >
                    View course →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        {loading
          ? 'Loading courses…'
          : searchMode
            ? `${courses.length} match${courses.length === 1 ? '' : 'es'} for "${term}"`
            : 'Pan or zoom the map to browse courses in that area.'}
      </p>
    </div>
  )
}
