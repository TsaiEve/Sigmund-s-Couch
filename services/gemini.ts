
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    // Switching to gemini-3-flash-preview for much faster analysis
    const model = 'gemini-3-flash-preview';
    const systemInstruction = SYSTEM_INSTRUCTIONS[language];
    
    const parts: any[] = [{ text: prompt }];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.split(',')[1]
        }
      });
    }

    const response = await this.ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text;
  }

  async generateSpeech(text: string, language: 'zh' | 'en') {
    // Using gemini-2.5-flash-preview-tts for high quality voice
    // Selection of voice based on language
    const voiceName = language === 'zh' ? 'Kore' : 'Puck'; 
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this with a calm, professional, and slightly academic tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio;
    } catch (error) {
      console.error("Speech generation failed", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
