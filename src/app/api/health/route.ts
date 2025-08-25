import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'API is healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        data: null,
      },
      { status: 500 }
    )
  }
}
