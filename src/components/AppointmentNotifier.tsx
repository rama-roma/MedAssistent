'use client';

import React, { useEffect, useState, useRef } from 'react';
import { notification } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslations } from 'next-intl';

interface Appointment {
    id: string;
    patient_name: string;
    appointment_date: string;
    type: string;
}

export const AppointmentNotifier: React.FC = () => {
    const { user } = useAuthStore();
    const t = useTranslations('common');
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const getDoctorInfo = async () => {
            if (user?.email) {
                try {
                    const res = await fetch(`/api/get-user?email=${user.email}`);
                    const { data } = await res.json();
                    if (data?.id) {
                        setDoctorId(data.id);
                    }
                } catch (err) {
                    console.error('Error getting user data for notifications:', err);
                }
            }
        };

        if (user) {
            getDoctorInfo();
        }
    }, [user]);

    useEffect(() => {
        if (!doctorId) return;

        const checkAppointments = async () => {
            try {
                const res = await fetch(`/api/appointments?doctor_id=${doctorId}`);
                const { data } = await res.json();

                if (data && Array.isArray(data)) {
                    const now = dayjs();

                    data.forEach((app: Appointment) => {
                        const appDate = dayjs(app.appointment_date);

                        // Notify if appointment is exactly now or within the next minute, 
                        // and hasn't been notified yet.
                        // We check if it's within [now - 1min, now + 1min] window
                        const isTime = appDate.isAfter(now.subtract(1, 'minute')) && appDate.isBefore(now.add(1, 'minute'));

                        if (isTime && !notifiedIds.current.has(app.id)) {
                            notification.info({
                                message: t('activity.appointment'),
                                description: `${app.patient_name} - ${dayjs(app.appointment_date).format('HH:mm')} (${t(`appointment_types.${app.type}`)})`,
                                icon: <ClockCircleOutlined className="text-primary" />,
                                placement: 'topRight',
                                duration: 10,
                            });
                            notifiedIds.current.add(app.id);
                        }
                    });
                }
            } catch (err) {
                console.error('Error checking appointments for notifications:', err);
            }
        };

        // Check immediately and then every 30 seconds
        checkAppointments();
        const interval = setInterval(checkAppointments, 30000);

        return () => clearInterval(interval);
    }, [doctorId, t]);

    return null; // This is a background listener component
};
