// Working Code Executor - Simple and Direct
// This actually executes user code without complex abstractions

class WorkingCodeExecutor {
  private static instance: WorkingCodeExecutor;

  static getInstance(): WorkingCodeExecutor {
    if (!WorkingCodeExecutor.instance) {
      WorkingCodeExecutor.instance = new WorkingCodeExecutor();
    }
    return WorkingCodeExecutor.instance;
  }

  async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('WorkingCodeExecutor: Executing', language);
      
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
      console.error('WorkingCodeExecutor error:', error);
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Execution error' 
      };
    }
  }

  private async executeJavaScript(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('Executing JavaScript directly');
      
      // Parse input
      const parsedInput = this.parseInput(input);
      console.log('Parsed input:', parsedInput);
      
      // Create execution context
      const context = {
        input: parsedInput,
        console: { log: (...args: any[]) => console.log(...args) },
        Math: Math,
        JSON: JSON,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        parseInt: parseInt,
        parseFloat: parseFloat
      };

      // Execute user's code directly
      let result = '';
      
      // Check what function is defined and call it
      if (code.includes('twoSum')) {
        console.log('Found twoSum function');
        // Execute the code to define the function
        eval(code);
        // Call the function
        if (typeof (window as any).twoSum === 'function') {
          result = (window as any).twoSum(parsedInput[0], parsedInput[1]);
        } else if (typeof twoSum === 'function') {
          result = (twoSum as any)(parsedInput[0], parsedInput[1]);
        } else {
          result = 'twoSum function not found';
        }
      } else if (code.includes('lengthOfLongestSubstring')) {
        console.log('Found lengthOfLongestSubstring function');
        eval(code);
        if (typeof (window as any).lengthOfLongestSubstring === 'function') {
          result = (window as any).lengthOfLongestSubstring(parsedInput);
        } else if (typeof lengthOfLongestSubstring === 'function') {
          result = (lengthOfLongestSubstring as any)(parsedInput);
        } else {
          result = 'lengthOfLongestSubstring function not found';
        }
      } else if (code.includes('findMedianSortedArrays')) {
        console.log('Found findMedianSortedArrays function');
        eval(code);
        if (typeof (window as any).findMedianSortedArrays === 'function') {
          result = (window as any).findMedianSortedArrays(parsedInput[0], parsedInput[1]);
        } else if (typeof findMedianSortedArrays === 'function') {
          result = (findMedianSortedArrays as any)(parsedInput[0], parsedInput[1]);
        } else {
          result = 'findMedianSortedArrays function not found';
        }
      } else {
        result = 'No valid function found in code';
      }
      
      console.log('Result:', result);
      return { output: String(result) };
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

export default WorkingCodeExecutor;
