
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

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
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
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !previewImage) || isAnalyzing) return;

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
      const audioData = await geminiService.generateSpeech(analysis, language, selectedVoice);

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

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white shadow-2xl overflow-hidden md:border-x border-sky-100">
      {/* Header */}
      <header className="px-6 py-5 border-b border-sky-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-xl shadow-sky-100 rotate-2 transform hover:rotate-0 transition-all cursor-pointer">
            <i className="fa-solid fa-couch text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight serif-font leading-none">{strings.title}</h1>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mt-1">{strings.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setShowVoiceSelect(!showVoiceSelect)}
              className="flex items-center space-x-2 text-xs font-bold px-4 py-2.5 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-100 transition-all border border-sky-100 shadow-sm"
            >
              <i className="fa-solid fa-microphone-lines"></i>
              <span>{VOICE_OPTIONS.find(v => v.id === selectedVoice)?.[`label_${language}`]}</span>
              <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${showVoiceSelect ? 'rotate-180' : ''}`}></i>
            </button>
            
            {showVoiceSelect && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-sky-50 overflow-hidden animate-fade-in z-40">
                <div className="px-5 py-3 bg-sky-50/50 text-[10px] font-bold text-sky-400 uppercase tracking-widest border-b border-sky-50">
                  {strings.voiceSelect}
                </div>
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setShowVoiceSelect(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 text-sm transition-colors hover:bg-sky-50 flex items-center justify-between ${selectedVoice === voice.id ? 'text-sky-600 font-bold bg-sky-50/30' : 'text-slate-600'}`}
                  >
                    {voice[`label_${language}`]}
                    {selectedVoice === voice.id && <i className="fa-solid fa-check text-[10px]"></i>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
            className="text-xs font-bold px-4 py-2.5 border-2 border-sky-50 text-sky-600 rounded-full hover:bg-sky-50 hover:border-sky-100 transition-all active:scale-95 shadow-sm"
          >
            {strings.switchLang}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-gradient-to-b from-sky-50/10 to-white"
        onClick={() => setShowVoiceSelect(false)}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32 animate-fade-in">
            <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-8">
               <i className="fa-solid fa-feather-pointed text-sky-400 text-5xl"></i>
            </div>
            <p className="max-w-sm serif-font text-xl italic text-slate-700 leading-relaxed">{strings.empty}</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} language={language} />
        ))}
        {isAnalyzing && (
          <div className="flex items-center space-x-4 text-sky-400 italic text-sm py-6 ml-4">
            <div className="flex space-x-2">
              <div className="w-2.5 h-2.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2.5 h-2.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="font-bold tracking-widest uppercase text-xs">{strings.analyzing}</span>
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="p-6 md:p-8 border-t border-sky-50 bg-white/80 backdrop-blur-sm shadow-[0_-10px_40px_-15px_rgba(14,165,233,0.1)]">
        {previewImage && (
          <div className="mb-6 relative inline-block">
            <img src={previewImage} alt="Preview" className="h-28 w-28 object-cover rounded-2xl border-4 border-white shadow-xl rotate-1" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all border-2 border-white"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-3 bg-slate-100/50 p-2.5 rounded-[2rem] border border-slate-200/60 focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-sky-100/50 transition-all">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          
          <div className="flex space-x-1 pl-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-2xl transition-all active:scale-90 flex items-center justify-center"
              title={strings.image}
            >
              <i className="fa-solid fa-camera text-xl"></i>
            </button>

            <button 
              onClick={toggleRecording}
              className={`w-12 h-12 rounded-2xl transition-all active:scale-90 flex items-center justify-center ${
                isRecording 
                ? 'text-rose-500 bg-rose-50 animate-pulse' 
                : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50'
              }`}
              title={strings.voiceInput}
            >
              <i className={`fa-solid ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'} text-xl`}></i>
            </button>
          </div>
          
          <div className="flex-1 relative pb-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isRecording ? strings.listening : strings.placeholder}
              rows={1}
              className="w-full resize-none bg-transparent border-none rounded-2xl py-3.5 px-3 focus:ring-0 text-slate-700 text-base outline-none transition-all placeholder:text-slate-400"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
          </div>

          <button 
            onClick={handleSendMessage}
            disabled={(!input.trim() && !previewImage) || isAnalyzing}
            className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all ${
              (!input.trim() && !previewImage) || isAnalyzing
                ? 'bg-slate-200 text-slate-400'
                : 'bg-sky-500 text-white shadow-xl shadow-sky-200 hover:bg-sky-600 hover:-translate-y-1'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-6 uppercase tracking-[0.3em] font-bold opacity-60 px-4">
          "The interpretation of dreams is the royal road to a knowledge of the unconscious activities of the mind."
        </p>
      </footer>
    </div>
  );
};

export default App;
