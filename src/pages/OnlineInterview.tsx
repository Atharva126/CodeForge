import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, Group, Separator } from 'react-resizable-panels';
import {
    PanelLeft,
    Monitor,
    Video,
    VideoOff,
    Mic,
    Send,
    Terminal as TerminalIcon,
    LogOut,
    Code,
    ChevronRight,
    Search,
    BookOpen,
    FileText,
    Zap,
    Sparkles,
    CheckCircle2,
    RefreshCw,
    Maximize2
} from 'lucide-react';
import { io } from 'socket.io-client';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { Excalidraw } from '@excalidraw/excalidraw';
import debounce from 'lodash.debounce';
import CollaborativeEditor from '../components/workspace/CollaborativeEditor';
import { useAuth } from '../contexts/AuthContext';
import { problemsData } from '../data/problemsData';

import { ENV_CONFIG } from '../env_config';

const getSocketURL = () => {
    if (ENV_CONFIG.VITE_COLLAB_SERVER_URL) return ENV_CONFIG.VITE_COLLAB_SERVER_URL;
    if (typeof window === 'undefined') return 'http://localhost:1234';
    // If on Vite dev server or localhost, point to the local collab server on port 1234
    if (window.location.hostname === 'localhost' || window.location.port === '5173') {
        return `http://${window.location.hostname}:1234`;
    }
    // Production fallback - should be handled by VITE_COLLAB_SERVER_URL mostly
    return `https://${window.location.hostname}`;
};
const socket = io(getSocketURL());

export default function OnlineInterview() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [leftPanelMode, setLeftPanelMode] = useState<'description' | 'whiteboard'>('description');
    const [currentProblem, setCurrentProblem] = useState<any>(null);
    const [terminalOutput, setTerminalOutput] = useState<any[]>([]);

    // Performance: Helper to limit terminal output to last 100 messages
    const addTerminalMessage = useCallback((msg: any | any[]) => {
        setTerminalOutput(prev => {
            const updates = Array.isArray(msg) ? msg : [msg];
            const newOutput = [...prev, ...updates];
            return newOutput.length > 100 ? newOutput.slice(-100) : newOutput;
        });
    }, []);
    const [interviewerNotes, setInterviewerNotes] = useState('');
    const [showProblemSelector, setShowProblemSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCallActive, setIsCallActive] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    const copyInviteLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
            addTerminalMessage({ type: 'system', message: '📋 Invite link copied to clipboard!' });
        });
    };
    const [dailyCall, setDailyCall] = useState<DailyCall | null>(null);
    const dailyContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!roomId || !user || !isCallActive || !dailyContainerRef.current || dailyCall) return;

        console.log('🎬 Daily: Initializing call for room:', roomId);

        // In a real app, you'd fetch a meeting token from your backend.
        // For this demo/optimized version, we use a public room URL pattern.
        // NOTE: Replace 'codeforge' with your actual Daily subdomain if available.
        const ROOM_URL = `https://codeforge.daily.co/${roomId}`;

        const call = DailyIframe.createFrame(dailyContainerRef.current, {
            iframeStyle: {
                width: '100%',
                height: '100%',
                border: '0',
                borderRadius: '28px',
            },
            showLeaveButton: false,
            showFullscreenButton: true,
            userName: user.email || 'Anonymous'
        });

        call.join({ url: ROOM_URL }).catch(err => {
            console.error('🎬 Daily: Join failed', err);
            addTerminalMessage({ type: 'system', message: '❌ Call Error: Could not join the video room.' });
        });

        call.on('joined-meeting', () => {
            addTerminalMessage({ type: 'system', message: '🤝 Connection: Global SFU Established!' });
            setDailyCall(call);
        });

        call.on('error', (e) => {
            console.error('🎬 Daily: Error', e);
            addTerminalMessage({ type: 'system', message: `⚠️ Call Issue: ${e.errorMsg}` });
        });

        return () => {
            console.log('🎬 Daily: Leaving and destroying call');
            call.leave();
            call.destroy();
            setDailyCall(null);
        };
    }, [roomId, user, isCallActive]);

    const toggleAudio = useCallback(() => {
        if (dailyCall) {
            const isAudioEnabled = dailyCall.localAudio();
            dailyCall.setLocalAudio(!isAudioEnabled);
            setIsMuted(isAudioEnabled);
        }
    }, [dailyCall]);

    const toggleVideo = useCallback(() => {
        if (dailyCall) {
            const isVideoEnabled = dailyCall.localVideo();
            dailyCall.setLocalVideo(!isVideoEnabled);
            setIsVideoOff(isVideoEnabled);
        }
    }, [dailyCall]);

    const [isInterviewer, setIsInterviewer] = useState(false);
    const isInterviewerRef = useRef(false);

    useEffect(() => {
        if (!roomId || !user || !isCallActive) return;

        const handleRoleAssigned = async ({ role }: { role: 'interviewer' | 'candidate' }) => {
            console.log('📡 Signaling: Role assigned by server:', role);
            const isCaller = role === 'interviewer';
            setIsInterviewer(isCaller);
            isInterviewerRef.current = isCaller;
        };

        const startFlow = async () => {
            try {
                socket.on('role-assigned', handleRoleAssigned);
                socket.emit('join-room', { roomId, userName: user.email || 'Anonymous' });
                addTerminalMessage({ type: 'system', message: '📡 Signaling: Connected to room.' });
            } catch (err: any) {
                console.error("Signaling error:", err);
            }
        };

        startFlow();

        return () => {
            socket.off('role-assigned', handleRoleAssigned);
        };
    }, [roomId, user, isCallActive]);

    const [isRunning, setIsRunning] = useState(false);

    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<SocketIOProvider | null>(null);

    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const isSyncingRef = useRef(false);

    // Syncing logic for Excalidraw
    useEffect(() => {
        if (!roomId || !excalidrawAPI) return;

        console.log('🎨 Whiteboard: Setting up sync for room:', roomId);
        const yArray = yDocRef.current.getArray('excalidraw-elements');

        const handleYArrayChange = (event: Y.YArrayEvent<any>) => {
            if (isSyncingRef.current) return;

            // If the transaction originated locally, don't update the scene again
            if (event.transaction.local) return;

            isSyncingRef.current = true;
            try {
                const elements = yArray.toArray() as any[];
                console.log(`🎨 Whiteboard: Received remote update (${elements.length} elements)`);
                excalidrawAPI.updateScene({ elements });
            } catch (err) {
                console.error('🎨 Whiteboard: Failed to update scene', err);
            } finally {
                // Small delay to ensure Excalidraw's internal state catches up
                setTimeout(() => {
                    isSyncingRef.current = false;
                }, 50);
            }
        };

        yArray.observe(handleYArrayChange);

        // Initial load
        const elements = yArray.toArray();
        if (elements.length > 0) {
            console.log(`🎨 Whiteboard: Performing initial load (${elements.length} elements)`);
            excalidrawAPI.updateScene({ elements });
        }

        return () => {
            console.log('🎨 Whiteboard: Cleaning up sync observer');
            yArray.unobserve(handleYArrayChange);
        };
    }, [roomId, excalidrawAPI]);

    // Debounced sync function to push local changes to Yjs
    const debouncedSyncToYjs = useRef(
        debounce((elements: any[]) => {
            if (!roomId) return;
            const yArray = yDocRef.current.getArray('excalidraw-elements');

            yDocRef.current.transact(() => {
                // Only update if there's actually a change to push
                // This is a naive implementation; 
                // In a production app we would compare versions or use a more structured Yjs type
                yArray.delete(0, yArray.length);
                yArray.push(elements);
            });
            console.log(`🎨 Whiteboard: Pushed ${elements.length} elements to Yjs`);
        }, 200)
    ).current;

    const handleExcalidrawChange = (elements: readonly any[]) => {
        // Essential guard: don't push changes that were triggered by a remote sync
        if (isSyncingRef.current || !roomId) return;

        // Push local changes to the shared Yjs document
        debouncedSyncToYjs(elements as any[]);
    };



    useEffect(() => {
        if (!roomId || !user) return;

        // Isolate Whiteboard Room to avoid conflicts
        const whiteboardRoomId = `${roomId}-whiteboard`;
        console.log('🎨 Whiteboard: Connecting provider to room:', whiteboardRoomId);

        const provider = new SocketIOProvider(getSocketURL(), whiteboardRoomId, yDocRef.current, { autoConnect: true });
        providerRef.current = provider;

        provider.on('status', ({ status }: any) => {
            console.log(`🎨 Whiteboard: Provider status: ${status}`);
        });

        provider.on('sync', (isSynced: boolean) => {
            console.log(`🎨 Whiteboard: Sync state: ${isSynced}`);
            if (isSynced && excalidrawAPI) {
                const yArray = yDocRef.current.getArray('excalidraw-elements');
                const elements = yArray.toArray();
                if (elements.length > 0) {
                    console.log('🎨 Whiteboard: Provider synced, updating scene...');
                    excalidrawAPI.updateScene({ elements });
                }
            }
        });

        addTerminalMessage({ type: 'system', message: '🎨 Whiteboard: Connecting collaboration engine...' });

        socket.on('problem-pushed', (problem) => {
            setCurrentProblem(problem);
            addTerminalMessage({ type: 'system', message: `Problem pushed: ${problem.title}` });
        });

        socket.on('execution-result', ({ userName, result }) => {
            addTerminalMessage([
                { type: 'system', message: `Code executed by ${userName}` },
                ...result.testCases.map((tc: any, i: number) => ({
                    type: 'output',
                    message: `Test Case ${i + 1}: ${tc.passed ? 'PASSED' : 'FAILED'} (Input: ${tc.input})`
                }))
            ]);
            setIsRunning(false);
        });

        return () => {
            console.log('🎨 Whiteboard: Disconnecting provider');
            provider.disconnect();
            socket.off('problem-pushed');
            socket.off('execution-result');
        };
    }, [roomId, user, excalidrawAPI]);

    const handleRun = async () => {
        if (!currentProblem) return;
        setIsRunning(true);

        // In a real app, we'd get the code from the Yjs doc or a ref
        // For now, we simulate the execution and broadcast the result
        // This ensures both users see the "Running..." state and the final result

        const mockResult = {
            testCases: currentProblem.examples?.map((ex: any) => ({
                input: ex.input,
                passed: true
            })) || []
        };

        // Simulate network delay
        setTimeout(() => {
            socket.emit('code-execution', {
                roomId,
                userName: user?.email,
                result: mockResult
            });
        }, 1500);
    };

    const handlePushProblem = (problem: any) => {
        socket.emit('push-problem', { roomId, problem });
        setShowProblemSelector(false);
    };

    const filteredProblems = problemsData.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen bg-[#0a0a0a] text-gray-300 flex flex-col overflow-hidden font-sans">
            {/* Top Bar */}
            <header className="h-14 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-6 z-20 shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <PanelLeft className={`w-5 h-5 transition-colors ${isSidebarOpen ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`} />
                    </div>
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={copyInviteLink}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showCopied ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {showCopied ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Monitor className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Copy Invite Link</span>
                                </>
                            )}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-white font-black tracking-tight text-xs uppercase">Room: {roomId}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isInterviewer ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {isInterviewer ? 'Interviewer' : 'Candidate'}
                        </div>
                    </div>
                    {isInterviewer && (
                        <button
                            onClick={() => setShowProblemSelector(true)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 border border-white/10"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Push Problem
                        </button>
                    )}
                    <button
                        onClick={() => setIsCallActive(!isCallActive)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/10 ${isCallActive ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white animate-pulse'}`}
                    >
                        {isCallActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                        {isCallActive ? 'Leave Call' : 'Rejoin Call'}
                    </button>
                    <button
                        onClick={() => (window as any).reconnectCall()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-yellow-500/20"
                        title="Fix camera/mic issues"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset Cam
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        Finish
                    </button>
                </div>
            </header>


            <div className="flex-1 flex overflow-hidden">
                <Group orientation="horizontal">
                    {/* Left Panel: Description & Whiteboard */}
                    {isSidebarOpen && (
                        <>
                            <Panel defaultSize={25} minSize={15}>
                                <div className="h-full bg-[#0f0f0f] border-r border-[#222] flex flex-col">
                                    <div className="flex items-center border-b border-[#222]">
                                        <button
                                            onClick={() => setLeftPanelMode('description')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${leftPanelMode === 'description' ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Problem Description
                                        </button>
                                        <button
                                            onClick={() => setLeftPanelMode('whiteboard')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${leftPanelMode === 'whiteboard' ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Whiteboard
                                        </button>
                                    </div>

                                    <div className={`flex-1 relative ${leftPanelMode === 'whiteboard' ? 'overflow-hidden p-0' : 'overflow-y-auto p-6'}`}>
                                        {leftPanelMode === 'description' ? (
                                            currentProblem ? (
                                                <div className="space-y-6">
                                                    <h2 className="text-2xl font-black text-white">{currentProblem.title}</h2>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${currentProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                            {currentProblem.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 leading-relaxed">{currentProblem.description}</p>

                                                    <div className="space-y-4 pt-4">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Examples</h3>
                                                        {currentProblem.examples?.map((ex: any, i: number) => (
                                                            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 font-mono text-sm">
                                                                <div className="mb-2"><span className="text-indigo-400 font-bold">Input:</span> {ex.input}</div>
                                                                <div><span className="text-green-400 font-bold">Output:</span> {ex.output}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                                                        <BookOpen className="w-8 h-8 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold">Waiting for Interviewer</h3>
                                                        <p className="text-gray-500 text-xs mt-1">The problem will appear here once pushed.</p>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            /* Clean, full-height container for Excalidraw */
                                            <div className="absolute inset-0 bg-[#121212]">
                                                <Excalidraw
                                                    excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                                                    onChange={handleExcalidrawChange}
                                                    theme="dark"
                                                    UIOptions={{
                                                        canvasActions: {
                                                            toggleTheme: false,
                                                            export: false,
                                                            loadScene: false,
                                                            saveToActiveFile: false,
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Panel>
                            <Separator className="w-1 bg-[#222] hover:bg-indigo-500/50 transition-colors" />
                        </>
                    )}

                    {/* Center Panel: Editor & Terminal */}
                    <Panel defaultSize={isInterviewer ? 50 : 75}>
                        <Group orientation="vertical">
                            <Panel defaultSize={70}>
                                <main className="h-full flex flex-col bg-[#0d0d0d] relative">
                                    <div className="flex-1 relative">
                                        <CollaborativeEditor
                                            roomId={roomId || 'default'}
                                            userName={user?.email || 'User'}
                                            userColor={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                                            language="javascript"
                                            onLanguageChange={() => { }}
                                        />
                                    </div>
                                </main>
                            </Panel>

                            <Separator className="h-1 bg-[#222] hover:bg-indigo-500/50 transition-colors" />

                            <Panel defaultSize={30} minSize={10}>
                                <div className="h-full border-t border-[#222] bg-[#0a0a0a] flex flex-col">
                                    <div className="h-10 bg-[#161616] border-b border-[#222] flex items-center justify-between px-6">
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            <TerminalIcon className="w-3 h-3" />
                                            Shared Terminal
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleRun}
                                                disabled={isRunning || !currentProblem}
                                                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isRunning ? <div className="w-3 h-3 border-2 border-indigo-400/20 border-t-indigo-400 animate-spin rounded-full" /> : <ChevronRight className="w-3 h-3" />}
                                                Run Code
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2">
                                        {terminalOutput.map((out, i) => (
                                            <div key={i} className={`${out.type === 'system' ? 'text-indigo-400 italic' : 'text-gray-400'}`}>
                                                {out.type === 'system' ? `[SYSTEM] ${out.message}` : `> ${out.message}`}
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span>$</span>
                                            <div className="w-2 h-4 bg-gray-600 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        </Group>
                    </Panel>

                    {/* Right Panel: Interviewer Tools (Interviewer Only) */}
                    {isInterviewer && (
                        <>
                            <Separator className="w-1 bg-[#222] hover:bg-indigo-500/50 transition-colors" />
                            <Panel defaultSize={25} minSize={20}>
                                <aside className="h-full bg-[#0f0f0f] flex flex-col overflow-hidden">
                                    <div className="p-6 border-b border-[#222]">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
                                            <Zap className="w-3 h-3" />
                                            Interviewer Tools
                                        </h3>

                                        <div className="space-y-4">
                                            <button
                                                onClick={() => setShowProblemSelector(true)}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Send className="w-4 h-4" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Push Problem</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>

                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Private Notes</span>
                                                    <FileText className="w-3 h-3 text-gray-600" />
                                                </div>
                                                <textarea
                                                    value={interviewerNotes}
                                                    onChange={(e) => setInterviewerNotes(e.target.value)}
                                                    placeholder="Write feedback, observations, or internal scores..."
                                                    className="w-full h-32 bg-transparent text-xs text-gray-300 resize-none focus:outline-none placeholder:text-gray-700 font-medium"
                                                />
                                            </div>

                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Internal Solution</span>
                                                    <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                                </div>
                                                <div className="bg-[#0a0a0a] rounded-xl p-3 font-mono text-[10px] text-gray-600 whitespace-pre">
                                                    {`// Solution Sketch\nfunction solve(n) {\n  return n > 0;\n}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto p-6 space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                            <Sparkles className="w-3 h-3 text-yellow-500" />
                                            Candidate Score
                                        </div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} className="h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-xs">
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                            </Panel>
                        </>
                    )}
                </Group>
            </div>

            {/* Daily.co Video Call UI */}
            <div className="fixed bottom-24 right-8 z-50 flex flex-col items-end gap-6 pointer-events-none">
                <AnimatePresence>
                    {isCallActive && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="flex flex-col gap-4 pointer-events-auto cursor-move active:scale-95 transition-transform"
                        >
                            <div className="w-[400px] h-[300px] bg-[#1a1a1a] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl relative group ring-4 ring-indigo-500/10">
                                <div ref={dailyContainerRef} className="w-full h-full" />
                            </div>

                            <div className="flex items-center justify-center gap-2 p-2.5 bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl self-center">
                                <button
                                    onClick={toggleAudio}
                                    className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isMuted ? <Mic className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isVideoOff ? <Video className="w-4 h-4 fill-current" /> : <Video className="w-4 h-4" />}
                                </button>

                                <button
                                    onClick={() => dailyCall?.requestFullscreen()}
                                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                    title="Fullscreen"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>

                                <div className="w-[1px] h-6 bg-white/10 mx-2" />
                                <button
                                    onClick={() => setIsCallActive(false)}
                                    className="p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-xl shadow-red-600/30"
                                >
                                    <VideoOff className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Problem Selector Modal */}
            <AnimatePresence>
                {showProblemSelector && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProblemSelector(false)}
                            className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl bg-gray-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-white/5">
                                <h3 className="text-2xl font-black text-white mb-6">Select a Problem</h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search problems to push..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {filteredProblems.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePushProblem(p)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                <Code className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-white mb-0.5">{p.title}</div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${p.difficulty === 'easy' ? 'text-green-500' : 'text-orange-500'}`}>
                                                    {p.difficulty}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Acceptance</div>
                                                <div className="text-xs font-bold text-white">{p.acceptance_rate}%</div>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                                                Push to Room
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
