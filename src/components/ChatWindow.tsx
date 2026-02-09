'use client'
import React, { useEffect, useRef } from 'react';
import { useChatStore, Message } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import { Avatar, Empty, Spin, Dropdown, MenuProps, Modal, Input, Button, message as antMessage } from 'antd';
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    RollbackOutlined,
    ShareAltOutlined,
    FileOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import ForwardModal from './ForwardModal';

const FileIcon = ({ name, type }: { name?: string, type: string }) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (type === 'image') return <FileImageOutlined className="text-blue-500 text-2xl" />;
    if (ext === 'pdf') return <FilePdfOutlined className="text-red-500 text-2xl" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileWordOutlined className="text-blue-700 text-2xl" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileExcelOutlined className="text-green-600 text-2xl" />;
    return <FileOutlined className="text-muted-foreground text-2xl" />;
};

const ChatWindow = () => {
    const t = useTranslations('common');
    const { user } = useAuthStore();
    const { activeChat, messages, loading, deleteMessage, updateMessage, setReplyTo } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
    const [editText, setEditText] = React.useState('');
    const [forwardVisible, setForwardVisible] = React.useState(false);
    const [forwardMsg, setForwardMsg] = React.useState<Message | null>(null);

    const downloadFile = async (url: string, filename: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            antMessage.error('Download failed');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleEdit = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditText(msg.text);
    };

    const saveEdit = async () => {
        if (!editingMessageId || !editText.trim()) return;
        try {
            await updateMessage(editingMessageId, editText.trim());
            setEditingMessageId(null);
        } catch {
            console.error('Failed to edit message');
        }
    };

    const handleDelete = (msgId: string) => {
        Modal.confirm({
            title: t('chat.delete_confirm_title_msg') || 'Delete message?',
            content: t('chat.delete_confirm_content_msg') || 'This action cannot be undone.',
            okText: t('chat.delete') || 'Delete',
            okType: 'danger',
            cancelText: t('chat.cancel') || 'Cancel',
            onOk: () => deleteMessage(msgId),
        });
    };

    if (!activeChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-secondary/5">
                <Empty description={t('chat.select_chat')} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center gap-4">
                <Avatar
                    src={activeChat.other_user?.avatar_url}
                    icon={<UserOutlined />}
                    size="large"
                    className="bg-primary/10 text-primary"
                />
                <div>
                    <h3 className="font-bold text-foreground">
                        {activeChat.other_user?.full_name} {activeChat.other_user?.full_surname}
                    </h3>
                    <p className="text-xs text-muted-foreground">{activeChat.other_user?.email}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-secondary/5 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Spin size="large" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <Empty description={t('chat.no_messages')} />
                    </div>
                ) : (
                    messages.map((msg: Message) => {
                        const isOwn = msg.sender_id === user?.id;

                        const menuItems: MenuProps['items'] = [
                            { key: 'reply', label: t('chat.reply') || 'Reply', icon: <RollbackOutlined /> },
                            { key: 'forward', label: t('chat.forward') || 'Forward', icon: <ShareAltOutlined /> },
                            isOwn ? { key: 'edit', label: t('chat.edit') || 'Edit', icon: <EditOutlined /> } : null,
                            isOwn ? { type: 'divider' } : null,
                            isOwn ? { key: 'delete', label: t('chat.delete') || 'Delete', icon: <DeleteOutlined />, danger: true } : null,
                        ].filter(Boolean) as MenuProps['items'];

                        return (
                            <div
                                key={msg.id}
                                className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                    <Dropdown menu={{
                                        items: menuItems,
                                        onClick: ({ key }) => {
                                            if (key === 'edit') handleEdit(msg);
                                            if (key === 'delete') handleDelete(msg.id);
                                            if (key === 'reply') setReplyTo(msg);
                                            if (key === 'forward') {
                                                setForwardMsg(msg);
                                                setForwardVisible(true);
                                            }
                                        }
                                    }} trigger={['contextMenu']}>
                                        <div
                                            className={`relative p-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${isOwn
                                                ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none'
                                                : 'bg-card border border-border text-foreground rounded-tl-none'
                                                }`}
                                        >
                                            {/* Reply Rendering */}
                                            {msg.parent_id && (
                                                <div className={`mb-2 p-2 rounded-lg border-l-4 text-xs ${isOwn ? 'bg-white/10 border-white/30 text-white/80' : 'bg-primary/5 border-primary/30 text-muted-foreground'
                                                    }`}>
                                                    <div className="text-[10px] uppercase font-bold text-primary/70 mb-1">{t('chat.replying_to')}</div>
                                                    {messages.find(m => m.id === msg.parent_id)?.text || (messages.find(m => m.id === msg.parent_id)?.type !== 'text' ? t('chat.files') : 'Original message missing')}
                                                </div>
                                            )}

                                            {/* Media Rendering */}
                                            {(msg.type === 'image' || msg.type === 'file') && msg.file_url && (
                                                <div
                                                    onClick={() => window.open(msg.file_url, '_blank')}
                                                    className={`flex items-center gap-3 p-3 rounded-xl mb-2 border hover:shadow-md transition-all no-underline cursor-pointer ${isOwn ? 'bg-white/10 border-white/20' : 'bg-secondary/50 border-border'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/10' : 'bg-card dark:bg-background shadow-sm'}`}>
                                                        <FileIcon name={msg.file_name} type={msg.type} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className={`text-xs font-bold truncate ${isOwn ? 'text-white' : 'text-foreground'}`}>
                                                            {msg.file_name || (msg.type === 'image' ? 'Image' : 'File')}
                                                        </div>
                                                        <div className={`text-[10px] uppercase font-semibold tracking-wider ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
                                                            {msg.file_name?.split('.').pop() || msg.type}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`p-2 rounded-full hover:bg-white/20 transition-colors ${isOwn ? 'text-white/70' : 'text-primary'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(msg.file_url!, msg.file_name || 'file');
                                                        }}
                                                    >
                                                        <DownloadOutlined />
                                                    </div>
                                                </div>
                                            )}

                                            {msg.type === 'video' && msg.file_url && (
                                                <div className="rounded-xl overflow-hidden mb-2 border border-white/10 shadow-lg bg-black/20 group relative max-w-[280px]">
                                                    <video
                                                        src={msg.file_url}
                                                        className="w-full max-h-[200px] object-contain block"
                                                        poster={msg.file_url + '#t=0.5'}
                                                        key={msg.file_url}
                                                        controls
                                                    />
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            shape="circle"
                                                            icon={<DownloadOutlined />}
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => downloadFile(msg.file_url!, msg.file_name || 'video.mp4')}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {msg.type === 'audio' && msg.file_url && (
                                                <div className={`flex items-center gap-2 p-1.5 rounded-full mb-2 min-w-[200px] max-w-[240px] h-10 border ${isOwn ? 'bg-white/15 border-white/10' : 'bg-primary/5 border-primary/10'
                                                    }`}>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer ${isOwn ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
                                                        }`} onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(msg.file_url!, msg.file_name || 'voice.webm');
                                                        }}>
                                                        <DownloadOutlined className="text-sm" />
                                                    </div>
                                                    <audio
                                                        src={msg.file_url}
                                                        controls
                                                        className="h-7 flex-1 focus:outline-none custom-audio-player"
                                                        key={msg.file_url}
                                                    />
                                                </div>
                                            )}

                                            {editingMessageId === msg.id ? (
                                                <div className="space-y-2 min-w-[200px]">
                                                    <Input.TextArea
                                                        value={editText}
                                                        onChange={e => setEditText(e.target.value)}
                                                        autoSize
                                                        className="rounded-lg"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="small" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                                        <Button size="small" type="primary" onClick={saveEdit}>Save</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                msg.text && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                                            )}

                                            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'text-white/60' : 'text-muted-foreground'} text-[10px]`}>
                                                <span>{dayjs(msg.created_at).format('HH:mm')}</span>
                                                {msg.is_edited && <span className="italic">({t('chat.edited') || 'edited'})</span>}
                                            </div>
                                        </div>
                                    </Dropdown>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <ForwardModal
                visible={forwardVisible}
                onClose={() => setForwardVisible(false)}
                messageToForward={forwardMsg}
            />
        </div>
    );
};

export default ChatWindow;
