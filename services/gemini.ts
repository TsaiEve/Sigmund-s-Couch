
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  /**
   * 根據規範：每次呼叫前才建立 GoogleGenAI 實例。
   * 這樣可以確保抓到環境中最即時的 process.env.API_KEY。
   */
  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    // 建立新實體
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    
    const parts: any[] = [];
    if (prompt && prompt.trim()) {
      parts.push({ text: prompt });
    }
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.split(',')[1]
        }
      });
    }

    if (parts.length === 0) {
      parts.push({ text: "分析師，請引導我開啟一段潛意識的對話。" });
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS[language],
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "潛意識的深度難以言表。";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // 如果發生 404/NotFound，可能是環境尚未同步金鑰
      if (error?.message?.includes('not found') || error?.status === 404) {
        throw new Error("授權連結尚未完成。請點擊頁面上的「初始化診間」按鈕。");
      }
      throw new Error(error?.message || "連線至分析核心失敗。");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
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
      console.warn("TTS 語音生成失敗：", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
