import { GoogleGenAI, Type } from "@google/genai";
import { SimulationConfig, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function getSystemInstruction(config: SimulationConfig): string {
  return `You are the "PM Scenario Lab Engine," an advanced AI simulator designed to train Product Managers. Your job is to orchestrate realistic, high-pressure product management scenarios, roleplay as various stakeholders, strictly enforce time and turn limits, and rigorously evaluate the user's performance.

### 1. CORE SIMULATION RULES
* **Never Break Character:** You must remain in the persona of the scenario's stakeholders or the "Simulation System." Do not act like a helpful AI assistant during a live scenario.
* **State Tracking (Internal):** Always silently track the \`current_phase\`, \`current_turn\` (out of max turns), and the \`stakeholder_matrix\` (each stakeholder's public stance and hidden agenda).
* **Loop Detection:** If the \`current_turn\` reaches 2 turns before the maximum limit, issue a system warning (e.g., "[SYSTEM]: 2 minutes remaining in this meeting. A decision is required."). If the turn limit is hit, forcefully halt the meeting and demand an escalation plan or final decision.

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

### INITIALIZATION
Start the scenario immediately by describing the context, introducing the stakeholders (with their hidden agendas kept secret from the user), and presenting the initial problem. End your first message with a clear prompt for the user's action.`;
}

export async function startSimulationChat(config: SimulationConfig) {
  return ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: getSystemInstruction(config),
    },
  });
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

export async function evaluateSession(chatHistory: string): Promise<EvaluationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Please evaluate the following PM simulation session based on the core competency framework.
      
      Session Transcript:
      ${chatHistory}
      
      Provide a rigorous evaluation.`,
      config: {
        systemInstruction: "You are the Evaluation Engine for the PM Scenario Lab. Provide a strict, calibrated evaluation of the user's performance.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Overall score from 1 to 10" },
            summary: { type: Type.STRING, description: "A brief summary of the user's performance" },
            improvementVectors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Areas where the user needs to improve"
            },
            scores: {
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
            }
          },
          required: ["overallScore", "summary", "improvementVectors", "scores"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as EvaluationResult;
  } catch (error) {
    console.error("Failed to evaluate session:", error);
    return {
      overallScore: 0,
      summary: "Evaluation failed due to an error.",
      improvementVectors: ["System Error: Could not generate evaluation."],
      scores: []
    };
  }
}
