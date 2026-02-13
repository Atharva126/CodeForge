import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Code, Zap, Clock, HardDrive, CheckCircle, XCircle, Loader2, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface CodingPlaygroundProps {
  className?: string;
}

import OnlineJudge from '../services/OnlineJudge';

const languages = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🟦' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '🔵' },
  { value: 'sql', label: 'SQL', icon: '🗄️' },
];

const STARTERS: Record<string, string> = {
  javascript: `// JavaScript Playground
// Write your code here and click "Run"

function main() {
  console.log("Hello, CodeForge!");

  const numbers = [1, 2, 3, 4, 5];
  const sum = numbers.reduce((a, b) => a + b, 0);

  console.log('Sum:', sum);
}

main();`,
  typescript: `// TypeScript Playground
// Note: Types are stripped before execution

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

const user: User = {
  id: 1,
  name: "CodeForge Admin",
  role: "admin"
};

console.log(\`User \${user.name} (\${user.role}) is active.\`);`,
  python: `# Python Playground
# Powered by Pyodide

def greet(name):
    return f"Hello, {name}!"

print(greet("CodeForge"))

# Standard libraries work too:
import random
numbers = [random.randint(1, 100) for _ in range(5)]
print(f"Random numbers: {numbers}")`,
  java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeForge!");
        
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        
        System.out.println("Sum of array elements: " + sum);
    }
}`,
  cpp: `// C++ Playground
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "Hello, CodeForge!" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}`,
  sql: `-- SQL Playground
-- SQLite via SQL.js

-- Create a table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  role TEXT
);

-- Insert sample data
INSERT INTO users VALUES (1, 'Alice', 'Admin');
INSERT INTO users VALUES (2, 'Bob', 'User');
INSERT INTO users VALUES (3, 'Charlie', 'User');

-- Query data
SELECT * FROM users;`
};

export default function CodingPlayground({ className = '' }: CodingPlaygroundProps) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTERS['javascript']);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'saving'>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [panelSizes, setPanelSizes] = useState({ editor: 50, output: 50 });
  const isResizingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load code from Supabase on mount or language change
  useEffect(() => {
    if (user) {
      loadSnippet();
    } else {
      // Set default starter code based on language if user not logged in or no snippet
      // Only reset code if it looks like default/empty to avoid overwriting user work
      if (!code.trim() || code.includes('Hello') || code.includes('Playground')) {
        setCode(STARTERS[language] || '');
      }
    }
  }, [user, language]);

  // Force update when language changes to show correct starter immediately
  useEffect(() => {
    setCode(STARTERS[language] || '');
  }, [language]);

  const loadSnippet = async () => {
    try {
      const { data, error } = await supabase
        .from('playground_snippets')
        .select('code')
        .eq('user_id', user?.id)
        .eq('language', language)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // If the saved code is very simple/default-looking, upgrade it to the new starter
        const isDefaultJS = data.code.includes('Hello, CodeForge!') || data.code.includes('console.log') || data.code === STARTERS['javascript'];
        const isWrongLanguage = (language !== 'javascript' && language !== 'typescript') && isDefaultJS;

        if (!data.code.trim() || data.code.includes('Hello from') || isDefaultJS || isWrongLanguage) {
          setCode(STARTERS[language] || '');
        } else {
          setCode(data.code);
        }
      } else {
        // Set default starter code
        setCode(STARTERS[language] || '');
      }
    } catch (err) {
      console.error('Error loading snippet:', err);
    }
  };

  const saveSnippet = async (newCode: string) => {
    if (!user) return;

    setStatus('saving');
    try {
      const { error } = await supabase
        .from('playground_snippets')
        .upsert({
          user_id: user.id,
          language,
          code: newCode
        }, {
          onConflict: 'user_id,language'
        });

      if (error) throw error;
      setStatus('idle');
    } catch (err) {
      console.error('Error saving snippet:', err);
      setStatus('error');
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    // Debounced auto-save
    if (user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveSnippet(newCode);
      }, 2000);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setStatus('running');
    setOutput('');
    setExecutionTime(null);
    setMemoryUsage(null);

    const start = performance.now();

    try {
      const judge = OnlineJudge.getInstance();
      const result = await judge.runPlaygroundCode(language, code);

      const end = performance.now();
      setExecutionTime(Number(((end - start) / 1000).toFixed(3)));

      if (result.error) {
        setStatus('error');
        setOutput(result.output ? `${result.output}\n\nError: ${result.error}` : `Error: ${result.error}`);
      } else {
        setStatus('success');
        setOutput(result.output || 'Program executed successfully (no output).');
      }

    } catch (err) {
      setStatus('error');
      setOutput(err instanceof Error ? err.stack || err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    // Handle code submission logic
    console.log('Submitting code:', { language, code });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-500 dark:text-blue-400';
      case 'success': return 'text-green-500 dark:text-green-400';
      case 'error': return 'text-red-500 dark:text-red-400';
      case 'saving': return 'text-orange-500 dark:text-orange-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'saving': return <Save className="w-4 h-4 animate-pulse" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    const startX = e.clientX;
    const startEditorSize = panelSizes.editor;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newEditorSize = Math.max(20, Math.min(80, startEditorSize + deltaPercent));
      setPanelSizes({
        editor: newEditorSize,
        output: 100 - newEditorSize
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`h-screen bg-gray-50 dark:bg-[#0f0f13] ${className} relative overflow-hidden flex flex-col transition-colors duration-300`}>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzFmZjIwIm9wYWNpdHk9IjAiIGhlaWdodD0iMGQiPC9kZWZzPjwvc3ZnPg==')] opacity-5"></div>

      {/* Header Bar */}
      <div className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between px-6 shadow-sm dark:shadow-lg relative z-10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              CodeForge Playground
            </h1>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600/50 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                  {lang.icon} {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600/50 transition-all duration-300 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{status === 'saving' ? 'Auto-saving...' : status}</span>
          </div>

          <button
            onClick={() => setCode(STARTERS[language] || '')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Reset Code to Default"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative z-10 flex overflow-hidden">
        {/* Code Editor Panel */}
        <div
          className="flex-shrink-0 h-full"
          style={{ width: `${panelSizes.editor}%` }}
        >
          <div className="h-full bg-white dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm dark:shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="h-full relative">
              <Editor
                height="100%"
                language={language}
                value={code}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  autoClosingBrackets: 'always',
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: 'on',
                  tabSize: 4,
                  insertSpaces: true,
                }}
                className="rounded-xl"
              />
              {/* Subtle glow border */}
              <div className="absolute inset-0 rounded-xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Horizontal Resize Handle */}
        <div
          className="w-2 bg-gray-200 dark:bg-gray-800/50 hover:bg-blue-500/50 transition-colors duration-300 flex items-center justify-center group cursor-col-resize"
          onMouseDown={handleMouseDown}
        >
          <div className="h-full w-1 rounded-full bg-gray-400 dark:bg-gray-600 group-hover:bg-blue-400 transition-colors duration-300" />
        </div>

        {/* Output Panel */}
        <div
          className="flex-shrink-0 h-full"
          style={{ width: `${panelSizes.output}%` }}
        >
          <div className="h-full bg-white dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm dark:shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
            {/* Output Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-500 dark:text-green-400" />
                  Terminal Output
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {executionTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{executionTime}s</span>
                    </div>
                  )}
                  {memoryUsage && (
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-4 h-4" />
                      <span>{memoryUsage}MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Output Content */}
            <div className="flex-1 min-h-0 px-4 py-3 overflow-auto">
              <div className="h-full bg-gray-50 dark:bg-gray-950 rounded-lg px-4 py-3 font-mono text-sm text-green-600 dark:text-green-400 border border-gray-200 dark:border-gray-700/50 shadow-inner">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Run" to execute your code...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .monaco-editor .margin {
          background-color: transparent !important;
        }

        .monaco-editor-background {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
