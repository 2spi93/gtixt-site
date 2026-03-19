import { NextResponse } from 'next/server'

const backgrounds = [
  {
    id: 'salle-de-controle',
    label: 'Salle de controle',
    src: '/galaxy/backgrounds/salle-de-controle.png',
    category: 'background',
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    count: backgrounds.length,
    data: backgrounds,
  })
}