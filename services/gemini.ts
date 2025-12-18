
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  /**
   * 獲取 GoogleGenAI 實例。
   * 這裡會嚴格檢查 Vercel 注入的環境變數。
   */
  private getAI() {
    // 優先嘗試讀取 process.env.API_KEY
    // 在 Vercel 的 Build step 中，這會被替換為實際的字串
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
      // 如果這行報錯，100% 是因為沒有 Redeploy，或者變數名稱打錯
      throw new Error(
        "【找不到金鑰】Vercel 尚未將 API_KEY 注入。請在 Environment Variables 存檔後，回到 Deployments 分頁點擊 'Redeploy'。"
      );
    }

    if (!apiKey.startsWith("AIza")) {
      throw new Error("【金鑰格式異常】抓到的 API_KEY 不是以 AIza 開頭，請確認 Vercel 後台設定是否正確。");
    }

    // 嚴格遵守：使用具名參數初始化
    return new GoogleGenAI({ apiKey: apiKey });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    let ai;
    try {
      ai = this.getAI();
    } catch (configError: any) {
      throw configError;
    }

    // 使用最強的 Gemini 3 Pro 進行心理分析
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
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "潛意識的深度難以言表，請嘗試換個方式分享。";
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      
      if (error?.message?.includes('API key not found') || error?.status === 403) {
        throw new Error("Google 拒絕了此金鑰。請確認您的 Google AI Studio 金鑰是否仍有效，或是否有帳單問題。");
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
      console.warn("TTS 語音生成失敗。", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
