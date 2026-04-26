// Next.js API Route: /api/classify
// Calls Gemini 2.5 Flash-Lite (via SDK) server-side for emergency classification

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { transcript, labels } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    // Attempt with 2.5 first
    try {
      await model.generateContent("test");
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `Classify this emergency and return JSON only:
{
  "emergencyType": "string",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": number,
  "reason": "string",
  "instructions": ["string", "string", "string"]
}

User input: "${transcript}"
Context Labels: ${labels.join(', ')}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    // Extract JSON in case there's extra text
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Could not parse JSON', raw: content }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
