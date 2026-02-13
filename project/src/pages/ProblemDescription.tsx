import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, AlertCircle, Bookmark, Plus, Check } from 'lucide-react';
import { problemsData } from '../data/problemsData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemDescription {
  description: string;
  examples: TestCase[];
  constraints: string[];
  timeComplexity: string;
  spaceComplexity: string;
  hints: string[];
}

const problemDescriptions: Record<string, ProblemDescription> = {
  '1': {
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    hints: [
      "A brute force solution would check every pair of numbers, but that's O(n²).",
      "Can we use a hash map to store numbers we've seen so far?",
      "Think about storing the complement (target - current number) in the hash map."
    ]
  },
  '2': {
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    examples: [
      {
        input: "s = \"abcabcbb\"",
        output: "3",
        explanation: "The answer is \"abc\", with the length of 3."
      },
      {
        input: "s = \"bbbbb\"",
        output: "1",
        explanation: "The answer is \"b\", with the length of 1."
      },
      {
        input: "s = \"pwwkew\"",
        output: "3",
        explanation: "The answer is \"wke\", with the length of 3."
      }
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m, n)) where m is the size of the character set",
    hints: [
      "Consider using a sliding window approach.",
      "A hash map can help track the last seen position of each character.",
      "When you encounter a repeated character, move the left pointer."
    ]
  },
  '4': {
    description: `Given a string s, return the longest palindromic substring in s.`,
    examples: [
      {
        input: "s = \"babad\"",
        output: "\"bab\"",
        explanation: "Note: \"aba\" is also a valid answer."
      },
      {
        input: "s = \"cbbd\"",
        output: "\"bb\""
      }
    ],
    constraints: [
      "1 <= s.length <= 1000",
      "s consist of only digits and English letters."
    ],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    hints: [
      "Consider expanding around each character as a potential center.",
      "For odd length palindromes, expand from a single character.",
      "For even length palindromes, expand from the gap between two characters."
    ]
  },
  '5': {
    description: `You are given an integer array height where height[i] is the height of the ith line. Find two lines that, together with the x-axis, form a container that contains the most water.

Return the maximum amount of water a container can store.`,
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area is between heights 8 and 7, which is 49."
      },
      {
        input: "height = [1,1]",
        output: "1"
      }
    ],
    constraints: [
      "n == height.length",
      "2 <= n <= 10^5",
      "1 <= height[i] <= 10^4"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    hints: [
      "Use two pointers, one at the beginning and one at the end.",
      "Move the pointer pointing to the shorter line inward.",
      "Why move the shorter line? Because the area is limited by the shorter height."
    ]
  },
  '6': {
    description: `Given an integer array nums, return the length of the longest strictly increasing subsequence.`,
    examples: [
      {
        input: "nums = [10,9,2,5,3,7,101,18]",
        output: "4",
        explanation: "The longest increasing subsequence is [2,3,7,101]."
      },
      {
        input: "nums = [0,1,0,3,2,3]",
        output: "4"
      },
      {
        input: "nums = [7,7,7,7,7,7,7]",
        output: "1"
      }
    ],
    constraints: [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4"
    ],
    timeComplexity: "O(n²) or O(n log n)",
    spaceComplexity: "O(n)",
    hints: [
      "For O(n²) solution: Use DP where dp[i] is the LIS ending at index i.",
      "For O(n log n) solution: Use patience sorting with binary search.",
      "Maintain a tails array where tails[i] is the smallest ending element of an increasing subsequence of length i+1."
    ]
  },
  '7': {
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.`,
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6."
      },
      {
        input: "nums = [1]",
        output: "1"
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23"
      }
    ],
    constraints: [
      "1 <= nums.length <= 3 * 10^4",
      "-10^5 <= nums[i] <= 10^5"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    hints: [
      "Use Kadane's algorithm.",
      "Keep track of current sum and max sum.",
      "If current sum becomes negative, reset it to 0.",
      "The answer is the maximum sum found during the iteration."
    ]
  },
  '8': {
    description: `Given a string s consisting only of characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
    examples: [
      {
        input: "s = \"()\"",
        output: "true"
      },
      {
        input: "s = \"()[]{}\"",
        output: "true"
      },
      {
        input: "s = \"(]\"",
        output: "false"
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    hints: [
      "Use a stack to keep track of opening brackets.",
      "When you see a closing bracket, check if it matches the top of the stack.",
      "At the end, the stack should be empty for a valid string."
    ]
  },
  '9': {
    description: `Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.`,
    examples: [
      {
        input: "l1 = [1,2,4], l2 = [1,3,4]",
        output: "[1,1,2,3,4,4]"
      },
      {
        input: "l1 = [], l2 = []",
        output: "[]"
      },
      {
        input: "l1 = [], l2 = [0]",
        output: "[0]"
      }
    ],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both l1 and l2 are sorted in non-decreasing order."
    ],
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(1)",
    hints: [
      "Use a dummy node to simplify the code.",
      "Compare the values of the current nodes and append the smaller one.",
      "When one list is exhausted, append the remaining nodes from the other list.",
      "Don't forget to handle edge cases where one or both lists are empty."
    ]
  },
  '10': {
    description: `Given a string s, determine whether any permutation of s is a palindrome.`,
    examples: [
      {
        input: "s = \"code\"",
        output: "false"
      },
      {
        input: "s = \"aab\"",
        output: "true"
      },
      {
        input: "s = \"carerac\"",
        output: "true"
      }
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s consists of only lowercase English letters."
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    hints: [
      "A string can be rearranged into a palindrome if at most one character has an odd count.",
      "Use a hash map or an array to count character frequencies.",
      "Count how many characters have odd frequencies.",
      "The string can form a palindrome if the count of odd-frequency characters is <= 1."
    ]
  }
};

export default function ProblemDescription() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lists, setLists] = useState<any[]>([]);
  const [showListSelector, setShowListSelector] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<string[]>([]);
  const [dbProblem, setDbProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Derive problem and problemDesc either from DB data (slug matching) or ID matching
  const problem = dbProblem
    ? (problemsData.find(p => p.slug === dbProblem.slug) || dbProblem)
    : (problemsData.find(p => p.id === id));

  const problemDesc = problem ? problemDescriptions[problem.id] : undefined;

  useEffect(() => {
    async function init() {
      if (id) {
        await fetchProblemFromDb();
      }
    }
    init();
  }, [id]);

  useEffect(() => {
    if (user && dbProblem) {
      fetchUserLists();
      checkSavedStatus();
    }
  }, [user, dbProblem]);

  const fetchProblemFromDb = async () => {
    try {
      setLoading(true);
      // Try fetching by UUID first (since we updated Links to use ID)
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Fallback for legacy ID (numeric strings in local data) if needed, 
        // though we want to phase this out.
        console.warn('Problem not found by UUID, trying slug fallback if applicable');
      }

      if (data) {
        setDbProblem(data);
      }
    } catch (err) {
      console.error('Error fetching problem from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_problem_lists')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      setLists(data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  const checkSavedStatus = async () => {
    try {
      if (!dbProblem) return;
      const { data, error } = await supabase
        .from('user_problem_list_items')
        .select('list_id')
        .eq('problem_id', dbProblem.id);
      if (error) throw error;
      setSavedLists(data?.map(d => d.list_id) || []);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const toggleSaveToList = async (listId: string) => {
    if (!user || !dbProblem) return;
    try {
      setSaving(listId);
      if (savedLists.includes(listId)) {
        // Remove
        const { error } = await supabase
          .from('user_problem_list_items')
          .delete()
          .eq('list_id', listId)
          .eq('problem_id', dbProblem.id);
        if (error) throw error;
        setSavedLists(savedLists.filter(l => l !== listId));
      } else {
        // Add
        const { error } = await supabase
          .from('user_problem_list_items')
          .insert([{ list_id: listId, problem_id: dbProblem.id }]);
        if (error) throw error;
        setSavedLists([...savedLists, listId]);
      }
    } catch (err) {
      console.error('Error toggling list item:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!problem || (!problemDesc && !dbProblem)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Problem not found</h1>
          <button
            onClick={() => navigate('/problems')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/problems')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Problems
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/gemini_generated_image_98pvmv98pvmv98pv-removebg-preview (1).svg"
                  alt="CodeForge"
                  className="w-10 h-10 object-contain"
                />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {problem.title}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {problem.acceptance_rate}% Acceptance Rate
                </span>
                <span className="capitalize">{problem.platform}</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowListSelector(!showListSelector)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${savedLists.length > 0
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <Bookmark className={`w-4 h-4 ${savedLists.length > 0 ? 'fill-current' : ''}`} />
                {savedLists.length > 0 ? 'Saved' : 'Save'}
              </button>

              {showListSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl">
                  <div className="p-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add to List</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {lists.length > 0 ? (
                      lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => toggleSaveToList(list.id)}
                          disabled={saving === list.id}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-2 truncate">
                            {list.name}
                          </span>
                          {saving === list.id ? (
                            <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                          ) : savedLists.includes(list.id) ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">You don't have any lists.</p>
                        <Link to="/my-lists" className="text-xs text-indigo-500 font-bold hover:underline">
                          Create one
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Problem Description */}
        {problemDesc && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {problemDesc.description}
              </p>
            </div>
          </div>
        )}

        {!problemDesc && dbProblem?.description && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {dbProblem.description}
              </p>
            </div>
          </div>
        )}

        {/* Examples */}
        {(problemDesc?.examples || dbProblem?.examples) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Examples</h2>
            <div className="space-y-4">
              {(problemDesc?.examples || dbProblem?.examples || []).map((example: TestCase, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Input: </span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                      {example.input}
                    </code>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Output: </span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                      {example.output}
                    </code>
                  </div>
                  {example.explanation && (
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      <span className="font-medium">Explanation: </span>
                      {example.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {(problemDesc?.constraints || dbProblem?.constraints) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Constraints</h2>
            <ul className="space-y-2">
              {(problemDesc?.constraints || dbProblem?.constraints || []).map((constraint: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400 mt-1">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complexity Analysis */}
        {(problemDesc?.timeComplexity || problemDesc?.spaceComplexity) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {problemDesc?.timeComplexity && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Complexity</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-mono">{problemDesc.timeComplexity}</p>
              </div>
            )}

            {problemDesc?.spaceComplexity && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Space Complexity</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-mono">{problemDesc.spaceComplexity}</p>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {problemDesc?.hints && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Hints
            </h2>
            <ul className="space-y-2">
              {problemDesc.hints.map((hint: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">💡</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Topics</h2>
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
