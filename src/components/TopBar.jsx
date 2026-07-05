import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, back = false }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-sm">
      {back && (
        <button onClick={() => navigate(-1)} className="text-xl leading-none">
          ←
        </button>
      )}
      <h1 className="text-lg font-bold flex-1 truncate">{title}</h1>
    </header>
  )
}
