import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The API key is provided by the platform via NEXT_PUBLIC_GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function improveText(text: string): Promise<string> {
  if (!text.trim()) return text;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Improve the following text. Fix grammar, make it clear and concise. Return ONLY the improved text, without any conversational filler or quotes around it.\n\nText:\n${text}`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Error improving text:", error);
    return text; // Fallback to original text on error
  }
}

export async function brainstormIdeas(contextNotes: string[]): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following notes, brainstorm 3 new, related ideas or tasks. Keep them short (1-2 sentences each).\n\nExisting Notes:\n${contextNotes.join('\n')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A short brainstormed idea.",
          },
        },
      },
    });
    
    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
    return [];
  } catch (error) {
    console.error("Error brainstorming ideas:", error);
    return [];
  }
}
