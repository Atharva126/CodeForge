// Code execution service - simulates real code execution
// In production, this would connect to a real code execution service like Judge0, CodeX, or custom backend

interface ExecutionRequest {
  language: string;
  code: string;
  input: string;
  expectedOutput?: string;
}

interface ExecutionResponse {
  output: string;
  error?: string;
  runtime: number;
  memory: number;
  exitCode: number;
}

class CodeExecutor {
  private static instance: CodeExecutor;

  static getInstance(): CodeExecutor {
    if (!CodeExecutor.instance) {
      CodeExecutor.instance = new CodeExecutor();
    }
    return CodeExecutor.instance;
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    
    try {
      // Simulate real code execution based on language and problem
      const result = await this.simulateExecution(request);
      
      const runtime = Date.now() - startTime;
      
      return {
        output: result.output,
        error: result.error,
        runtime,
        memory: Math.floor(Math.random() * 50) + 10, // Simulated memory usage
        exitCode: result.error ? 1 : 0
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        runtime: Date.now() - startTime,
        memory: 0,
        exitCode: 1
      };
    }
  }

  private async simulateExecution(request: ExecutionRequest): Promise<{ output: string; error?: string }> {
    const { language, code, input } = request;

    // Check for syntax errors with detailed messages
    const syntaxCheck = this.hasSyntaxErrors(code, language);
    if (syntaxCheck.hasError) {
      return { output: '', error: syntaxCheck.error };
    }

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));

    // Execute based on problem and input
    const problemId = this.extractProblemId(code);
    
    try {
      const output = this.executeProblem(problemId, input, language);
      return { output };
    } catch (error) {
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Runtime Error: An error occurred during execution' 
      };
    }
  }

  private hasSyntaxErrors(code: string, language: string): { hasError: boolean; error?: string } {
    // Basic syntax validation with specific error messages
    if (!code.trim()) return { hasError: true, error: 'Error: Empty code' };

    switch (language) {
      case 'python':
        // Check for basic Python syntax errors
        if (code.includes('def ') && !code.includes('):')) {
          return { hasError: true, error: 'SyntaxError: expected \':\' after function definition' };
        }
        if (code.includes('if ') && !code.includes(':')) {
          return { hasError: true, error: 'SyntaxError: expected \':\' after if statement' };
        }
        if (code.includes('for ') && !code.includes(':')) {
          return { hasError: true, error: 'SyntaxError: expected \':\' after for loop' };
        }
        if (code.includes('while ') && !code.includes(':')) {
          return { hasError: true, error: 'SyntaxError: expected \':\' after while loop' };
        }
        
        // Check for unclosed strings
        const singleQuotes = (code.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) {
          return { hasError: true, error: 'SyntaxError: EOL while scanning string literal' };
        }
        
        const doubleQuotes = (code.match(/"/g) || []).length;
        if (doubleQuotes % 2 !== 0) {
          return { hasError: true, error: 'SyntaxError: EOL while scanning string literal' };
        }
        break;
      
      case 'javascript':
        // Check for basic JavaScript syntax errors
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          return { hasError: true, error: 'SyntaxError: Unexpected token \'}\'. Missing closing brace' };
        }
        
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          return { hasError: true, error: 'SyntaxError: Unexpected token \')\'. Missing closing parenthesis' };
        }
        
        // Check for missing semicolons in common cases
        const lines = code.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
              !trimmed.includes('if ') && !trimmed.includes('for ') && !trimmed.includes('while ') &&
              !trimmed.includes('function ') && !trimmed.includes('=>') && !trimmed.includes('//')) {
            return { hasError: true, error: `SyntaxError: Missing semicolon at end of line: "${trimmed}"` };
          }
        }
        break;

      case 'java':
        // Check for basic Java syntax errors
        if (code.includes('class ') && !code.includes('{')) {
          return { hasError: true, error: 'SyntaxError: Expected \'{\' after class declaration' };
        }
        if (code.includes('public ') && !code.includes('{')) {
          return { hasError: true, error: 'SyntaxError: Expected \'{\' after public declaration' };
        }
        
        // Check for missing semicolons
        const javaLines = code.split('\n');
        for (const line of javaLines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
              !trimmed.includes('class ') && !trimmed.includes('import ') && !trimmed.includes('//')) {
            return { hasError: true, error: `SyntaxError: \';\' expected at end of statement: "${trimmed}"` };
          }
        }
        break;

      case 'cpp':
        // Check for basic C++ syntax errors
        if (code.includes('#include') && !code.includes('<')) {
          return { hasError: true, error: 'SyntaxError: Expected \'<\' after #include directive' };
        }
        if (code.includes('int main') && !code.includes('{')) {
          return { hasError: true, error: 'SyntaxError: Expected \'{\' after main function declaration' };
        }
        
        // Check for missing semicolons
        const cppLines = code.split('\n');
        for (const line of cppLines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
              !trimmed.includes('#include') && !trimmed.includes('using ') && !trimmed.includes('//')) {
            return { hasError: true, error: `SyntaxError: expected \';\' at end of declaration: "${trimmed}"` };
          }
        }
        break;
    }

    return { hasError: false };
  }

  private extractProblemId(code: string): string {
    // Extract problem ID from code comments or function names
    const lines = code.split('\n');
    for (const line of lines) {
      if (line.includes('twoSum') || line.includes('Two Sum')) return '1';
      if (line.includes('lengthOfLongestSubstring') || line.includes('Longest Substring')) return '2';
      if (line.includes('findMedianSortedArrays') || line.includes('Median')) return '3';
      if (line.includes('longestPalindrome') || line.includes('Palindrome')) return '4';
      if (line.includes('maxArea') || line.includes('Container')) return '5';
      if (line.includes('lengthOfLIS') || line.includes('Increasing')) return '6';
      if (line.includes('maxSubArray') || line.includes('Subarray')) return '7';
      if (line.includes('isValid') || line.includes('Valid')) return '8';
      if (line.includes('mergeTwoLists') || line.includes('Merge')) return '9';
      if (line.includes('canPermutePalindrome') || line.includes('Permutation')) return '10';
    }
    return '1'; // Default to problem 1
  }

  private executeProblem(problemId: string, input: string, language: string): string {
    // Real problem solutions
    switch (problemId) {
      case '1': // Two Sum
        return this.solveTwoSum(input, language);
      case '2': // Longest Substring Without Repeating
        return this.solveLongestSubstring(input, language);
      case '3': // Median of Two Sorted Arrays
        return this.solveMedianSortedArrays(input, language);
      default:
        return '42'; // Default fallback
    }
  }

  private solveTwoSum(input: string, language: string): string {
    try {
      // Parse input: [2,7,11,15], 9
      const match = input.match(/\[(.*?)\],\s*(\d+)/);
      if (!match) return '[]';

      const nums = JSON.parse(`[${match[1]}]`);
      const target = parseInt(match[2]);

      // Real Two Sum algorithm
      const map = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
          return `[${map.get(complement)},${i}]`;
        }
        map.set(nums[i], i);
      }
      return '[]';
    } catch {
      return '[]';
    }
  }

  private solveLongestSubstring(input: string, language: string): string {
    try {
      // Parse input: "abcabcbb"
      const match = input.match(/"([^"]+)"/);
      if (!match) return '0';

      const s = match[1];
      
      // Real sliding window algorithm
      const charSet = new Set<string>();
      let left = 0;
      let maxLen = 0;

      for (let right = 0; right < s.length; right++) {
        while (charSet.has(s[right])) {
          charSet.delete(s[left]);
          left++;
        }
        charSet.add(s[right]);
        maxLen = Math.max(maxLen, right - left + 1);
      }

      return maxLen.toString();
    } catch {
      return '0';
    }
  }

  private solveMedianSortedArrays(input: string, language: string): string {
    try {
      // Parse input: [1,3], [2]
      const match = input.match(/\[(.*?)\],\s*\[(.*?)\]/);
      if (!match) return '0.0';

      const nums1 = JSON.parse(`[${match[1]}]`);
      const nums2 = JSON.parse(`[${match[2]}]`);
      
      // Real median finding algorithm
      const merged = [...nums1, ...nums2].sort((a, b) => a - b);
      const mid = Math.floor(merged.length / 2);
      
      if (merged.length % 2 === 0) {
        return ((merged[mid - 1] + merged[mid]) / 2).toFixed(1);
      } else {
        return merged[mid].toString();
      }
    } catch {
      return '0.0';
    }
  }
}

export default CodeExecutor;
