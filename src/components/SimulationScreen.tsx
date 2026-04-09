import { useState, useEffect, useRef } from 'react';
import { SimulationConfig, Message, EvaluationResult, PastSession } from '../types';
import { startSimulationChat, evaluateSession, generateHint, GeminiAPIError, startMentorChat } from '../services/gemini';
import { Send, Clock, AlertTriangle, CheckCircle2, Loader2, StopCircle, ArrowLeft, Lightbulb, Save, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SimulationScreenProps {
  config: SimulationConfig;
  onFinish: (result: EvaluationResult) => void;
  onCancel: () => void;
  initialSession?: PastSession | null;
}

export default function SimulationScreen({ config, onFinish, onCancel, initialSession }: SimulationScreenProps) {
  const [messages, setMessages] = useState<Message[]>(initialSession?.messages || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(!initialSession); // Start true while initializing if no initial session
  const [chat, setChat] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(initialSession?.timeLeft ?? 300); // 5 minutes per turn if time pressure is on
  const [hasRespondedInTurn, setHasRespondedInTurn] = useState(false);
  const [turnCount, setTurnCount] = useState(initialSession?.turnCount ?? 0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  
  // Mentor Chat State
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [mentorMessages, setMentorMessages] = useState<Message[]>([]);
  const [mentorInput, setMentorInput] = useState('');
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [mentorChat, setMentorChat] = useState<any>(null);
  const mentorMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maxTurns = config.mode === 'quick_rep' ? (
    config.difficulty === 'Beginner' ? 10 :
    config.difficulty === 'Intermediate' ? 15 :
    config.difficulty === 'Advanced' ? 20 :
    25 // Expert
  ) : config.mode === 'meeting_room' ? 7 : 15;

  const isInitializing = useRef(false);
  const lastConfigId = useRef<string | null>(null);

  // Initialize chat
  useEffect(() => {
    // Create a unique ID for the config to track if it actually changed
    const configId = JSON.stringify(config) + (initialSession?.id || '');
    if (lastConfigId.current === configId) return;
    if (isInitializing.current) return;

    const initChat = async () => {
      isInitializing.current = true;
      try {
        console.log("Initializing simulation chat...");
        const newChat = await startSimulationChat(config, maxTurns, initialSession?.geminiHistory);
        setChat(newChat);
        lastConfigId.current = configId;
        
        if (!initialSession) {
          // Trigger initial message only if not resuming
          const response = await newChat.sendMessage({ message: "BEGIN SCENARIO" });
          setMessages([{ role: 'model', content: response.text || '', timestamp: Date.now() }]);
          setTurnCount(1);
        }
        setIsTyping(false);
        setHasRespondedInTurn(false); // Reset for the first turn
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        let errorMsg = "Error initializing scenario. Please try again.";
        if (error instanceof GeminiAPIError) {
          errorMsg = error.message;
        }
        setMessages([{ role: 'system', content: errorMsg, timestamp: Date.now() }]);
        setIsTyping(false);
      } finally {
        isInitializing.current = false;
      }
    };
    initChat();
  }, [config, maxTurns, initialSession]);

  // Initialize Mentor Chat when opened
  useEffect(() => {
    if (isMentorOpen && !mentorChat) {
      const initMentor = async () => {
        const historyText = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
        const newMentorChat = await startMentorChat(historyText);
        setMentorChat(newMentorChat);
        setMentorMessages([{ role: 'model', content: "Hi! I'm your AI Mentor. How can I help you navigate this scenario?", timestamp: Date.now() }]);
      };
      initMentor();
    }
  }, [isMentorOpen, mentorChat, messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    mentorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mentorMessages, isMentorTyping]);

  // Timer logic
  useEffect(() => {
    if (!config.timePressure || isTyping || isEvaluating || messages.length === 0 || isSaving) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.timePressure, isTyping, isEvaluating, messages.length, isSaving]);

  const handleTimeUp = async () => {
    if (!chat) return;
    setIsTyping(true);
    const timeUpMsg: Message = { role: 'system', content: "[SYSTEM]: Time expired for this turn. The stakeholders are waiting.", timestamp: Date.now() };
    setMessages(prev => [...prev, timeUpMsg]);
    
    if (!hasRespondedInTurn) {
      // If user didn't respond, force a 0 score evaluation
      onFinish({
        overallScore: 0,
        executiveSummary: "No response submitted within the time limit.",
        yourApproach: "None",
        idealApproach: "Respond within the time limit.",
        unreadPolitics: "N/A",
        alternativeStrategicPaths: [],
        targetedAreasForImprovement: ["Timeliness of response"],
        thinkingToInvoke: "Time Management",
        competencyBreakdown: [{ competency: "Timeliness", score: 0, feedback: "No response submitted." }],
        actionableNextStep: "Try again with more focus on speed."
      });
      return;
    }

    try {
      const response = await chat.sendMessage({ message: "[SYSTEM]: The user ran out of time to respond. React accordingly as the stakeholders." });
      setMessages(prev => [...prev, { role: 'model', content: response.text || '', timestamp: Date.now() }]);
      setTurnCount(prev => prev + 1);
      setTimeLeft(300);
      setHasRespondedInTurn(false);
    } catch (error) {
      console.error(error);
      let errorMsg = "Error communicating with the simulation engine.";
      if (error instanceof GeminiAPIError) {
        errorMsg = error.message;
      }
      setMessages(prev => [...prev, { role: 'system', content: errorMsg, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chat || isTyping) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeLeft(300);
    setHasRespondedInTurn(true);

    try {
      const response = await chat.sendMessage({ message: userMsg.content });
      let responseText = response.text || '';
      
      if (responseText.includes('[SCENARIO_RESOLVED]')) {
        responseText = responseText.replace(/\[SCENARIO_RESOLVED\]/g, '').trim();
        setIsResolved(true);
        setMessages(prev => [
          ...prev, 
          { role: 'model', content: responseText, timestamp: Date.now() },
          { role: 'system', content: "[SYSTEM]: Scenario successfully resolved early! You can now End & Evaluate.", timestamp: Date.now() }
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: responseText, timestamp: Date.now() }]);
      }
      
      setTurnCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
      let errorMsg = "Error communicating with the simulation engine.";
      if (error instanceof GeminiAPIError) {
        errorMsg = error.message;
      }
      setMessages(prev => [...prev, { role: 'system', content: errorMsg, timestamp: Date.now() }]);
      // Remove the user message so they can try again if it was a network error
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMentorSend = async () => {
    if (!mentorInput.trim() || !mentorChat || isMentorTyping) return;

    const userMsg: Message = { role: 'user', content: mentorInput, timestamp: Date.now() };
    setMentorMessages(prev => [...prev, userMsg]);
    setMentorInput('');
    setIsMentorTyping(true);

    try {
      const response = await mentorChat.sendMessage({ message: userMsg.content });
      setMentorMessages(prev => [...prev, { role: 'model', content: response.text || '', timestamp: Date.now() }]);
    } catch (error) {
      console.error(error);
      setMentorMessages(prev => [...prev, { role: 'system', content: "Error communicating with Mentor.", timestamp: Date.now() }]);
    } finally {
      setIsMentorTyping(false);
    }
  };

  const handleGetHint = async () => {
    if (hintsLeft <= 0 || isGettingHint || isTyping || isResolved) return;
    setIsGettingHint(true);
    try {
      const historyText = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
      const hint = await generateHint(historyText);
      setMessages(prev => [...prev, { role: 'system', content: `[SYSTEM HINT]: ${hint}`, timestamp: Date.now() }]);
      setHintsLeft(prev => prev - 1);
    } catch (error) {
      console.error(error);
      let errorMsg = "Error generating hint.";
      if (error instanceof GeminiAPIError) {
        errorMsg = error.message;
      }
      setMessages(prev => [...prev, { role: 'system', content: errorMsg, timestamp: Date.now() }]);
    } finally {
      setIsGettingHint(false);
    }
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      const sessionId = initialSession?.id || (typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36));
        
      const user = auth.currentUser;
      if (user && chat) {
        const geminiHistory = await chat.getHistory();
        await setDoc(doc(db, 'sessions', sessionId), {
          userId: user.uid,
          date: new Date().toISOString(),
          config,
          status: 'in-progress',
          messages,
          turnCount,
          timeLeft,
          geminiHistory: geminiHistory.map((h: any) => ({ role: h.role, parts: h.parts }))
        });
        onCancel(); // Return to dashboard
      }
    } catch (dbError) {
      handleFirestoreError(dbError, OperationType.CREATE, 'sessions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    setIsEvaluating(true);
    try {
      if (!hasRespondedInTurn && turnCount > 0) {
        // If user didn't respond to the last prompt and manually ended, force 0 score
        onFinish({
          overallScore: 0,
          executiveSummary: "Simulation ended without a final response.",
          yourApproach: "None",
          idealApproach: "Complete the simulation turns.",
          unreadPolitics: "N/A",
          alternativeStrategicPaths: [],
          targetedAreasForImprovement: ["Completion of tasks"],
          thinkingToInvoke: "Task Completion",
          competencyBreakdown: [{ competency: "Completion", score: 0, feedback: "Simulation ended prematurely." }],
          actionableNextStep: "Try to finish the full turn cycle."
        });
        return;
      }

      // Compile chat history
      const historyText = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
      const result = await evaluateSession(historyText, turnCount, maxTurns);
      
      // Save session to database
      try {
        const sessionId = initialSession?.id || (typeof crypto.randomUUID === 'function' 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36));
          
        console.log(`Attempting to save session ${sessionId} to Firestore...`);
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'sessions', sessionId), {
            userId: user.uid,
            date: new Date().toISOString(),
            config,
            status: 'completed',
            evaluation: result
          });
          console.log("Session saved successfully to Firestore.");
        } else {
          console.error("No authenticated user found. Cannot save session.");
        }
      } catch (dbError) {
        handleFirestoreError(dbError, OperationType.CREATE, 'sessions');
      }

      onFinish(result);
    } catch (error) {
      console.error("Evaluation failed:", error);
      alert("Failed to evaluate session. Please check console.");
      setIsEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderMessageContent = (content: string) => {
    // Split by [SYSTEM], [SYSTEM HINT] and [Internal CoT] to style them differently, render the rest as Markdown
    const parts = content.split(/(\[SYSTEM\].*?(?=\n|$)|\[SYSTEM HINT\].*?(?=\n|$)|\[Internal CoT\].*?(?=\n|$))/g);
    
    return parts.map((part, i) => {
      if (!part.trim()) return null;

      if (part.startsWith('[SYSTEM]')) {
        return <div key={i} className="text-rose-400 font-mono text-sm my-3 p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg">{part}</div>;
      }
      if (part.startsWith('[SYSTEM HINT]')) {
        return <div key={i} className="text-amber-400 font-mono text-sm my-3 p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg">{part}</div>;
      }
      if (part.startsWith('[Internal CoT]')) {
        return <div key={i} className="text-neutral-500 italic text-sm my-3 border-l-2 border-neutral-700 pl-3 py-1">{part}</div>;
      }
      
      return (
        <div key={i} className="text-sm md:text-base">
          <Markdown
            components={{
              p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-md font-bold text-white mb-2 mt-3" {...props} />,
              code: ({node, ...props}) => <code className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-sm font-mono text-indigo-300" {...props} />,
              pre: ({node, ...props}) => <pre className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 overflow-x-auto mb-3" {...props} />,
            }}
          >
            {part}
          </Markdown>
        </div>
      );
    });
  };

  const getStakeholderAvatar = (content: string) => {
    const match = content.match(/^([^:]+):/);
    if (match) {
      const name = match[1].trim();
      // Use a consistent avatar for the same name
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    return null;
  };

  const getStakeholderName = (content: string) => {
    const match = content.match(/^([^:]+):/);
    return match ? match[1].trim() : null;
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 relative overflow-hidden">
      {showConfirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">End Simulation?</h3>
            <p className="text-neutral-400 mb-6">Are you sure you want to go back? Your current progress and evaluation will be lost unless you save.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmCancel(false)}
                className="px-4 py-2 rounded-lg font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Yes, End Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowConfirmCancel(true)}
            className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{config.mode.replace('_', ' ').toUpperCase()}</span>
            <span className="text-xs text-neutral-400">{config.difficulty} • {config.theme}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving || isEvaluating || isTyping}
            className="hidden md:flex items-center gap-2 text-neutral-400 hover:text-white disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save & Exit
          </button>

          <button
            onClick={handleGetHint}
            disabled={hintsLeft <= 0 || isGettingHint || isTyping || isEvaluating || isResolved}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isGettingHint ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
            Hints {hintsLeft}/2
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-neutral-300">
            <span className={cn("px-2 py-1 rounded", turnCount >= maxTurns - 1 ? "bg-rose-500/20 text-rose-400" : "bg-neutral-800")}>
              Turn {turnCount} / {maxTurns}
            </span>
          </div>
          
          {config.timePressure && (
            <div className={cn(
              "flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-lg border transition-colors",
              timeLeft <= 30 ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse" : "bg-neutral-800 border-neutral-700 text-neutral-300"
            )}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}

          <button
            onClick={handleFinish}
            disabled={isEvaluating || isTyping}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isEvaluating ? <Loader2 size={16} className="animate-spin" /> : <StopCircle size={16} />}
            End & Evaluate
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 relative">
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const stakeholderAvatar = msg.role === 'model' ? getStakeholderAvatar(msg.content) : null;
                  const stakeholderName = msg.role === 'model' ? getStakeholderName(msg.content) : null;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={cn(
                        "flex w-full gap-3",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      {msg.role !== 'system' && (
                        <div className="flex-none mt-1">
                          {msg.role === 'user' ? (
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                              YOU
                            </div>
                          ) : stakeholderAvatar ? (
                            <img 
                              src={stakeholderAvatar} 
                              alt={stakeholderName || 'Stakeholder'} 
                              className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs font-bold shadow-sm">
                              AI
                            </div>
                          )}
                        </div>
                      )}

                      <div className={cn(
                        "max-w-[80%] rounded-2xl p-5 leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-500/10" 
                          : msg.role === 'system'
                            ? "bg-rose-950/30 border border-rose-900/50 text-rose-200 w-full text-center"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-bl-sm"
                      )}>
                        {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-3">
                <div className="flex-none mt-1">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs font-bold shadow-sm">
                    AI
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-sm p-4 flex items-center gap-1.5 text-neutral-500 w-20 h-12 shadow-sm">
                  <motion.div 
                    className="w-2 h-2 bg-indigo-500 rounded-full" 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} 
                  />
                  <motion.div 
                    className="w-2 h-2 bg-indigo-500 rounded-full" 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} 
                  />
                  <motion.div 
                    className="w-2 h-2 bg-indigo-500 rounded-full" 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} 
                  />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </main>

          {/* Input Area */}
          <footer className="flex-none p-4 bg-neutral-900 border-t border-neutral-800 z-10">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isTyping ? "Wait for response..." : isResolved ? "Scenario resolved. Click End & Evaluate." : "Type your decision or response..."}
                disabled={isTyping || isEvaluating || turnCount > maxTurns || isResolved}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-4 pr-12 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-50 transition-all shadow-inner"
                rows={3}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isEvaluating || turnCount > maxTurns || isResolved}
                className="absolute right-3 bottom-4 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg transition-colors shadow-md"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-2 text-xs text-neutral-500">
              Press Enter to send, Shift+Enter for new line.
            </div>
          </footer>
        </div>

        {/* AI Mentor Sidebar */}
        <AnimatePresence>
          {isMentorOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-neutral-800 bg-neutral-900 flex flex-col z-20 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-indigo-400 font-medium">
                  <MessageSquare size={18} />
                  AI Mentor
                </div>
                <button onClick={() => setIsMentorOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mentorMessages.map((msg, idx) => (
                  <div key={idx} className={cn("flex w-full gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "max-w-[85%] rounded-xl p-3 text-sm leading-relaxed",
                      msg.role === 'user' ? "bg-indigo-600 text-white rounded-br-sm" : "bg-neutral-800 text-neutral-300 rounded-bl-sm"
                    )}>
                      <Markdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>
                  </div>
                ))}
                {isMentorTyping && (
                  <div className="flex justify-start gap-2">
                    <div className="bg-neutral-800 rounded-xl rounded-bl-sm p-3 flex items-center gap-1.5 w-16 h-10">
                      <motion.div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </div>
                )}
                <div ref={mentorMessagesEndRef} />
              </div>

              <div className="p-4 border-t border-neutral-800 bg-neutral-950">
                <div className="relative">
                  <input
                    type="text"
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMentorSend()}
                    placeholder="Ask for advice..."
                    disabled={isMentorTyping}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleMentorSend}
                    disabled={!mentorInput.trim() || isMentorTyping}
                    className="absolute right-2 top-2 p-1 text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Mentor Toggle Button */}
      {!isMentorOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsMentorOpen(true)}
          className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/20 transition-colors z-20"
          title="Open AI Mentor"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}
    </div>
  );
}
