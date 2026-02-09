"use client";
import React from 'react';
import { Avatar, Button, Divider } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    FileTextOutlined,
    PictureOutlined,
    LinkOutlined,
    MoreOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useChatStore } from '@/src/store/chatStore';
import { useTranslations } from 'next-intl';

interface ChatSidebarProps {
    onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onClose }) => {
    const t = useTranslations('common');
    const { activeChat } = useChatStore();

    if (!activeChat || !activeChat.other_user) return null;

    const user = activeChat.other_user;

    return (
        <div className="w-80 h-full bg-card border-l border-border flex flex-col overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 flex flex-col items-center text-center">
                <div className="flex justify-between w-full mb-4 lg:hidden">
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
                </div>

                <Avatar
                    src={user.avatar_url}
                    icon={<UserOutlined />}
                    size={120}
                    className="bg-primary/10 text-primary rounded-3xl mb-4 shadow-xl ring-4 ring-background"
                />
                <h3 className="text-xl font-bold text-foreground mb-1">{user.full_name}</h3>
                <p className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full mb-6">
                    {t('doctor') || 'Medical Specialist'}
                </p>

                <div className="flex gap-4 w-full">
                    <Button block className="rounded-xl h-10 font-bold border-secondary/50">{t('chat.call') || 'Call'}</Button>
                    <Button block type="primary" className="rounded-xl h-10 font-bold shadow-lg shadow-primary/20">{t('chat.video') || 'Video'}</Button>
                </div>
            </div>

            <Divider className="my-0 opacity-50" />

            {/* Information */}
            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        {t('information') || 'Information'}
                    </h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <MailOutlined />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('email') || 'Email'}</p>
                                <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                                <PhoneOutlined />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('phone') || 'Phone'}</p>
                                <p className="text-sm font-medium text-foreground">+62 813-4545-210</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media/Files (Mock placeholders as in design) */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('chat.media') || 'Media'}</h4>
                        <Button type="link" size="small" className="text-xs font-bold p-0">{t('view_all') || 'Show More'}</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-square bg-secondary/30 rounded-xl overflow-hidden hover:opacity-80 cursor-pointer transition-opacity flex items-center justify-center">
                                <PictureOutlined className="text-muted-foreground/30 text-lg" />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('chat.files') || 'Files'}</h4>
                        <Button type="link" size="small" className="text-xs font-bold p-0">{t('view_all') || 'Show More'}</Button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/20 cursor-pointer transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                <FileTextOutlined />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">Medical-report-2024.pdf</p>
                                <p className="text-[10px] text-muted-foreground italic">2.1 MB • Today</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
