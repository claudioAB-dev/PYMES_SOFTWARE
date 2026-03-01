import { createHmac } from "crypto";

const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret_for_development_invites_12345!Axioma";

/**
 * Signs a payload string (like a user ID) into a URL-safe token.
 * Output format: payload.signature
 */
export function signInviteToken(payload: string): string {
    const signature = createHmac("sha256", SECRET_KEY)
        .update(payload)
        .digest("base64url"); // URL-safe base64

    return `${payload}.${signature}`;
}

/**
 * Validates a signed token and returns the original payload if valid.
 * Returns null if the signature is invalid or tampered with.
 */
export function verifyInviteToken(token: string): string | null {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    // Re-calculate the signature to verify it matches
    const expectedSignature = createHmac("sha256", SECRET_KEY)
        .update(payload)
        .digest("base64url");

    if (signature === expectedSignature) {
        return payload;
    }

    return null; // Invalid signature
}
