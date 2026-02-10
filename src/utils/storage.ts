import localforage from 'localforage';
import type { Session } from '../types';

const STORE_NAME = 'vendor-nexus-vault';

export const saveSession = async (session: Session) => {
    try {
        const sessions = await getSessions();
        const existingIndex = sessions.findIndex(s => s.id === session.id);

        if (existingIndex >= 0) {
            sessions[existingIndex] = session;
        } else {
            sessions.unshift(session);
        }

        await localforage.setItem(STORE_NAME, sessions);
    } catch (error) {
        console.error("Failed to save session", error);
    }
};

export const getSessions = async (): Promise<Session[]> => {
    try {
        const sessions = await localforage.getItem<Session[]>(STORE_NAME);
        return sessions || [];
    } catch (error) {
        console.error("Failed to load sessions", error);
        return [];
    }
};

export const deleteSession = async (sessionId: string) => {
    try {
        const sessions = await getSessions();
        const updated = sessions.filter(s => s.id !== sessionId);
        await localforage.setItem(STORE_NAME, updated);
        return updated;
    } catch (error) {
        console.error("Failed to delete session", error);
        return [];
    }
};
