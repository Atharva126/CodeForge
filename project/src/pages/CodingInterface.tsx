import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, Send, ChevronDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { problemsData } from '../data/problemsData';
import Editor from '@monaco-editor/react';
import SubmissionAnalyticsModal from '../components/SubmissionAnalyticsModal';
import { supabase } from '../lib/supabase';
import BadgeService from '../services/badgeService';
import { gamificationService } from '../services/gamificationService';
import OnlineJudge from '../services/OnlineJudge';

interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  error?: string;
}

interface ExecutionResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'wrong';
  testCases: TestCase[];
  runtime?: number;
  memory?: number;
  message?: string;
}

const languages = [
  { id: 'javascript', name: 'JavaScript', version: 'ES2022', monaco: 'javascript' },
  { id: 'typescript', name: 'TypeScript', version: '5.x', monaco: 'typescript' },
  { id: 'python', name: 'Python', version: '3.x', monaco: 'python' },
  { id: 'java', name: 'Java', version: '15.x', monaco: 'java' },
  { id: 'cpp', name: 'C++', version: 'GCC 10.x', monaco: 'cpp' },
  { id: 'sql', name: 'SQL', version: 'SQLite', monaco: 'sql' },
];

const starterCode: Record<string, Record<string, string>> = {
  '1': {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};
`,
    typescript: `/**
 * Note: TypeScript mode runs as plain JavaScript.
 */
var twoSum = function(nums, target) {
  
};
`,
    python: `def twoSum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    
`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
    sql: `-- Write your SQL query here
SELECT * FROM users;`,
  },
  '2': {
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    
};
`,
    typescript: `/**
 * Note: TypeScript mode runs as plain JavaScript.
 */
var lengthOfLongestSubstring = function(s) {
  
};
`,
    python: `def lengthOfLongestSubstring(s):
    """
    :type s: str
    :rtype: int
    """
    
`,
    java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        
    }
}`,
    cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        
    }
};`,
    sql: `-- Write your SQL query here
SELECT name, length(name) as len FROM users ORDER BY len DESC;`,
  },
  '3': {
    javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {
    
};
`,
    typescript: `/**
 * Note: TypeScript mode runs as plain JavaScript.
 */
var findMedianSortedArrays = function(nums1, nums2) {
  
};
`,
    python: `def findMedianSortedArrays(nums1, nums2):
    """
    :type nums1: List[int]
    :type nums2: List[int]
    :rtype: float
    """
    
`,
    java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        
    }
}`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        
    }
};`,
    sql: `-- SQL Median calculation (simulated)
SELECT AVG(val) FROM (SELECT val FROM data ORDER BY val LIMIT 2);`,
  },
};

const PROBLEM_FN_NAME: Record<string, string> = {
  '1': 'twoSum',
  '2': 'lengthOfLongestSubstring',
  '3': 'findMedianSortedArrays',
};

const PROBLEM_COMPLEXITY: Record<string, { time: string; space: string }> = {
  '1': { time: 'O(n)', space: 'O(n)' },
  '2': { time: 'O(n)', space: 'O(min(m, n))' },
  '3': { time: 'O(log(min(m, n)))', space: 'O(1)' },
  '4': { time: 'O(n^2)', space: 'O(n)' },
  '5': { time: 'O(log10(x))', space: 'O(1)' },
  '7': { time: 'O(log10(x))', space: 'O(1)' },
  '9': { time: 'O(n)', space: 'O(1)' },
  '10': { time: 'O(n)', space: 'O(1)' },
  '14': { time: 'O(n)', space: 'O(n)' },
};

const HIDDEN_TESTS: Record<string, Array<{ input: string; expected: unknown }>> = {
  '1': [
    { input: '[2,7,11,15], 9', expected: [0, 1] },
    { input: '[3,2,4], 6', expected: [1, 2] },
    { input: '[3,3], 6', expected: [0, 1] },
  ],
  '2': [
    { input: '"abcabcbb"', expected: 3 },
    { input: '"bbbbb"', expected: 1 },
    { input: '"pwwkew"', expected: 3 },
  ],
  '3': [
    { input: '[1,3], [2]', expected: 2.0 },
    { input: '[1,2], [3,4]', expected: 2.5 },
  ],
};

const PUBLIC_TESTS: Record<string, Array<{ input: string; expected: unknown }>> = {
  '1': [
    { input: '[2,7,11,15], 9', expected: [0, 1] },
  ],
  '2': [
    { input: '"abcabcbb"', expected: 3 },
  ],
  '3': [
    { input: '[1,3], [2]', expected: 2.0 },
  ],
};

type JudgeStatus = ExecutionResult['status'];

function formatValue(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Detects if the current code in a language slot is actually from another language.
 * This is used to "heal" corrupted localStorage states from previous bugs.
 */
function detectLanguageMismatch(code: string, targetLang: string): boolean {
  if (!code || code.trim().length === 0) return false;

  const snippets = {
    js: ['var ', 'function ', 'const ', 'let ', '/**'],
    java: ['public class ', 'new Solution()', '@param'],
    cpp: ['#include', 'using namespace', '::'],
    python: ['def ', 'self.'],
  };

  if (targetLang === 'cpp' || targetLang === 'java') {
    // If we're in C++/Java but see JS keywords, it's a mismatch
    if (code.includes('var ') || (code.includes('function ') && !code.includes('Solution'))) return true;
    if (code.includes('/**') && !code.includes('/*')) return true; // C++ usually uses // or /*
  }

  if (targetLang === 'cpp') {
    if (snippets.java.some(s => code.includes(s))) return true;
    if (snippets.python.some(s => code.includes(s))) return true;
  }

  if (targetLang === 'python') {
    if (code.includes('class Solution {')) return true; // Java/C++ style
    if (code.includes('var ')) return true;
  }

  return false;
}

export default function CodingInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const battleId = queryParams.get('battle');
  const { user } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localId, setLocalId] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult>({ status: 'idle', testCases: [] });
  const [customTestInput, setCustomTestInput] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [editorHeight, setEditorHeight] = useState(60);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const codeLanguageRef = useRef(selectedLanguage);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    async function loadProblemAndCode() {
      if (!id) return;
      try {
        setIsLoading(true);
        isInitialLoadRef.current = true;

        let targetProblem = problem;
        if (!targetProblem || targetProblem.id !== id) {
          const { data, error } = await supabase.from('problems').select('*').eq('id', id).single();
          if (error) throw error;
          targetProblem = data;
          setProblem(data);
        }

        const localProblem = problemsData.find(p => p.slug === targetProblem.slug);
        if (localProblem) {
          const lId = localProblem.id;
          setLocalId(lId);
          let savedCode = localStorage.getItem(`code_${id}_${selectedLanguage}`);

          // Aggressive Heal logic: detect if saved code is from another language
          if (savedCode && detectLanguageMismatch(savedCode, selectedLanguage)) {
            console.warn(`Detected language mismatch for ${selectedLanguage}, restoring starter code.`);
            savedCode = null;
          }

          if (savedCode) {
            setCode(savedCode);
          } else if (starterCode[lId]?.[selectedLanguage]) {
            setCode(starterCode[lId][selectedLanguage]);
          } else {
            setCode('');
          }
        }
        codeLanguageRef.current = selectedLanguage;
        // Small delay to ensure state has settled before allowing saves
        setTimeout(() => { isInitialLoadRef.current = false; }, 100);
      } catch (err) {
        console.error('Error loading problem/code:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProblemAndCode();
  }, [id, selectedLanguage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runJudge(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [code, customTestInput, selectedLanguage, id, localId]);

  useEffect(() => {
    if (id && code && codeLanguageRef.current === selectedLanguage && !isInitialLoadRef.current) {
      localStorage.setItem(`code_${id}_${selectedLanguage}`, code);
    }
  }, [id, selectedLanguage, code]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && editorRef.current) {
        const containerWidth = editorRef.current.offsetWidth;
        const newWidth = (e.clientX / containerWidth) * 100;
        setLeftPanelWidth(Math.min(Math.max(newWidth, 20), 80));
      }
      if (isDraggingVertical && editorRef.current) {
        const containerHeight = editorRef.current.offsetHeight;
        const newHeight = ((e.clientY - editorRef.current.getBoundingClientRect().top) / containerHeight) * 100;
        setEditorHeight(Math.min(Math.max(newHeight, 30), 80));
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingVertical(false);
    };
    if (isDragging || isDraggingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDraggingVertical]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const runJudge = async (isSubmit: boolean) => {
    const problemId = localId || '';
    const fnName = PROBLEM_FN_NAME[problemId];
    if (!fnName) {
      setExecutionResult({
        status: 'error',
        testCases: [],
        runtime: 0,
        memory: 0,
        message: 'This problem is not yet supported by the judge.',
      });
      return;
    }

    setExecutionResult({ status: 'running', testCases: [] });

    try {
      const tests = isSubmit
        ? (HIDDEN_TESTS[problemId] || [])
        : (customTestInput.trim()
          ? [{ input: customTestInput.trim(), expected: undefined }]
          : (PUBLIC_TESTS[problemId] || []));

      if (!tests.length) {
        setExecutionResult({
          status: 'idle',
          testCases: [],
          runtime: 0,
          memory: 0,
          message: isSubmit ? 'No test cases found.' : 'Enter input or click Submit.',
        });
        return;
      }

      const judge = OnlineJudge.getInstance();
      const testCases: TestCase[] = [];
      let totalRuntime = 0;
      let totalMemory = 0;
      let status: JudgeStatus = 'success';
      let message = isSubmit ? 'All test cases passed!' : 'Test case passed!';

      for (const t of tests) {
        const result = await judge.runCode({
          language: selectedLanguage,
          code: code,
          fnName: fnName,
          testCases: [{
            input: t.input,
            expectedOutput: t.expected === undefined ? '' : formatValue(t.expected),
            isHidden: false
          }],
          timeLimit: 5000,
          memoryLimit: 128
        });

        totalRuntime += result.time;
        totalMemory = Math.max(totalMemory, result.memory || 0);

        if (result.status !== 'Accepted') {
          status = result.status === 'Wrong Answer' ? 'wrong' : 'error';
          message = result.error || result.status;
          testCases.push({
            input: t.input,
            expectedOutput: t.expected === undefined ? '' : formatValue(t.expected),
            actualOutput: result.output,
            passed: false,
            error: result.error,
          });
          break;
        }

        testCases.push({
          input: t.input,
          expectedOutput: t.expected === undefined ? '' : formatValue(t.expected),
          actualOutput: result.output,
          passed: true,
        });
      }

      setExecutionResult({
        status,
        testCases,
        runtime: Math.round(totalRuntime),
        memory: totalMemory > 0 ? totalMemory : undefined,
        message,
      });

      if (isSubmit && user) {
        let dbStatus = 'Runtime Error';
        if (status === 'success') dbStatus = 'Accepted';
        else if (status === 'wrong') dbStatus = 'Wrong Answer';
        else if (message === 'Time Limit Exceeded') dbStatus = 'Time Limit Exceeded';

        await supabase.from('user_submissions').insert({
          user_id: user.id,
          problem_id: id,
          battle_id: battleId,
          status: dbStatus,
          language: selectedLanguage,
          code: code,
          runtime: Math.round(totalRuntime),
          memory: totalMemory
        });

        if (dbStatus === 'Accepted') {
          await supabase.from('user_activity').insert({
            user_id: user.id,
            action_type: 'problem_solved',
            title: 'Solved Problem',
            description: `Successfully solved problem #${id}`,
            metadata: { problem_id: id, language: selectedLanguage }
          });
          await gamificationService.claimDailyReward(user.id, 'submission');
          await BadgeService.syncAndCheck(user.id, 'problem_solved');

          // Update challenge progress for problem solving
          await gamificationService.updateChallengeProgress(user.id, 'problems_solved', 1);
        }
      }

      if (status === 'success' && isSubmit) {
        setTimeout(() => {
          setShowAnalytics(true);
        }, 3000);
      }
    } catch (err) {
      setExecutionResult({
        status: 'error',
        testCases: [],
        runtime: 0,
        memory: undefined,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'wrong': return <XCircle className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 dark:text-blue-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'wrong': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Problem not found</h1>
          <button onClick={() => navigate('/problems')} className="text-blue-400 hover:text-blue-300">
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/gemini_generated_image_98pvmv98pvmv98pv-removebg-preview (1).svg"
              alt="CodeForge"
              className="w-6 h-6 object-contain"
            />
            <h2 className="font-medium">{problem.title}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                setSelectedLanguage(newLang);

                // Immediately load new language content to avoid the save-race
                let stored = localStorage.getItem(`code_${id}_${newLang}`);

                // Aggressive Heal logic: detect if saved code is from another language
                if (stored && detectLanguageMismatch(stored, newLang)) {
                  console.warn(`Detected language mismatch for ${newLang}, restoring starter code.`);
                  stored = null;
                }

                if (stored) {
                  setCode(stored);
                } else if (localId && starterCode[localId]?.[newLang]) {
                  setCode(starterCode[localId][newLang]);
                } else {
                  setCode('');
                }
                codeLanguageRef.current = newLang;
                isInitialLoadRef.current = true;
                // Settlement timeout
                setTimeout(() => { isInitialLoadRef.current = false; }, 100);
              }}
              className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:border-blue-500"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={() => runJudge(false)} disabled={executionResult.status === 'running'} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg transition-colors">
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>

          <button onClick={() => runJudge(true)} disabled={executionResult.status === 'running'} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-lg transition-colors">
            <Send className="w-4 h-4" />
            <span>Submit</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex" ref={editorRef}>
        <div className="bg-gray-900 border-r border-gray-800 overflow-y-auto p-6" style={{ width: `${leftPanelWidth}%` }}>
          <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">{tag}</span>
            ))}
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6 whitespace-pre-wrap">{problem.description}</p>
          </div>
          {/* Examples */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Examples</h3>
            {(problem.examples || []).map((ex: any, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 mb-3 text-sm">
                <div><span className="text-gray-400">Input: </span>{ex.input}</div>
                <div><span className="text-gray-400">Output: </span>{ex.output}</div>
                {ex.explanation && <div className="text-gray-400 mt-1">{ex.explanation}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="w-1 bg-gray-800 hover:bg-blue-600 cursor-col-resize" onMouseDown={() => setIsDragging(true)} />

        <div className="flex-1 flex flex-col bg-gray-950">
          <div className="relative flex-1 border-b border-gray-800" style={{ height: `${editorHeight}%` }}>
            <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  if (localId && starterCode[localId]?.[selectedLanguage]) {
                    if (confirm('Reset to starter code? Current changes will be lost.')) {
                      setCode(starterCode[localId][selectedLanguage]);
                    }
                  }
                }}
                className="p-1.5 bg-gray-800/50 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors title='Reset Code'"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1">
                  Reset
                </div>
              </button>
            </div>
            <Editor
              height="100%"
              language={languages.find(l => l.id === selectedLanguage)?.monaco || 'javascript'}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
            />
          </div>

          <div className="h-1 bg-gray-800 hover:bg-blue-600 cursor-row-resize" onMouseDown={() => setIsDraggingVertical(true)} />

          <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase">Test Case Input</span>
                {executionResult.status !== 'idle' && (
                  <div className={`flex items-center gap-2 text-sm ${getStatusColor(executionResult.status)}`}>
                    {getStatusIcon(executionResult.status)}
                    <span>{executionResult.message}</span>
                  </div>
                )}
              </div>
              <textarea
                value={customTestInput}
                onChange={(e) => setCustomTestInput(e.target.value)}
                className="w-full h-20 bg-gray-800 text-gray-300 rounded border border-gray-700 p-2 text-sm focus:outline-none"
                placeholder="Enter custom test input..."
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {executionResult.testCases.map((tc, i) => (
                <div key={i} className={`p-3 rounded-lg border ${tc.passed ? 'bg-green-950/10 border-green-900/50' : 'bg-red-950/10 border-red-900/50'}`}>
                  <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                    {tc.passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    Test Case {i + 1}
                  </div>
                  <div className="text-xs font-mono space-y-1">
                    <div><span className="text-gray-500">Input:</span> {tc.input}</div>
                    <div><span className="text-gray-500">Expected:</span> {tc.expectedOutput}</div>
                    <div><span className="text-gray-500">Actual:</span> <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>{tc.actualOutput}</span></div>
                    {tc.error && <div className="text-red-400 mt-1">{tc.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SubmissionAnalyticsModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        runtime={executionResult.runtime || 0}
        memory={executionResult.memory || 0}
        runtimePercentile={98} // Mock value for demo
        memoryPercentile={94}  // Mock value for demo
        avgRuntime={120}       // Mock value for demo
        fastestRuntime={45}    // Mock value for demo
        avgMemory={32.5}       // Mock value for demo
        lowestMemory={12.4}    // Mock value for demo
        complexityInfo={localId ? PROBLEM_COMPLEXITY[localId] : { time: 'N/A', space: 'N/A' }}
      />
    </div>
  );
}
