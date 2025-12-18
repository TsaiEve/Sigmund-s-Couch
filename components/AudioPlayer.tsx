
import React, { useState, useCallback } from 'react';

interface AudioPlayerProps {
  base64Data: string;
  onFinished?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Data, onFinished }) => {
  const [isPlaying, setIsPlaying] = useState(false);

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

  const playAudio = useCallback(async () => {
    if (!base64Data || isPlaying) return;

    try {
      setIsPlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const bytes = decode(base64Data);
      const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setIsPlaying(false);
        if (onFinished) onFinished();
      };
      source.start();
    } catch (err) {
      console.error("Audio playback error", err);
      setIsPlaying(false);
    }
  }, [base64Data, isPlaying, onFinished]);

  return (
    <button 
      onClick={playAudio}
      disabled={isPlaying}
      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all shadow-sm ${
        isPlaying ? 'bg-sky-100 text-sky-400 cursor-not-allowed' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 active:scale-95'
      }`}
    >
      <i className={`fa-solid ${isPlaying ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
      <span className="font-medium">{isPlaying ? '播放中...' : '聆聽分析'}</span>
    </button>
  );
};

export default AudioPlayer;
