// Next.js API Route: /api/classify
// Calls xAI Grok server-side for emergency classification

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { transcript, labels } = await request.json();

  const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'xAI API key not configured' }, { status: 500 });
  }

  const prompt = `You are CrisisLink's emergency triage AI. Analyze this distress call and scene.

VOICE TRANSCRIPT: "${transcript}"
IMAGE SCENE LABELS: ${(labels as string[]).join(', ')}

Respond ONLY with a valid JSON object:
{
  "emergencyType": "string",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": number,
  "reason": "string",
  "instructions": ["string", "string", "string"]
}

Be decisive. Prioritize life safety. Return ONLY JSON.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: response.status });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const match = content.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
