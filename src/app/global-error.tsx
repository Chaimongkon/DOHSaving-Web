"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="th">
            <body
                style={{
                    margin: 0,
                    fontFamily:
                        "'Noto Sans Thai', 'Inter', -apple-system, sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        padding: "2rem",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚨</div>
                    <h2
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "0.5rem",
                        }}
                    >
                        เกิดข้อผิดพลาดร้ายแรง
                    </h2>
                    <p
                        style={{
                            color: "#666",
                            marginBottom: "1.5rem",
                            maxWidth: "400px",
                            lineHeight: 1.6,
                        }}
                    >
                        ระบบไม่สามารถแสดงผลได้ กรุณาลองใหม่อีกครั้ง
                        {/* รหัสอ้างอิงตรงกับ log ฝั่งเซิร์ฟเวอร์ — สมาชิกแจ้งรหัสนี้ให้เจ้าหน้าที่ค้นหาสาเหตุได้ */}
                        {error.digest && (
                            <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.8rem", color: "#999" }}>
                                รหัสอ้างอิง: {error.digest}
                            </span>
                        )}
                    </p>
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
                        }}
                    >
                        ลองอีกครั้ง
                    </button>
                </div>
            </body>
        </html>
    );
}
