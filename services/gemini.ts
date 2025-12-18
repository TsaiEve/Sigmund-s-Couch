
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  /**
   * 獲取 GoogleGenAI 實例。
   * 這裡會嚴格檢查 Vercel 注入的環境變數。
   */
  private getAI() {
    // 獲取 Vercel 部署時設定的環境變數
    const apiKey = process.env.API_KEY;

    // 檢查 1: 是否根本沒有設定環境變數
    if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
      throw new Error(
        "【環境變數缺失】請到 Vercel 控制台 -> Settings -> Environment Variables 設定名為 API_KEY 的變數，並務必執行一次 Redeploy。"
      );
    }

    // 檢查 2: 格式初步校驗 (Gemini Key 通常以 AIza 開頭)
    if (!apiKey.startsWith("AIza")) {
      throw new Error("【API Key 格式錯誤】您的 API_KEY 看起來不正確，請從 Google AI Studio 重新複製。");
    }

    // 嚴格遵守：使用具名參數初始化
    return new GoogleGenAI({ apiKey: apiKey });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    let ai;
    try {
      ai = this.getAI();
    } catch (configError: any) {
      // 捕獲並拋出環境配置錯誤
      throw configError;
    }

    // 使用 Gemini 3 Pro 提供深度的精神分析邏輯
    const model = 'gemini-3-pro-preview';
    const systemInstruction = SYSTEM_INSTRUCTIONS[language];
    
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
          systemInstruction,
          temperature: 0.8,
          // 為複雜的佛洛依德理論分析保留思考空間
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "潛意識的深度難以言表，請嘗試換個方式分享。";
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      
      // 處理 API 端的報錯
      if (error?.message?.includes('API key not found')) {
        throw new Error("API Key 未在請求中正確傳遞，請檢查 Vercel 設定。");
      }
      if (error?.status === 403 || error?.message?.includes('403')) {
        throw new Error("API Key 已失效或被 Google 停用 (403 Forbidden)。");
      }
      if (error?.message?.includes('model not found')) {
        throw new Error("目前選用的模型 (Gemini 3 Pro) 在您的區域可能尚未開放。");
      }
      
      throw new Error(error?.message || "無法連線至分析核心，請稍後再試。");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    try {
      const ai = this.getAI();
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
      console.warn("TTS 語音生成失敗，這不影響文字對話。", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
