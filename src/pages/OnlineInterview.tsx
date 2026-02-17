import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, Group, Separator } from 'react-resizable-panels';
import {
    Video,
    VideoOff,
    Mic,
    Terminal as TerminalIcon,
    LogOut,
    Code,
    Search,
    FileText,
    Zap,
    Sparkles,
    CheckCircle2,
    RefreshCw,
    Maximize2,
    LayoutGrid,
    Info,
    Settings,
    MoreVertical,
    ScreenShare,
    Users as UsersIcon,
    Activity,
    Lock
} from 'lucide-react';
import { io } from 'socket.io-client';
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

    const [activeTab, setActiveTab] = useState<'problem' | 'whiteboard' | 'chat' | 'insights'>('problem');
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
    const [jitsiApi, setJitsiApi] = useState<any>(null);
    const jitsiContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!roomId || !user || !isCallActive || !jitsiContainerRef.current || jitsiApi) return;

        // Jitsi Meet External API is loaded in index.html
        if (!(window as any).JitsiMeetExternalAPI) {
            console.error('🎬 Jitsi: API not loaded');
            addTerminalMessage({ type: 'system', message: '❌ Call Error: Video engine not ready. Please refresh.' });
            return;
        }

        console.log('🎬 Jitsi: Initializing call for room:', roomId);

        const domain = 'meet.jit.si';
        const options = {
            roomName: `codeforge-${roomId}`,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: user.email?.split('@')[0] || 'Anonymous'
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: false,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'fullscreen', 'fittowindow', 'hangup', 'chat', 'settings', 'videoquality'
                ],
                SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
                SHOW_PROMOTIONAL_CLOSE_PAGE: false
            }
        };

        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        setJitsiApi(api);

        api.addEventListeners({
            readyToClose: () => setIsCallActive(false),
            videoConferenceJoined: () => {
                addTerminalMessage({ type: 'system', message: '🤝 Connection: Jitsi Global SFU Established!' });
            },
            participantJoined: (participant: any) => {
                addTerminalMessage({ type: 'system', message: `👤 Participant joined: ${participant.displayName}` });
            }
        });

        return () => {
            console.log('🎬 Jitsi: Disposing call');
            api.dispose();
            setJitsiApi(null);
        };
    }, [roomId, user, isCallActive]);

    const toggleAudio = useCallback(() => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleAudio');
            setIsMuted(!isMuted);
        }
    }, [jitsiApi, isMuted]);

    const toggleVideo = useCallback(() => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleVideo');
            setIsVideoOff(!isVideoOff);
        }
    }, [jitsiApi, isVideoOff]);

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
        <div className="h-screen bg-[#050505] text-gray-400 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Top Navigation */}
            <header className="h-14 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Code className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-xs font-black tracking-tight uppercase">CodeForge <span className="text-indigo-400">Live</span></span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protocol v4.2</span>
                        </div>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={copyInviteLink}>
                        <UsersIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Room: {roomId}</span>
                        {showCopied && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-1" />}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isInterviewer ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {isInterviewer ? 'Host / Interviewer' : 'Candidate'}
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        End Session
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Activity Bar (Vertical) */}
                <nav className="w-16 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 gap-4 z-30 shrink-0">
                    <button
                        onClick={() => setActiveTab('problem')}
                        className={`p-3 rounded-2xl transition-all relative group ${activeTab === 'problem' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Problem Statement"
                    >
                        <FileText className="w-5 h-5" />
                        {activeTab === 'problem' && <motion.div layoutId="activeTab" className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('whiteboard')}
                        className={`p-3 rounded-2xl transition-all relative group ${activeTab === 'whiteboard' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Canvas Whiteboard"
                    >
                        <LayoutGrid className="w-5 h-5" />
                        {activeTab === 'whiteboard' && <motion.div layoutId="activeTab" className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`p-3 rounded-2xl transition-all relative group ${activeTab === 'insights' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Interview Insights"
                    >
                        <Activity className="w-5 h-5" />
                        {activeTab === 'insights' && <motion.div layoutId="activeTab" className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r-full" />}
                    </button>

                    <div className="mt-auto flex flex-col items-center gap-4">
                        <button className="p-3 rounded-2xl text-gray-600 hover:text-white hover:bg-white/5 transition-all">
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 border border-white/20 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                            {user?.email?.[0].toUpperCase() || 'A'}
                        </div>
                    </div>
                </nav>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    <Group orientation="horizontal">
                        {/* Left Content Area (Problem/Whiteboard) */}
                        <Panel defaultSize={22} minSize={15} className="bg-[#080808]">
                            <div className="h-full flex flex-col border-r border-white/5">
                                <div className="h-12 flex items-center px-6 border-b border-white/5 bg-black/20">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                        {activeTab === 'problem' && <><FileText className="w-3 h-3" /> Description</>}
                                        {activeTab === 'whiteboard' && <><LayoutGrid className="w-3 h-3" /> Whiteboard</>}
                                        {activeTab === 'insights' && <><Activity className="w-3 h-3" /> Live Insights</>}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'problem' && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="h-full overflow-y-auto p-6 space-y-8"
                                            >
                                                {currentProblem ? (
                                                    <>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${currentProblem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                                    {currentProblem.difficulty}
                                                                </span>
                                                                <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">350 Points</span>
                                                            </div>
                                                            <h2 className="text-3xl font-black text-white tracking-tight mb-4">{currentProblem.title}</h2>
                                                            <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed">
                                                                <p>{currentProblem.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Examples</h3>
                                                            {currentProblem.examples?.map((ex: any, i: number) => (
                                                                <div key={i} className="group bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                                                                    <div className="flex flex-col gap-4 font-mono text-xs">
                                                                        <div><span className="text-gray-500 block mb-1 uppercase text-[9px] font-black">Input</span> <div className="text-indigo-300 bg-indigo-500/5 p-2 rounded-lg">{ex.input}</div></div>
                                                                        <div><span className="text-gray-500 block mb-1 uppercase text-[9px] font-black">Output</span> <div className="text-emerald-300 bg-emerald-500/5 p-2 rounded-lg">{ex.output}</div></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                                                        <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center animate-pulse">
                                                            <Sparkles className="w-8 h-8 text-indigo-500/50" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-black text-sm uppercase tracking-widest">Protocol Initializing</h3>
                                                            <p className="text-gray-500 text-xs mt-2 font-medium leading-relaxed">Waiting for the interviewer to broadcast a challenge to the secure room.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                        {activeTab === 'whiteboard' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-[#0a0a0a]"
                                            >
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
                                            </motion.div>
                                        )}
                                        {activeTab === 'insights' && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="h-full p-6 flex flex-col gap-4"
                                            >
                                                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                                        <Zap className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Signal Status</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500">Latency</span>
                                                            <span className="text-emerald-400 font-mono font-bold">14ms</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: '85%' }}
                                                                className="h-full bg-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500">Stability</span>
                                                            <span className="text-indigo-400 font-mono font-bold">99.8%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Logs</h4>
                                                    <div className="space-y-3">
                                                        {terminalOutput.slice(-5).map((log, i) => (
                                                            <div key={i} className="flex gap-3 text-[10px] font-medium leading-tight">
                                                                <span className="text-indigo-500 transition-all group-hover:text-white shrink-0">[{i}]</span>
                                                                <span className="text-gray-400 truncate">{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </Panel>

                        <Separator className="w-[1px] bg-white/5 hover:bg-indigo-500/50 transition-colors" />

                        {/* Center Workspace (Editor) */}
                        <Panel defaultSize={53} minSize={40} className="relative bg-[#0d0d0d]">
                            <div className="h-full flex flex-col">
                                <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 relative z-10 shrink-0">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Main_Engine.js</span>
                                        </div>
                                        <div className="h-4 w-[1px] bg-white/10" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Language</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">JavaScript</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRun}
                                            disabled={isRunning || !currentProblem}
                                            className="h-8 px-4 flex items-center gap-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{isRunning ? 'Compiling...' : 'Run Prototype'}</span>
                                        </button>
                                        <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 relative">
                                    <CollaborativeEditor
                                        roomId={roomId || 'default'}
                                        userName={user?.email || 'User'}
                                        userColor={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                                        language="javascript"
                                        onLanguageChange={() => { }}
                                    />

                                    {/* Glass Terminal Overlay (Bottom) */}
                                    <div className="absolute bottom-6 left-6 right-6 z-20">
                                        <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden max-h-48 flex flex-col transition-all hover:border-white/20">
                                            <div className="h-10 px-6 flex items-center justify-between border-b border-white/5 bg-white/5 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <TerminalIcon className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Secure Environment Logs</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                                                </div>
                                            </div>
                                            <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto space-y-2 custom-scrollbar">
                                                {terminalOutput.map((out, i) => (
                                                    <div key={i} className="flex gap-3 leading-relaxed">
                                                        <span className="text-gray-600 shrink-0">#0{i + 1}</span>
                                                        <span className={out.type === 'system' ? 'text-indigo-400 font-bold italic' : 'text-emerald-400/80'}>
                                                            {out.type === 'system' ? out.message : out.message}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-2 text-indigo-500/50">
                                                    <span className="animate-pulse">_</span>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Awaiting Execution Result</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        <Separator className="w-[1px] bg-white/5 hover:bg-indigo-500/50 transition-colors" />

                        {/* Right Sidebar (Interviewer / Participants) */}
                        <Panel defaultSize={25} minSize={20} className="bg-[#080808]">
                            <div className="h-full flex flex-col border-l border-white/5">
                                {/* Participants Panel */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 shrink-0">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                            <UsersIcon className="w-3 h-3" /> Grid Network
                                        </span>
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            2 Active
                                        </span>
                                    </div>

                                    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto min-h-0 bg-black/20">
                                        <div className="flex-1 min-h-[140px] bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden relative group">
                                            {!isCallActive ? (
                                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                                        <VideoOff className="w-5 h-5 text-red-500/50" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 leading-tight">Video Stream Terminated</span>
                                                </div>
                                            ) : (
                                                <div ref={jitsiContainerRef} className="w-full h-full" />
                                            )}
                                        </div>

                                        {isInterviewer && (
                                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col gap-5 overflow-y-auto">
                                                    <div className="flex items-center justify-between shrink-0">
                                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Activity className="w-3 h-3" /> Dashboard
                                                        </h4>
                                                        <button onClick={() => setShowProblemSelector(true)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                                <span>Private Notes</span>
                                                                <Lock className="w-3 h-3 text-white/10" />
                                                            </div>
                                                            <textarea
                                                                value={interviewerNotes}
                                                                onChange={(e) => setInterviewerNotes(e.target.value)}
                                                                placeholder="Broadcast internal observations..."
                                                                className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-400 resize-none focus:outline-none focus:border-indigo-500/30 transition-all font-medium placeholder:text-gray-800"
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                                <span>Evaluation Factor</span>
                                                                <Sparkles className="w-3 h-3 text-yellow-500/50" />
                                                            </div>
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <button key={n} className="flex-1 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-white transition-all text-xs font-black">
                                                                        {n}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Actions Panel (Bottom of Sidebar) */}
                                    <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
                                        <button
                                            onClick={() => setShowProblemSelector(true)}
                                            className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Update Prototype
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </Group>
                </div>
            </div>

            {/* Bottom Floating Control Bar (Centered) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1.5 ring-1 ring-white/10 ring-inset"
                >
                    <button
                        onClick={toggleAudio}
                        className={`p-3.5 rounded-2xl transition-all relative group shadow-sm ${isMuted ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <Mic className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                        <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3.5 rounded-2xl transition-all relative group shadow-sm ${isVideoOff ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={isVideoOff ? 'Start Video' : 'Stop Video'}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 fill-current" />}
                        <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-2" />

                    <button className="p-3.5 rounded-2xl bg-white/5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Screen Share">
                        <ScreenShare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => jitsiApi?.executeCommand('toggleFullscreen')}
                        className="p-3.5 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                    <button className="p-3.5 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Room Info">
                        <Info className="w-5 h-5" />
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-2" />

                    <button
                        onClick={() => setIsCallActive(!isCallActive)}
                        className={`px-5 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group ${isCallActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'}`}
                    >
                        {isCallActive ? <Lock className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        {isCallActive ? 'Disconnect' : 'Connect Protocol'}
                    </button>
                </motion.div>
            </div>

            {/* Problem Selector Modal (Redesigned) */}
            <AnimatePresence>
                {showProblemSelector && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProblemSelector(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ring-1 ring-white/10"
                        >
                            <div className="p-10 border-b border-white/5 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
                                <h3 className="text-4xl font-black text-white mb-8 tracking-tight">Broadcast <span className="text-indigo-500">Node</span></h3>
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Scan problems by title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-none">
                                {filteredProblems.map((p, idx) => (
                                    <motion.button
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handlePushProblem(p)}
                                        className="w-full flex items-center justify-between p-5 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group overflow-hidden relative"
                                    >
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:rotate-[10deg]">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-white text-lg tracking-tight mb-0.5">{p.title}</div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${p.difficulty === 'easy' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                        {p.difficulty}
                                                    </div>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{p.acceptance_rate}% Acceptance</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400 transition-all">
                                                Initialize
                                            </div>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

