import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
} from "amazon-cognito-identity-js";

// ── Pool config — read from env vars ─────────────────────────────────────────
// These are injected at build time via Vite — set them in frontend/.env
const poolData = {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
};

let _pool = null;
function getPool() {
    if (!_pool) _pool = new CognitoUserPool(poolData);
    return _pool;
}

// ── Sign In ───────────────────────────────────────────────────────────────────
/**
 * Returns the Cognito ID token (JWT) on success.
 * Throws a human-readable error string on failure.
 */
export function signIn(email, password) {
    return new Promise((resolve, reject) => {
        const pool = getPool();
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
        const authDetails = new AuthenticationDetails({
            Username: email,
            Password: password,
        });

        cognitoUser.authenticateUser(authDetails, {
            onSuccess(session) {
                resolve({
                    idToken: session.getIdToken().getJwtToken(),
                    accessToken: session.getAccessToken().getJwtToken(),
                    refreshToken: session.getRefreshToken().getToken(),
                    email,
                });
            },
            onFailure(err) {
                reject(err.message || "Login failed");
            },
            newPasswordRequired() {
                // First-time login — return a signal so the UI can show a new-password form
                reject("NEW_PASSWORD_REQUIRED");
            },
        });
    });
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
export function signUp(email, password) {
    return new Promise((resolve, reject) => {
        const pool = getPool();
        pool.signUp(email, password, [], null, (err, result) => {
            if (err) return reject(err.message || "Sign-up failed");
            resolve(result.user);
        });
    });
}

// ── Confirm Sign Up ───────────────────────────────────────────────────────────
export function confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
        const pool = getPool();
        const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) return reject(err.message || "Confirmation failed");
            resolve(result);
        });
    });
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export function signOut() {
    const pool = getPool();
    const user = pool.getCurrentUser();
    if (user) user.signOut();
}

// ── Get current session (restore on page refresh) ────────────────────────────
export function getCurrentSession() {
    return new Promise((resolve, reject) => {
        const pool = getPool();
        const user = pool.getCurrentUser();
        if (!user) return reject("No user");
        user.getSession((err, session) => {
            if (err || !session.isValid()) return reject("Invalid session");
            resolve({
                idToken: session.getIdToken().getJwtToken(),
                accessToken: session.getAccessToken().getJwtToken(),
                email: session.getIdToken().payload.email,
            });
        });
    });
}
