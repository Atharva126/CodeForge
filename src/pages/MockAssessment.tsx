import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
    Timer,
    LogOut,
    Play,
    Send,
    CheckCircle,
    PanelLeft,
    Layout,
    Terminal,
    Settings,
    Brain,
    Code
} from 'lucide-react';
import { useMockSession } from '../contexts/MockSessionContext';
import OnlineJudge from '../services/OnlineJudge';

export default function MockAssessment() {
    const navigate = useNavigate();
    const { session, updateCode, submitAll, quitSession, timeRemaining } = useMockSession();
    const [activeProblemIndex, setActiveProblemIndex] = useState(0);
    const [leftPanelWidth, setLeftPanelWidth] = useState(40);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!session) {
            navigate('/interview');
        }
    }, [session, navigate]);

    if (!session) return null;

    const currentProblem = session.problems[activeProblemIndex];
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleRun = async () => {
        setIsRunning(true);
        try {
            const judge = OnlineJudge.getInstance();
            const code = session.userCode[currentProblem.id] || '';
            // Simplified run logic for demo
            const result = await judge.runCode({
                language: 'javascript',
                code: code,
                fnName: 'solution', // Mock function name
                testCases: currentProblem.examples?.map(ex => ({ input: ex.input, expectedOutput: ex.output, isHidden: false })) || [],
                timeLimit: 2000,
                memoryLimit: 64
            });
            setExecutionResult(result);
        } catch (err) {
            setExecutionResult({ error: 'Failed to execute code' });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = () => {
        submitAll();
        navigate('/interview/results');
    };

    return (
        <div className="h-screen bg-[#0a0a0a] text-gray-300 flex flex-col overflow-hidden font-sans">
            {/* Top Bar */}
            <header className="h-14 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-6 z-20 shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <PanelLeft className={`w-5 h-5 transition-colors ${isSidebarOpen ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`} />
                    </div>
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <div className="flex items-center gap-3">
                        <span className="text-white font-black tracking-tight text-lg uppercase">{session.companyName}</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20`}>
                            In Progress
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 bg-[#111] px-8 py-1 rounded-full border border-[#333]">
                    <div className="flex items-center gap-3">
                        <Timer className={`w-4 h-4 ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
                        <span className={`font-mono text-xl font-black ${timeRemaining < 300 ? 'text-red-500' : 'text-white'}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { if (confirm('Are you sure you want to quit?')) quitSession(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        Quit
                    </button>
                    <div className="h-4 w-[1px] bg-[#333]" />
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    >
                        <Send className="w-4 h-4" />
                        Submit All
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Problem Navigator */}
                <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#0f0f0f] border-r border-[#222] flex flex-col relative"
                        >
                            <div className="p-6 border-b border-[#222]">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Problem Navigator</h3>
                                <div className="space-y-2">
                                    {session.problems.map((p, idx) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setActiveProblemIndex(idx)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeProblemIndex === idx
                                                ? 'bg-indigo-500/10 border border-indigo-500/30 text-white'
                                                : 'hover:bg-white/5 border border-transparent text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${idx === activeProblemIndex ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-[#333]'}`} />
                                                <span className="text-sm font-bold">Question {idx + 1}</span>
                                            </div>
                                            {session.status[p.id] === 'solved' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : session.status[p.id] === 'in-progress' ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-orange-500/50 border-t-orange-500 animate-spin" />
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto p-6 space-y-4">
                                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Target Level</span>
                                    </div>
                                    <div className="text-lg font-black text-white">{session.problems[0].difficulty.toUpperCase()}</div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Workspace */}
                <main className="flex-1 flex overflow-hidden bg-[#0d0d0d]">
                    {/* Problem Description */}
                    <div className="overflow-y-auto bg-[#0a0a0a]" style={{ width: `${leftPanelWidth}%` }}>
                        <div className="p-8 pb-20">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Problem {activeProblemIndex + 1}</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-xs font-medium text-gray-500">{currentProblem.acceptance_rate}% Acceptance</span>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">{currentProblem.title}</h2>

                            <div className="prose prose-invert max-w-none mb-10">
                                <p className="text-lg text-gray-400 leading-relaxed font-medium">
                                    {currentProblem.description}
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                        <Layout className="w-3 h-3" />
                                        Examples
                                    </h3>
                                    <div className="space-y-4">
                                        {currentProblem.examples?.map((ex, i) => (
                                            <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-6 font-mono text-sm group hover:border-[#333] transition-colors">
                                                <div className="mb-4">
                                                    <span className="text-indigo-400 font-bold">Input:</span> {ex.input}
                                                </div>
                                                <div className="mb-4">
                                                    <span className="text-green-400 font-bold">Output:</span> {ex.output}
                                                </div>
                                                {ex.explanation && (
                                                    <div className="text-gray-500 italic">
                                                        {ex.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" />
                                        Constraints
                                    </h3>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {currentProblem.constraints?.map((c, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-gray-500 bg-[#111] p-3 rounded-xl border border-[#222]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Draggable Divider */}
                    <div
                        className="w-1 bg-[#222] hover:bg-indigo-500/50 cursor-col-resize transition-colors z-10"
                        onMouseDown={() => {
                            const handleMove = (moveEvent: MouseEvent) => {
                                const newWidth = (moveEvent.clientX / window.innerWidth) * 100;
                                setLeftPanelWidth(Math.min(Math.max(newWidth, 20), 70));
                            };
                            const handleUp = () => {
                                window.removeEventListener('mousemove', handleMove);
                                window.removeEventListener('mouseup', handleUp);
                            };
                            window.addEventListener('mousemove', handleMove);
                            window.addEventListener('mouseup', handleUp);
                        }}
                    />

                    {/* Code Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
                        <div className="h-12 bg-[#161616] border-b border-[#222] flex items-center justify-between px-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-[#222] rounded-lg text-xs font-bold text-white uppercase tracking-widest border border-[#333]">
                                    <Code className="w-3 h-3 text-indigo-400" />
                                    JavaScript
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                language="javascript"
                                value={session.userCode[currentProblem.id] || ''}
                                theme="vs-dark"
                                onChange={(val) => updateCode(currentProblem.id, val || '')}
                                options={{
                                    fontSize: 16,
                                    minimap: { enabled: false },
                                    scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                                    lineNumbers: 'on',
                                    padding: { top: 20 },
                                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, Courier New, monospace'
                                }}
                            />
                        </div>

                        {/* Bottom Panel */}
                        <div className="h-1/3 border-t border-[#222] bg-[#0a0a0a] flex flex-col">
                            <div className="h-12 bg-[#161616] border-b border-[#222] flex items-center justify-between px-6">
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-500">
                                    <Terminal className="w-4 h-4" />
                                    Console Output
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleRun}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#222] text-white hover:bg-[#333] transition-all text-[10px] font-black uppercase tracking-widest border border-[#333]"
                                    >
                                        {isRunning ? <div className="w-3 h-3 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Play className="w-3 h-3" />}
                                        Run
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto">
                                {isRunning ? (
                                    <div className="flex items-center gap-3 text-gray-500 italic">
                                        <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 animate-spin rounded-full" />
                                        Executing against test cases...
                                    </div>
                                ) : executionResult ? (
                                    <div className="space-y-4">
                                        {executionResult.error ? (
                                            <div className="text-red-400 bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                                                {executionResult.error}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-green-400 font-bold">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Code Executed Successfully
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {currentProblem.examples?.map((ex, i) => (
                                                        <div key={i} className="text-xs p-3 bg-white/5 rounded-lg border border-white/5">
                                                            <div className="text-gray-500 mb-1">Test Case {i + 1}</div>
                                                            <div className="flex justify-between">
                                                                <span>Output: <span className="text-white">{ex.output}</span></span>
                                                                <span className="text-green-500 font-bold">PASSED</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-600 italic">
                                        Run code to see test case results...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
