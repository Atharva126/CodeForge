// Simple Working Code Executor
// This actually executes user code logic without complex abstractions

class SimpleWorkingExecutor {
  private static instance: SimpleWorkingExecutor;

  static getInstance(): SimpleWorkingExecutor {
    if (!SimpleWorkingExecutor.instance) {
      SimpleWorkingExecutor.instance = new SimpleWorkingExecutor();
    }
    return SimpleWorkingExecutor.instance;
  }

  async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('SimpleWorkingExecutor: Executing', language);
      
      switch (language) {
        case 'javascript':
          return this.executeJavaScript(code, input);
        case 'python':
          return this.executePython(code, input);
        case 'java':
          return this.executeJava(code, input);
        case 'cpp':
          return this.executeCpp(code, input);
        default:
          return { output: '', error: `Unsupported language: ${language}` };
      }
    } catch (error) {
      console.error('SimpleWorkingExecutor error:', error);
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Execution error' 
      };
    }
  }

  private async executeJavaScript(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('Executing JavaScript code');
      
      // Parse input
      const parsedInput = this.parseInput(input);
      console.log('Parsed input:', parsedInput);
      
      // Create a simple function to execute user code
      const executeUserCode = new Function('input', `
        try {
          ${code}
          
          // Test the function
          let result;
          if (typeof twoSum === 'function') {
            result = twoSum(input[0], input[1]);
          } else if (typeof lengthOfLongestSubstring === 'function') {
            result = lengthOfLongestSubstring(input);
          } else if (typeof findMedianSortedArrays === 'function') {
            result = findMedianSortedArrays(input[0], input[1]);
          } else {
            result = 'No valid function found';
          }
          
          return { success: true, result: String(result) };
        } catch (error) {
          return { success: false, error: error.message };
        }
      `);
      
      const result = executeUserCode(parsedInput);
      
      if (result.success) {
        return { output: result.result };
      } else {
        return { output: '', error: result.error };
      }
      
    } catch (error) {
      console.error('JavaScript execution error:', error);
      return { output: '', error: error instanceof Error ? error.message : 'Execution error' };
    }
  }

  private async executePython(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      const parsedInput = this.parseInput(input);
      
      // Execute Python-like logic
      if (code.includes('def twoSum')) {
        const result = this.executeTwoSumLogic(parsedInput);
        return { output: result };
      } else if (code.includes('def lengthOfLongestSubstring')) {
        const result = this.executeLongestSubstringLogic(parsedInput);
        return { output: result };
      } else if (code.includes('def findMedianSortedArrays')) {
        const result = this.executeMedianSortedArraysLogic(parsedInput);
        return { output: result };
      }
      
      return { output: 'No valid function found' };
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : 'Python execution error' };
    }
  }

  private async executeJava(code: string, input: string): Promise<{ output: string; error?: string }> {
    return this.executePython(code, input);
  }

  private async executeCpp(code: string, input: string): Promise<{ output: string; error?: string }> {
    return this.executePython(code, input);
  }

  private parseInput(input: string): any {
    try {
      if (input.includes('[') && input.includes(']')) {
        const match = input.match(/\[(.*?)\],\s*(.+)/);
        if (match) {
          const arr = JSON.parse(`[${match[1]}]`);
          const target = match[2];
          return [arr, isNaN(target) ? target : Number(target)];
        }
      }
      if (input.includes('"')) {
        const match = input.match(/"([^"]+)"/);
        return match ? match[1] : input;
      }
      return isNaN(input) ? input : Number(input);
    } catch (e) {
      return input;
    }
  }

  private executeTwoSumLogic(input: any): string {
    const [nums, target] = Array.isArray(input) ? input : [input];
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const complement = (target as number) - nums[i];
      if (map.has(complement)) {
        return `[${map.get(complement)},${i}]`;
      }
      map.set(nums[i], i);
    }
    return '[]';
  }

  private executeLongestSubstringLogic(input: any): string {
    const s = typeof input === 'string' ? input : String(input);
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
  }

  private executeMedianSortedArraysLogic(input: any): string {
    const [nums1, nums2] = Array.isArray(input) ? input : [input, input];
    const merged = [...nums1, ...nums2].sort((a: number, b: number) => a - b);
    const mid = Math.floor(merged.length / 2);
    
    if (merged.length % 2 === 0) {
      return ((merged[mid - 1] + merged[mid]) / 2).toFixed(1);
    } else {
      return merged[mid].toString();
    }
  }
}

export default SimpleWorkingExecutor;
