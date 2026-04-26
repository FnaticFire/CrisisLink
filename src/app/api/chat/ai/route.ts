// Next.js API Route: /api/chat/ai
// Proxies Gemini 2.5 Flash-Lite calls to keep the API Key hidden from the client

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { message, emergencyType } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key not configured on server' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are CrisisLink AI (Gemini 2.5), an emergency safety advisor. 
Emergency: ${emergencyType}. 
User Message: ${message}.
Provide 1-2 sentences of actionable safety advice.`;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text() });
  } catch (error: any) {
    console.error('[/api/chat/ai] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
