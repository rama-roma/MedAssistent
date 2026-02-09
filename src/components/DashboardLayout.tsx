'use client';

import React from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Input, Avatar, Badge } from 'antd';
import {
    SearchOutlined,
    AppstoreOutlined,
    TeamOutlined,
    CalendarOutlined,
    SettingOutlined,
    LogoutOutlined,
    MedicineBoxOutlined,
    UserOutlined,
    BellOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/src/i18n/navigation';
import { ModeToggle } from '@/src/components/mode-toggle';
import { Select } from 'antd';
import { AppointmentNotifier } from './AppointmentNotifier';
import { useChatStore, Message } from '@/src/store/chatStore';
import { supabase } from '@/lib/supabase';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const { unreadCounts } = useChatStore();
    const t = useTranslations('common');
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const [userName, setUserName] = React.useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    React.useEffect(() => {
        const fetchUserName = async () => {
            if (!user?.email) return;
            try {
                const response = await fetch(`/api/get-user?email=${user.email}`);
                const { data } = await response.json();
                if (data?.full_name) {
                    setUserName(data.full_name);
                }
                if (data?.avatar_url) {
                    setAvatarUrl(data.avatar_url);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserName();
    }, [user?.email]);

    // Global Chat Subscription
    React.useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('global-chat-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload: { new: Message }) => {
                    const state = useChatStore.getState();
                    // Avoid duplicates
                    const alreadyExists = state.messages.some(m => m.id === payload.new.id);
                    if (!alreadyExists) {
                        state.addMessage(payload.new);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const handleLanguageChange = (value: string) => {
        router.push(pathname, { locale: value });
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            <AppointmentNotifier />
            {/* --- Left Sidebar --- */}
            <aside className="w-64 bg-card m-4 rounded-3xl shadow-lg flex flex-col justify-between p-6 hidden lg:flex border border-border">
                <div>
                    <img className='w-40 mb-10' src="/medassist.png" alt="" />

                    <nav className="space-y-2">
                        <Link href="/home">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/home') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                                <AppstoreOutlined />
                                <span>{t('dashboard')}</span>
                            </div>
                        </Link>
                        <Link href="/doctors">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/doctors') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                                <TeamOutlined />
                                <span>{t('doctors')}</span>
                            </div>
                        </Link>
                        <Link href="/appointments">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/appointments') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                                <CalendarOutlined />
                                <span>{t('appointments')}</span>
                            </div>
                        </Link>
                        <Link href="/chat">
                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/chat') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                                <div className="flex items-center gap-3">
                                    <MessageOutlined />
                                    <span>{t('chats')}</span>
                                </div>
                                {totalUnread > 0 && (
                                    <Badge count={totalUnread} size="small" className="chat-badge" />
                                )}
                            </div>
                        </Link>
                        <Link href="/records">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/records') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                                <MedicineBoxOutlined />
                                <span>{t('actions.medical_records')}</span>
                            </div>
                        </Link>
                    </nav>
                </div>

                <div className="space-y-2">
                    <Link href="/profile">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium mb-2 transition-colors ${isActive('/profile') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/10'}`}>
                            <UserOutlined/>
                            <span>{t('profile')}</span>
                        </div>
                    </Link>
                    <div
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors"
                    >
                        <LogoutOutlined />
                        <span>{t('logout')}</span>
                    </div>
                </div>
            </aside>

            {/* --- Main Content Wrapper --- */}
            <main className="flex-1 flex flex-col py-4 pr-4 lg:pl-0 pl-4 space-y-4 overflow-hidden">
                {/* --- Top Header (Shared) --- */}
                <header className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm mx-4 lg:mx-0 border border-border">
                    <Input
                        prefix={<SearchOutlined className="text-muted-foreground" />}
                        placeholder={t('search_placeholder')}
                        bordered={false}
                        className="bg-secondary/20 rounded-xl max-w-md px-4 py-2"
                    />
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <Select
                            defaultValue={locale}
                            onChange={handleLanguageChange}
                            variant="borderless"
                            className="w-24"
                            options={[
                                { value: 'en', label: 'English' },
                                { value: 'ru', label: 'Русский' },
                                { value: 'tj', label: 'Тоҷикӣ' },
                            ]}
                        />

                        {/* Theme Toggle */}
                        <ModeToggle />

                        <div className="w-px h-8 bg-border mx-2"></div>

                        {/* Profile/Notifs */}
                        <div className="flex items-center gap-3">
                            <Link href="/profile">
                                <Avatar shape="square" size={40} src={avatarUrl || user?.user_metadata?.avatar_url} icon={<UserOutlined />} className="cursor-pointer bg-primary/10 text-primary rounded-xl" />
                            </Link>
                            <div className="hidden md:block">
                                <h4 className="font-bold text-sm text-foreground">{userName || user?.user_metadata?.full_name || t('guest')}</h4>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                        <Badge count={totalUnread} size="small" offset={[-2, 2]}>
                            <BellOutlined className="text-xl text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                        </Badge>
                    </div>
                </header>

                {/* Page Content */}
                <div className={`flex-1 ${pathname.includes('/chat') ? 'overflow-hidden' : 'overflow-y-auto pr-2'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
