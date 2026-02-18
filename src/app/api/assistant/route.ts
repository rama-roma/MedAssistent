
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy", // Prevent crash if missing
});

// Fallback logic for when OpenAI is unavailable or quota exceeded
function getLocalFallbackResponse(text: string, language: string = 'ru-RU') {
    const t = text.toLowerCase();
    const isRu = language.startsWith('ru');
    const isTg = language.startsWith('tg');

    // Helper for responses
    const resp = (ru: string, en: string, tg: string) => {
        if (isRu) return ru;
        if (isTg) return tg;
        return en;
    };

    // 1. Navigation
    if (t.includes('профиль') || t.includes('profile') || t.includes('profil')) {
        return {
            response: resp("Открываю профиль.", "Opening profile.", "Профилро мекушоям."),
            action: "NAVIGATE",
            data: { path: "/profile" }
        };
    }
    if (t.includes('дашборд') || t.includes('главная') || t.includes('домой') || t.includes('dashboard') || t.includes('home') || t.includes('asosiy')) {
        return {
            response: resp("Перехожу на главную.", "Going to dashboard.", "Ба саҳифаи асосӣ мегузарам."),
            action: "NAVIGATE",
            data: { path: "/dashboard" }
        };
    }
    if (t.includes('сообщения') || t.includes('чат') || t.includes('messages') || t.includes('chat') || t.includes('паём')) {
        return {
            response: resp("Открываю сообщения.", "Opening messages.", "Паёмҳоро мекушоям."),
            action: "NAVIGATE",
            data: { path: "/messages" }
        };
    }
    if (t.includes('расписание') || t.includes('календарь') || t.includes('schedule') || t.includes('calendar') || t.includes('ҷадвал')) {
        return {
            response: resp("Открываю расписание.", "Opening schedule.", "Ҷадвалро мекушоям."),
            action: "NAVIGATE",
            data: { path: "/appointments" }
        };
    }
    if (t.includes('пациент') || t.includes('patient') || t.includes('бемор')) {
        if (t.includes('нов') || t.includes('new') || t.includes('nav') || t.includes('соз') || t.includes('create') || t.includes('регистр')) {
             return {
                response: resp("Открываю регистрацию пациента.", "Opening patient registration.", "Саҳифаи қайди беморро мекушоям."),
                action: "REGISTER_PATIENT",
                data: {}
            };
        }
    }

    // 2. Actions like "Read Schedule"
    if (t.includes('план') || t.includes('встреч') || ((t.includes('что') || t.includes('какие')) && t.includes('сегодня'))) {
         return {
            response: resp("Проверяю ваше расписание...", "Checking your schedule...", "Ҷадвали шуморо месанҷам..."),
            action: "READ_SCHEDULE",
            data: {}
        };
    }

    // 3. Greetings / Chit-chat
    if (t.includes('привет') || t.includes('hello') || t.includes('салом')) {
         return {
            response: resp("Привет! Чем могу помочь?", "Hello! How can I help?", "Салом! Чӣ хел ёрӣ расонам?"),
            action: "NONE",
            data: {}
        };
    }

    // Default fallback
    return {
        response: resp(
            "Я вас не совсем понял, но я учусь. Попробуйте открыть профиль или расписание.", 
            "I didn't quite catch that. Try asking to open profile or schedule.",
            "Ман шуморо нафаҳмидам. Кӯшиш кунед, ки профил ё ҷадвалро кушоед."
        ),
        action: "NONE",
        data: {}
    };
}

export async function POST(req: Request) {
    let language = 'ru-RU';
    let text = '';

    try {
        const body = await req.json();
        text = body.text || '';
        const context = body.context;
        if (body.language) language = body.language;

        console.log('[Assistant API] Received:', { text, language });

        // Force local fallback if specific keywords found OR if we want to save money
        // For now, let's try OpenAI first, but catch errors to use fallback.
        // Actually, since user has NO money, let's skip OpenAI if we suspect it will fail, 
        // OR just try-catch it.

        try {
             const systemPrompt = `
You are a smart voice assistant for a medical dashboard.
Context: Language=${language}, UserContext=${JSON.stringify(context || {})}
Actions: NAVIGATE, READ_SCHEDULE, READ_NOTIFICATIONS, CREATE_APPOINTMENT, REGISTER_PATIENT, CANCEL_APPOINTMENT, NONE.
JSON Response: { "response": "text", "action": "ACTION_NAME", "data": {} }
`;
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content");
            return NextResponse.json(JSON.parse(content));

        } catch (openaiError: any) {
            console.warn('[Assistant API] OpenAI Failed, switching to fallback:', openaiError.message);
            // Fallback Logic
            const headerError = openaiError?.status === 429 || openaiError?.error?.code === 'insufficient_quota';
            
            // If it's a billing/quota issue or ANY error, use fallback
            const fallbackResult = getLocalFallbackResponse(text, language);
            
            // Should we tell the user we are in offline mode? Maybe subtly.
            // fallbackResult.response += " (Offline)"; 
            
            return NextResponse.json(fallbackResult);
        }

    } catch (error: any) {
        console.error('[Assistant API] Fatal Error:', error);
        return NextResponse.json(
            { 
                response: language.startsWith('ru') ? "Ошибка сервиса." : "Service error.",
                action: null,
                error: error.message 
            },
            { status: 500 }
        );
    }
}
