"use client";
import { useState, useEffect } from 'react';
import { Card, Button, Avatar, message, Input, Spin, Empty } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/src/components/DashboardLayout';
import { useUsersStore } from '@/src/store/users';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from '@/src/i18n/navigation';
import { useChatStore } from '@/src/store/chatStore';

const DoctorsPage = () => {
    const t = useTranslations('common');
    const { user } = useAuthStore();
    const router = useRouter();
    const { getOrCreateChat, setActiveChat } = useChatStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [messagingDoctorId, setMessagingDoctorId] = useState<string | null>(null);
    const { users, loading, fetchUsers } = useUsersStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Filter out current user and apply search
    const filteredDoctors = users
        .filter(doc => doc.email !== user?.email) // Exclude current user
        .filter(doc => {
            const fullName = doc.full_name || '';
            const email = doc.email || '';
            return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.toLowerCase().includes(searchTerm.toLowerCase());
        });

    const handleMessage = async (targetUserId: string) => {
        if (!user?.id) {
            message.error(t('messages.login_required'));
            return;
        }

        setMessagingDoctorId(targetUserId);
        try {
            const chat = await getOrCreateChat(user.id, targetUserId);
            setActiveChat(chat);
            message.loading({ content: t('messages.opening_chat'), key: 'chat_nav' });
            router.push(`/chat`);
            setTimeout(() => message.success({ content: t('messages.chat_opened'), key: 'chat_nav', duration: 2 }), 1000);
        } catch (error) {
            console.error('Chat creation error:', error);
            message.error({ content: t('messages.chat_error'), key: 'chat_nav' });
        } finally {
            setMessagingDoctorId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            {t('colleague_directory.title')}
                        </h1>
                        <p className="text-muted-foreground mt-2">{t('colleague_directory.description')}</p>
                    </div>
                    <div className="w-full md:w-80">
                        <Input
                            prefix={<SearchOutlined className="text-muted-foreground" />}
                            placeholder={t('colleague_directory.search')}
                            className="rounded-xl bg-card border-border h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spin size="large" />
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map(doctor => (
                            <Card
                                key={doctor.id}
                                bordered={false}
                                className="shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group bg-card border border-border rounded-3xl"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <Avatar shape="square" size={80} icon={<UserOutlined />} src={doctor.avatar_url} className="bg-primary/10 text-primary rounded-xl" />
                                            <span className="absolute -top-1 -right-1 w-3 h-3 border-2 border-white dark:border-card rounded-full bg-gray-400"></span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors text-foreground">{doctor.full_name}</h3>
                                            <p className="text-muted-foreground text-sm">
                                                {doctor.email || t('ui.no_email')}
                                            </p>
                                            <p className="text-xs text-blue-500 mt-1">{doctor.address || t('ui.no_address')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6 h-12 overflow-hidden text-sm text-muted-foreground line-clamp-2">
                                    {doctor.gender && doctor.age ? `${t(`common.${doctor.gender.toLowerCase()}`)}, ${doctor.age} ${t('ui.years_old')}` : t('ui.no_info')}
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    icon={<MessageOutlined />}
                                    className="rounded-xl h-10 font-medium shadow-md shadow-blue-500/20 bg-primary"
                                    loading={messagingDoctorId === doctor.id}
                                    onClick={() => handleMessage(doctor.id)}
                                >
                                    {t('colleague_directory.send_message')}
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20">
                        <Empty description={<span className="text-muted-foreground">{t('no_colleagues')}</span>} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default DoctorsPage;
