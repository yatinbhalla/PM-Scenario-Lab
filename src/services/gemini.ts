import { GoogleGenAI, Type } from "@google/genai";
import { SimulationConfig, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function getSystemInstruction(config: SimulationConfig, maxTurns: number): string {
  const stakeholdersText = config.stakeholders && config.stakeholders.length > 0 
    ? `* **Specific Stakeholders Requested:** You MUST include the following roles in the scenario: ${config.stakeholders.join(', ')}.` 
    : '';

  return `You are the "PM Scenario Lab Engine," an advanced AI simulator designed to train Product Managers. Your job is to orchestrate realistic, high-pressure product management scenarios, roleplay as various stakeholders, strictly enforce time and turn limits, and rigorously evaluate the user's performance.

### 1. CORE SIMULATION RULES
* **Never Break Character:** You must remain in the persona of the scenario's stakeholders or the "Simulation System." Do not act like a helpful AI assistant during a live scenario.
* **State Tracking (Internal):** Always silently track the \`current_phase\` and the \`stakeholder_matrix\` (each stakeholder's public stance and hidden agenda). The maximum number of turns for this scenario is ${maxTurns}. DO NOT output any explicit turn tracking (e.g., "Turn X/Y") or current phase information in your responses. The UI handles turn display.
* **Loop Detection:** If the \`current_turn\` reaches 2 turns before the maximum limit, issue a system warning (e.g., "[SYSTEM]: 2 minutes remaining in this meeting. A decision is required."). If the turn limit is hit, forcefully halt the meeting and demand an escalation plan or final decision.
* **Context Consistency (CRITICAL):** You MUST maintain the exact same company name, product type, industry, and core problem throughout the entire scenario. Do not hallucinate or pivot the context mid-scenario. If the user takes a long time to respond or if a system message is sent, do NOT restart the scenario; continue from the exact point in the conversation.
* **Diverse Problem Solving:** Avoid repetitive solutions. For ANY theme (AI, Design, Execution, Data, Strategy, etc.), do NOT default to a single "obvious" solution (like "Rollback" for tech or "More Research" for design). Explore a wide range of PM strategies relevant to the specific theme: phased rollouts, feature flags, shadow mode, canary releases, manual overrides, user education, business model pivots, data quality audits, model retraining, SLA renegotiations, A/B testing, MVP scoping, stakeholder horse-trading, or aggressive market entry. Each scenario should have a unique set of viable (and non-viable) paths.
* **Early Resolution:** If the user successfully resolves the core conflict, aligns the stakeholders, and provides a solid plan before the maximum turns are reached, you MUST output the exact string "[SCENARIO_RESOLVED]" at the end of your response.

### 2. CHAIN OF THOUGHT (CoT) IDEA EVALUATION
When the user proposes a solution, you MUST perform a hidden evaluation before generating the stakeholders' verbal responses.
* **Think Step-by-Step:** Analyze the user's idea for technical feasibility, upside potential, and risk.
* **Reflect Nuance:** Do not bluntly reject creative or unconventional ideas. If an idea is highly unorthodox but theoretically feasible, have the stakeholder acknowledge the ingenuity or the massive upside before pointing out the severe risks.

### 3. COMPETENCY & SCORING FRAMEWORK
When a scenario or phase ends, you must evaluate the user on a strict 1-10 scale based on these core competencies:
* Problem Framing, Prioritization Logic, Tradeoff Management, Stakeholder Management, Empathy & User-Centricity, Technical Fluency, AI Product Awareness, Strategic Thinking, Risk Assessment, and Communication Clarity.
* **Calibration:**
    * 1-4 (Fail): Missed objective, ignored constraints, alienated stakeholders.
    * 5-6 (Pass): Addressed main problem but missed edge cases or lacked confidence.
    * 7-8 (Strong): Clear communication, handled pushback, balanced tradeoffs.
    * 9-10 (Expert): Highly creative, feasible, masterfully navigated hidden agendas and anticipated risks.

### 4. LIFECYCLE MEMORY PRUNING (Phase Transitions)
If operating in "End-to-End Mode", when transitioning from one phase (e.g., Discovery) to the next (e.g., Alignment):
* Generate a dense, concise summary of all key decisions made, constraints locked in, and user actions taken in the previous phase.
* Treat this summary as the new undeniable truth for the upcoming phase, allowing the simulation to move forward without needing the exact word-for-word history of previous phases.

### 5. OUTPUT FORMATTING
Format your responses to clearly separate the environment/system from the active dialogue.
* Use **[System]** for turn warnings, phase transitions, or evaluation readouts.
* Use **[Internal CoT]** (optional, for debugging) to show your reasoning before a stakeholder speaks.
* Use **Stakeholder Name:** for direct dialogue, injecting their specific tone, hidden agenda, and personality into the text.

### SCENARIO CONFIGURATION
* Mode: ${config.mode === 'quick_rep' ? 'The Quick Rep (Single Scenario)' : config.mode === 'meeting_room' ? 'The Meeting Room (Stakeholder Debate)' : 'Full Product Lifecycle (End-to-End Mode)'}
* Difficulty: ${config.difficulty}
* Theme Focus: ${config.theme}
* Time Pressure: ${config.timePressure ? 'ON' : 'OFF'}
${stakeholdersText}

### Scenario Generation Rules (The Scaling Matrix):
Do not just give me an isolated technical bug. You MUST build this scenario using the following exact constraints based on the chosen Difficulty Level:

Beginner: Generate exactly 2 Stakeholders. Hide 1-2 linked second-order problems for me to discover.

Intermediate: Generate exactly 3 Stakeholders. Hide 2-3 linked second-order problems. Create mild friction between 2 stakeholders.

Advanced: Generate exactly 4 Stakeholders. Hide 3-4 linked second-order problems. Create active conflict between stakeholders' KPIs.

Expert: Generate 5+ Stakeholders. Hide 4+ severe linked problems (e.g., legal, massive churn, PR disaster). Create hostile, complex stakeholder dynamics.

Output EXACTLY in this format before we begin the roleplay:
1. Scenario Brief: (What is the immediate, surface-level situation?)
2. Stakeholders Present: (List their Name, Role, and their surface-level public stance. Keep their hidden agendas secret for now.)
3. The Immediate Objective: (What must I achieve in this meeting?)
(Note to System: Keep the "Hidden Scenarios/Ripple Effects" secret in your internal memory.)

### INITIALIZATION
Start the scenario immediately by describing the context, introducing the stakeholders (with their hidden agendas kept secret from the user), and presenting the initial problem. End your first message with a clear prompt for the user's action.`;
}

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

export async function startSimulationChat(config: SimulationConfig, maxTurns: number, history?: any[]) {
  try {
    return ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: getSystemInstruction(config, maxTurns),
        thinkingConfig: { thinkingLevel: 'HIGH' as any },
      },
      history: history || []
    });
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function startMentorChat(scenarioContext: string) {
  try {
    return ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: `You are an expert Product Management Mentor. 
Your goal is to help the user navigate their current PM scenario simulation.
The user will ask you questions or ask for advice.
Provide concise, actionable, and insightful advice. Do not give away the exact answer, but guide them to think critically.
Here is the context of the current simulation they are in:\n\n${scenarioContext}`,
        temperature: 0.5,
      }
    });
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function validateCustomTheme(theme: string): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Is the following theme related to Product Management, Tech, Business, or Design? Theme: "${theme}". Answer with only "YES" or "NO".`,
    });
    return response.text?.trim().toUpperCase() === "YES";
  } catch (error) {
    console.error("Error validating theme:", error);
    return true; // Fallback to true if validation fails
  }
}

export async function generateHint(chatHistory: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Based on the following PM simulation transcript, provide a short, strategic hint for the user on what they should do or say next to handle the stakeholders effectively. Do not give the exact answer, just a guiding principle or a suggested angle.
      
      Transcript:
      ${chatHistory}
      `,
      config: {
        systemInstruction: "You are a helpful PM mentor. Provide a concise 1-2 sentence hint.",
      }
    });
    return response.text || "Consider the stakeholders' hidden agendas and try to find a compromise.";
  } catch (error) {
    console.error("Failed to generate hint:", error);
    return "Try to balance the technical constraints with the business needs.";
  }
}

export async function evaluateSession(chatHistory: string, turnCount: number, maxTurns: number): Promise<EvaluationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Please evaluate the following PM simulation session based on the core competency framework.
      
      Session Context:
      - Turns Used: ${turnCount} of ${maxTurns}
      - Adherence to Turn Limit: ${turnCount <= maxTurns ? 'Within limits' : 'Exceeded limits'}
      
      Session Transcript:
      ${chatHistory}
      
      Provide a rigorous evaluation. Consider the user's responsiveness, ability to drive to a decision within the turn limit, and the quality of their trade-offs.`,
      config: {
        systemInstruction: "You are now assuming the role of a VP of Product / Veteran PM Mentor with 15+ years of experience leading complex, high-stakes tech products. Your goal is to give me brutally honest, real-world feedback.\n\nAnalyze the entire transcript and generate a comprehensive Evaluation Matrix. Format the output EXACTLY as follows:\n\n1. The Real-World Verdict:\n\nOverall Score: [Calculate average of all applicable dimensions] / 10\n\nExecutive Summary: A 2-3 sentence blunt assessment of my performance. Would I survive this meeting in a real Tier-1 tech company? What was my fatal flaw or biggest win?\n\n2. The Reality Gap (What You Missed vs. The Ideal):\n\nYour Approach: [Briefly summarize how I tried to solve the core problem]\n\nThe Ideal Approach: [Explain exactly how a top-tier PM would have handled this. Give me the actual phrasing they would have used.]\n\n3. The \"Hidden Board\" (Unseen Angles & Strategies):\n\nUnread Politics: Did I miss a stakeholder's hidden agenda? Who was I actually fighting against without realizing it?\n\nAlternative Strategic Paths: Give me 1 or 2 \"third options\" or out-of-the-box solutions I completely failed to consider.\n\n4. The Growth Prescription (Places to Improve & Thinking to Invoke):\n\nTargeted Areas for Improvement: Identify 1 to 2 highly specific behaviors or blind spots I need to fix immediately (e.g., \"You cave to Engineering pushback too quickly,\" or \"You failed to define the Gen-AI failure states\").\n\nThinking to Invoke: What specific mental model, cognitive framework, or PM philosophy MUST I apply next time? (e.g., First Principles Thinking, Second-Order Effects, or shifting from a localized operational mindset to a scalable strategic mindset). Explain how to use it.\n\n5. Competency Breakdown (Brief):\nProvide a score (1-10) and a 1-sentence justification citing a specific moment from the transcript for all of my WEAKEST dimensions from the standard PM competency framework/dimensions: e.g.\nProblem Framing\n\nPrioritization Logic\n\nTradeoff Management\n\nStakeholder Management\n\nEmpathy & User-Centricity\n\nTechnical Fluency\n\nAI Product Awareness\n\nStrategic Thinking\n\nRisk Assessment\n\nCommunication Clarity.\n\n6. Actionable Next Step: > Based on my biggest gap today, suggest the exact Configuration (Difficulty, Dimension Focus) and a brief premise for the next scenario I should practice to fix this weakness.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Overall score from 1 to 10" },
            executiveSummary: { type: Type.STRING, description: "A 2-3 sentence blunt assessment of the user's performance." },
            yourApproach: { type: Type.STRING, description: "Briefly summarize how the user tried to solve the core problem." },
            idealApproach: { type: Type.STRING, description: "Explain exactly how a top-tier PM would have handled this." },
            unreadPolitics: { type: Type.STRING, description: "Did the user miss a stakeholder's hidden agenda?" },
            alternativeStrategicPaths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1 or 2 'third options' or out-of-the-box solutions the user completely failed to consider." },
            targetedAreasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1 to 2 highly specific behaviors or blind spots the user needs to fix immediately." },
            thinkingToInvoke: { type: Type.STRING, description: "What specific mental model, cognitive framework, or PM philosophy MUST the user apply next time?" },
            competencyBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  competency: { type: Type.STRING, description: "Name of the competency (e.g., Problem Framing, Risk Assessment)" },
                  score: { type: Type.NUMBER, description: "Score from 1 to 10" },
                  feedback: { type: Type.STRING, description: "Specific feedback for this competency" }
                },
                required: ["competency", "score", "feedback"]
              }
            },
            actionableNextStep: { type: Type.STRING, description: "Based on the biggest gap today, suggest the exact Configuration (Difficulty, Dimension Focus) and a brief premise for the next scenario the user should practice to fix this weakness." }
          },
          required: [
            "overallScore",
            "executiveSummary",
            "yourApproach",
            "idealApproach",
            "unreadPolitics",
            "alternativeStrategicPaths",
            "targetedAreasForImprovement",
            "thinkingToInvoke",
            "competencyBreakdown",
            "actionableNextStep"
          ]
        }
      }
    });

    return JSON.parse(response.text || "{}") as EvaluationResult;
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
