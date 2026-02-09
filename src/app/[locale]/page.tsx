'use client';
import { Checkbox, Select } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "../../i18n/navigation";
import { ModeToggle } from "@/src/components/mode-toggle";
import { useState } from "react";
import { useAuthStore } from "@/src/store/authStore";


const Page = () => {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
    }
  };




  const handleLanguageChange = (value: string) => {
    router.push(pathname, { locale: value });
  };
  return (
    <>
      <main>
        <nav className="max-w-[1400px] m-auto p-4">
          <ul className="flex items-center justify-between">
            <div className="flex items-center gap-20">
              <Link href="/">
                <img className="w-40" src="/medassist.png" alt="" />
              </Link>
              <li>....</li>
              <li>....</li>
              <li>....</li>
            </div>
            <div className="flex items-center gap-1">
              <Select
                defaultValue={locale}
                style={{ width: 120 }}
                onChange={handleLanguageChange}
                options={[
                  {
                    value: 'ru',
                    label: (
                      <div className="flex items-center gap-2">
                        <img
                          src="/russia.png"
                          alt="Ru"
                          className="border w-5 h-5 rounded-full object-cover"
                        />
                        <span>Русский</span>
                      </div>
                    ),
                  },
                  {
                    value: 'en',
                    label: (
                      <div className="flex items-center gap-2">
                        <img
                          src="/english.png"
                          alt="En"
                          className="border w-5 h-5 rounded-full object-cover"
                        />
                        <span>English</span>
                      </div>
                    ),
                  },
                  {
                    value: 'tj',
                    label: (
                      <div className="flex items-center gap-2">
                        <img
                          src="/tajik.png"
                          alt="Tj"
                          className="border w-5 h-5 rounded-full object-cover"
                        />
                        <span>Тоҷикӣ</span>
                      </div>
                    ),
                  },
                ]}
              />
              <ModeToggle />
            </div>
          </ul>
        </nav>

        <section>
          <video
            src="/med.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "80vh",
              objectFit: "cover",
            }}
          ></video>
          <form className="bg-white/50 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-7 w-96 h-auto absolute top-40 left-30 shadow-xl border border-white/20 dark:border-border">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              {t('login')}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground/80">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-xl border border-border bg-white/50 dark:bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground/80">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-xl border border-border bg-white/50 dark:bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-foreground/80"
                >
                  {t('remember_me')}
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                {t('login')}
              </button>
              <div className="text-center space-y-2">
                <a
                  href="#"
                  className="block text-sm text-primary hover:text-primary/80 hover:underline"
                >
                  {t('forgot_password')}
                </a>
                <p className="text-sm text-muted-foreground">
                  {t('no_account')}
                  <Link
                    href="/register"
                    className="text-primary hover:text-primary/80 hover:underline ml-1"
                  >
                    {t('register')}
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default Page;
