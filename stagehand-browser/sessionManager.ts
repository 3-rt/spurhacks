import { Browserbase } from "@browserbasehq/sdk";
import fs from "fs/promises";
import path from "path";

interface SessionData {
  sessionId: string;
  createdAt: string;
  lastUsed: string;
}

class SessionManager {
  private sessionFile: string;
  private browserbase: Browserbase;
  private currentSession: SessionData | null = null;

  constructor() {
    this.sessionFile = path.join(process.cwd(), "session.json");
    this.browserbase = new Browserbase();
  }

  async loadSession(): Promise<SessionData | null> {
    try {
      const data = await fs.readFile(this.sessionFile, "utf-8");
      const session = JSON.parse(data) as SessionData;
      
      // Check if session is still valid (less than 1 hour old)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (ageInHours < 1) {
        this.currentSession = session;
        return session;
      } else {
        // Session is too old, remove the file
        await this.clearSession();
        return null;
      }
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  async saveSession(sessionId: string): Promise<void> {
    const session: SessionData = {
      sessionId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };
    
    this.currentSession = session;
    await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
  }

  async updateLastUsed(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.lastUsed = new Date().toISOString();
      await fs.writeFile(this.sessionFile, JSON.stringify(this.currentSession, null, 2));
    }
  }

  async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.sessionFile);
    } catch (error) {
      // File doesn't exist, that's fine
    }
    this.currentSession = null;
  }

  async getOrCreateSession(): Promise<string> {
    // Try to load existing session
    const existingSession = await this.loadSession();
    
    if (existingSession) {
      // Verify the session is still valid by trying to get debug URL
      try {
        await this.browserbase.sessions.debug(existingSession.sessionId);
        await this.updateLastUsed();
        return existingSession.sessionId;
      } catch (error) {
        // Session is invalid, create a new one
        console.log("Existing session is invalid, creating new session");
        await this.clearSession();
      }
    }

    // Create new session
    const session = await this.browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });
    
    await this.saveSession(session.id);
    return session.id;
  }

  getCurrentSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }
}

export default SessionManager; 