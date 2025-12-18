
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  // 依照開發規範，直接使用 process.env.API_KEY 進行初始化。
  // 這樣做可以確保 Vercel 或其他建置環境能正確識別並替換該字串。
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    const ai = this.getAI();
    // 心理分析屬於複雜推理任務，升級至 Pro 模型以提供更深度的見解。
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
      parts.push({ text: "請以分析師的身份向我打招呼，開啟一段對話。" });
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });
      return response.text || "潛意識的深度難以言表，請嘗試換個方式分享。";
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      // 如果 API Key 真的沒抓到，SDK 會報錯，我們在這裡捕捉。
      if (error?.message?.includes('API key')) {
        throw new Error("API Key 設定異常。請確認 Vercel 環境變數名稱為 API_KEY，且您在變更後已執行「Redeploy」。");
      }
      throw new Error(error?.message || "無法連線至分析核心，請稍後再試。");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    try {
      const ai = this.getAI();
      let personaPrompt = "";
      
      if (language === 'zh') {
        const isMale = ['Charon', 'Fenrir', 'Puck'].includes(voiceName);
        const persona = isMale ? "穩重、睿智的中年台灣男性心理分析師" : "溫柔、專業、細膩的女性心理分析師";
        personaPrompt = `請用一位「${persona}」的語氣，低沈且溫和地朗讀：${text}`;
      } else {
        personaPrompt = `Professional psychoanalyst voice: ${text}`;
      }
      
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
      console.warn("Speech generation failed.", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
