"use client";

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App as AntdApp } from "antd";
import thTH from "antd/locale/th_TH";

// DOHSaving theme configuration
const theme = {
    token: {
        // Primary brand color — DOH Saving orange
        colorPrimary: "#E8652B",
        colorSuccess: "#52c41a",
        colorWarning: "#faad14",
        colorError: "#ff4d4f",
        colorInfo: "#1677ff",

        // Typography
        fontFamily: "'Noto Sans Thai', 'Inter', -apple-system, sans-serif",
        fontSize: 14,
        borderRadius: 8,

        // Layout
        colorBgLayout: "#f5f5f5",
        colorBgContainer: "#ffffff",
    },
    components: {
        Button: {
            borderRadius: 8,
            controlHeight: 40,
        },
        Card: {
            borderRadiusLG: 12,
        },
        Input: {
            borderRadius: 8,
            controlHeight: 40,
        },
    },
};

export default function AntdProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AntdRegistry>
            <ConfigProvider theme={theme} locale={thTH}>
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </AntdRegistry>
    );
}
