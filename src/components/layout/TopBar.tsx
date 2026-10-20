"use client";

import React from "react";
import { Space, Typography } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { clean, formatTime, parseTime, telHref, useContactData } from "@/lib/contactInfo";

const { Text } = Typography;

export default function TopBar() {
  const { info } = useContactData();
  const phone = clean(info.mainPhone) || clean(info.phone);
  const email = clean(info.email);
  const hours = `จันทร์ - ศุกร์ ${formatTime(parseTime(info.openTime, 8 * 60 + 30))} - ${formatTime(parseTime(info.closeTime, 16 * 60 + 30))} น.`;

  return (
    <div className="topbar">
      <div className="topbar-inner">
        {/* Left — Contact info */}
        <Space size="large" className="topbar-left">
          <Space size={4}>
            <PhoneOutlined />
            <a href={telHref(phone)} className="topbar-text">{phone}</a>
          </Space>
          <Space size={4}>
            <MailOutlined />
            <a href={`mailto:${email}`} className="topbar-text">{email}</a>
          </Space>
        </Space>

        {/* Right — Hours & Location */}
        <Space size="large" className="topbar-right">
          <Space size={4}>
            <ClockCircleOutlined />
            <Text className="topbar-text">{hours}</Text>
          </Space>
          <Space size={4}>
            <EnvironmentOutlined />
            <Text className="topbar-text">สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ถ.ศรีอยุธยา กรุงเทพฯ</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
}
