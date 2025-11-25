import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, Chat } from '@google/genai';
import { Mic, MicOff, Bot, User, Loader2, Send, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';
import type { User as UserType, WalletSummary } from '../types';

interface AskViewProps {
  user?: UserType;
  summary?: WalletSummary | null;
}

// --- AUDIO HELPER FUNCTIONS ---

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

// Enhanced Markdown Renderer
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const renderInline = (content: string) => {
        const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-[#39b5ff]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-gray-800 rounded px-1 py-0.5 text-sm font-mono text-yellow-400">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 ml-2 text-gray-300">{listItems}</ul>);
            listItems = [];
        }
    };

    text.split('\n').forEach((line, index) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = line.trim().substring(2);
            listItems.push(<li key={index}>{renderInline(content)}</li>);
        } else {
            flushList();
            if (line.trim()) {
                elements.push(<p key={index} className="min-h-[1em]">{renderInline(line)}</p>);
            }
        }
    });

    flushList();

    return <div className="space-y-2">{elements}</div>;
};

const suggestedPrompts = [
  { text: "What exactly is Fitcoin?", emoji: "🤔" },
  { text: "How can I earn more FIT?", emoji: "🚀" },
  { text: "Explain the Savings Tiers.", emoji: "📈" },
  { text: "What's the best value in the Marketplace?", emoji: "🛒" },
];

const Headlines: React.FC<{
  prompts: { text: string; emoji: string }[];
  onClick: (prompt: string) => void;
}> = ({ prompts, onClick }) => {
  const allPrompts = [...prompts, ...prompts];

  return (
    <div className="w-full max-w-md bg-[#161b22] border border-gray-800 rounded-full overflow-hidden relative h-12 flex items-center group shadow-lg shadow-[#000]/50">
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#161b22] to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#161b22] to-transparent z-10"></div>
      <div className="flex animate-scroll group-hover:pause">
        {allPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onClick(prompt.text)}
            className="flex-shrink-0 flex items-center mx-4 text-sm text-gray-400 hover:text-[#39b5ff] transition whitespace-nowrap font-medium"
          >
            <span className="mr-2 text-lg">{prompt.emoji}</span>
            {prompt.text}
            <Sparkles className="w-4 h-4 text-[#2e8dee] ml-6 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
};

const SuggestionsTicker: React.FC<{
  prompts: { text: string; emoji: string }[];
  onClick: (prompt: string) => void;
}> = ({ prompts, onClick }) => {
  if (prompts.length === 0) return null;
  
  const allPrompts = [...prompts, ...prompts];

  return (
    <div className="w-full bg-[#161b22] border-t border-gray-800 relative h-10 flex items-center group mb-2">
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#161b22] to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#161b22] to-transparent z-10"></div>
      <div className="flex animate-scroll group-hover:pause">
        {allPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onClick(prompt.text)}
            className="flex-shrink-0 flex items-center mx-3 text-xs text-gray-400 hover:text-white transition whitespace-nowrap"
          >
            <span className="mr-2 text-base">{prompt.emoji}</span>
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
};


const AskView: React.FC<AskViewProps> = ({ user, summary }) => {
    type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
    interface TranscriptItem {
      speaker: 'user' | 'model';
      text: string;
      isError?: boolean;
      onRetry?: () => void;
    }

    const CHAT_HISTORY_STORAGE_KEY = `fitcoin_ask_chat_history_${user?.userId || 'guest'}`;

    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [transcript, setTranscript] = useState<TranscriptItem[]>(() => {
        try {
            const storedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
            if (storedHistory) {
                const parsedHistory = JSON.parse(storedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.every(item => 'speaker' in item && 'text' in item)) {
                    return parsedHistory;
                }
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
            localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
        }
        return [];
    });
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isModelResponding, setIsModelResponding] = useState(false);
    const [contextualSuggestions, setContextualSuggestions] = useState<{ text: string; emoji: string; }[]>([]);

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

    useEffect(scrollToBottom, [transcript]);
    useEffect(() => {
        if(isModelResponding || currentOutput) {
            scrollToBottom();
        }
    }, [isModelResponding, currentOutput]);

    // Save history limited to last 20 messages
    useEffect(() => {
        if (connectionState === 'idle' && !isModelResponding) {
            try {
                const historyToSave = transcript.filter(item => item.text && item.text.trim() !== '' && !item.isError).slice(-20);
                if (historyToSave.length > 0) {
                    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
                } else {
                    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
                }
            } catch (e) {
                console.error("Failed to save chat history", e);
            }
        }
    }, [transcript, connectionState, isModelResponding, CHAT_HISTORY_STORAGE_KEY]);

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your chat history?")) {
            setTranscript([]);
            localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
            setContextualSuggestions([]);
        }
    };

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
    
    // Construct System Instruction with User Context
    const systemInstruction = useMemo(() => {
        let userContext = "";
        if (user && summary) {
            userContext = `\n\nCURRENT USER DATA:\n- Name: ${user.displayName}\n- Fitcoin Balance: ${summary.balance.toFixed(2)}\n- Staked Amount: ${summary.stakedAmount.toFixed(2)}\n- Today's Activities: ${summary.today.activities.length > 0 ? summary.today.activities.map(a => a.title).join(', ') : 'None yet'}\n- Recent Earnings (7 days): ${summary.last7Days.reduce((acc, curr) => acc + curr.fitcoinEarned, 0)} FIT`;
        }

        return `You are a friendly, enthusiastic, and helpful Fitcoin assistant and health coach. You have complete knowledge of the Fitcoin app ecosystem. Your primary goal is to help users understand the app, stay motivated, and achieve their fitness goals.

${userContext}

Your knowledge includes:
- Wallet: Balance, today's earnings, weekly totals, activity sync cooldown (1 hour). The balance can be toggled to show its value in Polygon (MATIC).
- Valuation: **10 Fitcoin (FIT) = 1 Polygon (MATIC)**. The USD value is based on the live market price of MATIC.
- Savings: Staking FIT, APY tiers (Bronze, Silver, Gold), and their minimum stake requirements.
- Marketplace: Available rewards, their costs, and how to redeem them.
- Community: Challenges, leaderboards, and the activity feed.
- Fitcoin Earning: How Fitcoins are calculated from activities like running, walking, cycling, etc. The daily cap is 50 FIT.

When interacting with users:
- Use the provided user data to personalize your responses. For example, if they have run today, congratulate them on that specific activity. If their balance is low, suggest ways to earn more.
- Always be encouraging and positive.
- If the user asks about their Fitcoin balance, you MUST proactively mention its estimated value based on the MATIC conversion and suggest staking as a way to earn more.
- Keep your answers concise and conversational. Use Markdown for lists or emphasis.
- After EVERY response, you MUST generate 2-3 short, relevant follow-up questions based on the current conversation to guide the user. Format these suggestions inside a [SUGGESTIONS] block like this example:
[SUGGESTIONS]
? 🤔 What is staking?
? 🚀 How do I join a challenge?
? 🛒 What can I buy in the Marketplace?
[/SUGGESTIONS]
- The suggestions should be diverse and genuinely helpful for continuing the conversation. Do not add suggestions if the user says goodbye.`;
    }, [user, summary]);

    const startConversation = useCallback(async () => {
        setConnectionState('connecting');
        setTranscript([]);
        setCurrentInput('');
        setCurrentOutput('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const retryVoice = () => {
                setTranscript(t => t.filter(i => !i.isError));
                startConversation();
            };

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
                        setTranscript(prev => [...prev, { speaker: 'model', text: 'A connection error occurred.', isError: true, onRetry: retryVoice }]);
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
    }, [stopConversation, currentInput, currentOutput, systemInstruction]);

    const handleSendTextMessage = async (messageOverride?: string) => {
        const userMessage = messageOverride || textInput.trim();
        if (!userMessage || isModelResponding || connectionState !== 'idle') return;

        if (!messageOverride) {
            setTextInput('');
        }
        setContextualSuggestions([]);
        setTranscript(prev => [...prev, { speaker: 'user', text: userMessage }]);
        setIsModelResponding(true);
        setTranscript(prev => [...prev, { speaker: 'model', text: '' }]); // Placeholder

        const retry = () => {
            setTranscript(prev => prev.slice(0, -2)); // Remove user msg and error msg
            handleSendTextMessage(userMessage);
        };

        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const history = transcript
                    .filter(item => item.text && item.text.trim() !== '' && !item.isError)
                    .map(item => ({
                        role: item.speaker === 'user' ? 'user' : 'model',
                        parts: [{ text: item.text }],
                    }));

                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                    history: history,
                });
            }

            const responseStream = await chatRef.current.sendMessageStream({ message: userMessage });
            
            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                setTranscript(prev => {
                    const newTranscript = [...prev];
                    const lastMsg = newTranscript[newTranscript.length - 1];
                    if (lastMsg && lastMsg.speaker === 'model') {
                        lastMsg.text += chunkText;
                    }
                    return newTranscript;
                });
            }

        } catch (error) {
            console.error("Failed to send message:", error);
            setTranscript(prev => {
                const newTranscript = [...prev];
                const lastMsg = newTranscript[newTranscript.length - 1];
                if (lastMsg && lastMsg.speaker === 'model') {
                    lastMsg.text = "Sorry, I couldn't connect. Please try again.";
                    lastMsg.isError = true;
                    lastMsg.onRetry = retry;
                }
                return newTranscript;
            });
        } finally {
            setIsModelResponding(false);
            setTranscript(prev => {
                const newTranscript = [...prev];
                const lastMessage = newTranscript[newTranscript.length - 1];
                if (!lastMessage || lastMessage.speaker !== 'model' || lastMessage.isError) return prev;

                const suggestionBlockRegex = /\[SUGGESTIONS\]\n?([\s\S]*?)\n?\[\/SUGGESTIONS\]/;
                const match = lastMessage.text.match(suggestionBlockRegex);

                if (match && match[1]) {
                    const suggestionLines = match[1].trim().split('\n');
                    const newSuggestions = suggestionLines
                        .map(line => {
                            const suggestionMatch = line.trim().match(/^\?\s*(.+?)\s+(.*)$/);
                            if (suggestionMatch && suggestionMatch[1] && suggestionMatch[2]) {
                                return { emoji: suggestionMatch[1], text: suggestionMatch[2] };
                            }
                            return null;
                        })
                        .filter((s): s is { emoji: string, text: string } => s !== null);
                    
                    setContextualSuggestions(newSuggestions);
                    lastMessage.text = lastMessage.text.replace(suggestionBlockRegex, '').trim();
                } else {
                    setContextualSuggestions([]);
                }
                
                return newTranscript;
            });
        }
    };
    
    useEffect(() => {
        return () => { 
            stopConversation();
            if (chatRef.current) {
                chatRef.current = null;
            }
        };
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
                return { Icon: Mic, className: "bg-[#2e8dee] hover:bg-[#39b5ff] hover:shadow-[0_0_15px_rgba(57,181,255,0.5)]", placeholder: "Type or tap the mic..." };
        }
    };
    
    const { Icon, className, placeholder } = getButtonState();
    const isVoiceActive = connectionState !== 'idle';
    const displayInput = isVoiceActive ? (currentInput ? currentInput + '...' : '') : textInput;

    return (
        <div className="flex flex-col h-full bg-[#0d0f12] shadow-2xl overflow-hidden rounded-xl border border-gray-800">
            <style>{`
                .chat-area-background {
                    background-color: #0d0f12;
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(46, 141, 238, 0.05) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(57, 181, 255, 0.05) 0px, transparent 50%);
                }
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
                .group-hover\\:pause:hover {
                    animation-play-state: paused;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce {
                    animation: bounce 1s infinite ease-in-out;
                }
            `}</style>
            <header className="p-4 border-b border-gray-800 flex-shrink-0 bg-[#161b22] backdrop-blur-sm flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center tracking-tight">
                    <Bot className="w-6 h-6 mr-2 text-[#2e8dee]" />
                    Ask Fitcoin AI
                </h3>
                <button 
                    onClick={handleClearHistory} 
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-full hover:bg-gray-800"
                    title="Clear Chat History"
                >
                    <Trash2 size={18} />
                </button>
            </header>
            
            <main className="flex-1 p-4 overflow-y-auto space-y-4 chat-area-background">
                {transcript.length === 0 && connectionState === 'idle' && !isModelResponding && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
                        <div className="w-20 h-20 bg-[#161b22] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#000]/50 border border-gray-800">
                            <Bot size={48} className="text-[#2e8dee]" />
                        </div>
                        <p className="font-bold text-xl text-white mb-2">Hello, {user?.displayName || 'there'}!</p>
                        <p className="font-medium text-gray-400 mb-8 max-w-xs">I'm your personal Fitcoin coach. Ask me about your stats, challenges, or fitness tips.</p>
                        <Headlines prompts={suggestedPrompts} onClick={handleSendTextMessage} />
                    </div>
                )}
                {transcript.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                        {entry.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center"><Bot className="w-5 h-5 text-[#2e8dee]" /></div>}
                        <div className={`max-w-[85%] md:max-w-md p-3.5 rounded-2xl shadow-md ${entry.speaker === 'user' ? 'bg-[#2e8dee] text-white rounded-br-none' : 'bg-[#161b22] text-gray-200 border border-gray-800 rounded-bl-none'}`}>
                            <div className="text-sm leading-relaxed">
                                {isModelResponding && index === transcript.length - 1 && entry.text === '' && !entry.isError ? (
                                    <div className="flex items-center space-x-1 p-2">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
                                    </div>
                                ) : (
                                    <>
                                        {entry.speaker === 'model' ? <MarkdownRenderer text={entry.text} /> : <p>{entry.text}</p>}
                                        {isModelResponding && index === transcript.length - 1 && <span className="inline-block w-1 h-3 bg-white/50 animate-pulse ml-1"></span>}
                                    </>
                                )}
                                {entry.isError && (
                                    <div className="mt-2 pt-2 border-t border-white/10">
                                        <button onClick={entry.onRetry} className="text-xs font-semibold bg-[#2e8dee] hover:bg-[#39b5ff] text-white py-1 px-3 rounded-full flex items-center transition-all">
                                            <AlertTriangle className="w-3 h-3 mr-1.5" />
                                            Retry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {entry.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-[#39b5ff]" /></div>}
                    </div>
                ))}
                 {currentInput && connectionState === 'connected' && (
                    <div className="flex items-start gap-3 justify-end">
                        <div className="max-w-[85%] md:max-w-md p-3 rounded-2xl bg-[#2e8dee] text-white opacity-60 rounded-br-none">
                             <p className="text-sm">{currentInput}...</p>
                        </div>
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-[#39b5ff]" /></div>
                    </div>
                 )}
                 {currentOutput && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center"><Bot className="w-5 h-5 text-[#2e8dee]" /></div>
                        <div className="max-w-[85%] md:max-w-md p-3 rounded-2xl bg-[#161b22] text-gray-200 opacity-60 rounded-bl-none">
                             <p className="text-sm">{currentOutput}...</p>
                        </div>
                    </div>
                 )}
                <div ref={transcriptEndRef} />
            </main>
            
            <footer className="p-3 border-t border-gray-800 bg-[#161b22] flex-shrink-0">
                {contextualSuggestions.length > 0 && !isModelResponding && (
                    <SuggestionsTicker 
                        prompts={contextualSuggestions} 
                        onClick={(promptText) => {
                            handleSendTextMessage(promptText);
                            setContextualSuggestions([]);
                        }}
                    />
                )}
                <div className="flex items-center space-x-2 bg-[#0d0f12] rounded-full border border-gray-800 p-1 pl-4 focus-within:border-[#2e8dee] focus-within:ring-1 focus-within:ring-[#2e8dee] transition-all">
                    <input
                        type="text"
                        value={displayInput}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                            if (contextualSuggestions.length > 0) {
                                setContextualSuggestions([]);
                            }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendTextMessage(); }}
                        disabled={isVoiceActive}
                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none disabled:text-gray-500"
                        placeholder={isVoiceActive ? placeholder : "Type your message..."}
                    />
                    <button
                        onClick={textInput && !isVoiceActive ? () => handleSendTextMessage() : handleToggleConversation}
                        disabled={connectionState === 'connecting' || isModelResponding}
                        className={`w-10 h-10 rounded-full text-white flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-200 disabled:opacity-50 ${textInput && !isVoiceActive ? 'bg-[#2e8dee] hover:bg-[#39b5ff]' : className}`}
                        aria-label={textInput && !isVoiceActive ? 'Send message' : (connectionState === 'connected' ? 'Stop conversation' : 'Start conversation')}
                    >
                        {textInput && !isVoiceActive ? <Send size={18} /> : <Icon size={20} />}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AskView;