import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Default credentials
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || DEFAULT_USERNAME;
const PASSWORD_HASH = process.env.PASSWORD_HASH || "";

// Session storage (in-memory, simple)
const sessions = new Map<string, { authenticated: boolean; expiresAt: number }>();

export class AuthService {
    private passwordHash: string = PASSWORD_HASH;
    private adminUsername: string = ADMIN_USERNAME;

    /**
     * Initialize password hash if not set
     */
    async initialize() {
        if (!this.passwordHash) {
            console.warn("⚠️  No PASSWORD_HASH set in environment. Using default password 'admin123'");
            console.warn("⚠️  Run install.sh to configure custom credentials");
            this.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        }
        console.log(`✓ Auth initialized for user: ${this.adminUsername}`);
    }

    /**
     * Verify username
     */
    verifyUsername(username: string): boolean {
        return username.toLowerCase() === this.adminUsername.toLowerCase();
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
     * Verify both username and password
     */
    async verifyCredentials(username: string, password: string): Promise<boolean> {
        if (!this.verifyUsername(username)) {
            return false;
        }
        return await this.verifyPassword(password);
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
