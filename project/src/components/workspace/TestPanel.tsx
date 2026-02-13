import { useState } from 'react';
import { Play, Send, ChevronUp, ChevronDown } from 'lucide-react';

interface TestPanelProps {
    testCases: any[];
    onRun: () => void;
    onSubmit: () => void;
    running: boolean;
    output: any;
}

export default function TestPanel({ testCases, onRun, onSubmit, running, output }: TestPanelProps) {
    const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');
    const [activeCase, setActiveCase] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);

    if (!testCases) return null;

    return (
        <div className={`bg-[#1e1e1e] border-t border-[#333] flex flex-col transition-all duration-300 ${isExpanded ? 'h-64' : 'h-10'}`}>
            {/* Helper Header to toggle expand */}
            <div className="flex items-center justify-between px-4 h-10 bg-[#252526] select-none cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                    <button
                        className={`flex items-center gap-2 text-xs font-semibold ${activeTab === 'input' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={(e) => { e.stopPropagation(); setActiveTab('input'); setIsExpanded(true); }}
                    >
                        Testcase
                    </button>
                    <button
                        className={`flex items-center gap-2 text-xs font-semibold ${activeTab === 'result' ? 'text-green-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={(e) => { e.stopPropagation(); setActiveTab('result'); setIsExpanded(true); }}
                    >
                        Run Result
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {/* Panel Content */}
            <div className={`flex-1 overflow-hidden flex flex-col ${!isExpanded ? 'hidden' : ''}`}>
                {activeTab === 'input' && (
                    <div className="flex-1 p-4 flex gap-4 overflow-hidden">
                        {/* Case Selector */}
                        <div className="w-32 flex-shrink-0 space-y-2 border-r border-[#333] pr-4">
                            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Cases</div>
                            {testCases.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveCase(idx)}
                                    className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors ${activeCase === idx
                                            ? 'bg-[#333] text-white'
                                            : 'text-gray-400 hover:bg-[#2a2a2a]'
                                        }`}
                                >
                                    Case {idx + 1}
                                </button>
                            ))}
                        </div>

                        {/* Case Inputs */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                {Object.entries(testCases[activeCase].input || {}).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-xs text-gray-500 block mb-1.5 font-mono">{key} =</label>
                                        <div className="bg-[#2a2a2a] p-2 rounded border border-[#333] text-gray-300 font-mono text-sm">
                                            {JSON.stringify(value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'result' && (
                    <div className="flex-1 p-4 overflow-auto">
                        {output ? (
                            <div className="space-y-4">
                                <div className={`text-lg font-medium ${output.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                    {output.status || 'Finished'}
                                </div>

                                {/* Using the mock output format from ProblemDetail for now */}
                                <pre className="font-mono text-sm text-gray-300 bg-[#2a2a2a] p-3 rounded">
                                    {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                                <p>Run your code to see results here</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Footer Actions */}
            <div className={`p-3 bg-[#1e1e1e] border-t border-[#333] flex justify-between items-center ${!isExpanded ? 'hidden' : ''}`}>
                <button className="text-gray-400 text-xs hover:text-white transition-colors">Console</button>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setActiveTab('result'); onRun(); }}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#333] hover:bg-[#444] text-white text-sm rounded transition-colors disabled:opacity-50"
                    >
                        <Play className="w-3.5 h-3.5" />
                        Run
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors disabled:opacity-50 font-medium"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
