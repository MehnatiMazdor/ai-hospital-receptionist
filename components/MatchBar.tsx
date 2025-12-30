'use client';

export function MatchBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{score.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
