'use client';

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme } from 'antd';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';
import { useTheme } from 'next-themes';

const StyledComponentsRegistry = ({ children }: React.PropsWithChildren) => {
    const cache = React.useMemo<Entity>(() => createCache(), []);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    useServerInsertedHTML(() => (
        <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    ));

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                theme={{
                    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: isDark ? {
                        colorBgContainer: '#121214',
                        colorBgElevated: '#1c1c1f',
                        colorBgLayout: '#0e0e10',
                        colorText: 'rgba(255, 255, 255, 0.95)',
                        colorTextSecondary: 'rgba(255, 255, 255, 0.70)',
                        colorTextTertiary: 'rgba(255, 255, 255, 0.50)',
                        colorBorder: '#2a2a2e',
                        colorBorderSecondary: '#212124',
                        colorPrimary: '#5b8def',
                        colorPrimaryBg: 'rgba(91, 141, 239, 0.15)',
                    } : {
                        colorPrimary: '#4a6fcf',
                    },
                }}
            >
                {children}
            </ConfigProvider>
        </StyleProvider>
    );
};

export default StyledComponentsRegistry;
