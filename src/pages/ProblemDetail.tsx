import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import { Play, Send, Settings, RefreshCw } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  constraints: string;
  examples: any[];
  tags: string[];
  test_cases: any[];
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500 bg-gray-900 min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-gray-800 p-4 rounded text-left overflow-auto max-w-2xl text-xs">
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ProblemDetailWithBoundary() {
  return (
    <ErrorBoundary>
      <ProblemDetailContent />
    </ErrorBoundary>
  )
}

function ProblemDetailContent() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('function solution(nums) {\n  // Write your code here\n  \n}');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadProblem();
    } else {
      setLoading(false);
    }
  }, [slug]);

  const loadProblem = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
      }

      if (data) {
        setProblem(data);
      }
    } catch (err) {
      console.error("Load problem exception:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="animate-pulse">Loading workspace...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center space-y-4">
          <div className="text-xl">Problem not found</div>
          <div className="text-sm text-gray-500">Slug: {slug || 'none'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex">
      {/* Left Panel - Problem Description */}
      <div className="w-2/5 bg-gray-900 border-r border-gray-800 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-4">{problem.title}</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
          problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-red-500/10 text-red-400'
          }`}>
          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
        </span>
        <p className="text-gray-300 leading-relaxed">{problem.description}</p>

        {problem.examples && problem.examples.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-white font-semibold">Examples</h3>
            {problem.examples.map((ex: any, i: number) => (
              <div key={i} className="bg-gray-800/50 rounded p-3 text-sm font-mono">
                <div className="text-gray-400">Input: <span className="text-gray-200">{JSON.stringify(ex.input)}</span></div>
                <div className="text-gray-400">Output: <span className="text-gray-200">{JSON.stringify(ex.output)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
          <span className="text-gray-300 text-sm">JavaScript</span>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-[#1e1e1e] text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />

        <div className="p-3 border-t border-[#333] flex justify-end gap-2 bg-[#1e1e1e]">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#333] hover:bg-[#444] text-white text-sm rounded transition-colors">
            <Play className="w-3.5 h-3.5" />
            Run
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors">
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
