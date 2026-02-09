'use client'
import React, { useState } from 'react';
import { Input, Button, message, Upload, Popover, Space } from 'antd';
import { SendOutlined, PaperClipOutlined, AudioOutlined, PictureOutlined, VideoCameraOutlined, StopOutlined } from '@ant-design/icons';
import { useChatStore, Message } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

const ChatInput = () => {
    const t = useTranslations('common');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const { activeChat, sendMessage, replyTo, setReplyTo } = useChatStore();
    const { user } = useAuthStore();

    // Listen for reply events or use a shared state. 
    // For now, let's assume ChatWindow might update a shared state in the store.
    // I will add 'replyTo' to ChatStore for better coordination.

    const uploadFile = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${activeChat?.id}/${fileName}`;

        const { error } = await supabase.storage
            .from('chat-media')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSend = async (contentOverride?: { text?: string, type?: Message['type'], file_url?: string, file_name?: string }) => {
        if ((!text.trim() && !contentOverride) || !activeChat || !user) return;

        setSending(true);
        try {
            await sendMessage(activeChat.id, user.id, contentOverride || {
                text: text.trim(),
                parent_id: replyTo?.id
            });
            if (!contentOverride) {
                setText('');
                setReplyTo(null);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            message.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (file: File, type: Message['type']) => {
        try {
            message.loading({ content: 'Uploading file...', key: 'upload' });
            const url = await uploadFile(file);
            await handleSend({ type, file_url: url, file_name: file.name });
            message.success({ content: 'File sent', key: 'upload' });
        } catch (error: unknown) {
            console.error('Detailed Upload Error:', error);
            const err = error as { message?: string, error_description?: string };
            const msg = err.message || err.error_description || 'Unknown error';
            message.error({ content: `Upload failed: ${msg}`, key: 'upload' });
        }
        return false; // Prevent default upload
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
                await handleFileUpload(file, 'audio');
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Recording failed:', error);
            message.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };

    if (!activeChat) return null;

    return (
        <div className="p-4 bg-card border-t border-border shadow-2xl relative z-10">
            <div className="flex items-end gap-3 max-w-6xl mx-auto">
                <Popover
                    content={
                        <Space direction="vertical">
                            <Upload
                                beforeUpload={(file) => handleFileUpload(file, 'image')}
                                accept="image/*"
                                showUploadList={false}
                            >
                                <Button icon={<PictureOutlined />} block>Image</Button>
                            </Upload>
                            <Upload
                                beforeUpload={(file) => handleFileUpload(file, 'video')}
                                accept="video/*"
                                showUploadList={false}
                            >
                                <Button icon={<VideoCameraOutlined />} block>Video</Button>
                            </Upload>
                            <Upload
                                beforeUpload={(file) => handleFileUpload(file, 'audio')}
                                accept="audio/*"
                                showUploadList={false}
                            >
                                <Button icon={<AudioOutlined />} block>Audio</Button>
                            </Upload>
                            <Upload
                                beforeUpload={(file) => handleFileUpload(file, 'file')}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                showUploadList={false}
                            >
                                <Button icon={<PaperClipOutlined />} block>Document</Button>
                            </Upload>
                        </Space>
                    }
                    trigger="click"
                    placement="top"
                >
                    <Button
                        shape="circle"
                        icon={<PaperClipOutlined />}
                        className="flex-shrink-0 border-none bg-secondary/30 hover:bg-secondary/50 text-muted-foreground h-10 w-10"
                    />
                </Popover>

                <div className="flex-1 flex flex-col gap-1">
                    {replyTo && (
                        <div className="flex items-center justify-between bg-primary/5 p-2 rounded-t-xl border-x border-t border-primary/10 animate-in slide-in-from-bottom-2">
                            <div className="flex-1 min-w-0 flex items-center gap-2 border-l-4 border-primary pl-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-primary uppercase">{t('chat.replying_to')}</div>
                                    <div className="text-xs text-muted-foreground truncate">{replyTo.text || (replyTo.type !== 'text' ? t('chat.files') : '')}</div>
                                </div>
                            </div>
                            <Button
                                type="text"
                                size="small"
                                icon={<StopOutlined className="text-[10px]" />}
                                onClick={() => setReplyTo(null)}
                                className="opacity-50 hover:opacity-100"
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Input.TextArea
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            placeholder={t('chat.placeholder')}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className={`${replyTo ? 'rounded-t-none rounded-b-2xl' : 'rounded-2xl'} border-none bg-secondary/30 hover:bg-secondary/40 focus:bg-background transition-all py-2 px-4 resize-none shadow-inner`}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isRecording ? (
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<StopOutlined />}
                            onClick={stopRecording}
                            className="flex-shrink-0 animate-pulse h-10 w-10 shadow-lg"
                        />
                    ) : (
                        <Button
                            shape="circle"
                            icon={<AudioOutlined />}
                            onClick={startRecording}
                            className="flex-shrink-0 bg-secondary/30 hover:bg-secondary/50 border-none text-muted-foreground h-10 w-10"
                        />
                    )}

                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => handleSend()}
                        loading={sending}
                        disabled={!text.trim() && !isRecording}
                        className="flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-blue-600 border-none shadow-lg shadow-primary/30 h-10 px-6 font-bold"
                    >
                        {t('chat.send')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
