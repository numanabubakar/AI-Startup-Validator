'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

interface ScoreRingProps {
  score: number
  label: string
  size?: number
}

function getScoreColor(score: number) {
  // Use hex colors for better compatibility with PDF capture
  if (score >= 75) return '#01796F' // Green/Primary
  if (score >= 50) return '#eab308' // Gold/Accent
  return '#ef4444' // Red/Destructive
}

export function ScoreRing({ score, label, size = 120 }: ScoreRingProps) {
  const color = getScoreColor(score)
  const data = [{ value: score, fill: color }]

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#f3f4f6' }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
