import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Shield, ShieldAlert, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HackerTerminal() {
    const [bootSequence, setBootSequence] = useState<string[]>([]);
    const [phase, setPhase] = useState<'booting' | 'challenge' | 'coding' | 'verifying' | 'success' | 'failed'>('booting');
    const [code, setCode] = useState('// calculated_access_code = ...\nreturn ');
    const [output, setOutput] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Boot sequence animation
    useEffect(() => {
        const sequence = [
            'INITIALIZING KERNEL...',
            'LOADING SECURITY MODULES...',
            'BYPASSING FIREWALL...',
            'ENCRYPTION DETECTED: A-256',
            'ACCESS DENIED.',
            'INITIATING MANUAL OVERRIDE...'
        ];

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= sequence.length) {
                clearInterval(interval);
                setTimeout(() => setPhase('challenge'), 500);
                return;
            }
            setBootSequence(prev => [...prev, sequence[currentIndex]]);
            currentIndex++;

            // Auto-scroll
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    // Cursor blinking
    useEffect(() => {
        const interval = setInterval(() => setCursorVisible(v => !v), 500);
        return () => clearInterval(interval);
    }, []);

    const handleRun = () => {
        setPhase('verifying');
        setTimeout(() => {
            try {
                // Safe-ish execution for simple math
                // eslint-disable-next-line no-new-func
                const userFunc = new Function(code);
                const result = userFunc();

                // Challenge: Calculate sum of [2, 4, 6] -> 12, or just any valid return?
                // Let's make it a specific challenge: "System requires access code: Sum of [10, 20, 30]"
                // Expected: 60

                if (result === 60) {
                    setPhase('success');
                } else {
                    setOutput(`ERROR: INVALID ACCESS CODE [${result}]. EXPECTED: 60`);
                    setPhase('failed');
                    setTimeout(() => setPhase('coding'), 2000);
                }
            } catch (err: any) {
                setOutput(`RUNTIME_ERROR: ${err.message}`);
                setPhase('failed');
                setTimeout(() => setPhase('coding'), 2000);
            }
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg mx-auto bg-black/90 rounded-lg overflow-hidden border border-green-500/30 shadow-[0_0_50px_rgba(0,255,100,0.15)] font-mono text-sm relative"
        >
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%] pointer-events-none" />

            {/* Header */}
            <div className="bg-gray-900 border-b border-green-500/30 p-3 flex items-center justify-between z-30 relative">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-bold tracking-wider">TERMINAL_RELAY_V2</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[320px] flex flex-col relative z-30">

                {/* Boot Phase */}
                {phase === 'booting' && (
                    <div className="space-y-2" ref={scrollRef}>
                        {bootSequence.map((line, i) => (
                            <div key={i} className="text-green-500/80">{`> ${line}`}</div>
                        ))}
                        <div className="text-green-500">{`> _`} {cursorVisible && '█'}</div>
                    </div>
                )}

                {/* Challenge Phase */}
                {(phase === 'challenge' || phase === 'coding' || phase === 'verifying' || phase === 'failed') && (
                    <div className="flex-1 flex flex-col">
                        <div className="mb-4 space-y-2 border-b border-green-500/20 pb-4">
                            <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="font-bold">SYSTEM LOCKED</span>
                            </div>
                            <p className="text-green-400">
                                To bypass security, calculate the generic checksum of the vector triad:
                            </p>
                            <code className="block bg-green-500/10 p-2 rounded text-green-300">
                                data = [10, 20, 30]
                            </code>
                        </div>

                        <div className={`transition-opacity duration-300 ${phase === 'coding' || phase === 'failed' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="relative group">
                                <textarea
                                    value={code}
                                    onChange={(e) => {
                                        if (phase !== 'verifying') {
                                            setCode(e.target.value);
                                            setPhase('coding');
                                        }
                                    }}
                                    className="w-full bg-black/50 border border-green-500/30 rounded p-3 text-green-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-green-500/20 font-mono resize-none h-32"
                                    spellCheck={false}
                                />
                                {phase === 'failed' && (
                                    <div className="absolute bottom-3 left-3 right-3 text-red-500 text-xs">
                                        {output}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleRun}
                                disabled={phase === 'verifying'}
                                className="mt-4 w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/50 py-2 rounded flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(0,255,100,0.3)] group"
                            >
                                {phase === 'verifying' ? (
                                    <>
                                        <Cpu className="w-4 h-4 animate-spin" />
                                        PROCESSING...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        EXECUTE_OVERRIDE()
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Phase */}
                {phase === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 shadow-[0_0_30px_rgba(0,255,100,0.4)]">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-400 tracking-widest mb-2">ACCESS GRANTED</h3>
                            <p className="text-green-500/70 text-sm">WELCOME TO THE ELITE, CODER.</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/problems'}
                            className="px-6 py-2 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition-colors"
                        >
                            ENTER SYSTEM
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
