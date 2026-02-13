import Editor from '@monaco-editor/react';
import { Settings, RefreshCw } from 'lucide-react';

interface CodeEditorProps {
    language: string;
    code: string;
    onChange: (value: string | undefined) => void;
    onLanguageChange: (lang: string) => void;
    theme?: 'vs-dark' | 'light';
}

export default function CodeEditor({ language, code, onChange, onLanguageChange, theme = 'vs-dark' }: CodeEditorProps) {
    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            className="appearance-none bg-[#3c3c3c] text-gray-300 text-xs px-3 py-1.5 rounded hover:bg-[#4c4c4c] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[120px]"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-white transition-colors p-1" title="Reset Code">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors p-1" title="Editor Settings">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor Instance */}
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language} // map language names if needed
                    value={code}
                    theme={theme}
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        formatOnPaste: true,
                        formatOnType: true,
                    }}
                />
            </div>
        </div>
    );
}
