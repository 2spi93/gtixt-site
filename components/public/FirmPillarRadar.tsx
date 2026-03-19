'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

type RadarPoint = {
  metric: string
  value: number
}

export default function FirmPillarRadar({ data }: { data: RadarPoint[] }) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.18)" />
          <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={20} domain={[0, 100]} stroke="#475569" />
          <Radar name="Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
