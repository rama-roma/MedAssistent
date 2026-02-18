
import { useChatStore } from '@/src/store/chatStore';
import { fetchAppointmentsByDoctorId, deleteAppointment } from '@/lib/appointments'; 
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

/**
 * Sends the voice transcript to the OpenAI-powered backend.
 */
async function getAIResponse(text: string, language: string, context: any) {
    try {
        const res = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language, context }),
        });
        
        const data = await res.json();

        if (!res.ok) {
            console.warn('AI API Error Response:', data);
            // If the server provided a user-friendly response, return it
            if (data.response) return data;
            throw new Error(`API Error: ${res.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('AI Request failed:', error);
        return null;
    }
}

/**
 * Main entry point for voice commands.
 */
export const processVoiceCommand = async (
    command: string, 
    language: string, 
    router: any, 
    speak: (text: string, lang: string) => void
) => {
    console.log(`[VoiceAgent] Processing: "${command}" (${language})`);

    // 1. Gather context locally if needed (e.g. current page, user name)
    const context = {
        currentPage: window.location.pathname,
    };

    // 2. Call AI
    const aiResult = await getAIResponse(command, language, context);

    if (!aiResult) {
        // Fallback if API fails
        return language === 'ru-RU' 
            ? 'Извините, произошла ошибка соединения.' 
            : language === 'tg-TJ'
            ? 'Бубахшед, хатогӣ рух дод.'
            : 'Sorry, connection error.';
    }

    const { response, action, data } = aiResult;

    // 3. Execute Action
    if (action) {
        console.log(`[VoiceAgent] Executing Action: ${action}`, data);
        await executeAction(action, data, router, language, speak);
    }

    // 4. Return the text response for the agent to speak
    return response;
};

/**
 * Action Executor
 */
async function executeAction(action: string, data: any, router: any, language: string, speak: (text: string, lang: string) => void) {
    const isRu = language === 'ru-RU';
    const isTg = language === 'tg-TJ';

    switch (action) {
        case 'NAVIGATE':
            if (data?.path) {
                router.push(data.path);
            }
            break;

        case 'READ_SCHEDULE':
            // The AI might have already generated the "response" text with the count.
            // But if we need real-time data inspection or specific UI updates:
            // For now, the prompt instructs the AI to just answer questions, 
            // but for dynamic data (like "how many appointments today"), 
            // the AI might handle it if we pass context... 
            // WAIT: The AI on the server doesn't have DB access in the current simplified route.
            // WE NEED TO FETCH DATA HERE IF THE AI REQUESTS IT.
            // Actually, my prompt said: "READ_SCHEDULE: Read the user's appointments for today."
            // If the AI returns this action, IT MEANS IT WANTS US TO FETCH AND SPEAK THE DATA.
            // But the AI also returns "response".
            // If the AI doesn't know the schedule, it can't put it in the "response".
            
            // Refined Logic:
            // If the action is data-dependent, we might need to override the 'response' 
            // or we accept that the AI response is generic "Checking your schedule..."
            // and we append the data to it? 
            // Or better: The AI response is just the confirmation, and we speak the data separately?
            // Let's stick to the current architecture: 
            // The `processVoiceCommand` returns a STRING to speak.
            // If we need to fetch data, we should do it here and potentially MODIFY the return value?
            // BUT `processVoiceCommand` is async.
            // Let's handle it by fetching data and perhaps displaying a notification or 
            // JUST returning the text is hard if we want to change what is spoken.
            
            // To fix this properly:
            // I should pass the `speak` function to `executeAction` too? 
            // No, `processVoiceCommand` returns the string to speak.
            // So if `executeAction` executes, it's side effects.
            // IF we need to Fetch Data to Speak it (like "You have 5 appointments"),
            // checking the logic... 
            
            // Current Plan: 
            // The API route I wrote prompts the AI to return a response.
            // But the AI doesn't know the DB state.
            // So the AI might say "I'm checking your schedule."
            // And then we fetch the data and SPEAK IT via a second `speak` call?
            // Yes, let's do that.
            
            await handleReadSchedule(speak, language);
            break;

        case 'CREATE_APPOINTMENT':
            router.push('/appointments?action=new');
            break;

        case 'REGISTER_PATIENT':
            router.push('/register');
            break;
            
        case 'CANCEL_APPOINTMENT':
             await handleCancelAppointment(speak, language);
             break;

        case 'READ_NOTIFICATIONS':
             await handleReadMessages(speak, language);
             break;

        default:
            break;
    }
}

// Data Fetching Helpers

// We need to pass `speak` to these helpers to output the result properly
// Since we can't easily change the *original* return value of processVoiceCommand which is the AI's "Okay, checking..."

async function handleReadSchedule(speak: any, language: string) {
    const isRu = language === 'ru-RU';
    const isTg = language === 'tg-TJ';
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            speak(isRu ? 'Вы не авторизованы.' : 'You are not logged in.', language);
            return;
        }

        const appointments = await fetchAppointmentsByDoctorId(user.id);
        const today = dayjs().format('YYYY-MM-DD');
        const todayApps = appointments.filter(a => a.appointment_date?.startsWith(today));
        const count = todayApps.length;

        const msg = isRu 
            ? `У вас сегодня ${count} встреч.` 
            : isTg 
            ? `Шумо имрӯз ${count} вохӯрӣ доред.` 
            : `You have ${count} appointments today.`;
        
        speak(msg, language);

    } catch (e) {
        console.error(e);
        speak(isRu ? 'Не удалось загрузить расписание.' : 'Failed to load schedule.', language);
    }
}

async function handleCancelAppointment(speak: any, language: string) {
    // Logic from previous implementation
    const isRu = language === 'ru-RU';
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const appointments = await fetchAppointmentsByDoctorId(user.id);
        const now = dayjs();
        const futureApps = appointments.filter(a => dayjs(a.appointment_date).isAfter(now));

        if (futureApps.length === 0) {
             speak(isRu ? 'Нет будущих записей для отмены.' : 'No future appointments to cancel.', language);
             return;
        }

        futureApps.sort((a, b) => dayjs(a.appointment_date).valueOf() - dayjs(b.appointment_date).valueOf());
        const target = futureApps[0];

        await deleteAppointment(target.id);
        
        const time = dayjs(target.appointment_date).format('HH:mm');
        const msg = isRu 
            ? `Отменена запись с ${target.patient_name} на ${time}.` 
            : `Cancelled appointment with ${target.patient_name} at ${time}.`;
            
        speak(msg, language);

    } catch (e) {
        console.error(e);
        speak(isRu ? 'Ошибка при отмене.' : 'Error cancelling.', language);
    }
}

async function handleReadMessages(speak: any, language: string) {
     const isRu = language === 'ru-RU';
     const isTg = language === 'tg-TJ';

     const state = useChatStore.getState();
     
     if (state.activeChat) {
         const msgs = state.messages;
         if (msgs.length > 0) {
             const lastMsg = msgs[msgs.length - 1];
             const text = lastMsg.text || (isRu ? 'Файл' : isTg ? 'Файл' : 'File attachment');
             speak(isRu ? `Последнее сообщение: ${text}` : isTg ? `Паёми охирин: ${text}` : `Last message: ${text}`, language);
         } else {
             speak(isRu ? 'В этом чате нет сообщений.' : 'No messages in this chat.', language);
         }
     } else {
         speak(isRu ? 'Откройте чат сначала.' : 'Open a chat first.', language);
     }
}
