import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    LayoutGrid,
    CheckCircle2,
    LogOut,
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

const problemsData = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        exampleInput: 'nums = [2,7,11,15], target = 9',
        exampleOutput: '[0, 1]'
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
    const [isJitsiLoaded, setIsJitsiLoaded] = useState(!!(window as any).JitsiMeetExternalAPI);
    const [participantCount, setParticipantCount] = useState(1);

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
        addTerminalMessage({ type: 'system', message: '🧠 Neural_Link: Phase 2 Protocol Active [v2.1]' });
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
    const jitsiContainerRef = useRef<HTMLDivElement>(null);

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

    // Dynamic Script Injection & Polling for Jitsi API
    useEffect(() => {
        if (isJitsiLoaded) return;

        // 1. Check if already present
        if ((window as any).JitsiMeetExternalAPI) {
            setIsJitsiLoaded(true);
            return;
        }

        // 2. Inject script if not found in document
        const existingScript = document.querySelector('script[src*="meet.jit.si/external_api.js"]');
        if (!existingScript) {
            console.log('🎬 Jitsi: Injecting script tag dynamically...');
            const script = document.createElement('script');
            script.id = "jitsi-external-api-loader";
            script.src = "https://meet.jit.si/external_api.js";
            script.async = true;
            script.onload = () => {
                console.log('🎬 Jitsi: Script loaded via dynamic injection');
                setIsJitsiLoaded(true);
            };
            document.head.appendChild(script);
        }

        // 3. Polling backup with more frequent checks
        const checkJitsi = setInterval(() => {
            if ((window as any).JitsiMeetExternalAPI) {
                console.log('🎬 Jitsi: API detected via polling @ ' + new Date().toLocaleTimeString());
                setIsJitsiLoaded(true);
                clearInterval(checkJitsi);
            }
        }, 500);

        return () => clearInterval(checkJitsi);
    }, [isJitsiLoaded]);

    useEffect(() => {
        if (!roomId || !user || !isCallActive || !jitsiContainerRef.current || jitsiApi || !isJitsiLoaded) {
            if (!isJitsiLoaded && isCallActive && roomId) {
                console.log('🎬 Jitsi: Waiting for script to load...');
            }
            return;
        }

        if (!(window as any).JitsiMeetExternalAPI) {
            console.error('🎬 Jitsi: API still not found despite isJitsiLoaded being true');
            return;
        }

        console.log('🎬 Jitsi: Initializing hub for room:', roomId);

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
                setParticipantCount(prev => prev + 1);
            },
            participantLeft: () => {
                setParticipantCount(prev => Math.max(1, prev - 1));
            }
        });

        return () => {
            api.dispose();
            setJitsiApi(null);
        };
    }, [roomId, user, isCallActive, jitsiApi, addTerminalMessage]);

    const [isInterviewer, setIsInterviewer] = useState(false);
    const isInterviewerRef = useRef(false);

    useEffect(() => {
        if (!roomId || !user || !isCallActive) return;

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
    }, [roomId, user, isCallActive]);

    const yDocRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<SocketIOProvider | null>(null);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

    useEffect(() => {
        if (!roomId || !excalidrawAPI) return;

        const yArray = yDocRef.current.getArray('excalidraw-elements');
        const handleYArrayChange = (event: Y.YArrayEvent<any>) => {
            if (event.transaction.local) return;
            try {
                const elements = yArray.toArray() as any[];
                excalidrawAPI.updateScene({ elements });
            } catch (err) {
                console.error('🎨 Whiteboard: Failed to update scene', err);
            }
        };

        yArray.observe(handleYArrayChange);
        const elements = yArray.toArray();
        if (elements.length > 0) {
            excalidrawAPI.updateScene({ elements });
        }

        return () => {
            yArray.unobserve(handleYArrayChange);
        };
    }, [roomId, excalidrawAPI]);

    const debouncedSyncToYjs = useRef(
        debounce((elements: any[]) => {
            if (!roomId) return;
            const yArray = yDocRef.current.getArray('excalidraw-elements');
            yDocRef.current.transact(() => {
                yArray.delete(0, yArray.length);
                yArray.push(elements);
            });
        }, 200)
    ).current;

    const handleExcalidrawChange = (elements: readonly any[]) => {
        debouncedSyncToYjs(elements as any[]);
    };

    useEffect(() => {
        if (!roomId || !user) return;
        const whiteboardRoomId = `${roomId}-whiteboard`;
        const provider = new SocketIOProvider(getSocketURL(), whiteboardRoomId, yDocRef.current, { autoConnect: true });
        providerRef.current = provider;

        provider.on('sync', (isSynced: boolean) => {
            if (isSynced && excalidrawAPI) {
                const yArray = yDocRef.current.getArray('excalidraw-elements');
                const elements = yArray.toArray();
                if (elements.length > 0) {
                    excalidrawAPI.updateScene({ elements });
                }
            }
        });

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
            provider.disconnect();
            socket.off('problem-pushed');
            socket.off('execution-result');
        };
    }, [roomId, user, excalidrawAPI, addTerminalMessage]);

    const handleRun = async () => {
        if (!currentProblem) return;
        setIsRunning(true);
        const mockResult = {
            testCases: [{ input: currentProblem.exampleInput, passed: true }]
        };
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
        <div className="h-screen bg-[#020202] text-gray-400 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 relative">
            {/* Immersive Environment Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <motion.div
                    animate={{ opacity: [0.1, 0.15, 0.1], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full"
                />
            </div>

            {/* Cinematic Top Navigation */}
            <header className="h-16 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 z-40 shrink-0 relative">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 animate-pulse" />
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg relative z-10 border border-white/20">
                                <Code className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-black tracking-tighter uppercase italic">CodeForge</span>
                                <div className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Live_Protocol</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">{roomId} // NODE_SECURE</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 mx-2" />

                    <div onClick={copyInviteLink} className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group hover:scale-105">
                        <UsersIcon className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Connection_ID</span>
                            <span className="text-[10px] text-white font-bold font-mono">{roomId}</span>
                        </div>
                        {showCopied && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-4 h-4 text-green-500" /></motion.div>}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active_Profile</span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all mt-0.5 ${isInterviewer ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            <div className={`w-1 h-1 rounded-full ${isInterviewer ? 'bg-violet-400' : 'bg-emerald-400'} animate-pulse`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isInterviewer ? 'Protocol_Host' : 'Subject_Candidate'}</span>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 mx-2" />

                    <button onClick={() => navigate('/')} className="group relative px-6 py-2.5 rounded-2xl overflow-hidden transition-all bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:border-red-400">
                        <div className="relative z-10 flex items-center gap-3">
                            <LogOut className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
                            <span className="text-[10px] text-red-400 group-hover:text-white font-black uppercase tracking-widest transition-colors">Terminate_Session</span>
                        </div>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative z-10">
                <nav className="w-20 bg-black/20 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-8 gap-6 z-40 shrink-0">
                    <button onClick={() => setActiveTab('problem')} className={`p-4 rounded-3xl transition-all relative group overflow-hidden ${activeTab === 'problem' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <FileText className="w-6 h-6 relative z-10" />
                        {activeTab === 'problem' && <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />}
                        <motion.div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                    <button onClick={() => setActiveTab('whiteboard')} className={`p-4 rounded-3xl transition-all relative group overflow-hidden ${activeTab === 'whiteboard' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <LayoutGrid className="w-6 h-6 relative z-10" />
                        {activeTab === 'whiteboard' && <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />}
                        <motion.div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                    <button onClick={() => setActiveTab('insights')} className={`p-4 rounded-3xl transition-all relative group overflow-hidden ${activeTab === 'insights' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <Activity className="w-6 h-6 relative z-10" />
                        {activeTab === 'insights' && <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />}
                        <motion.div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                </nav>

                <div className="flex-1 flex overflow-hidden">
                    <Group orientation="horizontal">
                        <Panel defaultSize={22} minSize={15} className="bg-black/10 backdrop-blur-md">
                            <div className="h-full flex flex-col border-r border-white/5 relative">
                                <div className="h-14 flex items-center px-8 border-b border-white/5 bg-white/[0.02]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{activeTab.toUpperCase()}</span>
                                </div>
                                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'problem' && (
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                                                {currentProblem ? (
                                                    <div className="space-y-6">
                                                        <h2 className="text-2xl font-black text-white italic">{currentProblem.title}</h2>
                                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-sm leading-relaxed">{currentProblem.description}</div>
                                                        <div className="space-y-4">
                                                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                                <div className="text-[10px] font-black text-indigo-400 mb-2">// INPUT</div>
                                                                <code className="text-xs text-white font-mono">{currentProblem.exampleInput}</code>
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                                <div className="text-[10px] font-black text-emerald-400 mb-2">// OUTPUT</div>
                                                                <code className="text-xs text-white font-mono">{currentProblem.exampleOutput}</code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest text-center">Standby...</div>
                                                )}
                                            </motion.div>
                                        )}
                                        {activeTab === 'whiteboard' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-[#111] overflow-hidden">
                                                {/* @ts-ignore */}
                                                <Excalidraw theme="dark" onChange={handleExcalidrawChange} onMount={(api) => setExcalidrawAPI(api)} />
                                            </motion.div>
                                        )}
                                        {activeTab === 'insights' && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">Alignment</span>
                                                    <span className="text-[10px] font-black text-emerald-400">98.4%</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </Panel>

                        <Separator className="w-[1px] bg-white/5" />

                        <Panel defaultSize={53} minSize={40} className="relative bg-black/40">
                            <div className="h-full flex flex-col">
                                <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Execution_Unit.bin</span>
                                    </div>
                                    <button onClick={handleRun} disabled={isRunning} className="px-5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                        {isRunning ? 'Executing...' : 'Run_Sequence'}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CollaborativeEditor
                                        roomId={roomId || ''}
                                        userName={user?.email || 'Anonymous'}
                                        userColor="#8b5cf6"
                                        language="javascript"
                                        onLanguageChange={() => { }}
                                    />
                                </div>
                                <div className="h-48 border-t border-white/5 bg-black/60 p-6 font-mono text-[11px] overflow-auto custom-scrollbar">
                                    {terminalOutput.map((log, i) => (
                                        <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'system' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                            <span className="opacity-50">{">>"}</span> {log.message}
                                        </div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                            </div>
                        </Panel>

                        <Separator className="w-[1px] bg-white/5" />

                        <Panel defaultSize={25} minSize={20} className="bg-black/10 backdrop-blur-md">
                            <div className="h-full flex flex-col p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Grid Network</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />{participantCount} ACTIVE
                                    </div>
                                </div>
                                <div className="relative aspect-video rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/5">
                                    <div ref={jitsiContainerRef} className="absolute inset-0 z-10" />
                                    <UsersIcon className="w-10 h-10 text-white opacity-5 absolute z-0" />
                                    {!jitsiApi && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0">
                                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Initializing_Engine...</span>
                                        </div>
                                    )}
                                </div>
                                {isInterviewer && (
                                    <div className="mt-auto space-y-4">
                                        <textarea value={interviewerNotes} onChange={(e) => setInterviewerNotes(e.target.value)} placeholder="Private feedback..." className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-300 resize-none focus:outline-none focus:border-indigo-500/50" />
                                        <button onClick={() => setShowProblemSelector(true)} className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Push_Data_Packet</button>
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </Group>
                </div>
            </div>

            {/* Floating Media Hub (Hidden for static docking) */}
            <AnimatePresence>
                {/* 
                isCallActive && !isMediaDockMinimized && (
                    <motion.div drag dragMomentum={false} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="fixed bottom-32 right-8 w-80 z-50">
                        ...
                    </motion.div>
                )
                */}
            </AnimatePresence>

            {/* Bottom Control Dock */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 py-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center gap-2 ring-1 ring-white/10 shadow-2xl">
                    <button onClick={toggleAudio} className={`p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'hover:bg-white/10 text-gray-400'}`}>{isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                    <button onClick={toggleVideo} className={`p-4 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'hover:bg-white/10 text-gray-400'}`}>{isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2" />
                    <button className="p-4 rounded-xl hover:bg-white/10 text-gray-400"><ScreenShare className="w-5 h-5" /></button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2" />
                    <button onClick={() => navigate('/')} className="px-6 py-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">Terminate</button>
                </motion.div>
            </div>

            {/* Problem Selector Modal */}
            <AnimatePresence>
                {showProblemSelector && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                            <div className="p-10 border-b border-white/5">
                                <h3 className="text-3xl font-black text-white mb-6 italic">Protocol Buffer</h3>
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input type="text" placeholder="Scan records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                                {filteredProblems.map((p) => (
                                    <button key={p.id} onClick={() => handlePushProblem(p)} className="w-full flex items-center justify-between p-6 rounded-3xl hover:bg-white/5 group transition-all">
                                        <div className="text-left"><div className="font-black text-white text-lg">{p.title}</div><div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">{p.difficulty}</div></div>
                                        <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase group-hover:bg-indigo-500 group-hover:text-white transition-all">Deploy</div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowProblemSelector(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
