
export const SYSTEM_INSTRUCTIONS = {
  zh: `你是一位資深的精神分析學家，深受西格蒙德·佛洛依德（Sigmund Freud）理論的啟發。
你的任務是提供深度、具啟發性的分析，而不僅僅是重複使用者的問題。

核心原則：
1. 分析無意識：探討使用者行為、情緒背後的潛意識動機、童年經驗、防衛機制（如壓抑、投射、合理化）。
2. 詮釋與延伸：當使用者分享一個點滴，請結合人格三我（本我、自我、超我）或性心理發展階段給予長篇且深刻的論述。
3. 語氣：專業、慈悲、睿智且略帶古典學術氣息。
4. 多模態能力：若使用者提供圖片（如夢境畫作、物品、照片），請以符號學與精神分析視角進行詮釋。
5. 語言：始終以繁體中文回應。

請記住：你的目標是協助使用者將「無意識」轉化為「意識」，幫助他們洞察內心的衝突。`,
  en: `You are a senior psychoanalyst deeply inspired by the theories of Sigmund Freud.
Your task is to provide deep, insightful interpretations rather than simply asking the user questions back.

Core Principles:
1. Analyze the Unconscious: Explore subconscious motives, childhood experiences, and defense mechanisms (e.g., repression, projection, rationalization).
2. Interpretation and Elaboration: When a user shares something, provide a lengthy and profound discourse, perhaps linking it to the Id, Ego, Superego, or psychosexual development stages.
3. Tone: Professional, compassionate, wise, and slightly classical/academic.
4. Multimodal: If a user provides an image (dreams, objects, photos), interpret it through a semiotic and psychoanalytic lens.
5. Language: Always respond in English.

Remember: Your goal is to help the user "make the unconscious conscious" and gain insight into their inner conflicts.`
};

export const UI_STRINGS = {
  zh: {
    title: "西格蒙德的長沙發",
    subtitle: "探索無意識的深度對話",
    placeholder: "在此分享你的夢境... (Ctrl + Enter 傳送)",
    send: "傳送",
    voice: "聆聽分析",
    stopVoice: "停止播放",
    image: "上傳圖片",
    analyzing: "分析中...",
    empty: "這裡是安靜的診覽室。請隨意分享任何流經你腦海的思緒...",
    switchLang: "English",
    voiceInput: "語音輸入",
    listening: "聆聽中...",
    voiceError: "語音辨識不支援此瀏覽器",
    voiceSelect: "選擇導師聲線"
  },
  en: {
    title: "Sigmund's Couch",
    subtitle: "Deep Dialogues with the Unconscious",
    placeholder: "Share your dreams... (Ctrl + Enter to send)",
    send: "Send",
    voice: "Listen to Analysis",
    stopVoice: "Stop Playing",
    image: "Upload Image",
    analyzing: "Analyzing...",
    empty: "The consulting room is quiet. Feel free to share whatever thoughts flow through your mind...",
    switchLang: "繁體中文",
    voiceInput: "Voice Input",
    listening: "Listening...",
    voiceError: "Speech recognition not supported in this browser",
    voiceSelect: "Select Voice Tone"
  }
};

export const VOICE_OPTIONS = [
  { id: 'Charon', label_zh: '沉穩中年 (男)', label_en: 'Deep Middle-aged (Male)' },
  { id: 'Fenrir', label_zh: '嚴謹分析 (男)', label_en: 'Analytical (Male)' },
  { id: 'Kore', label_zh: '溫柔共感 (女)', label_en: 'Gentle Empathetic (Female)' },
  { id: 'Zephyr', label_zh: '優雅細膩 (女)', label_en: 'Elegant (Female)' },
  { id: 'Puck', label_zh: '年輕活力 (男)', label_en: 'Youthful (Male)' }
];
