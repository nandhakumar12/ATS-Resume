import React from "react";

const Login = () => {
    const handleLogin = () => {
        window.location.href = "/api/auth/login";
    };

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-base)",
            backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,189,248,0.12), transparent)",
        }}>
            <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center", padding: "3rem 2.5rem" }}>
                {/* Logo */}
                <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1.5rem",
                    fontSize: "1.8rem",
                }}>
                    🤖
                </div>

                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>AI ATS Platform</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
                    Intelligent resume screening powered by spaCy & AWS
                </p>

                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%",
                        padding: "0.9rem 1.5rem",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                        color: "#020617",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "1rem",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "0.02em",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(56,189,248,0.3)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                    Sign in with AWS Cognito
                </button>

                <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Secured by Amazon Cognito · OAuth 2.0 / OIDC
                </p>
            </div>
        </div>
    );
};

export default Login;
