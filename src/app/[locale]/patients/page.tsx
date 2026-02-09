'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input, Card, Button, Avatar, Tag, Table, Spin, Empty } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/src/components/DashboardLayout';
import { useAuthStore } from '@/src/store/authStore';
import dayjs from 'dayjs';

interface Patient {
  key: string;
  name: string;
  phone: string;
  lastVisit: string;
  visitCount: number;
  status: string;
}

const PatientsPage = () => {
  const t = useTranslations('common');
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatientsData = async () => {
      if (!user?.email) return;
      try {
        // Get doctor ID first
        const userRes = await fetch(`/api/get-user?email=${user.email}`);
        const userData = await userRes.json();

        if (userData?.data?.id) {
          // Get all appointments for this doctor
          const appRes = await fetch(`/api/appointments?doctor_id=${userData.data.id}`);
          const appData = await appRes.json();
          if (appData?.data) {
            setAppointments(appData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsData();
  }, [user]);

  const patientsList = useMemo(() => {
    const patientsMap = new Map<string, Patient>();

    appointments.forEach(app => {
      const existing = patientsMap.get(app.patient_name);
      const appDate = dayjs(app.appointment_date);

      if (!existing) {
        patientsMap.set(app.patient_name, {
          key: app.id,
          name: app.patient_name,
          phone: app.patient_phone,
          lastVisit: app.appointment_date,
          visitCount: 1,
          status: 'Active'
        });
      } else {
        existing.visitCount += 1;
        if (dayjs(app.appointment_date).isAfter(dayjs(existing.lastVisit))) {
          existing.lastVisit = app.appointment_date;
        }
      }
    });

    const list = Array.from(patientsMap.values());

    if (searchTerm) {
      return list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [appointments, searchTerm]);

  const columns = [
    {
      title: t('form.patient_name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-primary/10 text-primary" />
          <span className="font-medium text-foreground">{text}</span>
        </div>
      )
    },
    {
      title: t('profile_page.phone'),
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: t('profile_page.appointments_count'),
      dataIndex: 'visitCount',
      key: 'visitCount',
      render: (val: number) => <Tag color="blue">{val}</Tag>
    },
    {
      title: t('activity.just_now'), // Using "Just now" as a placeholder for last visit header if needed, but better use a specific one
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: t('form.label_status'),
      dataIndex: 'status',
      key: 'status',
      render: () => (
        <Tag color="green">
          {t('status.active')}
        </Tag>
      )
    },
    {
      title: '',
      key: 'action',
      render: () => (
        <Button icon={<FileTextOutlined />} size="small" type="link">
          {t('schedule.details')}
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('stats.new_patients')}
            </h1>
            <p className="text-muted-foreground mt-2">{t('profile_page.activity_history')}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Input
              size="large"
              placeholder={t('search_placeholder')}
              prefix={<SearchOutlined className="text-muted-foreground" />}
              className="rounded-xl w-full md:w-80 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card bordered={false} className="shadow-sm rounded-2xl overflow-hidden bg-card border border-border">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : patientsList.length > 0 ? (
            <Table
              columns={columns}
              dataSource={patientsList}
              pagination={{ pageSize: 10 }}
              className="custom-table"
            />
          ) : (
            <div className="py-20">
              <Empty description={t('schedule.empty')} />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;
