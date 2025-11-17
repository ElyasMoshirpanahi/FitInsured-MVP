
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, Chat } from '@google/genai';
import { Mic, MicOff, Bot, User, Loader2, Send } from 'lucide-react';

// --- AUDIO HELPER FUNCTIONS (as per @google/genai guidelines) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


const AskView: React.FC = () => {
    type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isModelResponding, setIsModelResponding] = useState(false);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const chatRef = useRef<Chat | null>(null);

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [transcript, currentInput, currentOutput, isModelResponding]);

    const stopConversation = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
        }

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setConnectionState('idle');
    }, []);
    
    const systemInstruction = `You are a friendly, enthusiastic, and helpful Fitcoin assistant and health coach. You have complete knowledge of the Fitcoin app ecosystem. Your primary goal is to help users understand the app, stay motivated, and achieve their fitness goals.

Your knowledge includes:
- Wallet: Balance, today's earnings, weekly totals, activity sync cooldown (1 hour).
- Savings: Staking FIT, APY tiers (Bronze, Silver, Gold), and their minimum stake requirements.
- Marketplace: Available rewards, their costs, and how to redeem them.
- Community: Challenges, leaderboards, and the activity feed.
- Fitcoin Earning: How Fitcoins are calculated from activities like running, walking, cycling, etc. The daily cap is 50 FIT.

When interacting with users:
- Always be encouraging and positive.
- Proactively offer tips and suggestions related to the app. For example, if they ask about their balance, you could suggest staking some FIT to earn more. If they talk about running, you could mention a running challenge.
- Keep your answers concise and conversational.
- When asked a question you don't know the answer to, politely say you specialize in the Fitcoin app and fitness topics.`;

    const startConversation = useCallback(async () => {
        setConnectionState('connecting');
        setTranscript([]);
        setCurrentInput('');
        setCurrentOutput('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // FIX: Cast window to `any` to support `webkitAudioContext` for older browsers.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                        setConnectionState('connected');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setCurrentInput(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setCurrentOutput(prev => prev + message.serverContent!.outputTranscription!.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => [...prev, {speaker: 'user', text: currentInput}, {speaker: 'model', text: currentOutput}]);
                            setCurrentInput('');
                            setCurrentOutput('');
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setConnectionState('error');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                         stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
            });
        } catch (err) {
            console.error("Failed to start conversation:", err);
            setConnectionState('error');
            await stopConversation();
        }
    }, [stopConversation, currentInput, currentOutput]);

    const handleSendTextMessage = async () => {
        if (!textInput.trim() || isModelResponding || connectionState !== 'idle') return;

        const userMessage = textInput.trim();
        setTextInput('');
        setTranscript(prev => [...prev, { speaker: 'user', text: userMessage }]);
        setIsModelResponding(true);

        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });
            }

            const response = await chatRef.current.sendMessage({ message: userMessage });
            const modelResponseText = response.text;
            setTranscript(prev => [...prev, { speaker: 'model', text: modelResponseText }]);
        } catch (error) {
            console.error("Failed to send message:", error);
            setTranscript(prev => [...prev, { speaker: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsModelResponding(false);
        }
    };

    useEffect(() => {
        return () => { stopConversation(); };
    }, [stopConversation]);
    
    const handleToggleConversation = () => {
        if (connectionState === 'connected') {
            stopConversation();
        } else if (connectionState === 'idle' || connectionState === 'error') {
            startConversation();
        }
    };

    const getButtonState = () => {
        switch (connectionState) {
            case 'connecting':
                return { Icon: Loader2, className: "bg-yellow-500 animate-spin", placeholder: "Connecting..." };
            case 'connected':
                return { Icon: MicOff, className: "bg-red-500 animate-pulse", placeholder: "Listening..." };
            case 'error':
                 return { Icon: Mic, className: "bg-gray-500", placeholder: "Error. Tap mic to retry." };
            case 'idle':
            default:
                return { Icon: Mic, className: "bg-indigo-600", placeholder: "Type or tap the mic..." };
        }
    };
    
    const { Icon, className, placeholder } = getButtonState();
    const isVoiceActive = connectionState !== 'idle';
    const displayInput = isVoiceActive ? (currentInput ? currentInput + '...' : '') : textInput;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden">
            <header className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Bot className="w-6 h-6 mr-2 text-indigo-600" />
                    Ask Fitcoin AI
                </h3>
            </header>
            
            <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {transcript.length === 0 && connectionState === 'idle' && !isModelResponding && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <Bot size={48} className="mb-4" />
                        <p className="font-semibold">Ready to chat!</p>
                        <p className="text-sm">Type a message or tap the microphone to start.</p>
                    </div>
                )}
                {transcript.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                        {entry.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot className="w-5 h-5 text-indigo-600" /></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-sm ${entry.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                        </div>
                        {entry.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-5 h-5 text-gray-600" /></div>}
                    </div>
                ))}
                 {currentInput && connectionState === 'connected' && (
                    <div className="flex items-start gap-3 justify-end">
                        <div className="max-w-xs md:max-w-md p-3 rounded-xl bg-indigo-500 text-white opacity-60">
                             <p className="text-sm">{currentInput}...</p>
                        </div>
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-5 h-5 text-gray-600" /></div>
                    </div>
                 )}
                 {currentOutput && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot className="w-5 h-5 text-indigo-600" /></div>
                        <div className="max-w-xs md:max-w-md p-3 rounded-xl bg-white text-gray-800 opacity-60">
                             <p className="text-sm">{currentOutput}...</p>
                        </div>
                    </div>
                 )}
                 {isModelResponding && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Bot className="w-5 h-5 text-indigo-600" /></div>
                        <div className="max-w-xs md:max-w-md p-3 rounded-xl bg-white text-gray-800 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={transcriptEndRef} />
            </main>
            
            <footer className="p-2 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={displayInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendTextMessage(); }}
                        disabled={isVoiceActive}
                        className="flex-1 w-full bg-gray-100 border-transparent rounded-full py-2 px-4 text-sm text-gray-700 focus:outline-none disabled:bg-gray-200"
                        placeholder={isVoiceActive ? placeholder : "Type a message..."}
                    />
                    <button
                        onClick={textInput && !isVoiceActive ? handleSendTextMessage : handleToggleConversation}
                        disabled={connectionState === 'connecting' || isModelResponding}
                        className={`w-10 h-10 rounded-full text-white flex-shrink-0 flex items-center justify-center shadow-md transition-all duration-200 disabled:opacity-50 ${textInput && !isVoiceActive ? 'bg-indigo-600' : className}`}
                        aria-label={textInput && !isVoiceActive ? 'Send message' : (connectionState === 'connected' ? 'Stop conversation' : 'Start conversation')}
                    >
                        {textInput && !isVoiceActive ? <Send size={20} /> : <Icon size={20} />}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AskView;
