import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "ats_id_token";
const ATOKEN_KEY = "ats_access_token";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);       // { email, role, full_name }
    const [loading, setLoading] = useState(true);

    // On mount — restore token from localStorage and validate with /api/auth/me
    useEffect(() => {
        (async () => {
            const idToken = localStorage.getItem(TOKEN_KEY);
            if (!idToken) { setLoading(false); return; }
            try {
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(ATOKEN_KEY);
                }
            } catch {
                // network error — clear tokens
                localStorage.removeItem(TOKEN_KEY);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Called after the Cognito /callback route returns tokens
    function storeTokens({ id_token, access_token }) {
        localStorage.setItem(TOKEN_KEY, id_token);
        if (access_token) localStorage.setItem(ATOKEN_KEY, access_token);
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ATOKEN_KEY);
        setUser(null);
        // Redirect to Cognito logout so the Cognito session is also cleared
        window.location.href = "/api/auth/logout";
    }

    function getIdToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, storeTokens, logout, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
