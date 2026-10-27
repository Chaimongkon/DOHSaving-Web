/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LogoutOutlined, MenuOutlined, RightOutlined, UserOutlined } from "@ant-design/icons";
import Link from "next/link";
import { navItems } from "./adminNav";
import { usePathname, useRouter } from "next/navigation";
import css from "./layout.module.css";

interface UserData {
  fullName: string;
  userRole: string;
  avatarPath: string | null;
  menuPermissions: string[] | null;
  mustChangePassword?: boolean;
}

/** หน้าที่ใช้ได้ระหว่างยังใช้รหัสผ่านชั่วคราว */
const ACCOUNT_PATH = "/admin/account";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const isLoginPage = pathname === "/admin/login";
  const [meVersion, setMeVersion] = useState(0);

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        // ไม่ redirect เพราะ middleware จะจัดการ
      });
  }, [isLoginPage, meVersion]);

  // เปลี่ยนรหัสผ่านสำเร็จ (หน้าบัญชีของฉัน) → โหลดข้อมูลผู้ใช้/เมนูใหม่
  useEffect(() => {
    const reload = () => setMeVersion((n) => n + 1);
    window.addEventListener("admin:password-changed", reload);
    return () => window.removeEventListener("admin:password-changed", reload);
  }, []);

  // ยังใช้รหัสผ่านชั่วคราว → ต้องตั้งรหัสใหม่ก่อน (API หลังบ้านก็ปฏิเสธจนกว่าจะเปลี่ยน)
  const mustChange = !!user?.mustChangePassword;
  useEffect(() => {
    if (mustChange && pathname !== ACCOUNT_PATH) router.replace(ACCOUNT_PATH);
  }, [mustChange, pathname, router]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Auto-expand groups that contain the active item
  useEffect(() => {
    const activeGroups = new Set<string>();
    navItems.forEach((section) => {
      if ("group" in section && section.items) {
        const hasActive = section.items.some((item) => isActive(item.href));
        if (hasActive) activeGroups.add(section.group);
      }
    });
    setExpandedGroups((prev) => {
      const merged = new Set(prev);
      activeGroups.forEach((g) => merged.add(g));
      return merged;
    });
  }, [pathname]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // กรองเมนูตามสิทธิ์ — admin เห็นทั้งหมด
  const filteredNavItems = useMemo(() => {
    if (user?.mustChangePassword) return [];
    if (!user || user.userRole === "admin") return navItems;
    const allowed = new Set(user.menuPermissions || []);
    return navItems
      .map((section) => {
        if ("href" in section) return section; // แดชบอร์ดเห็นเสมอ
        if ("group" in section && section.items) {
          const filtered = section.items.filter((item) => allowed.has(item.href));
          if (filtered.length === 0) return null;
          return { ...section, items: filtered };
        }
        return section;
      })
      .filter(Boolean) as typeof navItems;
  }, [user]);

  // ถ้าอยู่หน้า login ไม่แสดง layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className={css.layout}>
      {/* Sidebar */}
      <aside className={`${css.sidebar} ${sidebarOpen ? css.sidebarOpen : ""}`}>
        <div className={css.brand}>
          <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={36}
            height={36}
          />
          <h2 className={css.brandName}>
            DOH Saving
            <span className={css.brandSub}>Admin Panel</span>
          </h2>
        </div>

        <nav className={css.nav}>
          {filteredNavItems.map((section, i) => {
            if ("href" in section && section.href) {
              const href = section.href;
              return (
                <Link
                  key={i}
                  href={href}
                  className={`${css.navItem} ${isActive(href) ? css.navItemActive : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={css.navIcon}>{section.icon}</span>
                  {section.label}
                </Link>
              );
            }
            if ("group" in section && section.group) {
              const groupName = section.group;
              const isExpanded = expandedGroups.has(groupName);
              const hasActiveChild = section.items?.some((item) => isActive(item.href));
              return (
                <div key={i} className={css.navGroup}>
                  <button
                    className={`${css.navLabel} ${hasActiveChild ? css.navLabelActive : ""}`}
                    onClick={() => toggleGroup(groupName)}
                    type="button"
                  >
                    <span>{section.group}</span>
                    <RightOutlined
                      className={`${css.navChevron} ${isExpanded ? css.navChevronOpen : ""}`}
                    />
                  </button>
                  <div
                    className={`${css.navGroupItems} ${isExpanded ? css.navGroupItemsOpen : ""}`}
                  >
                    {section.items?.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${css.navItem} ${isActive(item.href) ? css.navItemActive : ""}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className={css.navIcon}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </nav>

        {/* User section */}
        <div className={css.userSection}>
          <div className={css.userInfo}>
            <div className={css.avatar}>
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <p className={css.userName}>
              {user?.fullName || "Admin"}
              <span className={css.userRole}>{user?.userRole || "admin"}</span>
            </p>
          </div>
          <Link
            href={ACCOUNT_PATH}
            className={`${css.accountLink} ${pathname === ACCOUNT_PATH ? css.accountLinkActive : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <UserOutlined /> บัญชีของฉัน / เปลี่ยนรหัสผ่าน
          </Link>
          <button className={css.logoutBtn} onClick={handleLogout}>
            <LogoutOutlined /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={css.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={css.main}>
        <header className={css.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className={css.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuOutlined />
            </button>
          </div>
          <div className={css.topbarRight} />
        </header>

        <main className={css.content}>{children}</main>
      </div>
    </div>
  );
}
