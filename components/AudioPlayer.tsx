
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UI_STRINGS } from '../constants';

interface AudioPlayerProps {
  base64Data: string;
  language: 'zh' | 'en';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Data, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const strings = UI_STRINGS[language];

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const playAudio = useCallback(async () => {
    if (!base64Data) return;
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsPlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;
      
      const bytes = decode(base64Data);
      const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      sourceRef.current = source;
      
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      source.start();
    } catch (err) {
      console.error("Audio playback error", err);
      setIsPlaying(false);
    }
  }, [base64Data, isPlaying, stopAudio]);

  return (
    <button 
      onClick={playAudio}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${
        isPlaying 
          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
          : 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100'
      } active:scale-95`}
    >
      <div className="flex items-center justify-center w-3 h-3">
        {isPlaying ? (
          <i className="fa-solid fa-square text-[10px] animate-pulse"></i>
        ) : (
          <i className="fa-solid fa-play text-[10px] ml-0.5"></i>
        )}
      </div>
      <span>{isPlaying ? strings.stopVoice : strings.voice}</span>
    </button>
  );
};

export default AudioPlayer;
