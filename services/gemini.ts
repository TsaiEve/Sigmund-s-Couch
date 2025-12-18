
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    const ai = this.getAI();
    const model = 'gemini-3-flash-preview';
    const systemInstruction = SYSTEM_INSTRUCTIONS[language];
    
    const parts: any[] = [{ text: prompt || (imageData ? "請分析這張圖片反映的潛意識象徵。" : "...") }];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.split(',')[1]
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: parts.length > 0 ? parts : [{ text: "Hello" }] },
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });
      return response.text || "抱歉，分析過程中出現了無意識的阻抗，請再試一次。";
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      throw new Error(error?.message || "無法連線至分析核心");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    const ai = this.getAI();
    let personaPrompt = "";
    
    if (language === 'zh') {
      const isMale = ['Charon', 'Fenrir', 'Puck'].includes(voiceName);
      const persona = isMale ? "穩重、睿智、中年台灣男性心理分析師" : "溫柔、專業、細膩的女性心理分析師";
      personaPrompt = `請用一位「${persona}」的語氣，低沈溫和地朗讀：${text}`;
    } else {
      personaPrompt = `Wise psychoanalyst voice: ${text}`;
    }
    
    try {
      const response = await ai.models.generateContent({
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

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
      console.error("Speech generation failed:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
