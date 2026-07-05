export default function ScoreSlider({ label, description, value, onChange }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-1">
        <label className="font-semibold text-gray-800">{label}</label>
        <span className="text-lg font-bold text-emerald-700">{value}/10</span>
      </div>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
        <span>1 · very poor</span>
        <span>10 · perfect</span>
      </div>
    </div>
  )
}
