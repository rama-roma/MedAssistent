"use client";

import React, { useEffect, useState } from 'react';
import { List, Avatar, Spin, Empty, Card, Typography, Tag, message } from 'antd';
import { UserOutlined, MailOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import { getUsers, User } from '@/lib/userService';

const { Text, Title } = Typography;

const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const data = await getUsers();
                setUsers(data);
            } catch (error: any) {
                message.error(error.message || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-20">
                <Spin size="large" tip="Fetching user records..." />
            </div>
        );
    }

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <Title level={4} style={{ margin: 0 }} className="flex items-center gap-2">
                        <UserOutlined className="text-primary" />
                        System Users
                    </Title>
                    <Tag color="cyan" className="rounded-full px-3">{users.length} Total</Tag>
                </div>
            }
            className="shadow-xl rounded-[24px] border border-border bg-card/50 backdrop-blur-xl"
        >
            {users.length > 0 ? (
                <List
                    itemLayout="vertical"
                    dataSource={users}
                    renderItem={(user) => (
                        <List.Item
                            key={user.id}
                            className="hover:bg-secondary/10 transition-all p-4 md:p-6 rounded-2xl mb-4 border border-transparent hover:border-primary/10"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                <Avatar
                                    size={64}
                                    icon={<UserOutlined />}
                                    className="bg-primary/20 text-primary border-2 border-primary/10 shadow-inner flex-shrink-0"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Title level={5} style={{ margin: 0 }} className="text-foreground">
                                            {user.full_name}
                                        </Title>
                                        <div className="flex items-center gap-2">
                                            {user.gender && (
                                                <Tag color={user.gender.toLowerCase() === 'male' ? 'blue' : 'magenta'} className="capitalize m-0 rounded-md">
                                                    {user.gender}
                                                </Tag>
                                            )}
                                            {user.age && (
                                                <Tag icon={<CalendarOutlined />} className="m-0 rounded-md border-none bg-secondary/30">
                                                    {user.age} yrs
                                                </Tag>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                        <div className="flex items-center gap-2 text-muted-foreground group">
                                            <MailOutlined className="text-primary/70" />
                                            <Text copyable className="text-sm group-hover:text-foreground transition-colors">
                                                {user.email}
                                            </Text>
                                        </div>
                                        {user.address && (
                                            <div className="flex items-start gap-2 text-muted-foreground group">
                                                <HomeOutlined className="text-primary/70 mt-1" />
                                                <Text className="text-sm italic group-hover:text-foreground transition-colors leading-tight">
                                                    {user.address}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div className="text-center">
                            <Text strong block>No Users Registered</Text>
                            <Text type="secondary" className="text-xs">The database currently contains no user records.</Text>
                        </div>
                    }
                    className="py-12"
                />
            )}
        </Card>
    );
};

export default UsersList;
