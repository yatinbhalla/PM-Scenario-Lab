import { SimulationConfig, EvaluationResult } from "../types";

export class GeminiAPIError extends Error {
  constructor(message: string, public type: 'RATE_LIMIT' | 'INVALID_REQUEST' | 'NETWORK' | 'UNKNOWN') {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

function handleGeminiError(error: any): never {
  console.error("Gemini API Error details:", error);
  const errorMessage = error?.message || String(error);
  
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
    throw new GeminiAPIError("You've hit the rate limit for the AI model. Please wait a moment and try again.", 'RATE_LIMIT');
  } else if (errorMessage.includes('400') || errorMessage.toLowerCase().includes('invalid')) {
    throw new GeminiAPIError("The AI model received an invalid request. Please try rephrasing.", 'INVALID_REQUEST');
  } else if (errorMessage.toLowerCase().includes('fetch') || errorMessage.toLowerCase().includes('network')) {
    throw new GeminiAPIError("Network error connecting to the AI service. Please check your connection.", 'NETWORK');
  }
  
  throw new GeminiAPIError("An unexpected error occurred with the AI service. Please try again.", 'UNKNOWN');
}

class RemoteChat {
  constructor(private type: 'simulation' | 'mentor', private config: any, private history: any[]) {}
  
  async sendMessage(params: { message: string }) {
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: this.type,
          config: this.config,
          history: this.history,
          message: params.message
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      this.history = data.history;
      return { text: data.text };
    } catch (error) {
      handleGeminiError(error);
    }
  }

  async getHistory() {
    return this.history;
  }
}

export async function startSimulationChat(config: SimulationConfig, maxTurns: number, history?: any[]) {
  return new RemoteChat('simulation', { config, maxTurns }, history || []);
}

export async function startMentorChat(scenarioContext: string) {
  return new RemoteChat('mentor', { scenarioContext }, []);
}

export async function validateCustomTheme(theme: string): Promise<boolean> {
  try {
    const res = await fetch('/api/gemini/validate-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    if (!res.ok) throw new Error('Failed to validate theme');
    const data = await res.json();
    return data.valid;
  } catch (error) {
    console.error("Error validating theme:", error);
    return true; // Fallback to true if validation fails
  }
}

export async function generateHint(chatHistory: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini/generate-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory })
    });
    if (!res.ok) throw new Error('Failed to generate hint');
    const data = await res.json();
    return data.hint;
  } catch (error) {
    console.error("Failed to generate hint:", error);
    return "Try to balance the technical constraints with the business needs.";
  }
}

export async function evaluateSession(chatHistory: string, turnCount: number, maxTurns: number): Promise<EvaluationResult> {
  try {
    const res = await fetch('/api/gemini/evaluate-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory, turnCount, maxTurns })
    });
    if (!res.ok) throw new Error('Failed to evaluate session');
    return await res.json();
  } catch (error) {
    console.error("Failed to evaluate session:", error);
    return {
      overallScore: 0,
      executiveSummary: "Evaluation failed due to an error.",
      yourApproach: "",
      idealApproach: "",
      unreadPolitics: "",
      alternativeStrategicPaths: [],
      targetedAreasForImprovement: [],
      thinkingToInvoke: "",
      competencyBreakdown: [],
      actionableNextStep: ""
    };
  }
}
