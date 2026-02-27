export default function Loading() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: "1rem",
                fontFamily: "var(--font-noto-sans-thai), sans-serif",
            }}
        >
            <div
                style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #f0f0f0",
                    borderTopColor: "#E8652B",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }}
            />
            <p style={{ color: "#888", fontSize: "0.9rem" }}>กำลังโหลด...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
