import { useState } from 'react';
import { Play, Code2, Zap, Terminal, Boxes, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Types ---
interface ExecutionStep {
    line: number;
    state: Record<string, any>;
}

export default function Visualizer() {
    const [code, setCode] = useState('// JavaScript Example\nlet x = 1;\nlet y = 2;\nx = x + y;\nconsole.log("Result:", x);');
    const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
    const [isLoading, setIsLoading] = useState(false);
    const [timeline, setTimeline] = useState<ExecutionStep[]>([]);
    const [output, setOutput] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState<number>(-1);

    // --- Dynamic Script Loading ---
    const loadScripts = async () => {
        if (language === 'javascript' && !(window as any).acorn) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/acorn';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        } else if (language === 'python' && !(window as any).loadPyodide) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
    };

    // --- Execution Engines ---
    const runJavascript = async () => {
        const acorn = (window as any).acorn;
        if (!acorn) throw new Error('Failed to load Acorn parser');

        try {
            const ast = acorn.parse(code, { ecmaVersion: 2020 });
            const varNames = new Set<string>();

            // Better AST walker
            const findVars = (node: any) => {
                if (!node) return;
                if (node.type === 'VariableDeclaration') {
                    node.declarations.forEach((d: any) => {
                        if (d.id.type === 'Identifier') varNames.add(d.id.name);
                    });
                }
                for (const k in node) {
                    if (node[k] && typeof node[k] === 'object') {
                        if (Array.isArray(node[k])) node[k].forEach(findVars);
                        else findVars(node[k]);
                    }
                }
            };
            findVars(ast);

            const lines = code.split('\n');
            const stateHistory: ExecutionStep[] = [];
            const outputLines: string[] = [];
            let currentExec = '';

            for (let i = 0; i < lines.length; i++) {
                const lineContent = lines[i].trim();
                if (!lineContent || lineContent.startsWith('//')) continue;

                currentExec += lines[i] + '\n';
                try {
                    const sandbox = new Function('console', `
            let __state = {};
            ${currentExec}
            ${Array.from(varNames).map(v => `try { __state["${v}"] = typeof ${v} !== 'undefined' ? ${v} : undefined; } catch(e){}`).join('\n')}
            return __state;
          `);

                    const stepState = sandbox({
                        log: (...args: any[]) => outputLines.push(args.map(a => JSON.stringify(a)).join(' '))
                    });
                    stateHistory.push({ line: i + 1, state: stepState });
                } catch (e) {
                    // Continue if it's an incomplete block/function
                }
            }
            setTimeline(stateHistory);
            setOutput(outputLines);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const runPython = async () => {
        if (!(window as any).loadPyodide) throw new Error('Pyodide script not loaded');
        if (!(window as any).pyodideInstance) {
            (window as any).pyodideInstance = await (window as any).loadPyodide();
        }
        const pyodide = (window as any).pyodideInstance;
        const outputLines: string[] = [];
        pyodide.setStdout({ batched: (msg: string) => outputLines.push(msg) });

        try {
            // Escaping for Python multi-line string
            const safeCode = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
            const wrapper = `
import json
import sys

def trace_code(code_str):
    history = []
    lines = code_str.split('\\n')
    ns = {}
    current_block = []
    
    # We execute block by block to handle loops/functions
    for i, line in enumerate(lines):
        striped = line.strip()
        if not striped and not current_block: continue
        
        current_block.append(line)
        block_code = '\\n'.join(current_block)
        
        try:
            # Check if it's a complete block
            compile(block_code, '<string>', 'exec')
            
            # Execute the block
            exec(block_code, ns)
            current_block = [] # Reset after successful execution
            
            # Capture state
            clean = {k: v for k, v in ns.items() if not k.startswith('__') and isinstance(v, (int, float, str, list, dict))}
            history.append({"line": i + 1, "state": clean.copy()})
        except SyntaxError as e:
            # If it's an unexpected EOF, it's likely an incomplete block (loop/def)
            if 'unexpected EOF' in str(e) or 'EOF while scanning' in str(e):
                continue
            else:
                print(f"Syntax Error at line {i+1}: {str(e)}")
                break
        except Exception as e:
            print(f"Error at line {i+1}: {str(e)}")
            break
            
    return json.dumps(history)

trace_code("${safeCode}")
      `;
            const result = await pyodide.runPythonAsync(wrapper);
            setTimeline(JSON.parse(result));
            setOutput(outputLines);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleRun = async () => {
        setIsLoading(true);
        setError(null);
        setTimeline([]);
        setOutput([]);
        try {
            await loadScripts();
            if (language === 'javascript') await runJavascript();
            else await runPython();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-gray-300 font-sans selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    AI Code Visualizer
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest">Beta</span>
                                </h1>
                                <p className="text-xs text-gray-500 font-medium">Real-time state execution engine</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                            <button
                                onClick={() => {
                                    setLanguage('javascript');
                                    setCode('// JavaScript Example\nlet x = 1;\nlet y = 2;\nx = x + y;\nconsole.log("Result:", x);');
                                }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'javascript' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                JavaScript
                            </button>
                            <button
                                onClick={() => {
                                    setLanguage('python');
                                    setCode('# Python Example\nx = 1\ny = 2\nx = x + y\nprint(f"Result: {x}")');
                                }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'python' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Python
                            </button>
                        </div>
                        <button
                            onClick={handleRun}
                            disabled={isLoading}
                            className="px-6 py-2 bg-white text-black font-black text-xs rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                            RUN VISUALIZER
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
                {/* Left: Editor */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="flex-1 bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-gray-800/50 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Source Code</span>
                            </div>
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="flex-1 w-full bg-transparent font-mono text-sm leading-relaxed text-indigo-100 outline-none resize-none custom-scrollbar"
                            spellCheck={false}
                        />
                    </div>

                    <div className="h-48 bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Terminal className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Console Output</span>
                        </div>
                        <div className="font-mono text-xs text-gray-500 space-y-1 overflow-y-auto h-24 custom-scrollbar">
                            {output.map((line, i) => <div key={i} className="flex gap-2"><span className="text-gray-700">➜</span>{line}</div>)}
                            {output.length === 0 && <span className="opacity-30 italic">No output yet...</span>}
                            {error && <div className="text-red-400 mt-2 bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</div>}
                        </div>
                    </div>
                </div>

                {/* Right: State Timeline */}
                <div className="lg:col-span-7 bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-gray-800/50 p-6 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Execution Timeline</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">
                            {timeline.length} steps recorded
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                        {timeline.map((step, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={idx}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeStep === idx ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'}`}
                                onClick={() => setActiveStep(idx)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-800">
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">Execution Step</span>
                                    </div>
                                    <div className="px-2 py-0.5 bg-gray-900 rounded-md text-[9px] font-mono text-indigo-400 border border-gray-800">
                                        LINE {step.line}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(step.state).map(([key, val]) => (
                                        <div key={key} className="flex flex-col gap-1 p-3 bg-black/20 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-widest">{key}</span>
                                            <span className="font-mono text-sm text-white truncate" title={JSON.stringify(val)}>
                                                {typeof val === 'string' ? `"${val}"` : JSON.stringify(val)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {timeline.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                                <Sparkles className="w-12 h-12 mb-4" />
                                <p className="text-sm font-bold">Write some code and hit RUN<br />to see the magic happen</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
