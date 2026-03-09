import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

type GenerateImageBody = {
  prompt?: string
  size?: '1024x1024' | '1024x1536' | '1536x1024'
  quality?: 'low' | 'medium' | 'high'
  model?: string
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = (await req.json()) as GenerateImageBody
    const prompt = (body.prompt || '').trim()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'prompt is required' },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'prompt is too long (max 2000 chars)' },
        { status: 400 }
      )
    }

    const client = new OpenAI({ apiKey })
    const model = body.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
    const size = body.size || '1024x1024'
    const quality = body.quality || 'medium'

    const result = await client.images.generate({
      model,
      prompt,
      size,
      quality,
    })

    const image = result.data?.[0]
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image returned by OpenAI' },
        { status: 502 }
      )
    }

    const dataUrl = image.b64_json ? `data:image/png;base64,${image.b64_json}` : null

    return NextResponse.json({
      success: true,
      model,
      image: {
        dataUrl,
        b64_json: image.b64_json || null,
        url: image.url || null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Image generation failed',
      },
      { status: 500 }
    )
  }
}
