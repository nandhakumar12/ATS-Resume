import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Cognito redirects back to this page with ?code=xxx after login.
 * We exchange the code for tokens via the backend /api/auth/callback.
 */
const Callback = ({ setPage }) => {
    const { storeTokens, setUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) {
            setPage("login");
            return;
        }

        (async () => {
            try {
                const res = await fetch(`/api/auth/callback?code=${code}`);
                if (!res.ok) throw new Error("Token exchange failed");
                const tokens = await res.json();
                storeTokens(tokens);

                const meRes = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${tokens.id_token}` },
                });
                if (meRes.ok) {
                    setUser(await meRes.json());
                }
                window.history.replaceState({}, document.title, "/");
                setPage("dashboard");
            } catch (err) {
                console.error("Cognito callback error:", err);
                setPage("login");
            }
        })();
    }, [setPage, setUser, storeTokens]);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
            <div className="spinner" />
            <p style={{ color: "var(--text-muted)" }}>Signing you in…</p>
        </div>
    );
};

export default Callback;
