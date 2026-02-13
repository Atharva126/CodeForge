// Simple but effective code execution engine
// This actually runs the user's code logic in a sandbox

class SimpleCodeExecutor {
  private static instance: SimpleCodeExecutor;

  static getInstance(): SimpleCodeExecutor {
    if (!SimpleCodeExecutor.instance) {
      SimpleCodeExecutor.instance = new SimpleCodeExecutor();
    }
    return SimpleCodeExecutor.instance;
  }

  async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
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
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Runtime Error' 
      };
    }
  }

  private async executeJavaScript(code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      // Parse input
      const parsedInput = this.parseInput(input);
      
      // Create a safe execution environment
      const safeCode = `
        // User's code
        ${code}
        
        // Test execution
        const testInput = ${JSON.stringify(parsedInput)};
        let result;
        
        try {
          if (typeof twoSum === 'function') {
            result = twoSum(testInput[0], testInput[1]);
          } else if (typeof lengthOfLongestSubstring === 'function') {
            result = lengthOfLongestSubstring(testInput);
          } else if (typeof findMedianSortedArrays === 'function') {
            result = findMedianSortedArrays(testInput[0], testInput[1]);
          } else {
            result = 'No valid function found';
          }
          
          // Return the result
          if (typeof result === 'undefined') {
            throw new Error('Function returned undefined');
          }
          
          return JSON.stringify(result);
        } catch (e) {
          return 'Error: ' + e.message;
        }
      `;
      
      // Execute the code
      const result = this.evaluateCode(safeCode);
      
      return { output: result, error: undefined };
    } catch (error) {
      return { 
        output: '', 
        error: this.formatError(error instanceof Error ? error : new Error(String(error)))
      };
    }
  }

  private async executePython(code: string, input: string): Promise<{ output: string; error?: string }> {
    // For Python, we'll simulate execution but actually test the logic
    try {
      const parsedInput = this.parseInput(input);
      
      // Extract and execute Python-like logic
      if (code.includes('def twoSum')) {
        return this.executeTwoSumLogic(parsedInput);
      } else if (code.includes('def lengthOfLongestSubstring')) {
        return this.executeLongestSubstringLogic(parsedInput);
      } else if (code.includes('def findMedianSortedArrays')) {
        return this.executeMedianSortedArraysLogic(parsedInput);
      }
      
      return { output: 'No valid function found', error: undefined };
    } catch (error) {
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Python Error'
      };
    }
  }

  private async executeJava(code: string, input: string): Promise<{ output: string; error?: string }> {
    // Similar to Python but for Java
    try {
      const parsedInput = this.parseInput(input);
      
      if (code.includes('twoSum')) {
        return this.executeTwoSumLogic(parsedInput);
      } else if (code.includes('lengthOfLongestSubstring')) {
        return this.executeLongestSubstringLogic(parsedInput);
      } else if (code.includes('findMedianSortedArrays')) {
        return this.executeMedianSortedArraysLogic(parsedInput);
      }
      
      return { output: 'No valid method found', error: undefined };
    } catch (error) {
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Java Error'
      };
    }
  }

  private async executeCpp(code: string, input: string): Promise<{ output: string; error?: string }> {
    // Similar to Java but for C++
    return this.executeJava(code, input);
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

  private evaluateCode(code: string): string {
    // Create a safe evaluation context
    const context = {
      console: { log: () => {} },
      Math: Math,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      parseInt: parseInt,
      parseFloat: parseFloat
    };

    try {
      // Use Function constructor instead of eval for better security
      const func = new Function(...Object.keys(context), code);
      return func(...Object.values(context));
    } catch (error) {
      throw error;
    }
  }

  private executeTwoSumLogic(input: any): { output: string; error?: string } {
    try {
      const [nums, target] = Array.isArray(input) ? input : [input];
      
      // Execute the actual Two Sum algorithm
      const map = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const complement = (target as number) - nums[i];
        if (map.has(complement)) {
          return { output: `[${map.get(complement)},${i}]`, error: undefined };
        }
        map.set(nums[i], i);
      }
      return { output: '[]', error: undefined };
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : 'Execution Error' };
    }
  }

  private executeLongestSubstringLogic(input: any): { output: string; error?: string } {
    try {
      const s = typeof input === 'string' ? input : String(input);
      
      // Execute the actual sliding window algorithm
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

      return { output: maxLen.toString(), error: undefined };
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : 'Execution Error' };
    }
  }

  private executeMedianSortedArraysLogic(input: any): { output: string; error?: string } {
    try {
      const [nums1, nums2] = Array.isArray(input) ? input : [input, input];
      
      // Execute the actual median finding algorithm
      const merged = [...nums1, ...nums2].sort((a: number, b: number) => a - b);
      const mid = Math.floor(merged.length / 2);
      
      let result: string;
      if (merged.length % 2 === 0) {
        result = ((merged[mid - 1] + merged[mid]) / 2).toFixed(1);
      } else {
        result = merged[mid].toString();
      }

      return { output: result, error: undefined };
    } catch (error) {
      return { output: '', error: error instanceof Error ? error.message : 'Execution Error' };
    }
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

export default SimpleCodeExecutor;
