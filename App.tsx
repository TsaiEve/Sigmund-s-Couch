
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { UI_STRINGS } from './constants';
import { geminiService } from './services/gemini';
import ChatBubble from './components/ChatBubble';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const strings = UI_STRINGS[language];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(strings.voiceError);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language === 'zh' ? 'zh-TW' : 'en-US';
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !previewImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      imageData: previewImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPreviewImage(null);
    setIsAnalyzing(true);

    try {
      const analysis = await geminiService.analyze(input, language, userMessage.imageData);
      
      // Generate audio for the response
      const audioData = await geminiService.generateSpeech(analysis, language);

      const analystMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'analyst',
        content: analysis,
        timestamp: new Date(),
        audioData: audioData || undefined
      };

      setMessages(prev => [...prev, analystMessage]);
    } catch (error) {
      console.error("Conversation failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-2xl overflow-hidden border-x border-sky-100">
      {/* Header */}
      <header className="px-6 py-5 border-b border-sky-100 flex items-center justify-between bg-white/90 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200 rotate-3 transform transition-transform hover:rotate-0 cursor-default">
            <i className="fa-solid fa-couch text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight serif-font">{strings.title}</h1>
            <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-widest">{strings.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={toggleLanguage}
          className="text-xs font-bold px-5 py-2.5 border-2 border-sky-100 text-sky-600 rounded-full hover:bg-sky-50 hover:border-sky-200 transition-all active:scale-95"
        >
          {strings.switchLang}
        </button>
      </header>

      {/* Messages Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-4 bg-gradient-to-b from-sky-50/20 to-white"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 animate-fade-in">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-6">
               <i className="fa-solid fa-feather-pointed text-sky-400 text-4xl"></i>
            </div>
            <p className="max-w-xs serif-font text-lg italic text-slate-600">{strings.empty}</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} language={language} />
        ))}
        {isAnalyzing && (
          <div className="flex items-center space-x-3 text-sky-400 italic text-sm py-4 ml-2">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="font-medium tracking-wide">{strings.analyzing}</span>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-6 border-t border-sky-50 bg-white shadow-[0_-4px_20px_-10px_rgba(14,165,233,0.1)]">
        {previewImage && (
          <div className="mb-4 relative inline-block group">
            <img src={previewImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-sky-200 shadow-md transition-transform group-hover:scale-105" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2 bg-slate-50 p-2 rounded-3xl border border-slate-100 focus-within:border-sky-200 focus-within:bg-white transition-all shadow-inner">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          
          <div className="flex space-x-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-2xl transition-all active:scale-90"
              title={strings.image}
            >
              <i className="fa-solid fa-image text-xl"></i>
            </button>

            <button 
              onClick={toggleRecording}
              className={`p-3.5 rounded-2xl transition-all active:scale-90 ${
                isRecording 
                ? 'text-red-500 bg-red-50 animate-pulse' 
                : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50'
              }`}
              title={strings.voiceInput}
            >
              <i className={`fa-solid ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'} text-xl`}></i>
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isRecording ? strings.listening : strings.placeholder}
              rows={1}
              className={`w-full resize-none bg-transparent border-none rounded-2xl py-3 px-2 focus:ring-0 text-slate-700 text-base outline-none transition-all ${isRecording ? 'placeholder:text-sky-400 italic' : ''}`}
              style={{ minHeight: '44px', maxHeight: '150px' }}
            />
          </div>

          <button 
            onClick={handleSendMessage}
            disabled={(!input.trim() && !previewImage) || isAnalyzing}
            className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
              (!input.trim() && !previewImage) || isAnalyzing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-sky-500 text-white shadow-xl shadow-sky-200 hover:bg-sky-600 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[11px] text-center text-slate-300 mt-4 uppercase tracking-[0.2em] font-bold opacity-80">
          The interpretation of the unconscious is the royal road to a knowledge of the mind
        </p>
      </footer>
    </div>
  );
};

export default App;
