// Next.js API Route: /api/places
// Proxies SerpAPI calls server-side to avoid CORS restrictions

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Forward all query params to SerpAPI
  const serpParams = new URLSearchParams(searchParams);
  
  // Ensure api_key is included (prefer server-side env)
  if (!serpParams.get('api_key')) {
    const key = process.env.NEXT_PUBLIC_SERPAPI_KEY || '6d8c067d5e4922129883526685718a221262d6600c73229b4c09d57a972e2cf6';
    if (!key) {
      return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
    }
    serpParams.set('api_key', key);
  }

  try {
    const serpUrl = `https://serpapi.com/search?${serpParams.toString()}`;
    const response = await fetch(serpUrl, {
      headers: { 'User-Agent': 'CrisisLink/1.0' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[/api/places] SerpAPI error:', response.status, text);
      return NextResponse.json({ error: 'SerpAPI error', detail: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[/api/places] Network error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
