"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, X, Award, Volume2, HelpCircle } from "lucide-react";
import { Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { processVoiceCommand } from "./VoiceActionHandler";

// Define SpeechRecognition types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

const VoiceAgent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("Привет! Я слушаю.");

    // Defaulting to Russian for input recognition based on user preference
    const [language] = useState("ru-RU");

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pathname = usePathname();
    const isManuallyStopped = useRef(false);

    // Initialize Speech Synthesis and Load Voices
    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                // console.log("Loaded voices:", availableVoices.length);
                setVoices(availableVoices);
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Helper: Stop Speaking
    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Helper: Speak Text
    const speak = useCallback((text: string, langCode: string) => {
        if (synthRef.current) {
            // Cancel current speech
            synthRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error("Speech error:", e);
                setIsSpeaking(false);
            };

            // Voice Selection Logic
            // Normalize langCode (e.g. 'ru-RU' -> 'ru')
            const baseLang = langCode.split('-')[0];

            // 1. Try to find a specific high-quality Russian voice
            // Voices like "Google русский", "Milena", "Yuri" are common good ones
            let preferredVoice = voices.find(v =>
                v.lang.toLowerCase().includes(baseLang) &&
                (v.name.includes("Google") || v.name.includes("Milena") || v.name.includes("Yuri") || v.name.includes("Female"))
            );

            // 2. Fallback to any voice with the matching language
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
            }

            // 3. Last resort fallback (browser default will take over if utterance.voice is not set, but we try hard)

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.lang = langCode;
            utterance.rate = 1.0;

            synthRef.current.speak(utterance);
            setResponse(text);
        }
    }, [voices]);

    // Helper: Process the recognized command
    // Defined BEFORE useEffect to properly handle dependencies
    const processCommand = useCallback(async (command: string) => {
        const lowerCommand = command.toLowerCase().trim();

        // Check for Stop command first
        if (
            lowerCommand.includes("stop") || lowerCommand.includes("стоп") ||
            lowerCommand.includes("тихо") || lowerCommand.includes("хватит")
        ) {
            stopSpeaking();
            setResponse("Тишина.");
            return;
        }

        // Delegate to VoiceActionHandler
        const actionResponse = await processVoiceCommand(command, language, router, speak);

        if (actionResponse) {
            speak(actionResponse, language);
        } else {
            // Only speak error if it's clearly not understood and we want to feedback
            const msg = "Я не понял, повторите.";
            speak(msg, language);
        }
    }, [language, router, speak, stopSpeaking]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

            if (SpeechRecognitionConstructor) {
                recognitionRef.current = new SpeechRecognitionConstructor();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = language;

                recognitionRef.current.onstart = () => {
                    setIsListening(true);
                    isManuallyStopped.current = false;
                };

                recognitionRef.current.onend = () => {
                    if (!isManuallyStopped.current && isOpen) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            console.error("Auto-restart failed:", e);
                            setIsListening(false);
                        }
                    } else {
                        setIsListening(false);
                    }
                };

                recognitionRef.current.onresult = (event: any) => {
                    const params = event.results[event.resultIndex];
                    if (params.isFinal) {
                        const text = params[0].transcript;
                        setTranscript(text);
                        processCommand(text);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (event.error === 'not-allowed') {
                        setIsListening(false);
                        isManuallyStopped.current = true;
                    }
                };
            }
        }
    }, [language, isOpen, processCommand]);

    // Control Handlers
    const toggleAgent = () => {
        const newState = !isOpen;
        setIsOpen(newState);

        if (newState) {
            startListening();
            speak("Я готов помочь.", language);
        } else {
            stopListening();
            stopSpeaking();
        }
    };

    const startListening = () => {
        isManuallyStopped.current = false;
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setTranscript("Слушаю...");
            } catch (error) {
                console.error("Error starting speech recognition:", error);
            }
        }
    };

    const stopListening = () => {
        isManuallyStopped.current = true;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleAgent}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-110 flex items-center justify-center animate-bounce"
                aria-label="Open AI Agent"
            >
                <Award size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col font-sans transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <Award size={20} />
                    <span className="font-semibold text-lg tracking-wide">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip title="Справка" placement="bottom">
                        <button
                            onClick={() => window.alert(
                                `Команды:\n
— Дашборд / Главная
— Профиль
— Сообщения
— Расписание
— Запиши пациента
`
                            )}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <HelpCircle size={20} />
                        </button>
                    </Tooltip>
                    <button
                        onClick={toggleAgent}
                        className="text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center gap-6 min-h-[200px] justify-center text-center">

                {/* Status Animation */}
                <div className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 ${isListening ? "bg-red-50 dark:bg-red-900/20" : isSpeaking ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                    {isListening && (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20 duration-1000"></span>
                            <span className="animate-ping absolute inline-flex h-2/3 w-2/3 rounded-full bg-red-500 opacity-20 delay-150 duration-1000"></span>
                        </>
                    )}
                    {isSpeaking && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-20"></span>
                    )}

                    {isListening ? (
                        <Mic size={36} className="text-red-500 drop-shadow-md" />
                    ) : isSpeaking ? (
                        <Volume2 size={36} className="text-green-500 drop-shadow-md" />
                    ) : (
                        <Award size={36} className="text-blue-500 drop-shadow-md" />
                    )}
                </div>

                {/* Text Display */}
                <div className="w-full space-y-2">
                    {isListening ? (
                        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse text-lg">
                            Слушаю...
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {transcript && transcript !== "Слушаю..." && (
                                <p className="text-sm text-gray-400 dark:text-gray-500">"{transcript}"</p>
                            )}
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-base leading-relaxed break-words">{response}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
        </div>
    );
};

export default VoiceAgent;
