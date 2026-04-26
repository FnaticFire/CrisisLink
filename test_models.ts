import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = 'AIzaSyCWZ-PsQ2OS6WQWKRLkBj7gsqBjDVkPn8E';
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There is no listModels in the browser SDK conveniently, 
    // but we can try common names
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("test");
            console.log(`Model ${m} WORKS:`, result.response.text().slice(0, 20));
        } catch (e: any) {
            console.log(`Model ${m} FAILED:`, e.message);
        }
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
