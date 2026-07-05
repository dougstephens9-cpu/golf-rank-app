function colorFor(score) {
  if (score >= 8.5) return 'bg-emerald-600'
  if (score >= 7) return 'bg-emerald-500'
  if (score >= 5) return 'bg-amber-500'
  if (score >= 3) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function ScoreBadge({ score, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-xl',
  }
  const value = typeof score === 'number' ? score.toFixed(1) : '—'
  return (
    <div
      className={`${sizes[size]} ${colorFor(score || 0)} rounded-full flex items-center justify-center text-white font-bold shadow-sm shrink-0`}
    >
      {value}
    </div>
  )
}
