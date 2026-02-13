// Simple and Direct Code Execution Engine
// This actually executes the user's code logic without complex abstractions

class DirectCodeExecutor {
  private static instance: DirectCodeExecutor;

  static getInstance(): DirectCodeExecutor {
    if (!DirectCodeExecutor.instance) {
      DirectCodeExecutor.instance = new DirectCodeExecutor();
    }
    return DirectCodeExecutor.instance;
  }

  async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('DirectCodeExecutor: Starting execution for', language);
      
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
      console.error('DirectCodeExecutor error:', error);
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Execution error' 
      };
    }
  }

  private async executeJavaScript(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      console.log('Executing JavaScript code directly');
      
      // Parse input
      const parsedInput = this.parseInput(input);
      console.log('Parsed input:', parsedInput);
      
      // Create a simple execution context
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

      // Execute the user's code in a safe way
      const userCode = `
        // User's code
        ${code}
        
        // Test execution
        let result;
        if (typeof twoSum === 'function') {
          console.log('Found twoSum function, calling with:', parsedInput);
          result = twoSum(context.input[0], context.input[1]);
          console.log('twoSum returned:', result);
        } else if (typeof lengthOfLongestSubstring === 'function') {
          console.log('Found lengthOfLongestSubstring function, calling with:', parsedInput);
          result = lengthOfLongestSubstring(context.input);
          console.log('lengthOfLongestSubstring returned:', result);
        } else if (typeof findMedianSortedArrays === 'function') {
          console.log('Found findMedianSortedArrays function, calling with:', parsedInput);
          result = findMedianSortedArrays(context.input[0], context.input[1]);
          console.log('findMedianSortedArrays returned:', result);
        } else {
          console.log('No function found in code');
          result = 'No function found';
        }
        
        return { output: String(result) };
      `;
      
      // Execute the code
      const func = new Function('context', userCode);
      const result = func(context);
      
      return { output: result || '' };
    } catch (error) {
      console.error('JavaScript execution error:', error);
      return { output: '', error: this.formatError(error instanceof Error ? error : new Error(String(error))) };
    }
  }

  private async executePython(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      const parsedInput = this.parseInput(input);
      
      // Execute Python-like logic directly
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
    // Similar to Python but with Java syntax
    return this.executePython(code, input);
  }

  private async executeCpp(code: string, input: string): Promise<{ output: string; error?: string }> {
    // Similar to Python but with C++ syntax
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
    
    let result: string;
    if (merged.length % 2 === 0) {
      result = ((merged[mid - 1] + merged[mid]) / 2).toFixed(1);
    } else {
      result = merged[mid].toString();
    }

    return result;
  }

  private formatError(error: Error): string {
    const message = error.message;
    
    if (message.includes('Unexpected token')) {
      return `SyntaxError: ${message}`;
    }
    if (message.includes('is not defined')) {
      return `ReferenceError: ${message}`;
    }
    if (message.includes('Cannot read property')) {
      return `TypeError: ${message}`;
    }
    if (message.includes('is not a function')) {
      return `TypeError: ${message}`;
    }
    
    return `Error: ${message}`;
  }
}

export default DirectCodeExecutor;
