import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Panel, Group, Separator } from 'react-resizable-panels';
import {
    Code,
    Activity,
    Users as UsersIcon,
    Mic,
    MicOff,
    Video,
    VideoOff,
    Search,
    CheckCircle2,
    ScreenShare,
    FileText
} from 'lucide-react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { Excalidraw } from "@excalidraw/excalidraw";
import debounce from 'lodash.debounce';
import CollaborativeEditor from '../components/workspace/CollaborativeEditor';
import { useAuth } from '../contexts/AuthContext';
import { ENV_CONFIG } from '../env_config';
import OnlineJudge from '../services/OnlineJudge';
import "@excalidraw/excalidraw/index.css";

const problemsData = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        exampleInput: 'nums = [2,7,11,15], target = 9',
        exampleOutput: '[0, 1]'
    },
    {
        id: 'palindrome-number',
        title: 'Palindrome Number',
        difficulty: 'Easy',
        category: 'Math',
        description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
        exampleInput: 'x = 121',
        exampleOutput: 'true'
    },
    {
        id: 'valid-parentheses',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        category: 'Stacks',
        description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
        exampleInput: 's = "()"',
        exampleOutput: 'true'
    },
    {
        id: 'reverse-linked-list',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        category: 'Linked Lists',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        exampleInput: 'head = [1,2,3,4,5]',
        exampleOutput: '[5,4,3,2,1]'
    },
    {
        id: 'valid-anagram',
        title: 'Valid Anagram',
        difficulty: 'Easy',
        category: 'Strings',
        description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
        exampleInput: 's = "anagram", t = "nagaram"',
        exampleOutput: 'true'
    },
    {
        id: 'max-subarray',
        title: 'Maximum Subarray',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        description: 'Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
        exampleInput: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        exampleOutput: '6'
    }
];

const getSocketURL = () => {
    if (ENV_CONFIG.VITE_COLLAB_SERVER_URL) return ENV_CONFIG.VITE_COLLAB_SERVER_URL;
    if (typeof window === 'undefined') return 'http://localhost:1234';
    if (window.location.hostname === 'localhost' || window.location.port === '5173') {
        return `http://${window.location.hostname}:1234`;
    }
    return `https://${window.location.hostname}`;
};

const socket = io(getSocketURL());

export default function OnlineInterview() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'problem' | 'whiteboard' | 'chat' | 'insights'>('problem');
    const [currentProblem, setCurrentProblem] = useState<any>(problemsData[0]);
    const [terminalOutput, setTerminalOutput] = useState<any[]>([]);

    // UI State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [interviewerNotes, setInterviewerNotes] = useState('');
    const [showProblemSelector, setShowProblemSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCallActive, setIsCallActive] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [code, setCode] = useState('');
    const [isJitsiLoaded, setIsJitsiLoaded] = useState(!!(window as any).JitsiMeetExternalAPI);

    const [videoSize, setVideoSize] = useState({ width: '35vw', height: '45vh' });
    const [videoPos, setVideoPos] = useState({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.48 });
    const [isResizing, setIsResizing] = useState(false);
    const [isVideoMaximized, setIsVideoMaximized] = useState(false);
    const dragControls = useDragControls();
    const workspaceRef = useRef<HTMLDivElement>(null);

    const terminalEndRef = useRef<HTMLDivElement>(null);

    const addTerminalMessage = useCallback((msg: any | any[]) => {
        setTerminalOutput(prev => {
            const updates = Array.isArray(msg) ? msg : [msg];
            const newOutput = [...prev, ...updates];
            return newOutput.length > 100 ? newOutput.slice(-100) : newOutput;
        });
    }, []);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    // Diagnostic Pulse to verify latest code
    useEffect(() => {
        addTerminalMessage({ type: 'system', message: '🧠 Neural_Link: Collaboration Master [v3.0-Master] Active' });
        console.log('🚀 SYSTEM: OnlineInterview [v3.0-Master] Initialized.');
    }, [addTerminalMessage]);

    const copyInviteLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
            addTerminalMessage({ type: 'system', message: '📋 Invite link copied to clipboard!' });
        });
    };

    const [jitsiApi, setJitsiApi] = useState<any>(null);
    const [jitsiContainer, setJitsiContainer] = useState<HTMLDivElement | null>(null);

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

    // 1. Simplified Jitsi Loader: Leverage index.html script or inject if missing
    useEffect(() => {
        const checkJitsi = () => {
            if ((window as any).JitsiMeetExternalAPI) {
                console.log('🎬 Jitsi: API detected');
                if (!isJitsiLoaded) setIsJitsiLoaded(true);
                return true;
            }
            return false;
        };

        if (checkJitsi()) return;

        const interval = setInterval(() => {
            if (checkJitsi()) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [isJitsiLoaded]);

    // 2. Jitsi Initialization Logic
    useEffect(() => {
        // Critical: Only initialize if everything is ready
        if (!roomId || !user?.email || !isCallActive || !jitsiContainer || jitsiApi || !isJitsiLoaded) {
            return;
        }

        const userIdentifier = user.email;
        addTerminalMessage({ type: 'system', message: '🛠️ Jitsi: Spawning Integrated Video Link...' });
        console.log('🎬 Jitsi: Spawning instance...', { roomId, user: userIdentifier, container: !!jitsiContainer });

        try {
            const domain = 'meet.jit.si';
            const options = {
                roomName: `codeforge-${roomId}-${ENV_CONFIG.VITE_COLLAB_SERVER_URL ? 'prod' : 'dev'}`,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainer,
                userInfo: {
                    displayName: userIdentifier.split('@')[0] || 'Anonymous'
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    p2p: { enabled: true }
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'fullscreen', 'fittowindow', 'hangup', 'chat', 'settings', 'videoquality'
                    ],
                    SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
                    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    RECENT_LIST_ENABLED: false
                }
            };

            const api = new (window as any).JitsiMeetExternalAPI(domain, options);
            setJitsiApi(api);

            api.addEventListeners({
                readyToClose: () => setIsCallActive(false),
                videoConferenceJoined: () => {
                    console.log('🎬 Jitsi: Joined successfully');
                    addTerminalMessage({ type: 'system', message: '🤝 Jitsi: Tactical Video Link Operational.' });
                },
                participantJoined: (participant: any) => {
                    addTerminalMessage({ type: 'system', message: `👤 Jitsi: Remote Signal Detected - ${participant.displayName}` });
                },
                videoConferenceLeft: () => {
                    console.log('🎬 Jitsi: Conference left');
                    setJitsiApi(null);
                }
            });

            return () => {
                console.log('🎬 Jitsi: Disposing instance');
                api.dispose();
                setJitsiApi(null);
            };
        } catch (err) {
            console.error('🎬 Jitsi: Fatal initialization error:', err);
            addTerminalMessage({ type: 'error', message: '🚫 Jitsi: Integrated Link Failed to Mount.' });
        }
    }, [roomId, user?.email, isCallActive, isJitsiLoaded, jitsiContainer, addTerminalMessage]); // Removed jitsiApi here

    const [isInterviewer, setIsInterviewer] = useState(false);
    const isInterviewerRef = useRef(false);

    useEffect(() => {
        if (!roomId || !user?.email || !isCallActive) return;

        const handleRoleAssigned = async ({ role }: { role: 'interviewer' | 'candidate' }) => {
            const isCaller = role === 'interviewer';
            setIsInterviewer(isCaller);
            isInterviewerRef.current = isCaller;
        };

        socket.on('role-assigned', handleRoleAssigned);
        socket.emit('join-room', { roomId, userName: user.email || 'Anonymous' });

        return () => {
            socket.off('role-assigned', handleRoleAssigned);
        };
    }, [roomId, user?.email, isCallActive]);

    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<SocketIOProvider | null>(null);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const isSyncingRef = useRef(false);
    const hasLoadedInitialSync = useRef(false);
    const isProviderSyncedRef = useRef(false);
    const lastRemoteUpdateRef = useRef(0);
    const entryTimestamp = useRef(Date.now());

    // 1. Permanent Neural Link (Yjs Provider) - Stays active even if tab changes
    useEffect(() => {
        if (!roomId || !user?.email) return;

        const whiteboardRoomId = `${roomId}-whiteboard`;
        console.log(`🎨 Canvas: Initializing Neural Link [${whiteboardRoomId}]`);

        const provider = new SocketIOProvider(getSocketURL(), whiteboardRoomId, yDocRef.current, { autoConnect: true });
        providerRef.current = provider;

        provider.on('sync', (isSynced: boolean) => {
            if (isSynced) {
                console.log('🎨 Canvas: Neural State Synchronized (Yjs).');
                isProviderSyncedRef.current = true;
                entryTimestamp.current = Date.now(); // Mark entry time
                addTerminalMessage({ type: 'system', message: '🎨 Canvas: Neural Link Established.' });
                // Request current problem state if we just synced
                socket.emit('request-problem-state', { roomId });
            }
        });

        provider.on('connection-error', (err: any) => {
            console.error('🎨 Canvas: Neural Link Connection Error', err);
            addTerminalMessage({ type: 'error', message: '🎨 Canvas: Neural Link Connection Error' });
        });

        // Handle other global socket events here to keep them stable
        socket.on('problem-pushed', (problem) => {
            setCurrentProblem(problem);
            addTerminalMessage({ type: 'system', message: `Problem pushed: ${problem.title}` });
        });

        socket.on('sync-problem-state', (problem) => {
            if (problem && !currentProblem) {
                setCurrentProblem(problem);
            }
        });

        socket.on('request-problem-state', () => {
            if (isInterviewerRef.current && currentProblem) {
                socket.emit('sync-problem-state', { roomId, problem: currentProblem });
            }
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
            provider.disconnect();
            socket.off('problem-pushed');
            socket.off('execution-result');
            socket.off('sync-problem-state');
            socket.off('request-problem-state');
        };
    }, [roomId, user?.email, addTerminalMessage]);

    // 2. Transient UI Bridge (Excalidraw <-> Yjs) - Only active when Whiteboard is mounted
    useEffect(() => {
        if (!excalidrawAPI) return;

        console.log('🎨 Canvas: UI Bridge Mounted.');
        const yMap = yDocRef.current.getMap('excalidraw-elements-map');

        const handleYjsChange = (event: Y.YMapEvent<any>) => {
            // 1. Ignore our own transactions
            if (event.transaction.local) return;

            // 2. Mark remote update time for echo-suppression
            lastRemoteUpdateRef.current = Date.now();
            isSyncingRef.current = true; // Temporary lock for updateScene

            try {
                const elements = Array.from(yMap.values());
                console.log(`🎨 Canvas: Receipt [${elements.length} elements]`);

                // Absolute Update
                excalidrawAPI.updateScene({ elements });

                if (!hasLoadedInitialSync.current) {
                    hasLoadedInitialSync.current = true;
                }
            } catch (err) {
                console.error('🎨 Canvas: Integration Error', err);
            } finally {
                // Release the lock almost immediately
                setTimeout(() => { isSyncingRef.current = false; }, 50);
            }
        };

        yMap.observe(handleYjsChange);

        // Initial Scene Load - Slight delay to ensure API is ready
        setTimeout(() => {
            if (hasLoadedInitialSync.current) return; // Already loaded via observe
            const elements = Array.from(yMap.values());
            console.log('🎨 Canvas: Manual Initial Scene Load...', { elementCount: elements.length });
            if (elements.length > 0) {
                excalidrawAPI.updateScene({ elements });
            }
            hasLoadedInitialSync.current = true;
            entryTimestamp.current = Date.now();
        }, 1200);

        return () => {
            console.log('🎨 Canvas: UI Bridge Unmounting.');
            yMap.unobserve(handleYjsChange);
        };
    }, [excalidrawAPI]);

    const debouncedSyncToYjs = useRef(
        debounce((elements: any[]) => {
            // 1. Neural Handshake: Ignore changes shortly after receiving a remote update
            // This prevents the "Echo Loop" without blocking real user drawing.
            const timeSinceRemoteUpdate = Date.now() - lastRemoteUpdateRef.current;
            if (timeSinceRemoteUpdate < 300) return;

            // 2. State Readiness
            if (!roomId || !isProviderSyncedRef.current || !hasLoadedInitialSync.current) return;

            const yMap = yDocRef.current.getMap('excalidraw-elements-map');

            yDocRef.current.transact(() => {
                let changes = 0;
                const timeSinceEntry = Date.now() - entryTimestamp.current;

                // 3. Smart Recovery: If local is empty but remote has content, 
                // and it's early in the session, FORCE a re-sync instead of wiping.
                if (elements.length === 0 && yMap.size > 0 && timeSinceEntry < 10000) {
                    console.log('🎨 Canvas: Smart Recovery Triggered (Preventing Wipe)');
                    const remoteState = Array.from(yMap.values());
                    excalidrawAPI.updateScene({ elements: remoteState });
                    return;
                }

                // 4. Parity Update
                elements.forEach(el => {
                    const existing = yMap.get(el.id) as any;
                    // Efficient comparison using version tags
                    if (!existing || existing.version !== el.version || existing.isDeleted !== el.isDeleted) {
                        yMap.set(el.id, el);
                        changes++;
                    }
                });

                // 5. Cleanup
                if (elements.length > 0) {
                    const localIds = new Set(elements.map(e => e.id));
                    yMap.forEach((_, id) => {
                        if (!localIds.has(id)) {
                            yMap.delete(id);
                            changes++;
                        }
                    });
                }

                if (changes > 0) {
                    console.log(`🎨 Canvas: Propagation [${changes} elements]`);
                }
            });
        }, 150)
    ).current;

    const handleExcalidrawChange = (elements: readonly any[]) => {
        if (isSyncingRef.current) return;
        debouncedSyncToYjs(elements as any[]);
    };

    const handleRun = async () => {
        if (!currentProblem || !user) return;
        setIsRunning(true);
        addTerminalMessage({ type: 'system', message: '🚀 Execution_Link: Initializing Sandbox...' });

        try {
            const judge = OnlineJudge.getInstance();
            const result = await judge.runCode({
                language: 'javascript', // Default for now, can be expanded
                code: code,
                fnName: currentProblem.id === 'two-sum' ? 'twoSum' : 'solve',
                testCases: [{
                    input: currentProblem.exampleInput,
                    expectedOutput: currentProblem.exampleOutput,
                    isHidden: false
                }],
                timeLimit: 5000,
                memoryLimit: 128
            });

            const testResults = result.status === 'Accepted'
                ? [{ input: currentProblem.exampleInput, passed: true }]
                : [{ input: currentProblem.exampleInput, passed: false }];

            socket.emit('code-execution', {
                roomId,
                userName: user.email,
                result: { testCases: testResults }
            });

            if (result.status === 'Accepted') {
                addTerminalMessage({ type: 'output', message: '✅ Success: All test cases passed Protocol_Verification.' });
            } else {
                addTerminalMessage({ type: 'error', message: `❌ Failed: ${result.error || result.status}` });
                if (result.output) {
                    addTerminalMessage({ type: 'output', message: `Actual: ${result.output}` });
                }
            }

        } catch (err) {
            console.error('Execution error:', err);
            addTerminalMessage({ type: 'error', message: '🚫 Error: Execution Pipeline Breach.' });
        } finally {
            setIsRunning(false);
        }
    };

    const handlePushProblem = (problem: any) => {
        socket.emit('push-problem', { roomId, problem });
        setShowProblemSelector(false);
    };

    const filteredProblems = problemsData.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen bg-[#020202] text-gray-400 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 relative">
            {/* Immersive Environment Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.08),transparent_70%)]" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            </div>

            {/* Nexus Header - Ultra Streamlined */}
            <header className="h-14 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-8 z-40 shrink-0 relative">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg border border-white/20">
                        <Code className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-[11px] font-black tracking-tight uppercase italic">Nexus_Protocol</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none">Node: {roomId?.slice(0, 8)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all cursor-pointer group" onClick={copyInviteLink}>
                        <UsersIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Share_Link</span>
                        {showCopied && <CheckCircle2 className="w-3 h-3 text-green-500 ml-1" />}
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${isInterviewer ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        <div className={`w-1 h-1 rounded-full ${isInterviewer ? 'bg-violet-400' : 'bg-emerald-400'} animate-pulse`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{isInterviewer ? 'Host' : 'Candidate'}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative z-10">
                <Group orientation="horizontal">
                    {/* Integrated Tactical Sidebar (Now Left) */}
                    <Panel defaultSize={28} minSize={20} className="bg-[#050505] border-r border-white/5">
                        <div className="h-full flex flex-col bg-white/[0.01]">
                            <div className="flex h-12 border-b border-white/5 shrink-0 z-[40] bg-[#050505] relative shadow-lg">
                                <button onClick={() => setActiveTab('problem')} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'problem' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                    Problem
                                    {activeTab === 'problem' && <motion.div layoutId="tabActive" className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500" />}
                                </button>
                                <button onClick={() => setActiveTab('whiteboard')} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'whiteboard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                    Canvas
                                    {activeTab === 'whiteboard' && <motion.div layoutId="tabActive" className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500" />}
                                </button>
                                {isInterviewer && (
                                    <button onClick={() => setActiveTab('chat')} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'chat' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                        Notes
                                        {activeTab === 'chat' && <motion.div layoutId="tabActive" className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500" />}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 relative overflow-hidden bg-black/40">
                                {/* Tab Content Layer (Problem & Notes) */}
                                <div className={`h-full overflow-auto custom-scrollbar p-6 relative transition-all duration-300 ${activeTab === 'whiteboard' ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-[30]'}`}>
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'problem' && (
                                            <motion.div key="problem-tab" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6 relative">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-black text-white italic tracking-tight">{currentProblem?.title}</h3>
                                                    <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-widest">{currentProblem?.difficulty}</div>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-gray-400 bg-white/[0.02] p-6 rounded-3xl border border-white/5 italic">
                                                    {currentProblem?.description}
                                                </p>
                                                <div className="space-y-4">
                                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 opacity-50">// System_Protocol_Params</div>
                                                    <pre className="text-[10px] bg-black/60 border border-white/5 p-6 rounded-2xl font-mono text-indigo-300 overflow-x-auto shadow-inner">
                                                        {currentProblem?.exampleInput}
                                                    </pre>
                                                </div>
                                                {isInterviewer && (
                                                    <button
                                                        onClick={() => setShowProblemSelector(true)}
                                                        className="w-full h-14 rounded-3xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-indigo-500/30 transition-all mt-6 shadow-xl relative z-[50]"
                                                    >
                                                        Change_Protocol
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                        {activeTab === 'chat' && isInterviewer && (
                                            <motion.div key="notes-tab" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex flex-col h-full space-y-4 relative z-10">
                                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">// Private_Observation_Log</div>
                                                <textarea
                                                    value={interviewerNotes}
                                                    onChange={(e) => setInterviewerNotes(e.target.value)}
                                                    placeholder="Enter subject assessment..."
                                                    className="flex-1 w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] text-gray-300 resize-none focus:outline-none focus:border-indigo-500/40 font-medium placeholder:text-gray-700 custom-scrollbar"
                                                />
                                                <button className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/10 hover:scale-[1.02] active:scale-95 transition-all relative z-20">Commit_Intel</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Persistent Whiteboard Layer */}
                                <div
                                    data-nexus-canvas-stable="true"
                                    className={`absolute inset-0 p-6 transition-opacity duration-300 ${activeTab === 'whiteboard' ? 'opacity-100 z-[10] pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                                >
                                    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-4xl bg-black/80 ring-1 ring-white/5 relative">
                                        {/* @ts-ignore */}
                                        <Excalidraw theme="dark" onChange={handleExcalidrawChange} excalidrawAPI={(api) => setExcalidrawAPI(api)} />
                                        {/* Diagnostic Marker */}
                                        <div className="absolute top-2 left-2 text-[6px] font-black text-indigo-500/50 uppercase tracking-widest z-50 pointer-events-none">Layer_Active</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <Separator className="w-[1px] bg-white/5 hover:bg-indigo-500/30 transition-colors cursor-col-resize" />

                    {/* Main Workspace (Now Right) */}
                    <Panel defaultSize={72} minSize={60} className="relative">
                        <div ref={workspaceRef} className="h-full flex flex-col bg-black/20 backdrop-blur-sm">
                            <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Primary_Workspace.exe</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1 mr-2">
                                        <button onClick={toggleAudio} title={isMuted ? "Power On Mic" : "Mute Signal"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={toggleVideo} title={isVideoOff ? "Initialize Visual" : "Disable Feed"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => setIsVideoMaximized(!isVideoMaximized)}
                                            title={isVideoMaximized ? "Exit Cinema Mode" : "Maximize Visual Focus"}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isVideoMaximized ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <ScreenShare className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all group">
                                        <FileText className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                        {isRunning ? 'Busy...' : 'Execute_Phase'}
                                    </button>

                                    <div className="w-[1px] h-4 bg-white/10 mx-1" />

                                    <button onClick={() => navigate('/')} className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest">Terminate</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CollaborativeEditor
                                    roomId={roomId || ''}
                                    userName={user?.email || 'Anonymous'}
                                    userColor="#8b5cf6"
                                    language="javascript"
                                    onLanguageChange={() => { }}
                                    onChange={(v) => setCode(v)}
                                />
                            </div>

                            {/* Collapsible Tactical Terminal */}
                            <div className="h-40 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl p-5 font-mono text-[10px] overflow-auto custom-scrollbar">
                                <div className="flex items-center gap-2 mb-3 opacity-30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                    <span className="uppercase tracking-[0.2em]">System_Logs_Initialized</span>
                                </div>
                                {terminalOutput.map((log, i) => (
                                    <div key={i} className={`mb-1.5 flex gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'system' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                        <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        <span>{log.message}</span>
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                        </div>
                    </Panel>
                </Group>
            </main>



            {/* Problem Selector Overlay */}
            <AnimatePresence>
                {showProblemSelector && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-black/90 backdrop-blur-2xl">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-[#080808] border border-white/5 rounded-[4rem] overflow-hidden shadow-4xl flex flex-col max-h-[75vh]">
                            <div className="p-12 border-b border-white/5 bg-white/[0.01]">
                                <h3 className="text-4xl font-black text-white mb-8 italic tracking-tighter">PROTOCOL_REGISTRY</h3>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 z-10" />
                                    <input type="text" placeholder="Scan identification codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold placeholder:text-gray-700 relative z-10 backdrop-blur-xl" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                                {filteredProblems.map((p) => (
                                    <button key={p.id} onClick={() => handlePushProblem(p)} className="w-full flex items-center justify-between p-7 rounded-[2.5rem] hover:bg-white/5 group transition-all border border-transparent hover:border-white/5">
                                        <div className="text-left">
                                            <div className="font-black text-white text-xl tracking-tight italic group-hover:text-indigo-400 transition-colors uppercase">{p.title}</div>
                                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                <span className="text-indigo-500/50">LEVEL:</span> {p.difficulty}
                                                <span className="mx-1">•</span>
                                                <span className="text-indigo-500/50">TAGS:</span> {p.category}
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all">Initialize</div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowProblemSelector(false)} className="absolute top-8 right-12 text-gray-600 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">Close [Esc]</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Floating Resizable Video Overlay */}
            <motion.div
                drag={!isVideoMaximized}
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragElastic={0}
                animate={isVideoMaximized ? {
                    top: (workspaceRef.current?.getBoundingClientRect().top ?? 80) + 48,
                    left: workspaceRef.current?.getBoundingClientRect().left ?? '28%',
                    width: workspaceRef.current?.offsetWidth ?? '72%',
                    height: (workspaceRef.current?.offsetHeight ?? 0) - 48,
                    x: 0,
                    y: 0,
                    borderRadius: '0px',
                    zIndex: 40
                } : {
                    top: 0,
                    left: 0,
                    x: videoPos.x,
                    y: videoPos.y,
                    width: videoSize.width,
                    height: videoSize.height,
                    borderRadius: '24px',
                    zIndex: 1000
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onDragEnd={(_, info) => setVideoPos({ x: info.point.x, y: info.point.y })}
                style={{
                    position: 'fixed' as const,
                    cursor: isVideoMaximized ? 'default' : (isResizing ? 'nwse-resize' : 'grab')
                }}
                className="bg-[#080808] border border-white/10 shadow-4xl overflow-hidden group ring-1 ring-white/5"
            >
                {/* Drag Handle Bar - Only visible when NOT maximized */}
                {!isVideoMaximized && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="drag-handle absolute top-0 left-0 right-0 h-10 z-30 cursor-grab active:cursor-grabbing flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent opacity-100 transition-opacity"
                    >
                        <div className="w-12 h-1 bg-white/40 rounded-full" />
                    </div>
                )}

                <div ref={setJitsiContainer} className="absolute inset-0 z-10" />

                {/* Visual Placemarker */}
                <div className="absolute inset-0 flex items-center justify-center z-0 bg-black/40 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <UsersIcon className="w-12 h-12 text-white animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Integrated_Visual_Relay</span>
                    </div>
                </div>

                {/* Resize Handle */}
                <div
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = parseInt(String(videoSize.width).replace('vw', '')) * window.innerWidth / 100;
                        const startHeight = parseInt(String(videoSize.height).replace('vh', '')) * window.innerHeight / 100;

                        const onMouseMove = (moveEvent: MouseEvent) => {
                            const newWidth = startWidth + (moveEvent.clientX - startX);
                            const newHeight = startHeight + (moveEvent.clientY - startY);
                            setVideoSize({
                                width: `${(newWidth / window.innerWidth) * 100}vw`,
                                height: `${(newHeight / window.innerHeight) * 100}vh`
                            });
                        };

                        const onMouseUp = () => {
                            setIsResizing(false);
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-50 flex items-center justify-center group/handle"
                >
                    <div className="w-1 h-1 bg-white/20 rounded-full mb-1 mr-1 group-hover/handle:bg-indigo-500 scale-1" />
                    <div className="w-1 h-1 bg-white/20 rounded-full mb-1 mr-1 group-hover/handle:bg-indigo-500" />
                </div>

                {/* Info Bar */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-[9px] font-black text-white/80 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                        Live_Transmission: {user?.email?.split('@')[0]}
                    </div>
                </div>
            </motion.div>
        </div >
    );
}
