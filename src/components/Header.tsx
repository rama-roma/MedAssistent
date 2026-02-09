'use client';

import { Link, usePathname, useRouter } from "@/src/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ModeToggle } from "@/src/components/mode-toggle";
import { Select, Avatar, Dropdown, MenuProps } from "antd";
import { UserOutlined, LogoutOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/src/store/authStore";

const Header = () => {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (pathname === '/' || pathname.includes('/home')) {
    return null;
  }

  const handleLanguageChange = (value: string) => {
    router.push(pathname, { locale: value });
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link href="/profile">{t('profile')}</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: <span onClick={() => logout()}>{t('logout')}</span>,
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <img className="w-40" src="/medassist.png" alt="" />


        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            {t('dashboard')}
          </Link>
          <Link href="/doctors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            {t('doctors')}
          </Link>
          <Link href="/appointments" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            {t('appointments')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <Select
            defaultValue={locale}
            onChange={handleLanguageChange}
            bordered={false}
            className="w-24 min-w-[100px]"
            options={[
              { value: 'en', label: <span className="text-sm">English</span> },
              { value: 'ru', label: <span className="text-sm">Русский</span> },
              { value: 'tj', label: <span className="text-sm">Тоҷикӣ</span> },
            ]}
          />

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Profile */}
          {user && (
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1.5 rounded-full transition-colors">
                <Avatar icon={<UserOutlined />} src={user.user_metadata?.avatar_url} />
              </div>
            </Dropdown>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
