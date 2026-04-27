import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Listen to this 8-second emergency distress audio. 
      Identify the emergency type and severity.
      Output ONLY valid JSON in this format:
      {
        "emergencyType": "FIRE/MEDICAL/POLICE/ACCIDENT/OTHER",
        "severity": "LOW/MEDIUM/HIGH/CRITICAL",
        "confidence": number (0-100),
        "reason": "Why did you choose this?",
        "instructions": ["Step 1", "Step 2", "Step 3"]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: "audio/webm" // MediaRecorder typically outputs webm in browsers
        }
      }
    ]);

    const responseText = result.response.text();
    // Clean JSON response (remove markdown if any)
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Voice Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze voice emergency' }, { status: 500 });
  }
}
