// Judge0 API Integration - Free Code Execution Service
// Uses Judge0 CE (Community Edition) for reliable code execution

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface Judge0Response {
  token: string;
}

interface Judge0Result {
  token: string;
  status: {
    id: number;
    description: string;
  };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: string;
}

class Judge0Executor {
  private static instance: Judge0Executor;
  private readonly API_URL = 'https://ce.judge0.com';
  private readonly API_KEY = ''; // Judge0 CE doesn't require API key for basic usage
  
  // Language IDs from Judge0 documentation
  private readonly LANGUAGE_IDS = {
    javascript: 63, // JavaScript (Node.js)
    python: 71,    // Python 3
    java: 62,      // Java
    cpp: 54        // C++
  };

  static getInstance(): Judge0Executor {
    if (!Judge0Executor.instance) {
      Judge0Executor.instance = new Judge0Executor();
    }
    return Judge0Executor.instance;
  }

  async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string }> {
    try {
      const languageId = this.LANGUAGE_IDS[language as keyof typeof this.LANGUAGE_IDS];
      if (!languageId) {
        return { output: '', error: `Unsupported language: ${language}` };
      }

      // Create submission
      const submission: Judge0Submission = {
        source_code: code,
        language_id: languageId,
        stdin: input,
        cpu_time_limit: 2, // 2 seconds
        memory_limit: 128  // 128 MB
      };

      console.log('Submitting to Judge0:', { language, languageId, input });

      // Submit code to Judge0
      const submitResponse = await fetch(`${this.API_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      });

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit code: ${submitResponse.statusText}`);
      }

      const submitResult: Judge0Response = await submitResponse.json();
      console.log('Judge0 submission token:', submitResult.token);

      // Get the result
      const result = await this.getSubmissionResult(submitResult.token);
      
      // Process the result
      return this.processJudge0Result(result);

    } catch (error) {
      console.error('Judge0 execution error:', error);
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Execution failed' 
      };
    }
  }

  private async getSubmissionResult(token: string): Promise<Judge0Result> {
    const maxAttempts = 20; // Maximum 20 attempts (10 seconds)
    const delay = 500; // 500ms between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.API_URL}/submissions/${token}`);
        if (!response.ok) {
          throw new Error(`Failed to get result: ${response.statusText}`);
        }

        const result: Judge0Result = await response.json();
        console.log('Judge0 result status:', result.status.description);

        // Check if execution is complete
        if (result.status.id >= 3) { // 3 = Accepted, 4+ = various error states
          return result;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Execution timeout');
  }

  private processJudge0Result(result: Judge0Result): { output: string; error?: string } {
    const status = result.status.description;
    
    switch (status) {
      case 'Accepted':
        return { output: result.stdout || '' };
      
      case 'Compilation Error':
        return { 
          output: '', 
          error: `Compilation Error: ${result.compile_output || 'Unknown compilation error'}` 
        };
      
      case 'Runtime Error (SIGSEGV)':
      case 'Runtime Error (SIGXFSZ)':
      case 'Runtime Error (SIGFPE)':
      case 'Runtime Error (SIGABRT)':
      case 'Runtime Error (NZEC)':
      case 'Runtime Error (Other)':
        return { 
          output: '', 
          error: `Runtime Error: ${result.stderr || 'Unknown runtime error'}` 
        };
      
      case 'Time Limit Exceeded':
        return { 
          output: '', 
          error: 'Time Limit Exceeded' 
        };
      
      case 'Memory Limit Exceeded':
        return { 
          output: '', 
          error: 'Memory Limit Exceeded' 
        };
      
      case 'Output Limit Exceeded':
        return { 
          output: '', 
          error: 'Output Limit Exceeded' 
        };
      
      default:
        return { 
          output: '', 
          error: `Execution failed with status: ${status}` 
        };
    }
  }

  // Helper method to get supported languages
  getSupportedLanguages(): string[] {
    return Object.keys(this.LANGUAGE_IDS);
  }

  // Helper method to check if Judge0 is available
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/about`);
      return response.ok;
    } catch (error) {
      console.error('Judge0 availability check failed:', error);
      return false;
    }
  }
}

export default Judge0Executor;
