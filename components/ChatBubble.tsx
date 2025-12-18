
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
    <div className={`flex w-full mb-8 ${isAnalyst ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isAnalyst ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white ${
          isAnalyst ? 'bg-sky-400' : 'bg-sky-600'
        } ${isAnalyst ? 'mr-3' : 'ml-3'}`}>
          <i className={`fa-solid ${isAnalyst ? 'fa-user-tie' : 'fa-user'}`}></i>
        </div>
        
        <div className={`flex flex-col ${isAnalyst ? 'items-start' : 'items-end'}`}>
          <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed transition-all hover:shadow-md ${
            isAnalyst 
              ? 'bg-white text-slate-800 border border-sky-100 serif-font' 
              : 'bg-sky-500 text-white'
          }`}>
            {message.imageData && (
              <div className="relative mb-3 group">
                <img 
                  src={message.imageData} 
                  alt="Uploaded attachment" 
                  className="max-w-xs rounded-xl border border-sky-200/50 shadow-sm" 
                />
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          <div className="mt-2 flex items-center space-x-3 px-1">
             <span className="text-[10px] text-slate-400 font-medium uppercase">
               {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isAnalyst && message.audioData && (
               <AudioPlayer base64Data={message.audioData} />
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
