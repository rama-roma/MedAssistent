'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Button, Table, Calendar, Badge, List, Modal, Form, DatePicker, Select, message, Avatar, Empty, Spin, Input, Dropdown } from 'antd';
import {
    CalendarOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    MessageOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/src/i18n/navigation';
import dayjs, { Dayjs } from 'dayjs';
import DashboardLayout from '@/src/components/DashboardLayout';
import { useUsersStore } from '@/src/store/users';
import { useChatStore } from '@/src/store/chatStore';

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

const HomePage = () => {
    const { user } = useAuthStore();
    const t = useTranslations('common');
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [form] = Form.useForm();
    const { getOrCreateChat, setActiveChat } = useChatStore();
    const { users, loading: loadingColleagues, fetchUsers } = useUsersStore();
    const [messagingDoctorId, setMessagingDoctorId] = useState<string | null>(null);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorId, setDoctorId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
        } finally {
            setLoading(false);
        }
    };

    // Filter out current user from colleagues
    const colleagues = users.filter(u => u.email !== user?.email);

    // --- Processed Data ---
    const todayAppointments = useMemo(() => {
        return appointments.filter(app =>
            dayjs(app.appointment_date).isSame(dayjs(), 'day') &&
            app.status !== 'done' &&
            app.status !== 'cancelled'
        );
    }, [appointments]);

    const stats = useMemo(() => {
        const uniquePatients = new Set(appointments.map(a => a.patient_name)).size;
        const consultations = appointments.filter(a => a.type === 'consultation').length;
        const surgeries = appointments.filter(a => a.type === 'surgery').length;

        return [
            { title: t('stats.upcoming_appointments'), count: todayAppointments.length.toString(), icon: <CalendarOutlined />, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
            { title: t('stats.new_patients'), count: uniquePatients.toString(), icon: <UserOutlined />, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
            { title: t('stats.consultations'), count: consultations.toString(), icon: <MessageOutlined />, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
            { title: t('stats.surgeries'), count: surgeries.toString(), icon: <MedicineBoxOutlined />, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
        ];
    }, [appointments, todayAppointments, t]);

    const handleCreateAppointment = async (values: {
        patientName: string;
        patientPhone: string;
        type: string;
        date: Dayjs;
        note?: string;
        status?: string;
    }) => {
        if (!doctorId) return;
        try {
            const isEditing = !!editingAppointment;
            const res = await fetch('/api/appointments', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAppointment?.id,
                    doctor_id: doctorId,
                    patient_name: values.patientName,
                    patient_phone: values.patientPhone,
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
            }
        } catch (error) {
            console.error('Error handling appointment:', error);
            message.error(editingAppointment ? t('messages.error_update') : t('messages.error_create'));
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

    const columns = [
        {
            title: t('form.patient_name'),
            dataIndex: 'patient_name',
            render: (text: string) => <div className="font-medium text-foreground">{text}</div>,
        },
        {
            title: t('form.appointment_type'),
            dataIndex: 'type',
            render: (type: string) => <span className="text-muted-foreground">{t(`appointment_types.${type}`)}</span>,
        },
        {
            title: t('form.label_status'),
            dataIndex: 'status',
            render: (status: string) => {
                const colors = {
                    confirmed: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                    pending: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                }[status as 'confirmed' | 'done' | 'pending'] || 'bg-gray-100 text-gray-600';

                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'confirmed' ? 'bg-blue-500' : status === 'done' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                        {t(`status.${status}`)}
                    </span>
                );
            },
        },
        {
            title: '',
            key: 'action',
            render: (_: unknown, record: Appointment) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'edit',
                                label: t('profile_page.edit'),
                                icon: <EditOutlined />,
                                onClick: () => {
                                    setEditingAppointment(record);
                                    form.setFieldsValue({
                                        patientName: record.patient_name,
                                        patientPhone: record.patient_phone,
                                        type: record.type,
                                        date: dayjs(record.appointment_date),
                                        note: record.note,
                                        status: record.status
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
                                        onOk: () => handleDeleteAppointment(record.id)
                                    });
                                }
                            }
                        ]
                    }}
                    trigger={['click']}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Center Column */}
                <div className="flex-1 space-y-6">
                    {/* Hero Banner */}
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">{t('banner.title')}, {user?.user_metadata?.full_name || 'Doctor'}</h1>
                            <p className="text-blue-100 mb-6 max-w-md">
                                {t('banner.description').includes('5') ? `${t('banner.description').split('5')[0]} ${todayAppointments.length} ${t('banner.description').split('5')[1]}` : t('banner.description')}
                            </p>
                            <div className="flex gap-4">
                                <Link href="/appointments">
                                    <Button className="bg-background text-primary border-none rounded-xl h-10 px-6 font-semibold hover:bg-background/90 transition-colors">
                                        {t('banner.button')}
                                    </Button>
                                </Link>
                                <Button
                                    className="bg-white/10 text-white border border-white/20 rounded-xl h-10 px-6 font-semibold hover:bg-white/20 transition-all"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    + {t('schedule.new_appointment')}
                                </Button>
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <div key={i} className={`h-full bg-card rounded-3xl animate-pulse ${i === 0 ? 'row-span-2 col-span-2' : ''}`} />)
                        ) : (
                            <>
                                {/* Large AI Card */}
                                <div className="row-span-2 col-span-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-3xl shadow-lg border border-white/10 relative overflow-hidden group cursor-pointer flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-4 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                            ✨
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">AI HEALTH ENGINE</h2>
                                        <p className="text-white/70 text-sm max-w-[200px]">Advanced diagnostics and predictive patient analytics coming soon.</p>
                                    </div>
                                    <div className="relative z-10 mt-4">
                                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10 backdrop-blur-md group-hover:bg-white/20 transition-colors">
                                            SMART DASHBOARD v2.0
                                        </div>
                                    </div>
                                    {/* Abstract background shapes */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
                                </div>

                                {/* Top Right: Consultations (Index 2) and Surgeries (Index 3) */}
                                {[stats[2], stats[3], stats[0], stats[1]].map((stat, idx) => (
                                    <div key={idx} className="bg-card p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-border flex flex-col items-center justify-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${stat.color} shadow-sm`}>
                                            {stat.icon}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-muted-foreground font-medium mb-1 line-clamp-1">{stat.title}</div>
                                            <div className="text-2xl font-black text-foreground">{stat.count}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Appointments Table */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">{t('schedule.todays_schedule')}</h3>
                            <Link href="/appointments">
                                <Button type="default" className="text-primary bg-primary/10 border-none rounded-lg font-medium">{t('view_all')}</Button>
                            </Link>
                        </div>
                        <Table
                            dataSource={todayAppointments}
                            columns={columns}
                            pagination={false}
                            className="custom-table"
                            rowKey="id"
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Right Sidebar Column (Widgets) */}
                <div className="w-full lg:w-80 space-y-6">
                    {/* Calendar */}
                    <div className="bg-card p-4 rounded-3xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="font-bold text-foreground">{t('appointments')}</h3>
                            <span className="text-primary text-sm font-medium bg-primary/10 px-2 py-1 rounded-lg">
                                {dayjs().format('MMM YYYY')}
                            </span>
                        </div>
                        <Calendar fullscreen={false} className="border-none" />
                    </div>

                    {/* Colleagues */}
                    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-foreground">{t('doctors')}</h3>
                            <Link href="/doctors">
                                <Button type="link" size="small">{t('view_all')}</Button>
                            </Link>
                        </div>
                        {loadingColleagues ? (
                            <div className="flex justify-center py-10">
                                <Spin size="small" />
                            </div>
                        ) : colleagues.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={colleagues}
                                renderItem={(item) => (
                                    <List.Item className="border-none py-2">
                                        <List.Item.Meta
                                            avatar={
                                                <Badge dot status="default" offset={[-2, 30]}>
                                                    <Avatar icon={<UserOutlined />} src={item.avatar_url} className="bg-secondary/30" />
                                                </Badge>
                                            }
                                            title={<span className="font-semibold text-sm text-foreground">{item.full_name}</span>}
                                            description={<span className="text-xs text-muted-foreground">{item.email}</span>}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="small"
                                                shape="circle"
                                                icon={<MessageOutlined className="text-muted-foreground" />}
                                                loading={messagingDoctorId === item.id}
                                                onClick={() => handleMessage(item.id)}
                                            />
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <div className="py-6">
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-xs text-muted-foreground">{t('no_colleagues')}</span>} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Creating New Appointment */}
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
                    <Form.Item name="patientName" label={t('form.patient_name')} rules={[{ required: true }]}>
                        <Input placeholder={t('form.placeholder_name')} className="rounded-lg" />
                    </Form.Item>
                    <Form.Item name="patientPhone" label={t('form.phone')} rules={[{ required: true }]}>
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
                            </Select>
                        </Form.Item>
                    )}
                    <Button type="primary" htmlType="submit" className="w-full bg-primary rounded-lg h-10 shadow-lg">
                        {editingAppointment ? t('profile_page.save') : t('schedule.create')}
                    </Button>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default HomePage;
