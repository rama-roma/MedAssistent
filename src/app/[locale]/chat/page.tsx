import React from 'react';
import DashboardLayout from '@/src/components/DashboardLayout';
import ChatList from '@/src/components/ChatList';
import ChatWindow from '@/src/components/ChatWindow';
import ChatInput from '@/src/components/ChatInput';

const ChatPage = () => {

    // Real-time messages are now handled globally in DashboardLayout

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
                <ChatList />
                <div className="flex-1 flex flex-col min-w-0">
                    <ChatWindow />
                    <ChatInput />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatPage;
