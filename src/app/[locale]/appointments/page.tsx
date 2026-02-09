'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Form, Input, Button, DatePicker, Select, List, Avatar, Tag, message, Spin, Dropdown } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, PhoneOutlined, FileTextOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/src/components/DashboardLayout';
import { useAuthStore } from '@/src/store/authStore';

interface Appointment {
    id: string;
    doctor_id: string;
    appointment_date: string;
    patient_name: string;
    patient_phone: string;
    note: string;
    type: string;
    status: string;
}

interface NewAppointmentValues {
    patient_name: string;
    patient_phone: string;
    note: string;
    type: string;
    date: Dayjs;
    status?: string;
}

const AppointmentsPage = () => {
    const t = useTranslations('common');
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const [form] = Form.useForm();
    // ... (omitting lines for brevity in thought, but I will provide full replacement content)
    // Wait, I should provide the full block as required by replacement content.
    // ...
    // I'll just do the replacement.

    useEffect(() => {
        const getDoctorInfo = async () => {
            if (user?.email) {
                try {
                    const res = await fetch(`/api/get-user?email=${user.email}`);
                    const { data } = await res.json();
                    if (data?.id) {
                        setDoctorId(data.id);
                        fetchAppointments(data.id);
                    }
                } catch (err) {
                    console.error('Error getting user data:', err);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        if (user) {
            getDoctorInfo();
        }
    }, [user]);

    const fetchAppointments = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/appointments?doctor_id=${id}`);
            const { data } = await res.json();
            if (data) {
                setAppointments(data);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            message.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (value: Dayjs) => {
        setSelectedDate(value);
    };

    const handleCreateAppointment = async (values: NewAppointmentValues) => {
        if (!doctorId) {
            message.error('User information not loaded');
            return;
        }

        try {
            const isEditing = !!editingAppointment;
            const res = await fetch('/api/appointments', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAppointment?.id,
                    doctor_id: doctorId,
                    patient_name: values.patient_name,
                    patient_phone: values.patient_phone,
                    note: values.note,
                    type: values.type,
                    appointment_date: values.date.toISOString(),
                    status: values.status || 'pending'
                }),
            });

            const { data, success } = await res.json();

            if (success) {
                if (isEditing) {
                    setAppointments(prev => prev.map(app => app.id === data.id ? data : app));
                    message.success(t('messages.success_update'));
                } else {
                    setAppointments(prev => [...prev, data]);
                    message.success(t('messages.success_create'));
                }
                setIsModalOpen(false);
                setEditingAppointment(null);
                form.resetFields();
            } else {
                message.error(t('messages.error_occurred'));
            }
        } catch (error) {
            console.error('Error handling appointment:', error);
            message.error(t('messages.error_occurred'));
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        if (!doctorId) return;
        try {
            const res = await fetch(`/api/appointments?id=${id}&doctor_id=${doctorId}`, {
                method: 'DELETE',
            });
            const { success } = await res.json();
            if (success) {
                setAppointments(prev => prev.map(app =>
                    app.id === id ? { ...app, status: 'cancelled' } : app
                ));
                message.success(t('messages.success_cancel'));
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            message.error(t('messages.error_delete'));
        }
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = appointments.filter(app =>
            dayjs(app.appointment_date).format('YYYY-MM-DD') === value.format('YYYY-MM-DD') &&
            app.status !== 'cancelled'
        );
        return (
            <ul className="events m-0 p-0 list-none">
                {listData.map((item) => (
                    <li key={item.id} className="mb-1">
                        <Badge
                            status={item.status === 'confirmed' ? 'processing' : item.status === 'done' ? 'default' : 'warning'}
                            text={dayjs(item.appointment_date).format('HH:mm')}
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const selectedAppointments = appointments.filter(app =>
        dayjs(app.appointment_date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD') &&
        app.status !== 'cancelled'
    );

    return (
        <DashboardLayout>
            <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('schedule.title')}</h1>
                        <p className="text-muted-foreground">{t('schedule.description')}</p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)} className="rounded-xl bg-primary">
                        {t('schedule.new_appointment')}
                    </Button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                        {/* Calendar Section */}
                        <div className="lg:col-span-2 bg-card p-6 rounded-3xl shadow-sm border border-border overflow-y-auto">
                            <Calendar
                                value={selectedDate}
                                onSelect={handleDateSelect}
                                cellRender={dateCellRender}
                                className="custom-calendar"
                            />
                        </div>

                        {/* Daily List Section */}
                        <div className="bg-card p-6 rounded-3xl shadow-sm border border-border flex flex-col">
                            <h3 className="text-xl font-bold mb-4 text-foreground">
                                {selectedDate.format('MMMM D, YYYY')}
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2">
                                {selectedAppointments.length > 0 ? (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={selectedAppointments}
                                        renderItem={(item) => (
                                            <List.Item className={`bg-secondary/5 rounded-xl p-4 mb-3 border border-border/50 transition-opacity ${item.status === 'done' ? 'opacity-60' : ''}`}>
                                                <List.Item.Meta
                                                    avatar={<Avatar icon={<UserOutlined />} className="bg-primary/10 text-primary" />}
                                                    title={<span className="font-semibold text-foreground">{item.patient_name}</span>}
                                                    description={
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <ClockCircleOutlined /> {dayjs(item.appointment_date).format('HH:mm')}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <PhoneOutlined /> {item.patient_phone}
                                                            </div>
                                                            {item.note && (
                                                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                                    <FileTextOutlined className="mt-0.5" />
                                                                    <span className="italic">{item.note}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    }
                                                />
                                                <div className="flex flex-col gap-2 items-end">
                                                    <Tag color={item.status === 'confirmed' ? 'blue' : item.status === 'done' ? 'default' : 'orange'}>
                                                        {t(`status.${item.status}`)}
                                                    </Tag>
                                                    <Dropdown
                                                        menu={{
                                                            items: [
                                                                {
                                                                    key: 'edit',
                                                                    label: t('profile_page.edit'),
                                                                    icon: <EditOutlined />,
                                                                    onClick: () => {
                                                                        setEditingAppointment(item);
                                                                        form.setFieldsValue({
                                                                            patient_name: item.patient_name,
                                                                            patient_phone: item.patient_phone,
                                                                            type: item.type,
                                                                            date: dayjs(item.appointment_date),
                                                                            note: item.note,
                                                                            status: item.status
                                                                        });
                                                                        setIsModalOpen(true);
                                                                    }
                                                                },
                                                                {
                                                                    key: 'delete',
                                                                    label: t('chat.delete'),
                                                                    icon: <DeleteOutlined />,
                                                                    danger: true,
                                                                    onClick: () => {
                                                                        Modal.confirm({
                                                                            title: t('chat.delete_confirm_title_msg'),
                                                                            content: t('chat.delete_confirm_content_msg'),
                                                                            okText: t('chat.yes'),
                                                                            okType: 'danger',
                                                                            cancelText: t('chat.no'),
                                                                            onOk: () => handleDeleteAppointment(item.id)
                                                                        });
                                                                    }
                                                                }
                                                            ]
                                                        }}
                                                        trigger={['click']}
                                                    >
                                                        <Button size="small" type="text" icon={<MoreOutlined />} />
                                                    </Dropdown>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <CalendarOutlined className="text-4xl mb-2 opacity-20" />
                                        <p>{t('schedule.empty')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Modal
                    title={editingAppointment ? t('profile_page.edit') : t('schedule.new_appointment')}
                    open={isModalOpen}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingAppointment(null);
                        form.resetFields();
                    }}
                    footer={null}
                >
                    <Form layout="vertical" onFinish={handleCreateAppointment} form={form}>
                        <Form.Item name="patient_name" label={t('form.patient_name')} rules={[{ required: true }]}>
                            <Input placeholder={t('form.placeholder_name')} className="rounded-lg" />
                        </Form.Item>
                        <Form.Item name="patient_phone" label={t('form.phone')} rules={[{ required: true }]}>
                            <Input placeholder="+992 000 000 000" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item name="type" label={t('form.appointment_type')} rules={[{ required: true }]}>
                            <Select className="rounded-lg">
                                <Select.Option value="checkup">{t('appointment_types.checkup')}</Select.Option>
                                <Select.Option value="consultation">{t('appointment_types.consultation')}</Select.Option>
                                <Select.Option value="surgery">{t('appointment_types.surgery')}</Select.Option>
                                <Select.Option value="follow_up">{t('appointment_types.follow_up')}</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="date" label={t('form.date_time')} rules={[{ required: true }]}>
                            <DatePicker showTime className="w-full rounded-lg" />
                        </Form.Item>
                        <Form.Item name="note" label={t('form.note')}>
                            <Input.TextArea placeholder={t('form.placeholder_note')} className="rounded-lg" rows={3} />
                        </Form.Item>
                        {editingAppointment && (
                            <Form.Item name="status" label={t('form.label_status')} rules={[{ required: true }]}>
                                <Select className="rounded-lg">
                                    <Select.Option value="pending">{t('status.pending')}</Select.Option>
                                    <Select.Option value="confirmed">{t('status.confirmed')}</Select.Option>
                                    <Select.Option value="done">{t('status.done')}</Select.Option>
                                    <Select.Option value="cancelled">{t('status.cancelled')}</Select.Option>
                                </Select>
                            </Form.Item>
                        )}
                        <Button type="primary" htmlType="submit" block className="rounded-lg h-10 bg-primary">
                            {editingAppointment ? t('profile_page.save') : t('schedule.create')}
                        </Button>
                    </Form>
                </Modal>

            </div>
        </DashboardLayout>
    );
};

export default AppointmentsPage;
