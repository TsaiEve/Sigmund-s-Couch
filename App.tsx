
import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { UI_STRINGS, VOICE_OPTIONS } from './constants';
import { geminiService } from './services/gemini';
import ChatBubble from './components/ChatBubble';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const strings = UI_STRINGS[language];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (event: any) => {
        setInput(prev => prev + event.results[0][0].transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isAnalyzing]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !previewImage) || isAnalyzing) return;

    const currentInput = input;
    const currentImg = previewImage;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: currentInput || (currentImg ? "[圖片訊息]" : ""),
      timestamp: new Date(),
      imageData: currentImg || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPreviewImage(null);
    setIsAnalyzing(true);

    try {
      const resultText = await geminiService.analyze(currentInput, language, currentImg || undefined);
      
      const analystMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'analyst',
        content: resultText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, analystMessage]);
      setIsAnalyzing(false);

      geminiService.generateSpeech(resultText, language, selectedVoice).then(audioData => {
        if (audioData) {
          setMessages(prev => prev.map(m => 
            m.id === analystMessage.id ? { ...m, audioData } : m
          ));
        }
      });

    } catch (error: any) {
      console.error("Analysis Error:", error);
      setIsAnalyzing(false);
      
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'analyst',
        content: `分析過程中斷：${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-white shadow-2xl overflow-hidden md:border-x border-sky-100">
      <header className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-couch"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-800 serif-font leading-tight">{strings.title}</h1>
            <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">{strings.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setShowVoiceSelect(!showVoiceSelect)}
              className="flex items-center space-x-2 text-[11px] font-bold px-3 py-2 bg-sky-50 text-sky-600 rounded-full border border-sky-100 transition-colors hover:bg-sky-100"
            >
              <i className="fa-solid fa-microphone-lines text-[10px]"></i>
              <span>{VOICE_OPTIONS.find(v => v.id === selectedVoice)?.[`label_${language}`]}</span>
            </button>
            {showVoiceSelect && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-sky-50 overflow-hidden z-50 animate-fade-in">
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => { setSelectedVoice(voice.id); setShowVoiceSelect(false); }}
                    className="w-full text-left px-4 py-3 text-xs hover:bg-sky-50 transition-colors border-b border-sky-50 last:border-0"
                  >
                    {voice[`label_${language}`]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
            className="text-[11px] font-bold px-3 py-2 border border-sky-100 text-sky-600 rounded-full hover:bg-sky-50 transition-all"
          >
            {strings.switchLang}
          </button>
        </div>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/20"
        onClick={() => setShowVoiceSelect(false)}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
            <i className="fa-solid fa-feather-pointed text-4xl text-sky-300 mb-4 animate-bounce"></i>
            <p className="max-w-xs serif-font text-lg italic">{strings.empty}</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} language={language} />
        ))}
        {isAnalyzing && (
          <div className="flex items-center space-x-3 text-sky-500 text-xs font-bold ml-2 animate-pulse">
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
              <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
              <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
            </div>
            <span className="tracking-widest uppercase">{strings.analyzing}</span>
          </div>
        )}
      </main>

      <footer className="p-4 md:p-6 border-t border-sky-50 bg-white">
        {previewImage && (
          <div className="mb-4 relative inline-block animate-fade-in">
            <img src={previewImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-sky-100 shadow-md" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-lg border-2 border-white hover:bg-rose-600 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2 bg-slate-100/60 p-2 rounded-2xl border border-slate-200/50 focus-within:bg-white focus-within:border-sky-300 focus-within:shadow-lg focus-within:shadow-sky-50 transition-all">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onloadend = () => setPreviewImage(reader.result as string);
               reader.readAsDataURL(file);
             }
          }} />
          
          <div className="flex mb-1">
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 text-slate-400 hover:text-sky-500 transition-colors flex items-center justify-center rounded-xl hover:bg-sky-50" title={strings.image}><i className="fa-solid fa-camera"></i></button>
            <button onClick={() => {
              if (recognitionRef.current) {
                if (isRecording) recognitionRef.current.stop();
                else { recognitionRef.current.lang = language === 'zh' ? 'zh-TW' : 'en-US'; recognitionRef.current.start(); setIsRecording(true); }
              }
            }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isRecording ? 'text-rose-500 bg-rose-50 animate-pulse' : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50'}`} title={strings.voiceInput}><i className="fa-solid fa-microphone"></i></button>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={strings.placeholder}
            rows={1}
            className="flex-1 bg-transparent border-none py-2.5 px-2 focus:ring-0 text-sm md:text-base outline-none resize-none placeholder:text-slate-400"
            style={{ maxHeight: '150px' }}
          />

          <button 
            onClick={handleSendMessage}
            disabled={(!input.trim() && !previewImage) || isAnalyzing}
            className={`mb-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${(!input.trim() && !previewImage) || isAnalyzing ? 'bg-slate-200 text-slate-400' : 'bg-sky-500 text-white shadow-lg hover:bg-sky-600 hover:-translate-y-0.5'}`}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-300 mt-5 font-bold tracking-[0.3em] opacity-60">"THE UNEXAMINED LIFE IS NOT WORTH LIVING"</p>
      </footer>
    </div>
  );
};

export default App;
