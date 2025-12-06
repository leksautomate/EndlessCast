import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Default password: "admin123" (hash will be generated on first use)
// User should change this via environment variable
const DEFAULT_PASSWORD = "admin123";
const PASSWORD_HASH = process.env.PASSWORD_HASH || "";

// Session storage (in-memory, simple)
const sessions = new Map<string, { authenticated: boolean; expiresAt: number }>();

export class AuthService {
    private passwordHash: string = PASSWORD_HASH;

    /**
     * Initialize password hash if not set
     */
    async initialize() {
        if (!this.passwordHash) {
            console.warn("⚠️  No PASSWORD_HASH set in environment. Using default password 'admin123'");
            console.warn("⚠️  Generate a hash by running: node -e \"const bcrypt=require('bcrypt');bcrypt.hash('your_password',10).then(h=>console.log(h))\"");
            this.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        }
    }

    /**
     * Verify password
     */
    async verifyPassword(password: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, this.passwordHash);
        } catch (error) {
            console.error("Password verification error:", error);
            return false;
        }
    }

    /**
     * Create session
     */
    createSession(): string {
        const sessionId = this.generateSessionId();
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

        sessions.set(sessionId, {
            authenticated: true,
            expiresAt,
        });

        return sessionId;
    }

    /**
     * Verify session
     */
    verifySession(sessionId: string): boolean {
        const session = sessions.get(sessionId);

        if (!session) {
            return false;
        }

        if (Date.now() > session.expiresAt) {
            sessions.delete(sessionId);
            return false;
        }

        return session.authenticated;
    }

    /**
     * Delete session
     */
    deleteSession(sessionId: string): void {
        sessions.delete(sessionId);
    }

    /**
     * Clean up expired sessions
     */
    cleanupSessions(): void {
        const now = Date.now();
        for (const [id, session] of Array.from(sessions.entries())) {
            if (now > session.expiresAt) {
                sessions.delete(id);
            }
        }
    }

    /**
     * Generate random session ID
     */
    private generateSessionId(): string {
        return Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join("");
    }
}

export const authService = new AuthService();

// Clean up expired sessions every hour
setInterval(() => authService.cleanupSessions(), 60 * 60 * 1000);
