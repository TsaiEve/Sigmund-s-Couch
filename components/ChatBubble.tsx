
import React from 'react';
import { Message } from '../types';
import AudioPlayer from './AudioPlayer';

interface ChatBubbleProps {
  message: Message;
  language: 'zh' | 'en';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, language }) => {
  const isAnalyst = message.role === 'analyst';

  return (
    <div className={`flex w-full mb-10 animate-fade-in ${isAnalyst ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[92%] md:max-w-[80%] ${isAnalyst ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white ${
          isAnalyst ? 'bg-sky-400 rotate-2' : 'bg-sky-600 -rotate-2'
        } ${isAnalyst ? 'mr-4' : 'ml-4'}`}>
          <i className={`fa-solid ${isAnalyst ? 'fa-user-tie text-xl' : 'fa-user text-lg'}`}></i>
        </div>
        
        <div className={`flex flex-col ${isAnalyst ? 'items-start' : 'items-end'}`}>
          {/* Content Bubble */}
          <div className={`p-5 rounded-3xl shadow-sm text-[16px] leading-relaxed transition-all hover:shadow-md ${
            isAnalyst 
              ? 'bg-white text-slate-800 border border-sky-100 serif-font rounded-tl-none' 
              : 'bg-sky-500 text-white shadow-sky-100 rounded-tr-none'
          }`}>
            {message.imageData && (
              <div className="relative mb-4 overflow-hidden rounded-xl border border-sky-100/50">
                <img 
                  src={message.imageData} 
                  alt="Attachment" 
                  className="max-w-full h-auto object-cover max-h-80" 
                />
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Footer of bubble */}
          <div className="mt-3 flex items-center space-x-4 px-2">
             <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-70">
               {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isAnalyst && message.audioData && (
               <AudioPlayer base64Data={message.audioData} language={language} />
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
