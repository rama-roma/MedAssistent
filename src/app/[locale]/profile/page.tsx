'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Card, Button, Avatar, Form, Input, Tag, Upload, message, Row, Col, Statistic } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    EnvironmentOutlined,
    CameraOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    CalendarOutlined,
    MedicineBoxOutlined,
    TeamOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/src/components/DashboardLayout';
import type { UploadProps } from 'antd';

const ProfilePage = () => {
    const { user } = useAuthStore();
    const t = useTranslations('common');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [userData, setUserData] = useState<any>(null);

    // Fetch user data from users table
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.email) return;

            try {
                const { data } = await fetch(`/api/get-user?email=${user.email}`).then(r => r.json());
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                // setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.email]);

    const onFinish = async (values: any) => {
        if (!user?.email) return;

        setSaving(true);
        try {
            const response = await fetch('/api/update-user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    full_name: values.full_name,
                    age: values.age,
                    gender: values.gender,
                    address: values.address,
                    job: values.job,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setUserData(result.data);
                message.success(t('profile_page.save_success') || 'Profile updated successfully!');
                setEditing(false);
            } else {
                message.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = () => {
        form.setFieldsValue({
            full_name: userData?.full_name || user?.user_metadata?.full_name || '',
            email: user?.email || '',
            age: userData?.age || user?.user_metadata?.age || '',
            gender: userData?.gender || user?.user_metadata?.gender || '',
            address: userData?.address || user?.user_metadata?.address || '',
            job: userData?.job || user?.user_metadata?.job || userData?.specialty || user?.user_metadata?.specialty || '',
        });
        setEditing(true);
    };

    const handleUpload: UploadProps['beforeUpload'] = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
        }
        return false;
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Modern Header Card */}
                <Card
                    bordered={false}
                    className="shadow-xl overflow-hidden relative bg-card rounded-3xl"
                >
                    {/* Simple Gradient Background */}
                    <div className="h-48 md:h-56 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Profile Content */}
                    <div className="px-6  md:px-12 pb-10 -mt-30 relative z-10">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            {/* Avatar */}
                            <div className="relative group">
                                <Avatar
                                    size={160}
                                    src={userData?.avatar_url || user?.user_metadata?.avatar_url}
                                    icon={<UserOutlined />}
                                    className="relative border-4 border-white bg-primary/20 text-primary shadow-xl"
                                />
                                <Upload
                                    showUploadList={false}
                                    beforeUpload={handleUpload}
                                    accept="image/*"
                                >
                                    <Button
                                        shape="circle"
                                        size="large"
                                        icon={<CameraOutlined />}
                                        className="absolute bottom-2 right-2 shadow-lg bg-primary text-white border-2 border-white opacity-0 group-hover:opacity-100 transition-all w-12 h-12"
                                    />
                                </Upload>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 text-center md:text-left mb-4">
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {userData?.full_name || user?.user_metadata?.full_name || t('guest')}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-white/80 text-base mb-4">
                                    <MailOutlined />
                                    <span>{user?.email || 'email@example.com'}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                                    <Tag color="blue" className="rounded-full px-4 py-1 text-sm font-medium">
                                        <MedicineBoxOutlined className="mr-1" />
                                        {t('profile_page.role_doctor')}
                                    </Tag>
                                    <Tag color="green" className="rounded-full px-4 py-1 text-sm font-medium">
                                        {t('profile_page.status_active')}
                                    </Tag>
                                    <Tag color="default" className="rounded-full px-4 py-1 text-sm font-medium">
                                        <CalendarOutlined className="mr-1" />
                                        {t('profile_page.joined')} {new Date(user?.created_at || Date.now()).getFullYear()}
                                    </Tag>
                                </div>
                            </div>

                            {/* Edit Button */}
                            <div className="mb-4">
                                <Button
                                    type={editing ? 'default' : 'primary'}
                                    size="large"
                                    icon={editing ? <CloseOutlined /> : <EditOutlined />}
                                    onClick={() => editing ? setEditing(false) : handleStartEdit()}
                                    className="rounded-xl h-12 px-8 font-semibold shadow-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                                >
                                    {editing ? t('profile_page.cancel') : t('profile_page.edit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card className="rounded-2xl border shadow-md hover:shadow-lg transition-shadow bg-card">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <TeamOutlined className="text-blue-500 text-2xl" />
                                </div>
                                <Statistic
                                    title={<span className="text-sm font-medium text-muted-foreground">{t('profile_page.total_patients')}</span>}
                                    value={156}
                                    valueStyle={{ color: '#3b82f6', fontWeight: '700', fontSize: '1.75rem' }}
                                />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="rounded-2xl border shadow-md hover:shadow-lg transition-shadow bg-card">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CalendarOutlined className="text-green-500 text-2xl" />
                                </div>
                                <Statistic
                                    title={<span className="text-sm font-medium text-muted-foreground">{t('profile_page.appointments_count')}</span>}
                                    value={89}
                                    valueStyle={{ color: '#22c55e', fontWeight: '700', fontSize: '1.75rem' }}
                                />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="rounded-2xl border shadow-md hover:shadow-lg transition-shadow bg-card">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <FileTextOutlined className="text-purple-500 text-2xl" />
                                </div>
                                <Statistic
                                    title={<span className="text-sm font-medium text-muted-foreground">{t('profile_page.reports_count')}</span>}
                                    value={234}
                                    valueStyle={{ color: '#a855f7', fontWeight: '700', fontSize: '1.75rem' }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Information Card */}
                <Card
                    bordered={false}
                    className="shadow-lg border rounded-2xl bg-card"
                    title={
                        <div className="flex items-center gap-3 py-1">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                <UserOutlined className="text-white text-lg" />
                            </div>
                            <div>
                                <span className="text-xl font-bold block">{t('profile_page.personal_info')}</span>
                                <span className="text-xs text-muted-foreground">{t('profile_page.manage_account')}</span>
                            </div>
                        </div>
                    }
                >
                    {editing ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                full_name: userData?.full_name || user?.user_metadata?.full_name || '',
                                email: user?.email || '',
                                age: userData?.age || user?.user_metadata?.age || '',
                                gender: userData?.gender || user?.user_metadata?.gender || '',
                                address: userData?.address || user?.user_metadata?.address || '',
                                job: userData?.job || user?.user_metadata?.job || userData?.specialty || user?.user_metadata?.specialty || '',
                            }}
                            className="mt-8"
                        >
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="full_name" label={<span className="font-bold text-base">{t('fullname')}</span>}>
                                        <Input
                                            prefix={<UserOutlined className="text-primary/60" />}
                                            className="rounded-2xl h-14 bg-secondary/20 border-none text-base"
                                            placeholder="Full Name"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="email" label={<span className="font-bold text-base">{t('email')}</span>}>
                                        <Input
                                            prefix={<MailOutlined className="text-primary/60" />}
                                            className="rounded-2xl h-14 bg-secondary/20 border-none text-base"
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="job" label={<span className="font-bold text-base">{t('job')}</span>}>
                                        <Input
                                            prefix={<MedicineBoxOutlined className="text-primary/60" />}
                                            className="rounded-2xl h-14 bg-secondary/20 border-none text-base hover:bg-secondary/30 transition-colors"
                                            placeholder="Specialty"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="age" label={<span className="font-bold text-base">{t('age')}</span>}>
                                        <Input
                                            type="number"
                                            prefix={<CalendarOutlined className="text-primary/60" />}
                                            className="rounded-2xl h-14 bg-secondary/20 border-none text-base"
                                            placeholder="Age"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="gender" label={<span className="font-bold text-base">{t('gender')}</span>}>
                                        <Input
                                            className="rounded-2xl h-14 bg-secondary/20 border-none text-base"
                                            placeholder="Gender"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="address" label={<span className="font-bold text-base">{t('address')}</span>}>
                                        <Input.TextArea
                                            className="rounded-2xl bg-secondary/20 border-none text-base"
                                            rows={4}
                                            placeholder="Full Address"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
                                <Button
                                    size="large"
                                    onClick={() => setEditing(false)}
                                    className="rounded-2xl px-10 h-14 font-semibold text-base"
                                >
                                    {t('profile_page.cancel')}
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    htmlType="submit"
                                    loading={saving}
                                    icon={<SaveOutlined />}
                                    className="rounded-2xl px-10 h-14 bg-primary shadow-2xl font-bold text-base hover:scale-105 transition-transform"
                                >
                                    {saving ? t('profile_page.saving') : t('profile_page.save')}
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        <div className="mt-6 space-y-4">
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('fullname')}</div>
                                        <div className="flex items-center gap-2 text-base">
                                            <UserOutlined className="text-primary" />
                                            <span className="font-medium">{userData?.full_name || user?.user_metadata?.full_name || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('email')}</div>
                                        <div className="flex items-center gap-2 text-base">
                                            <MailOutlined className="text-primary" />
                                            <span className="font-medium">{user?.email || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('job')}</div>
                                        <div className="flex items-center gap-2 text-base">
                                            <MedicineBoxOutlined className="text-primary" />
                                            <span className="font-medium">{userData?.job || user?.user_metadata?.job || userData?.specialty || user?.user_metadata?.specialty || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('age')}</div>
                                        <div className="flex items-center gap-2 text-base">
                                            <CalendarOutlined className="text-primary" />
                                            <span className="font-medium">{userData?.age || user?.user_metadata?.age || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('gender')}</div>
                                        <div className="flex items-center gap-2 text-base">
                                            <UserOutlined className="text-primary" />
                                            <span className="font-medium">{userData?.gender || user?.user_metadata?.gender || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24}>
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t('address')}</div>
                                        <div className="flex items-start gap-2 text-base">
                                            <EnvironmentOutlined className="text-primary mt-0.5" />
                                            <span className="font-medium">{userData?.address || user?.user_metadata?.address || 'Not set'}</span>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
