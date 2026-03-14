import React, { useState } from "react";
import { signIn, signUp, confirmSignUp } from "../services/cognito";
import { useAuth } from "../context/AuthContext";

const VIEWS = { LOGIN: "login", SIGNUP: "signup", CONFIRM: "confirm" };

const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    color: "var(--text)",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
};

const Login = () => {
    const { login } = useAuth();
    const [view, setView] = useState(VIEWS.LOGIN);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState("");

    const toStr = (e) => (typeof e === "string" ? e : e?.message || "An error occurred");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const session = await signIn(email, password);
            login(session);
        } catch (err) {
            setError(err === "NEW_PASSWORD_REQUIRED" ? "Please contact admin to reset your password." : toStr(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await signUp(email, password);
            setInfo("Check your email for a verification code.");
            setView(VIEWS.CONFIRM);
        } catch (err) {
            setError(toStr(err));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await confirmSignUp(email, code);
            setInfo("Account confirmed! Please sign in.");
            setView(VIEWS.LOGIN);
        } catch (err) {
            setError(toStr(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex", minHeight: "100vh", alignItems: "center",
            justifyContent: "center", background: "var(--bg-base)",
            backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.08), transparent)",
        }}>
            <div className="card" style={{ maxWidth: 420, width: "100%", padding: "2.5rem 2rem" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.3rem" }}>AI ATS Platform</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                        {view === VIEWS.LOGIN && "Sign in to your account"}
                        {view === VIEWS.SIGNUP && "Create a new account"}
                        {view === VIEWS.CONFIRM && "Verify your email"}
                    </p>
                </div>

                {/* Info / Error */}
                {info && <p style={{ background: "rgba(52,211,153,0.1)", border: "1px solid var(--green)", color: "var(--green)", borderRadius: "8px", padding: "0.7rem", fontSize: "0.85rem", marginBottom: "1rem" }}>{info}</p>}
                {error && <p style={{ background: "rgba(248,113,113,0.1)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "8px", padding: "0.7rem", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}

                {/* LOGIN Form */}
                {view === VIEWS.LOGIN && (
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="submit" disabled={loading} style={{ padding: "0.8rem", borderRadius: "10px", background: "linear-gradient(135deg, #ffffff, #d1d1d1)", color: "#000", border: "none", fontWeight: 700, fontSize: "1rem", fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "opacity 0.2s", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                            No account?{" "}
                            <button type="button" onClick={() => { setView(VIEWS.SIGNUP); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Sign up</button>
                        </p>
                    </form>
                )}

                {/* SIGN UP Form */}
                {view === VIEWS.SIGNUP && (
                    <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input style={inputStyle} type="password" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                        <button type="submit" disabled={loading} style={{ padding: "0.8rem", borderRadius: "10px", background: "linear-gradient(135deg, #ffffff, #d1d1d1)", color: "#000", border: "none", fontWeight: 700, fontSize: "1rem", fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Creating account…" : "Create Account"}
                        </button>
                        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                            Already have an account?{" "}
                            <button type="button" onClick={() => { setView(VIEWS.LOGIN); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Sign in</button>
                        </p>
                    </form>
                )}

                {/* CONFIRM Form */}
                {view === VIEWS.CONFIRM && (
                    <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        <input style={inputStyle} type="text" placeholder="6-digit verification code" value={code} onChange={e => setCode(e.target.value)} required maxLength={6} />
                        <button type="submit" disabled={loading} style={{ padding: "0.8rem", borderRadius: "10px", background: "linear-gradient(135deg, #ffffff, #d1d1d1)", color: "#000", border: "none", fontWeight: 700, fontSize: "1rem", fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Verifying…" : "Verify Email"}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default Login;
