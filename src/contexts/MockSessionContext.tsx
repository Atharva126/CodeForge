import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Problem } from '../data/problemsData';

interface MockSession {
    roleId: string;
    companyName: string;
    problems: Problem[];
    startTime: number | null;
    endTime: number | null;
    userCode: Record<string, string>; // problemId -> code
    status: Record<string, 'solved' | 'in-progress' | 'idle'>;
    isCompleted: boolean;
}

interface MockSessionContextType {
    session: MockSession | null;
    startSession: (roleId: string, companyName: string, problems: Problem[]) => void;
    updateCode: (problemId: string, code: string) => void;
    updateStatus: (problemId: string, status: 'solved' | 'in-progress' | 'idle') => void;
    submitAll: () => void;
    quitSession: () => void;
    timeRemaining: number; // In seconds
}

const MockSessionContext = createContext<MockSessionContextType | undefined>(undefined);

export function MockSessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<MockSession | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    const startSession = useCallback((roleId: string, companyName: string, problems: Problem[]) => {
        const startTime = Date.now();
        const duration = 60 * 60; // 60 minutes for the session
        const endTime = startTime + duration * 1000;

        const initialCode: Record<string, string> = {};
        const initialStatus: Record<string, 'solved' | 'in-progress' | 'idle'> = {};

        problems.forEach(p => {
            initialCode[p.id] = '';
            initialStatus[p.id] = 'idle';
        });

        setSession({
            roleId,
            companyName,
            problems,
            startTime,
            endTime,
            userCode: initialCode,
            status: initialStatus,
            isCompleted: false,
        });
        setTimeRemaining(duration);
    }, []);

    const updateCode = useCallback((problemId: string, code: string) => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                userCode: {
                    ...prev.userCode,
                    [problemId]: code,
                },
                status: {
                    ...prev.status,
                    [problemId]: prev.status[problemId] === 'solved' ? 'solved' : 'in-progress'
                }
            };
        });
    }, []);

    const updateStatus = useCallback((problemId: string, status: 'solved' | 'in-progress' | 'idle') => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                status: {
                    ...prev.status,
                    [problemId]: status,
                }
            };
        });
    }, []);

    const submitAll = useCallback(() => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                isCompleted: true,
            };
        });
    }, []);

    const quitSession = useCallback(() => {
        setSession(null);
        setTimeRemaining(0);
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (session && !session.isCompleted && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitAll();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [session, timeRemaining, submitAll]);

    return (
        <MockSessionContext.Provider value={{
            session,
            startSession,
            updateCode,
            updateStatus,
            submitAll,
            quitSession,
            timeRemaining
        }}>
            {children}
        </MockSessionContext.Provider>
    );
}

export function useMockSession() {
    const context = useContext(MockSessionContext);
    if (context === undefined) {
        throw new Error('useMockSession must be used within a MockSessionProvider');
    }
    return context;
}
