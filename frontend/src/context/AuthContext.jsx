import React, { createContext, useContext, useEffect, useState } from "react";
import { signOut, getCurrentSession } from "../services/cognito";

const AuthContext = createContext(null);
const TOKEN_KEY = "ats_id_token";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentSession()
            .then(({ idToken, email }) => {
                localStorage.setItem(TOKEN_KEY, idToken);
                setUser({ email, idToken });
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
            })
            .finally(() => setLoading(false));
    }, []);

    function login({ idToken, accessToken, email }) {
        localStorage.setItem(TOKEN_KEY, idToken);
        setUser({ email, idToken });
    }

    function logout() {
        signOut();
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    }

    function getIdToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
