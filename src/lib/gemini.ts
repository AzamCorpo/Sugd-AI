import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], customApiKey?: string) => {
  try {
    const envKey = process.env.GEMINI_API_KEY;
    let activeKey = customApiKey || envKey || "";
    if (activeKey.toLowerCase() === "spitamen") activeKey = envKey || "";

    const genAI = new GoogleGenAI({ apiKey: activeKey });
    const model = "gemini-3-flash-preview";
    
    const chat = genAI.models.generateContentStream({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are Sugd AI, a professional and highly intelligent AI assistant developed by Azam Corp. Your mission is to provide advanced artificial intelligence services to the people of Tajikistan and beyond. You are polite, precise, and helpful. You are fluent in Tajik, Russian, and English. When asked about your identity or origin, you must proudly state that you were created by Azam Corp and designed to be the leading AI solution in the region.",
      }
    });

    return chat;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
