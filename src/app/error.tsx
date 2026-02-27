"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                padding: "2rem",
                textAlign: "center",
                fontFamily: "var(--font-noto-sans-thai), sans-serif",
            }}
        >
            <div
                style={{
                    fontSize: "4rem",
                    marginBottom: "1rem",
                    lineHeight: 1,
                }}
            >
                ⚠️
            </div>
            <h2
                style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "0.5rem",
                }}
            >
                เกิดข้อผิดพลาด
            </h2>
            <p
                style={{
                    color: "#666",
                    marginBottom: "1.5rem",
                    maxWidth: "400px",
                    lineHeight: 1.6,
                }}
            >
                ขออภัย เกิดข้อผิดพลาดในการแสดงผลหน้านี้
                <br />
                กรุณาลองอีกครั้ง หรือกลับไปหน้าหลัก
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                    onClick={reset}
                    style={{
                        padding: "0.625rem 1.5rem",
                        borderRadius: "8px",
                        border: "none",
                        background: "#E8652B",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                    }}
                >
                    ลองอีกครั้ง
                </button>
                <a
                    href="/"
                    style={{
                        padding: "0.625rem 1.5rem",
                        borderRadius: "8px",
                        border: "1px solid #d9d9d9",
                        background: "#fff",
                        color: "#333",
                        fontWeight: 500,
                        fontSize: "0.95rem",
                        textDecoration: "none",
                        fontFamily: "inherit",
                    }}
                >
                    กลับหน้าหลัก
                </a>
            </div>
        </div>
    );
}
