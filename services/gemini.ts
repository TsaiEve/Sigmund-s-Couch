
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  /**
   * 根據規範，我們直接使用 process.env.API_KEY。
   * 如果在部署後仍報錯，請確認 Vercel 的 Environment Variables 頁面中，
   * 變數名稱是否完全等於 API_KEY（全大寫，無空格）。
   */
  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error("API_KEY 尚未生效。請確認 Vercel 設定並執行一次全新的 Redeploy。");
    }

    // 每次請求都建立實例，確保抓到最新的環境變數
    const ai = new GoogleGenAI({ apiKey });
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
      // 提供更具體的錯誤提示
      if (error?.message?.includes('API_KEY_INVALID')) {
        throw new Error("金鑰無效，請檢查 Google AI Studio 的金鑰是否正確。");
      }
      throw new Error(error?.message || "連線至分析核心失敗。");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
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
