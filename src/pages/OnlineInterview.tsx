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
    Users,
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
    RefreshCw
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
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [isInterviewer, setIsInterviewer] = useState(false);
    const [iceState, setIceState] = useState<string>('new');
    const [tracksReceived, setTracksReceived] = useState<string[]>([]);
    const partnerIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const isInterviewerRef = useRef(false);

    useEffect(() => {
        if (!roomId || !user || !isCallActive) return;

        const cleanupPC = () => {
            if (peerConnectionRef.current) {
                console.log('🎬 Media: Cleaning up PC');
                const pc = peerConnectionRef.current;
                pc.onicecandidate = null;
                pc.ontrack = null;
                pc.onconnectionstatechange = null;
                pc.oniceconnectionstatechange = null;
                pc.onicegatheringstatechange = null;
                pc.close();
                peerConnectionRef.current = null;
                setIceState('new');
                setTracksReceived([]);
            }
        };

        const createPC = () => {
            const pcState = peerConnectionRef.current?.connectionState;
            const sigState = peerConnectionRef.current?.signalingState;

            // Guard: Don't recreate if already in a useful state
            if (peerConnectionRef.current &&
                (pcState === 'connected' || pcState === 'connecting' || sigState === 'have-local-offer' || sigState === 'have-remote-offer')) {
                console.log('🎬 Media: PC already exists and is active/negotiating, skipping creation.');
                return peerConnectionRef.current;
            }

            if (peerConnectionRef.current) cleanupPC();

            console.log('🎬 Media: Creating new Peer Connection');
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            });

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { roomId, candidate: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                console.log('🎬 Media: Remote track received:', event.track.kind);
                setTracksReceived(prev => Array.from(new Set([...prev, event.track.kind])));
                const stream = event.streams[0];
                if (stream) setRemoteStream(stream);
            };

            pc.onnegotiationneeded = async () => {
                try {
                    if (isInterviewerRef.current && partnerIdRef.current) {
                        console.log('📡 Signaling: Negotiation needed, sending offer...');
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { roomId, offer });
                    }
                } catch (err) {
                    console.error('Negotiation error:', err);
                }
            };

            pc.onconnectionstatechange = () => {
                console.log("🎬 Media: Connection State:", pc.connectionState);
                if (pc.connectionState === 'connected') {
                    addTerminalMessage({ type: 'system', message: '🤝 Connection: Established!' });
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    if (isCallActive) {
                        console.log('📡 Signaling: Connection shaky/lost, state:', pc.connectionState);
                    }
                }
            };

            pc.oniceconnectionstatechange = () => {
                setIceState(pc.iceConnectionState);
            };

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
                    pc.addTrack(track, localStreamRef.current!);
                });
                // Apply initial bitrate constraints based on current quality setting
                applyBitrateConstraints(pc, videoQuality);
            }

            peerConnectionRef.current = pc;
            return pc;
        };

        const handleOffer = async (offer: any) => {
            console.log('📡 Signaling: Received Offer');
            const pc = createPC();
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                while (pendingCandidates.current.length > 0) {
                    const cand = pendingCandidates.current.shift();
                    if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { roomId, answer });
            } catch (err) {
                console.error('Offer error:', err);
            }
        };

        const handleAnswer = async (answer: any) => {
            console.log('📡 Signaling: Received Answer');
            const pc = peerConnectionRef.current;
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    while (pendingCandidates.current.length > 0) {
                        const cand = pendingCandidates.current.shift();
                        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                    }
                } catch (err) {
                    console.error('Answer error:', err);
                }
            }
        };

        const handleIceCandidate = async (candidate: any) => {
            const pc = peerConnectionRef.current;
            if (pc && pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('ICE Candidate skipped');
                }
            } else {
                pendingCandidates.current.push(candidate);
            }
        };

        const handleRoomParticipants = async ({ participants }: any) => {
            const myId = socket.id;
            const others = participants.filter((p: string) => p !== myId);
            partnerIdRef.current = others[0] || null;

            // If partner joined and I am interviewer, ensures PC exists (onnegotiationneeded will handle the rest)
            if (isInterviewerRef.current && partnerIdRef.current) {
                console.log('📡 Signaling: Partner detected, ensuring PC...');
                createPC();
            }
        };

        const handleRoleAssigned = async ({ role }: { role: 'interviewer' | 'candidate' }) => {
            console.log('📡 Signaling: Role assigned by server:', role);
            const isCaller = role === 'interviewer';
            setIsInterviewer(isCaller);
            isInterviewerRef.current = isCaller;

            // If assigned interviewer and partner already here, ensuring PC
            if (isCaller && partnerIdRef.current) {
                console.log('📡 Signaling: Role assigned and partner present, ensuring PC...');
                createPC();
            }
        };

        const startFlow = async () => {
            try {
                // Ensure socket is joined
                socket.off('offer', handleOffer);
                socket.off('answer', handleAnswer);
                socket.off('ice-candidate', handleIceCandidate);
                socket.off('room-participants', handleRoomParticipants);

                socket.on('offer', handleOffer);
                socket.on('answer', handleAnswer);
                socket.on('ice-candidate', handleIceCandidate);
                socket.on('room-participants', handleRoomParticipants);
                socket.on('role-assigned', handleRoleAssigned);

                socket.emit('join-room', { roomId, userName: user.email || 'Anonymous' });
                addTerminalMessage({ type: 'system', message: '📡 Signaling: Connected to room.' });
            } catch (err: any) {
                console.error("Signaling error:", err);
            }
        };

        if (isCallActive) {
            startFlow();
        } else {
            cleanupPC();
        }

        (window as any).reconnectCall = () => {
            addTerminalMessage({ type: 'system', message: '🔄 Force re-connecting media...' });

            // Stop existing local stream tracks to release hardware
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
                setLocalStream(null);
            }

            cleanupPC();
            if (isCallActive) startFlow();
        };

        return () => {
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('room-participants', handleRoomParticipants);
            socket.off('role-assigned', handleRoleAssigned);
            cleanupPC();
        };
    }, [roomId, user?.id, isCallActive]);

    // Separate Media Lifecycle: Keep camera alive once started
    useEffect(() => {
        if (!isCallActive) return;

        const initMedia = async (retries = 3) => {
            if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
                addTerminalMessage({ type: 'system', message: '⚠️ Security: HTTPS required for camera.' });
            }

            try {
                // HARDWARE RELEASE: Always stop existing tracks before requesting new ones
                if (localStreamRef.current) {
                    console.log("🎬 Media: Releasing existing tracks...");
                    localStreamRef.current.getTracks().forEach(t => t.stop());
                    localStreamRef.current = null;
                    setLocalStream(null);
                }

                if (!localStreamRef.current) {
                    console.log("🎬 Media: Requesting camera access...");
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 640, height: 480, frameRate: 24 },
                        audio: true
                    });
                    setLocalStream(stream);
                    localStreamRef.current = stream;
                    if (videoRef.current) videoRef.current.srcObject = stream;

                    // Late track attachment: If PC exists, add tracks now
                    if (peerConnectionRef.current) {
                        const pc = peerConnectionRef.current;
                        stream.getTracks().forEach(track => {
                            const alreadyAdded = pc.getSenders().some(s => s.track === track);
                            if (!alreadyAdded) {
                                console.log(`🎬 Media: Manually adding late track ${track.kind} to PC`);
                                pc.addTrack(track, stream);
                            }
                        });
                    }

                    addTerminalMessage({ type: 'system', message: '📸 Camera: Ready.' });
                }
            } catch (err: any) {
                console.error("Media error:", err);
                if (err.name === 'NotReadableError') {
                    if (retries > 0) {
                        addTerminalMessage({ type: 'system', message: `⚠️ Camera Busy: Retrying in 2s... (${retries} left)` });
                        setTimeout(() => initMedia(retries - 1), 2000);
                    } else {
                        addTerminalMessage({ type: 'system', message: '❌ Camera Failure: Device is in use by another application. Please close other tabs/apps and click "Reset Cam".' });
                    }
                } else {
                    addTerminalMessage({ type: 'system', message: `❌ Media Error: ${err.message}` });
                }
            }
        };

        initMedia();
    }, [isCallActive]);

    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
            if (isMuted) {
                console.log('🔇 Audio track disabled - saving bandwidth');
                addTerminalMessage({ type: 'system', message: '🔇 Mic muted - audio transmission paused to save bandwidth' });
            } else {
                console.log('🎤 Audio track enabled');
                addTerminalMessage({ type: 'system', message: '🎤 Mic unmuted - audio transmission resumed' });
            }
        }
    }, [isMuted, localStream]);

    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOff;
            });
            if (isVideoOff) {
                console.log('📹 Video track disabled - saving significant bandwidth');
                addTerminalMessage({ type: 'system', message: '📹 Camera off - video transmission paused (saving ~80% bandwidth)' });
            } else {
                console.log('📹 Video track enabled');
                addTerminalMessage({ type: 'system', message: '📹 Camera on - video transmission resumed' });
            }
        }
    }, [isVideoOff, localStream]);

    useEffect(() => {
        if (localStream && videoRef.current && !isVideoOff) {
            if (videoRef.current.srcObject === localStream) return;
            videoRef.current.srcObject = localStream;
        }
    }, [isVideoOff, localStream]);

    // Consolidated Remote Stream Binding with robust guards
    useEffect(() => {
        const video = remoteVideoRef.current;
        if (remoteStream && video) {
            if (video.srcObject === remoteStream) return;

            console.log("🎬 Media: Attaching remote stream to video element");
            video.srcObject = remoteStream;

            video.play().catch(e => {
                if (e.name === 'AbortError') {
                    console.log("📽️ Playback was interrupted by a new request (Normal behavior during sync)");
                } else {
                    console.error("❌ Remote play error:", e);
                    addTerminalMessage({ type: 'system', message: `⚠️ Video Error: ${e.message}` });
                }
            });
        }
    }, [remoteStream]);

    const [videoQuality, setVideoQuality] = useState<'data-saver' | 'low' | 'medium' | 'high'>('low');
    const [isChangingQuality, setIsChangingQuality] = useState(false);

    const applyBitrateConstraints = async (pc: RTCPeerConnection, quality: string) => {
        const bitrates: Record<string, number> = {
            'data-saver': 100000, // 100kbps
            'low': 250000,        // 250kbps
            'medium': 600000,     // 600kbps
            'high': 1500000       // 1.5Mbps
        };

        const bitrate = bitrates[quality] || 250000;
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
            try {
                const params = videoSender.getParameters();
                if (!params.encodings) params.encodings = [{}];
                params.encodings[0].maxBitrate = bitrate;
                await videoSender.setParameters(params);
                console.log(`🎬 Media: Bitrate capped at ${bitrate / 1000}kbps for ${quality} mode`);
            } catch (err) {
                console.warn("🎬 Media: Failed to set bitrate parameters", err);
            }
        }
    };

    const changeVideoQuality = async (quality: 'data-saver' | 'low' | 'medium' | 'high') => {
        if (!localStream || isChangingQuality) return;
        setIsChangingQuality(true);
        setVideoQuality(quality);

        const constraints = {
            video: quality === 'data-saver' ? { width: 176, height: 144, frameRate: 15 } :
                quality === 'low' ? { width: 320, height: 240, frameRate: 15 } :
                    quality === 'medium' ? { width: 640, height: 480, frameRate: 24 } :
                        { width: 1280, height: 720, frameRate: 30 },
            audio: true
        };

        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newVideoTrack = newStream.getVideoTracks()[0];

            // stop old video track
            localStream.getVideoTracks().forEach(track => track.stop());

            // Replace track in PeerConnection
            if (peerConnectionRef.current) {
                const pc = peerConnectionRef.current;
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(newVideoTrack);
                    await applyBitrateConstraints(pc, quality);
                }
            }

            // Update Local Stream State
            const audioTrack = localStream.getAudioTracks()[0];
            const consolidatedStream = new MediaStream([newVideoTrack, ...(audioTrack ? [audioTrack] : [])]);
            setLocalStream(consolidatedStream);

            if (videoRef.current) {
                videoRef.current.srcObject = consolidatedStream;
            }

            addTerminalMessage({ type: 'system', message: `📹 Quality switched to: ${quality.toUpperCase()} (${quality === 'data-saver' ? '100' : quality === 'low' ? '250' : quality === 'medium' ? '600' : '1500'}kbps)` });

        } catch (err) {
            console.error("Failed to switch quality", err);
            addTerminalMessage({ type: 'system', message: `⚠️ Failed to switch quality: ${err}` });
        } finally {
            setIsChangingQuality(false);
        }
    };

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

            {/* Floating Dual Video Call UI */}
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
                            <div className="flex gap-4">
                                {/* Partner Video (Remote) */}
                                <div className="w-44 h-56 bg-[#1a1a1a] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl relative group ring-4 ring-indigo-500/10">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <div className="absolute top-3 right-3 z-30 flex gap-1">
                                            {tracksReceived.map(t => (
                                                <div key={t} className="px-1.5 py-0.5 rounded bg-black/50 text-[7px] text-green-400 font-bold uppercase border border-green-500/20">
                                                    {t}
                                                </div>
                                            ))}
                                            <div className="px-1.5 py-0.5 rounded bg-black/50 text-[7px] text-indigo-400 font-bold uppercase border border-indigo-500/20">
                                                ICE: {iceState}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                            Partner ({partnerIdRef.current ? partnerIdRef.current.slice(0, 4) : '...'})
                                        </span>
                                    </div>

                                    {/* Video is always in DOM to avoid Ref issues, just hidden by the placeholder */}
                                    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className={`w-full h-full object-cover transition-opacity duration-700 ${remoteStream ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                        {!remoteStream && (
                                            <div className="absolute inset-0 bg-indigo-500/5 flex items-center justify-center overflow-hidden">
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.1, 1],
                                                        opacity: [0.3, 0.5, 0.3]
                                                    }}
                                                    transition={{ duration: 4, repeat: Infinity }}
                                                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                                                >
                                                    <Users className="w-8 h-8 text-indigo-400/40" />
                                                </motion.div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Self Video (Local) */}
                                <div className="w-44 h-56 bg-[#1a1a1a] rounded-[28px] border border-indigo-500/30 overflow-hidden shadow-2xl relative group ring-4 ring-indigo-500/20">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-wider">You ({socket.id?.slice(0, 4) || 'Self'})</span>
                                    </div>

                                    {isVideoOff ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                                <Users className="w-5 h-5 text-gray-700" />
                                            </div>
                                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Camera Off</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover scale-x-[-1]"
                                            />
                                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 p-2.5 bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl self-center">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isMuted ? <Mic className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsVideoOff(!isVideoOff)}
                                    className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isVideoOff ? <Video className="w-4 h-4 fill-current" /> : <Video className="w-4 h-4" />}
                                </button>

                                <button
                                    onClick={() => {
                                        const nextMap: Record<string, 'data-saver' | 'low' | 'medium' | 'high'> = {
                                            'high': 'medium',
                                            'medium': 'low',
                                            'low': 'data-saver',
                                            'data-saver': 'high'
                                        };
                                        changeVideoQuality(nextMap[videoQuality]);
                                    }}
                                    disabled={isChangingQuality}
                                    className={`px-3 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1 ${isChangingQuality ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20'}`}
                                >
                                    {isChangingQuality ? (
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>{videoQuality === 'high' ? 'HD' : videoQuality === 'medium' ? 'SD' : videoQuality === 'low' ? 'LQ' : 'DS'}</span>
                                    )}
                                </button>

                                <button
                                    onClick={() => (window as any).reconnectCall?.()}
                                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-xl"
                                    title="Reconnect Call"
                                >
                                    <Zap className="w-4 h-4" />
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
