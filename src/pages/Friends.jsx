import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'

export default function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [incoming, setIncoming] = useState([])
  const [friends, setFriends] = useState([])
  const [outgoingIds, setOutgoingIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const [recs, setRecs] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(true)

  async function loadFriendships() {
    setLoading(true)
    const { data: rows } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(id, username), addressee:profiles!friendships_addressee_id_fkey(id, username)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    const incomingReqs = []
    const acceptedFriends = []
    const outgoing = new Set()

    for (const row of rows || []) {
      const isRequester = row.requester_id === user.id
      const other = isRequester ? row.addressee : row.requester
      if (row.status === 'accepted') {
        acceptedFriends.push({ friendshipId: row.id, ...other })
      } else if (row.status === 'pending' && !isRequester) {
        incomingReqs.push({ friendshipId: row.id, ...other })
      } else if (row.status === 'pending' && isRequester) {
        outgoing.add(other.id)
      }
    }

    setIncoming(incomingReqs)
    setFriends(acceptedFriends)
    setOutgoingIds(outgoing)
    setLoading(false)
  }

  async function loadRecommendations() {
    setLoadingRecs(true)
    const { data } = await supabase
      .from('recommendations')
      .select('*, courses(id, name, city, state), sender:profiles!recommendations_sender_id_fkey(username)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
    setRecs(data || [])
    setLoadingRecs(false)
  }

  useEffect(() => {
    loadFriendships()
    loadRecommendations()
  }, [user.id])

  async function dismissRecommendation(id) {
    await supabase.from('recommendations').delete().eq('id', id)
    setRecs((prev) => prev.filter((r) => r.id !== id))
  }

  async function viewRecommendation(rec) {
    await supabase.from('recommendations').update({ seen: true }).eq('id', rec.id)
    navigate(`/course/${rec.courses?.id}`)
  }

  async function handleSearch(e) {
    e.preventDefault()
    setNotice('')
    if (!search.trim()) {
      setResults([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${search.trim()}%`)
      .neq('id', user.id)
      .limit(10)
    setResults(data || [])
  }

  async function sendRequest(addresseeId) {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' })
    if (error) {
      setNotice(error.message)
    } else {
      setOutgoingIds((prev) => new Set(prev).add(addresseeId))
    }
  }

  async function respond(friendshipId, accept) {
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    } else {
      await supabase.from('friendships').delete().eq('id', friendshipId)
    }
    loadFriendships()
  }

  const friendIds = new Set(friends.map((f) => f.id))

  return (
    <div>
      <TopBar title="Friends" />
      <div className="p-4">
        {!loadingRecs && recs.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2">Courses your friends recommend</h2>
            <div className="space-y-2">
              {recs.map((rec) => (
                <div key={rec.id} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{rec.courses?.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[rec.courses?.city, rec.courses?.state].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        from {rec.sender?.username || 'a friend'}
                      </p>
                      {rec.message && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{rec.message}"</p>
                      )}
                    </div>
                    {!rec.seen && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => viewRecommendation(rec)}
                      className="text-sm font-semibold text-emerald-700"
                    >
                      View course →
                    </button>
                    <button
                      onClick={() => dismissRecommendation(rec.id)}
                      className="text-sm font-semibold text-gray-400 ml-auto"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
          <button className="bg-emerald-700 text-white font-semibold px-4 rounded-lg">
            Search
          </button>
        </form>

        {notice && <p className="text-red-600 text-sm mb-3">{notice}</p>}

        {results.length > 0 && (
          <div className="space-y-2 mb-6">
            {results.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                <span className="font-medium text-gray-800">{p.username}</span>
                {friendIds.has(p.id) ? (
                  <span className="text-xs text-gray-400">Already friends</span>
                ) : outgoingIds.has(p.id) ? (
                  <span className="text-xs text-gray-400">Requested</span>
                ) : (
                  <button
                    onClick={() => sendRequest(p.id)}
                    className="text-sm font-semibold text-emerald-700"
                  >
                    + Add friend
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {incoming.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2">Friend requests</h2>
            <div className="space-y-2">
              {incoming.map((p) => (
                <div key={p.friendshipId} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                  <span className="font-medium text-gray-800">{p.username}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(p.friendshipId, true)}
                      className="text-sm font-semibold text-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respond(p.friendshipId, false)}
                      className="text-sm font-semibold text-gray-400"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-bold text-gray-800 mb-2">My friends</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : friends.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No friends yet — search for a username above to connect.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <button
                key={f.friendshipId}
                onClick={() => navigate(`/friends/${f.id}`)}
                className="w-full flex items-center justify-between bg-white rounded-xl p-3 shadow-sm text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{f.username}</span>
                <span className="text-sm text-emerald-700 font-semibold">View Top 10 ›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
