import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  created_at: string;
  chat_id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  file_url?: string;
  file_name?: string;
  is_edited?: boolean;
  parent_id?: string;
  duration?: number;
  replied_message?: Message;
}

export interface Chat {
  id: string;
  created_at: string;
  user_one: string;
  user_two: string;
  last_message?: string;
  last_message_at?: string;
  other_user?: {
    id: string;
    full_name: string;
    full_surname?: string;
    avatar_url: string;
    email: string;
  };
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  loading: boolean;
  fetchChats: (userId: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, senderId: string, content: { text?: string, type?: Message['type'], file_url?: string, file_name?: string, parent_id?: string }) => Promise<void>;
  updateMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  getOrCreateChat: (userOne: string, userTwo: string) => Promise<Chat>;
  replyTo: Message | null;
  setReplyTo: (message: Message | null) => void;
  unreadCounts: Record<string, number>;
  fetchUnreadCounts: (userId: string) => Promise<void>;
  markAsRead: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  loading: false,
  unreadCounts: {},
  replyTo: null,

  setReplyTo: (message) => set({ replyTo: message }),

  fetchUnreadCounts: async (userId) => {
    const { chats } = get();
    const counts: Record<string, number> = {};
    
    await Promise.all(chats.map(async (chat) => {
      const lastReadAt = localStorage.getItem(`last_read_${chat.id}`) || '1970-01-01T00:00:00Z';
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .neq('sender_id', userId)
        .gt('created_at', lastReadAt);
      
      if (!error) {
        counts[chat.id] = count || 0;
      }
    }));
    
    set({ unreadCounts: counts });
  },

  markAsRead: (chatId) => {
    localStorage.setItem(`last_read_${chatId}`, new Date().toISOString());
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [chatId]: 0 }
    }));
  },

  fetchChats: async (userId) => {
    set({ loading: true });
    try {
      // Fetch chats where user is either user_one or user_two
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`user_one.eq.${userId},user_two.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      const chatsWithUsers = await Promise.all((chatsData || []).map(async (chat) => {
        const otherUserId = chat.user_one === userId ? chat.user_two : chat.user_one;
        
        // Try to fetch from users table
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, full_surname, fileAvatar, email')
          .eq('id', otherUserId)
          .maybeSingle();

        let finalUser = null;
        if (userData) {
          finalUser = {
            id: userData.id,
            full_name: userData.full_name || 'User',
            full_surname: userData.full_surname || '',
            avatar_url: userData.fileAvatar || '',
            email: userData.email || ''
          };
        }

        return {
          ...chat,
          other_user: finalUser || { id: otherUserId, full_name: 'Dr. Specialist', avatar_url: '', email: 'No email' }
        };
      }));

      set({ chats: chatsWithUsers, loading: false });
      // Fetch unread counts after chats are loaded
      get().fetchUnreadCounts(userId);
    } catch (error) {
      console.error('Error fetching chats:', error);
      set({ loading: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [] });
    if (chat) {
      get().fetchMessages(chat.id);
      get().markAsRead(chat.id);
    }
  },

  fetchMessages: async (chatId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Ensure activeChat has other_user data if not present or fallback
    const state = get();
    if (state.activeChat?.id === chatId && (!state.activeChat.other_user || state.activeChat.other_user.full_name === 'Loading...' || state.activeChat.other_user.full_name === 'Dr. Specialist' || state.activeChat.other_user.full_name === 'Colleague' || state.activeChat.other_user.full_name === 'Unknown Colleague')) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      const otherUserId = state.activeChat.user_one === currentUser.id 
        ? state.activeChat.user_two 
        : state.activeChat.user_one;
      
      // Try users table
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, full_surname, fileAvatar, email')
        .eq('id', otherUserId)
        .maybeSingle();
      
      let finalUser = null;
      if (userData) {
        finalUser = {
          id: userData.id,
          full_name: userData.full_name || 'User',
          full_surname: userData.full_surname || '',
          avatar_url: userData.fileAvatar || '',
          email: userData.email || ''
        };
      }
      
      if (finalUser) {
        set({ activeChat: { ...state.activeChat, other_user: finalUser } });
      }
    }

    set({ messages: data || [] });
  },

  sendMessage: async (chatId, senderId, content) => {
    // Optimistic message object
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      chat_id: chatId,
      sender_id: senderId,
      text: content.text || '',
      type: content.type || 'text',
      file_url: content.file_url,
      file_name: content.file_name,
      parent_id: content.parent_id
    };

    // Add to local state immediately
    set((state) => ({
      messages: [...state.messages, optimisticMessage]
    }));

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        text: content.text || '',
        type: content.type || 'text',
        file_url: content.file_url,
        file_name: content.file_name,
        parent_id: content.parent_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      set((state) => ({
        messages: state.messages.filter(m => m.id !== optimisticMessage.id)
      }));
      throw error;
    }

    // Replace optimistic message with real one from DB
    if (data) {
      set((state) => ({
        messages: state.messages.map(m => m.id === optimisticMessage.id ? data : m)
      }));
    }
  },

  updateMessage: async (messageId, text) => {
    const { error } = await supabase
      .from('messages')
      .update({ text, is_edited: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating message:', error);
      throw error;
    }

    set((state) => ({
      messages: state.messages.map((m) => 
        m.id === messageId ? { ...m, text, is_edited: true } : m
      )
    }));
  },

  deleteMessage: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }

    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId)
    }));
  },

  deleteChat: async (chatId) => {
    // First delete all messages
    await supabase.from('messages').delete().eq('chat_id', chatId);
    const { error } = await supabase.from('chats').delete().eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }

    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      activeChat: state.activeChat?.id === chatId ? null : state.activeChat
    }));
  },

  addMessage: (message) => {
    const state = get();
    
    // If message is for the active chat, just add it and mark as read
    if (state.activeChat?.id === message.chat_id) {
      set((state) => ({
        messages: [...state.messages, message]
      }));
      state.markAsRead(message.chat_id);
    } else {
      // If it's for another chat, increment unread count if it's not from us
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && message.sender_id !== user.id) {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [message.chat_id]: (state.unreadCounts[message.chat_id] || 0) + 1
            }
          }));
        }
      });
    }
  },

  getOrCreateChat: async (userOne, userTwo) => {
    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user_one.eq.${userOne},user_two.eq.${userTwo}),and(user_one.eq.${userTwo},user_two.eq.${userOne})`)
      .maybeSingle();

    if (existingChat) {
      const otherUserId = existingChat.user_one === userOne ? existingChat.user_two : existingChat.user_one;
      
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, full_surname, fileAvatar, email')
        .eq('id', otherUserId)
        .maybeSingle();
      
      let finalUser = null;
      if (userData) {
        finalUser = {
          id: userData.id,
          full_name: userData.full_name || 'User',
          full_surname: userData.full_surname || '',
          avatar_url: userData.fileAvatar || '',
          email: userData.email || ''
        };
      }
      
      return { ...existingChat, other_user: finalUser };
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({ user_one: userOne, user_two: userTwo })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating chat:', createError);
      throw createError;
    }

    const otherUserId = newChat.user_one === userOne ? newChat.user_two : newChat.user_one;
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, full_surname, fileAvatar, email')
      .eq('id', otherUserId)
      .maybeSingle();

    let finalUser = null;
    if (userData) {
      finalUser = {
        id: userData.id,
        full_name: userData.full_name || 'User',
        full_surname: userData.full_surname || '',
        avatar_url: userData.fileAvatar || '',
        email: userData.email || ''
      };
    }

    const chatWithUser = { 
      ...newChat, 
      other_user: finalUser || { id: otherUserId, full_name: 'Unknown', full_surname: 'User', avatar_url: '', email: '' } 
    };

    // Also add this new chat to the chats list so it shows up immediately
    set((state) => ({
      chats: [chatWithUser, ...state.chats]
    }));

    return chatWithUser;
  }
}));
