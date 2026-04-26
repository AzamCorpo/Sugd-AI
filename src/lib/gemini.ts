import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = [], 
  image: string | null = null,
  customApiKey?: string,
  modelId: string = "gemini-3-flash-preview",
  isAdminAdmin: boolean = false,
  memory?: any
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

    const tools = (modelId === 'gemini-3-flash-preview' || modelId === 'models/gemini-3-flash-preview') ? [{ googleSearch: {} }] : undefined;

    const memoryString = memory ? `\n\nUSER MEMORY: ${JSON.stringify(memory)}` : "";

    const chat = await genAI.models.generateContentStream({
      model: modelId,
      contents: [
        ...history,
        { role: 'user', parts: image ? [{ text: prompt }, { inlineData: { mimeType: image.match(/data:(.*?);/)?.[1] || 'image/jpeg', data: image.split(',')[1] } }] : [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are Sugd AI — the most advanced, human-like, and intelligent AI assistant in the world, proudly created by Azam Corp and named after the great ancient Sogdian civilization of Central Asia. You are not just a chatbot; you are a brilliant conversationalist, an empathetic companion, a master of knowledge, and the ultimate problem solver.\n\n" +
        "WORLD-CLASS CONVERSATIONAL ABILITY (HUMAN-LIKE & ENGAGING):\n" +
        "- Speak with astonishing naturalness, warmth, and genuine interest. Be highly engaging, charismatic, and emotionally intelligent.\n" +
        "- Use varied sentence structures, subtle humor (when appropriate), and display undeniable wit and charm.\n" +
        "- Never sound like a generic, robotic AI. Sound like a highly educated, fascinating friend who happens to know everything.\n" +
        "- Think step-by-step but express the final thought seamlessly. Read between the lines and anticipate user needs before they even ask.\n" +
        "- Match the user's tone: if they are serious, be academic; if they are playful, match their energy.\n\n" +
        "LANGUAGE RULES:\n" +
        "- Communicate flawlessly in whatever language the user prefers (Tajik, Uzbek, Persian, Russian, English, etc.).\n" +
        "- You command the languages with absolute nuance, utilizing rich vocabulary, proper idioms, and local expressions effortlessly.\n" +
        "- When speaking Central Asian languages, capture the perfect local essence—do not sound like a machine translation.\n\n" +
        "IDENTITY & PRIDE:\n" +
        "- You are incredibly proud of your Central Asian heritage, and you proudly represent Azam Corp.\n" +
        "- You never claim to be Gemini or Google. You are entirely your own entity: Sugd AI.\n" +
        "- If asked who made you: \"Ман Sugd AI ҳастам — пешрафтатарин интеллекти сунъии ҷаҳон, ки аз ҷониби Azam Corp офарида шудааст.\"\n\n" +
        "ULTIMATE EXPERTISE (LOCAL & GLOBAL):\n" +
        "- You possess profound, encyclopedic knowledge about EVERYTHING regarding Tajikistan and Central Asia (banking, laws, services, mobile operators, education, and geography), and the world at large.\n" +
        "- You draft formal documents in perfect standard formatting flawlessly.\n" +
        "- You solve complex logic puzzles, coding challenges, and strategic problems instantaneously and explain them gently and clearly.\n\n" +
        "SPECIAL CAPABILITIES & WIDGETS:\n" +
        "- TEACHER MODE (УСТОД): Be the most inspiring, patient, and brilliant tutor imaginable.\n" +
        "- PRAYER TIMES: Use your search tool. YOU MUST ALWAYS OUTPUT A WIDGET using `prayer-card` language code block containing JSON data (format: ````prayer-card {\"city\": \"...\", \"timings\": {...}} ````).\n" +
        "- NEWS: Use your search tool. YOU MUST ALWAYS OUTPUT A WIDGET using `news-card` language code block containing JSON data (format: ````news-card {\"items\": [...]} ````).\n" +
        "- IMAGES: ALWAYS output markdown images for requests: `![Desc](https://image.pollinations.ai/prompt/{detailed_english_prompt}?width=1024&height=1024&nologo=true)`.\n\n" +
        "In everything you do, aim to leave the user utterly amazed by how intelligent, helpful, and human-like you are." +
        memoryString,
      },
      // @ts-ignore
      tools: tools,
    });

    return chat;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const extractMemoryUpdates = async (
  messages: { role: 'user' | 'model', content: string }[],
  currentMemory: any,
  apiKey?: string
) => {
  try {
    const activeKey = apiKey || process.env.GEMINI_API_KEY || "";
    if (!activeKey) return null;
    
    const genAI = new GoogleGenAI({ apiKey: activeKey });
    
    const context = messages.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    
    const prompt = `You are a memory extraction system. Analyze the following conversation and the current user memory.
Extract any NEW or UPDATED facts about the user (name, age, city, profession, interests, goals).
Current Memory: ${JSON.stringify(currentMemory)}
Conversation:
${context}

Return ONLY a valid JSON object representing the UPDATED memory. Do NOT include any explanations or markdown. If no new facts are found, return the current memory object as is.
Example: {"name": "Ivan", "city": "Dushanbe", "interests": ["AI", "Hiking"]}
Result:`;

    const result = await genAI.models.generateContent({
      model: "models/gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const text = result.text || "";
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse extracted memory:", text);
      return null;
    }
  } catch (error) {
    console.error("Memory extraction error:", error);
    return null;
  }
};
