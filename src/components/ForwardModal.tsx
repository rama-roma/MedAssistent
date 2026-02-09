import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Button, message } from 'antd';
import { SearchOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useChatStore, Message } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/lib/supabase';

interface Doctor {
    id: string;
    full_name: string;
    avatar_url: string;
    job: string;
}

interface ForwardModalProps {
    visible: boolean;
    onClose: () => void;
    messageToForward: Message | null;
}

const ForwardModal: React.FC<ForwardModalProps> = ({ visible, onClose, messageToForward }) => {
    const t = useTranslations('common');
    const [search, setSearch] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const { getOrCreateChat, sendMessage } = useChatStore();
    const { user } = useAuthStore();

    const fetchDoctors = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    job
                `)
                .neq('id', user?.id || '');

            if (error) throw error;
            setDoctors((data as unknown as Doctor[]) || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (visible) {
            fetchDoctors();
        }
    }, [visible, fetchDoctors]);

    const handleForward = async (doctor: Doctor) => {
        if (!messageToForward || !user) return;

        try {
            const chat = await getOrCreateChat(user.id, doctor.id);
            await sendMessage(chat.id, user.id, {
                text: messageToForward.text,
                type: messageToForward.type,
                file_url: messageToForward.file_url,
                file_name: messageToForward.file_name,
            });
            message.success(`${t('chat.forward')} ${doctor.full_name}`);
            onClose();
        } catch (error) {
            console.error('Forward failed:', error);
            message.error('Forward failed');
        }
    };

    const filteredDoctors = doctors.filter(d =>
        d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.job?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal
            title={t('chat.forward_title')}
            open={visible}
            onCancel={onClose}
            footer={null}
            bodyStyle={{ padding: '12px 0' }}
        >
            <div className="px-4 mb-4">
                <Input
                    placeholder={t('colleague_directory.search')}
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="rounded-full"
                />
            </div>
            <List
                loading={loading}
                dataSource={filteredDoctors}
                className="max-h-[400px] overflow-y-auto"
                renderItem={doctor => (
                    <List.Item
                        key={doctor.id}
                        className="px-4 hover:bg-secondary/20 cursor-pointer transition-colors"
                        onClick={() => handleForward(doctor)}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={doctor.avatar_url} icon={<UserOutlined />} />}
                            title={doctor.full_name}
                            description={doctor.job}
                        />
                        <Button type="primary" shape="circle" icon={<SendOutlined />} size="small" />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default ForwardModal;
