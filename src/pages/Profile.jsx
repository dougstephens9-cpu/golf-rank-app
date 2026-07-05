import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setNotice(error.message)
    } else {
      setNotice('Saved!')
      refreshProfile()
    }
  }

  return (
    <div>
      <TopBar title="Profile" />
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block font-semibold text-gray-800 text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {notice && <p className="text-emerald-700 text-sm">{notice}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        <button
          onClick={signOut}
          className="w-full border border-red-300 text-red-600 font-semibold py-3 rounded-xl"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
