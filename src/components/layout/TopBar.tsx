"use client";

import React from "react";
import { Space, Typography } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        {/* Left — Contact info */}
        <Space size="large" className="topbar-left">
          <Space size={4}>
            <PhoneOutlined />
            <Text className="topbar-text">02-644-4633 ต่อ 205</Text>
          </Space>
          <Space size={4}>
            <MailOutlined />
            <Text className="topbar-text">dohcoop@hotmail.com</Text>
          </Space>
        </Space>

        {/* Right — Hours & Location */}
        <Space size="large" className="topbar-right">
          <Space size={4}>
            <ClockCircleOutlined />
            <Text className="topbar-text">จันทร์ - ศุกร์ 08:30 - 16:15 น.</Text>
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
