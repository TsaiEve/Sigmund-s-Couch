
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

export class GeminiService {
  private getApiKey(): string {
    // 安全地存取 process.env，避免在瀏覽器中報錯
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
      }
    } catch (e) {
      console.warn("Process env is not accessible.");
    }
    return '';
  }

  private getAI() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API Key 尚未設定。請在環境變數中加入 API_KEY。");
    }
    return new GoogleGenAI({ apiKey });
  }

  async analyze(prompt: string, language: 'zh' | 'en', imageData?: string) {
    const ai = this.getAI();
    const model = 'gemini-3-flash-preview';
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

    // 如果完全沒有內容，給予一個預設提示
    if (parts.length === 0) {
      parts.push({ text: "請以分析師的身份與我打聲招呼。" });
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
      return response.text || "潛意識的深度難以言表，請嘗試換個方式分享你的思緒。";
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      throw new Error(error?.message || "無法連線至分析核心，請檢查 API Key 或網路連線。");
    }
  }

  async generateSpeech(text: string, language: 'zh' | 'en', voiceName: string = 'Charon') {
    try {
      const ai = this.getAI();
      let personaPrompt = "";
      
      if (language === 'zh') {
        const isMale = ['Charon', 'Fenrir', 'Puck'].includes(voiceName);
        const persona = isMale ? "穩重、睿智的中年台灣男性心理分析師" : "溫柔、專業、細膩的女性心理分析師";
        personaPrompt = `請用一位「${persona}」的語氣，低沈且溫和地朗讀這段話：${text}`;
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
      console.warn("Speech generation failed, skipping audio.", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
