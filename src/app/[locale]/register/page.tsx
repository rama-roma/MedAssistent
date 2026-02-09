'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from "@/src/i18n/navigation";
import { Form, Input, Button, message, Select, Upload } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  NumberOutlined,
  CameraOutlined,
  GlobalOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import Image from 'next/image';
import { ModeToggle } from "@/src/components/mode-toggle";

const { Option } = Select;
const { TextArea } = Input;

interface RegisterValues {
  fullname: string;
  email: string;
  password?: string;
  age: string;
  gender: string;
  job: string;
  address: string;
}

const RegisterPage = () => {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleLanguageChange = (value: string) => {
    router.push(pathname, { locale: value });
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onFinish = async (values: RegisterValues) => {
    if (!imageUrl) {
      message.error(t('upload_photo'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/doctor-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, photo: imageUrl }),
      });

      if (response.ok) {
        message.success(t('registration_success'));
        router.push('/');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to send registration request');
      }
    } catch {
      message.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload: UploadProps['beforeUpload'] = async (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return Upload.LIST_IGNORE;
    }

    const base64 = await getBase64(file as File);
    setImageUrl(base64);
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-800/20 -z-10" />
      <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 dark:bg-primary/5" />
      <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -z-10 dark:bg-secondary/5" />

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image className="w-40" src="/medassist.png" alt="MedAssist Logo" width={160} height={40} />
          </Link>
          <div className="flex items-center gap-4">
            <Select
              defaultValue={locale}
              onChange={handleLanguageChange}
              bordered={false}
              className="w-24 min-w-[100px]"
              suffixIcon={<GlobalOutlined className="text-primary/70" />}
              options={[
                { value: 'en', label: <span className="text-sm font-semibold">EN</span> },
                { value: 'ru', label: <span className="text-sm font-semibold">RU</span> },
                { value: 'tj', label: <span className="text-sm font-semibold">TJ</span> },
              ]}
            />
            <ModeToggle />
          </div>
        </div>
      </header>


      <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-card/60 backdrop-blur-3xl rounded-[32px] md:rounded-[40px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/5 p-6 md:p-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-xl font-bold shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {t('register')}
              </h1>
            </div>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="middle"
            className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-0"
          >
            {/* compact photo upload */}
            <div className="md:col-span-4 flex flex-col items-center justify-center mb-4 py-3 bg-secondary/10 rounded-2xl border border-white/10 dark:border-white/5">
              <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader-compact scale-90"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                {imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={imageUrl} alt="avatar" fill className="rounded-full object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CameraOutlined className="text-lg mb-1" />
                    <div className="text-[10px] font-bold uppercase tracking-tighter">{t('upload_photo')}</div>
                  </div>
                )}
              </Upload>
              <p className="text-[10px] font-bold text-foreground/40 mt-1 uppercase">{t('doctor_photo')} *</p>
            </div>

            <div className="md:col-span-8 space-y-2">
              <Form.Item
                name="fullname"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('fullname')}</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Input prefix={<UserOutlined className="text-primary/60" />} placeholder="Full Name" className="rounded-xl border-none bg-secondary/20 h-10 text-sm" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('email')}</span>}
                rules={[{ required: true, type: 'email' }]}
                className="mb-0"
              >
                <Input prefix={<MailOutlined className="text-primary/60" />} placeholder="Email Address" className="rounded-xl border-none bg-secondary/20 h-10 text-sm" />
              </Form.Item>
            </div>

            <div className="md:col-span-6 space-y-2 pt-2">
              <Form.Item
                name="password"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('password')}</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Input.Password prefix={<LockOutlined className="text-primary/60" />} placeholder="Password" className="rounded-xl border-none bg-secondary/20 h-10 text-sm" />
              </Form.Item>

              <Form.Item
                name="age"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('age')}</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Input type="number" prefix={<NumberOutlined className="text-primary/60" />} placeholder="Age" className="rounded-xl border-none bg-secondary/20 h-10 text-sm" />
              </Form.Item>
            </div>

            <div className="md:col-span-6 space-y-2 pt-2">
              <Form.Item
                name="gender"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('gender')}</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Select placeholder="Gender" className="registration-select-compact h-10 text-sm">
                  <Option value="male">{t('male')}</Option>
                  <Option value="female">{t('female')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="job"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('job')}</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Input prefix={<MedicineBoxOutlined className="text-primary/60" />} placeholder="Specialty" className="rounded-xl border-none bg-secondary/20 h-10 text-sm" />
              </Form.Item>
            </div>

            <div className="md:col-span-12 pt-2">
              <Form.Item
                name="address"
                label={<span className="text-xs font-bold text-foreground/60 ml-0.5">{t('address')}</span>}
                rules={[{ required: true }]}
                className="mb-4"
              >
                <TextArea placeholder="Clinical Address" rows={2} className="rounded-xl border-none bg-secondary/20 py-2 px-3 text-sm" />
              </Form.Item>
            </div>

            <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full sm:w-auto px-12 h-11 rounded-xl text-base font-bold shadow-lg shadow-primary/20 bg-primary border-none"
              >
                {t('register')}
              </Button>
              <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 dark:bg-primary/5 uppercase tracking-wider italic">
                {t('admin_review_note')}
              </span>
            </div>

            <div className="md:col-span-12 mt-6 pt-4 border-t border-white/10 dark:border-white/5 text-center text-xs text-muted-foreground/60 font-medium">
              Joined already? <Link href="/" className="text-primary font-bold hover:underline transition-all">{t('login')}</Link>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;