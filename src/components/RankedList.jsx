import ScoreBadge from './ScoreBadge'

const medal = ['🥇', '🥈', '🥉']

export default function RankedList({ ratings, onSelect }) {
  const top10 = ratings.slice(0, 10)
  const rest = ratings.slice(10)

  return (
    <div>
      <div className="space-y-2">
        {top10.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.courses?.id)}
            className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm text-left hover:bg-gray-50"
          >
            <span className="w-7 text-center font-bold text-gray-400 shrink-0">
              {medal[i] || `#${i + 1}`}
            </span>
            <ScoreBadge score={r.average_score} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{r.courses?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {[r.courses?.city, r.courses?.state].filter(Boolean).join(', ')}
              </p>
              {r.comment && (
                <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">"{r.comment}"</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {rest.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-500 text-sm mt-6 mb-2">Also rated</h3>
          <div className="space-y-2">
            {rest.map((r, i) => (
              <button
                key={r.id}
                onClick={() => onSelect(r.courses?.id)}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-2.5 shadow-sm text-left hover:bg-gray-50 opacity-80"
              >
                <span className="w-7 text-center text-xs font-bold text-gray-400 shrink-0">
                  #{i + 11}
                </span>
                <ScoreBadge score={r.average_score} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">{r.courses?.name}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
