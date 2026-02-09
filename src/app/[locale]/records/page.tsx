'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input, Card, Avatar, Tag, Table, Spin, Empty, Select } from 'antd';
import { SearchOutlined, UserOutlined, FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/src/components/DashboardLayout';
import { useAuthStore } from '@/src/store/authStore';
import dayjs from 'dayjs';

interface Appointment {
    id: string;
    patient_name: string;
    patient_phone: string;
    appointment_date: string;
    type: string;
    status: string;
    note?: string;
}

const RecordsPage = () => {
    const t = useTranslations('common');
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.email) return;
            try {
                // Get doctor ID
                const userRes = await fetch(`/api/get-user?email=${user.email}`);
                const userData = await userRes.json();

                if (userData?.data?.id) {
                    // Get all appointments
                    const appRes = await fetch(`/api/appointments?doctor_id=${userData.data.id}`);
                    const appData = await appRes.json();
                    if (appData?.data) {
                        setAppointments(appData.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching records:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const filteredRecords = useMemo(() => {
        return appointments.filter(app => {
            const matchesSearch = app.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.patient_phone.includes(searchTerm);
            const matchesStatus = statusFilter ? app.status === statusFilter : true;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => dayjs(b.appointment_date).unix() - dayjs(a.appointment_date).unix());
    }, [appointments, searchTerm, statusFilter]);

    const columns = [
        {
            title: t('form.patient_name'),
            dataIndex: 'patient_name',
            key: 'patient_name',
            render: (text: string) => (
                <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} className="bg-primary/10 text-primary" />
                    <span className="font-medium text-foreground">{text}</span>
                </div>
            )
        },
        {
            title: t('form.date_time'),
            dataIndex: 'appointment_date',
            key: 'appointment_date',
            render: (date: string) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ClockCircleOutlined className="text-xs" />
                    <span>{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>
                </div>
            )
        },
        {
            title: t('form.appointment_type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag className="rounded-md border-none px-3 py-1 bg-secondary/50 text-secondary-foreground">
                    {t(`appointment_types.${type}`)}
                </Tag>
            )
        },
        {
            title: t('form.label_status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors = {
                    confirmed: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                    pending: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }[status as 'confirmed' | 'done' | 'pending' | 'cancelled'] || 'bg-gray-100 text-gray-600';

                return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors}`}>
                        {t(`status.${status}`)}
                    </span>
                );
            },
        },
        {
            title: t('form.phone'),
            dataIndex: 'patient_phone',
            key: 'patient_phone',
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {t('actions.medical_records')}
                        </h1>
                        <p className="text-muted-foreground mt-2">{t('profile_page.activity_history')}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <Input
                            placeholder={t('search_placeholder')}
                            prefix={<SearchOutlined className="text-muted-foreground" />}
                            className="rounded-xl w-full sm:w-64 border-border h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            placeholder={t('form.label_status')}
                            allowClear
                            className="w-full sm:w-48 h-10 rounded-xl"
                            onChange={setStatusFilter}
                            suffixIcon={<FilterOutlined className="text-muted-foreground" />}
                        >
                            <Select.Option value="pending">{t('status.pending')}</Select.Option>
                            <Select.Option value="confirmed">{t('status.confirmed')}</Select.Option>
                            <Select.Option value="done">{t('status.done')}</Select.Option>
                            <Select.Option value="cancelled">{t('status.cancelled')}</Select.Option>
                        </Select>
                    </div>
                </div>

                <Card bordered={false} className="shadow-sm rounded-3xl overflow-hidden bg-card border border-border">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Spin size="large" />
                        </div>
                    ) : filteredRecords.length > 0 ? (
                        <Table
                            columns={columns}
                            dataSource={filteredRecords}
                            rowKey="id"
                            pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                            className="custom-table"
                        />
                    ) : (
                        <div className="py-20 text-center">
                            <Empty description={t('schedule.empty')} />
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default RecordsPage;
