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

export async function summarizeNote(content: string): Promise<string> {
  if (!content.trim()) return '';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following note concisely in 1-2 sentences. Return ONLY the summary.\n\nNote:\n${content}`,
    });
    return response.text?.trim() || '';
  } catch (error) {
    console.error("Error summarizing note:", error);
    return '';
  }
}

export async function convertToTasks(content: string): Promise<{ title: string; status: 'pending' | 'completed'; dueDate?: string }[]> {
  if (!content.trim()) return [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract actionable tasks from the following note. Return a JSON array of objects, each with a 'title' (string), 'status' (either 'pending' or 'completed'), and optionally a 'dueDate' (ISO 8601 string if a date is mentioned).\n\nNote:\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              status: { type: Type.STRING },
              dueDate: { type: Type.STRING }
            },
            required: ["title", "status"]
          }
        }
      }
    });
    
    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
    return [];
  } catch (error) {
    console.error("Error converting to tasks:", error);
    return [];
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

export async function semanticSearch(query: string, notes: { id: string, content: string }[]): Promise<string[]> {
  if (!query.trim() || notes.length === 0) return [];
  
  try {
    const notesJson = JSON.stringify(notes);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a semantic search engine. Find the notes that match the following query semantically. Return ONLY a JSON array of the matching note IDs.\n\nQuery: ${query}\n\nNotes:\n${notesJson}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
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
    console.error("Error performing semantic search:", error);
    return [];
  }
}

export async function getSmartSuggestions(content: string): Promise<string[]> {
  if (!content.trim()) return [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following note and provide 3 smart suggestions or actions the user could take based on the content (e.g., "Schedule a meeting", "Create a task list", "Research topic X"). Keep them short and actionable.\n\nNote:\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
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
    console.error("Error getting smart suggestions:", error);
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) return [];
  
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: [text],
    });
    return result.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

export async function classifyNote(content: string, existingFolders: string[]): Promise<string> {
  if (!content.trim() || existingFolders.length === 0) return '';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Classify the following note into one of the existing folders. Return ONLY the exact folder name from the list. If none fit perfectly, return the best match.\n\nFolders: ${existingFolders.join(', ')}\n\nNote:\n${content}`,
    });
    const suggestedFolder = response.text?.trim() || '';
    if (existingFolders.includes(suggestedFolder)) {
      return suggestedFolder;
    }
    return '';
  } catch (error) {
    console.error("Error classifying note:", error);
    return '';
  }
}
