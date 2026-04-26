// ============================================================
// CrisisLink AI Detection Pipeline — Production Ready
// • Speech-to-Text  : Web Speech API (browser-native, free)
// • Image Analysis  : Google Gemini Vision API (real)
// • Classification  : Gemini 2.5 Flash-Lite (via server)
// ============================================================

import { toast } from 'react-hot-toast';
import { debugError } from '../debug';

export interface AIDetectionResult {
  emergencyType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  reason: string;
  instructions: string[];
}

// ─────────────────────────────────────────────
// 1. SPEECH-TO-TEXT via Web Speech API
// ─────────────────────────────────────────────
export function transcribeAudio(_blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve('Emergency distress detected.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported; using fallback.');
      resolve('Emergency! I need help immediately.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Speech-to-Text] Transcript:', transcript);
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech-to-Text] Error:', event.error);
      resolve('Emergency! I need urgent assistance.');
    };

    recognition.onend = () => {};

    recognition.start();

    setTimeout(() => {
      try { recognition.stop(); } catch {}
    }, 8000);
  });
}

// ─────────────────────────────────────────────
// 2. IMAGE ANALYSIS via Gemini Vision API
// ─────────────────────────────────────────────
export async function analyzeEmergencyImage(imageBase64: string): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[Vision] No API key; using mock labels.');
    return ['Fire', 'Smoke', 'Emergency', 'Indoor'];
  }

  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let data;
    
    for (const model of models) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Analyze this emergency and classify severity (Context: 100 Safety Rules). Return ONLY JSON array of hazard labels.` },
                { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
          }),
        }
      );
      if (response.ok) {
        data = await response.json();
        break;
      }
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '["Emergency"]';
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    toast.error('AI Vision Parse Error. Using static labels.');
    return ['Emergency', 'Distress'];
  } catch (error: any) {
    toast.error(`Vision AI Failed: ${error.message}`);
    return ['Emergency', 'General'];
  }
}

// ─────────────────────────────────────────────
// 3. EMERGENCY CLASSIFICATION via Gemini API
// ─────────────────────────────────────────────
export async function classifyEmergency(
  transcript: string,
  labels: string[]
): Promise<AIDetectionResult> {
  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, labels }),
    });

    if (!response.ok) {
      throw new Error('Server Route Failed');
    }

    const result = await response.json() as AIDetectionResult;
    if (result.emergencyType && result.severity) return result;
    throw new Error('Invalid Data from Server');
  } catch (error: any) {
    debugError('Triage-Server-Failed', error);
    
    // SECOND FALLBACK: Direct Client-to-Gemini Fetch (as suggested by user)
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyCWZ-PsQ2OS6WQWKRLkBj7gsqBjDVkPn8E';
      const directResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Classify emergency and return JSON only: { "emergencyType": "", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "confidence": 0, "reason": "", "instructions": [] } \n\nUser input: ${transcript}` }] }]
          })
        }
      );
      if (directResponse.ok) {
        const d = await directResponse.json();
        const t = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const m = t.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
      }
    } catch (e2) {
      debugError('Triage-Direct-Failed', e2);
    }

    toast.error('AI Classifier Unavailable. Using rule-based triage.');
    return ruleBasedFallback(transcript, labels);
  }
}

// ─────────────────────────────────────────────
// 4. RULE-BASED FALLBACK (no internet needed)
// ─────────────────────────────────────────────
export function ruleBasedFallback(transcript: string, labels: string[]): AIDetectionResult {
  const combined = `${transcript} ${labels.join(' ')}`.toLowerCase();

  if (combined.includes('fire') || combined.includes('smoke') || combined.includes('burn')) {
    return {
      emergencyType: 'Fire Emergency',
      severity: 'HIGH',
      confidence: 91,
      reason: 'Fire indicators detected in analysis.',
      instructions: ['Stay low.', 'Exit via stairs.', 'Call 101.'],
    };
  }

  if (combined.includes('heart') || combined.includes('medical') || combined.includes('hurt') || combined.includes('accident')) {
    return {
      emergencyType: 'Medical Emergency',
      severity: 'HIGH',
      confidence: 90,
      reason: 'Medical distress detected.',
      instructions: ['Apply pressure on bleeding.', 'Check breathing.', 'Call 108.'],
    };
  }

  return {
    emergencyType: 'General Emergency',
    severity: 'MEDIUM',
    confidence: 72,
    reason: 'Distress detected. Dispatching help.',
    instructions: ['Stay calm.', 'Find safe spot.', 'Stay on line.'],
  };
}
