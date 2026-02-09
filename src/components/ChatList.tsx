'use client'
import React, { useEffect } from 'react';
import { useChatStore } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import { Avatar, Badge, Spin, Input, Button, Popconfirm } from 'antd';
import { UserOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

const ChatList = () => {
    const t = useTranslations('common');
    const { user } = useAuthStore();
    const { chats, activeChat, fetchChats, setActiveChat, loading, deleteChat, unreadCounts } = useChatStore();
    const [searchTerm, setSearchTerm] = React.useState('');

    useEffect(() => {
        if (user?.id) {
            fetchChats(user.id);
        }
    }, [user?.id, fetchChats]);

    const filteredChats = chats.filter(chat =>
        chat.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.other_user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If activeChat is missing from the list (e.g. just created), add it manually
    if (activeChat && !filteredChats.find(c => c.id === activeChat.id)) {
        filteredChats.unshift(activeChat);
    }

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        try {
            await deleteChat(chatId);
        } catch {
            console.error('Failed to delete chat');
        }
    };

    if (loading && chats.length === 0) {
        return (
            <div className="w-full md:w-80 border-r border-border h-full flex items-center justify-center">
                <Spin />
            </div>
        );
    }

    return (
        <div className="w-full md:w-80 border-r border-border h-full bg-card/30 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 space-y-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent px-2">
                    {t('chat.title')}
                </h2>
                <Input
                    placeholder={t('chat.search_placeholder') || 'Search chats...'}
                    prefix={<SearchOutlined className="text-muted-foreground" />}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="rounded-xl border-none bg-secondary/30 hover:bg-secondary/40 transition-all py-2"
                />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredChats.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground text-sm italic opacity-50">
                        {searchTerm ? t('chat.no_results') || 'No results found' : t('chat.no_chats')}
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-primary/5 group relative border-l-4 ${activeChat?.id === chat.id
                                ? 'bg-primary/10 border-primary'
                                : 'border-transparent hover:border-primary/30'
                                }`}
                        >
                            <Badge status="processing" offset={[-2, 32]} color="#10b981">
                                <Avatar
                                    src={chat.other_user?.avatar_url}
                                    icon={<UserOutlined />}
                                    className="bg-primary/10 text-primary shadow-sm ring-2 ring-background"
                                    size={48}
                                />
                            </Badge>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className="font-bold text-foreground text-sm truncate uppercase tracking-tight">
                                        {chat.other_user?.full_name} {chat.other_user?.full_surname}
                                    </h4>
                                    {unreadCounts[chat.id] > 0 && (
                                        <Badge count={unreadCounts[chat.id]} size="small" className="unread-badge ml-2" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate font-medium">
                                    {chat.other_user?.email || 'No email available'}
                                </p>
                            </div>

                            <Popconfirm
                                title={t('chat.delete_chat_confirm') || "Delete conversation?"}
                                onConfirm={(e) => handleDeleteChat(e as React.MouseEvent, chat.id)}
                                onCancel={(e) => e?.stopPropagation()}
                                okText={t('chat.yes') || "Yes"}
                                cancelText={t('chat.no') || "No"}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Popconfirm>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatList;
