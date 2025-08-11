interface ScoreDisplayProps {
  score: number
  combo: number
}

export default function ScoreDisplay({ score, combo }: ScoreDisplayProps) {
  return (
    <div className="flex w-full justify-between rounded-lg bg-gray-900 p-3 text-white shadow-lg border border-gray-700 max-w-md mx-auto">
      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-400">Score</h3>
        <p className="text-2xl font-bold">{Math.floor(score).toLocaleString()}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-400">Combo</h3>
        <p
          className={`text-2xl font-bold ${combo > 10 ? "text-yellow-400" : ""} ${combo > 20 ? "text-green-400" : ""}`}
        >
          {combo}x
        </p>
      </div>
    </div>
  )
}

