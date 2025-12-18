
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  private ai: any;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key is missing. Please check your environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
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

    try {
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
    } catch (error) {
      console.error("Gemini Analysis failed:", error);
      throw error;
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    let personaPrompt = "";
    
    if (language === 'zh') {
      const malePersona = "穩重、睿智、帶有親切台灣口音的中年男性心理分析師";
      const femalePersona = "溫柔、專業、富有同理心的女性心理分析師";
      const isMale = ['Charon', 'Fenrir', 'Puck'].includes(voiceName);
      const persona = isMale ? malePersona : femalePersona;
      personaPrompt = `請用一位「${persona}」的語氣，低沈、咬字清晰且溫和地朗讀這段話：${text}`;
    } else {
      personaPrompt = `Read this as a wise psychoanalyst with a calm and professional voice: ${text}`;
    }
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: personaPrompt }] }],
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
      console.error("Speech generation failed:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
