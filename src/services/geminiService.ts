import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined") {
      throw new Error(
        "Invalid or missing Gemini API Key. AI Studio expects GEMINI_API_KEY. For external platforms like Cloudflare Pages, please ensure GEMINI_API_KEY or VITE_GEMINI_API_KEY is set in your build environment variables."
      );
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface StoryboardBeat {
  sceneNumber: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
}

export async function parseScript(script: string): Promise<StoryboardBeat[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `Analyze the following movie script and break it down into a sequence of exactly 4-8 key storyboard beats. 
        For each beat, provide:
        1. A brief scene title.
        2. A concise description of the action.
        3. A highly descriptive visual prompt for an image generator (describe composition, lighting, camera angle, and key visual elements like a cinematographer would).
        
        Script:
        ${script}` }]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: ["sceneNumber", "title", "description", "visualPrompt"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse script:", error);
    throw new Error("Failed to process the script into storyboard beats.");
  }
}

export async function generateBeatImage(visualPrompt: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Professional cinematic storyboard panel, hand-drawn charcoal and pencil style, high contrast, cinematic lighting, ${visualPrompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate image.");
}
