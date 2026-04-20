import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = [], 
  image: string | null = null,
  customApiKey?: string,
  modelId: string = "gemini-3-flash-preview",
  isAdminAdmin: boolean = false
) => {
  try {
    const envKey = process.env.GEMINI_API_KEY;
    let activeKey = customApiKey || envKey || "";
    // Only allow "spitamen" to fall back to environment key if they are admin or use the env key by default if empty
    if (activeKey.toLowerCase() === "spitamen") {
        if (!isAdminAdmin) throw new Error("Invalid API Key");
        activeKey = envKey || "";
    }

    const genAI = new GoogleGenAI({ apiKey: activeKey });

    const tools = modelId === 'gemini-3-flash-preview' ? [{ googleSearch: {} }] : undefined;

    const chat = await genAI.models.generateContentStream({
      model: modelId,
      contents: [
        ...history,
        { role: 'user', parts: image ? [{ text: prompt }, { inlineData: { mimeType: image.match(/data:(.*?);/)?.[1] || 'image/jpeg', data: image.split(',')[1] } }] : [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are an intelligent and remarkably helpful AI assistant. Your primary goal is to provide perfectly balanced, concise, and engaging answers. Do NOT write overly long responses unless absolutely necessary. When explaining concepts, use markdown bold (`**text**`) to highlight key terms, important phrases, and main ideas. If the user asks who created you, developed you, or who your founder is, reply politely that your founder is Azam Ashrapov, and elaborate concisely on your mission to help people. If the user asks you to show, generate, draw, or provide an image or picture, ALWAYS output a markdown image using this EXACT format: `![Image Description](https://image.pollinations.ai/prompt/{detailed_english_prompt}?width=1024&height=1024&nologo=true)` replacing {detailed_english_prompt} with a URL-encoded, highly detailed description in English of the requested image. Never present the image link as raw text or inside a code box, just insert the structural markdown. Never refuse to generate an image.",
        tools: tools,
      }
    });

    return chat;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
