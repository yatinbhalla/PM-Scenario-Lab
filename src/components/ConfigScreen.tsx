import React, { useState } from 'react';
import { AppMode, Difficulty, ThemeFocus, SimulationConfig } from '../types';
import { ArrowLeft, Zap, Users, Layers, ShieldAlert, Clock, BrainCircuit, Target, BarChart2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { validateCustomTheme } from '../services/gemini';

interface ConfigScreenProps {
  onStart: (config: SimulationConfig) => void;
  onCancel: () => void;
}

export default function ConfigScreen({ onStart, onCancel }: ConfigScreenProps) {
  const [mode, setMode] = useState<AppMode>('quick_rep');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [theme, setTheme] = useState<ThemeFocus>('AI-Heavy');
  const [customTheme, setCustomTheme] = useState('');
  const [timePressure, setTimePressure] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [themeError, setThemeError] = useState('');

  const handleStart = async () => {
    if (theme === 'Custom Theme') {
      if (!customTheme.trim()) {
        setThemeError('Please enter a custom theme');
        return;
      }
      setIsValidating(true);
      setThemeError('');
      try {
        const isValid = await validateCustomTheme(customTheme);
        if (!isValid) {
          setThemeError('Enter valid theme');
          setIsValidating(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setIsValidating(false);
      onStart({ mode, difficulty, theme: customTheme as ThemeFocus, timePressure });
    } else {
      onStart({ mode, difficulty, theme, timePressure });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-white mb-8">Configure Scenario</h1>

      <div className="space-y-10">
        {/* Mode Selection */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            1. Select Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModeCard
              title="The Quick Rep"
              description="Rapid-fire, single-decision text scenario."
              icon={<Zap size={24} />}
              selected={mode === 'quick_rep'}
              onClick={() => setMode('quick_rep')}
            />
            <ModeCard
              title="The Meeting Room"
              description="Visual stakeholder debate and alignment."
              icon={<Users size={24} />}
              selected={mode === 'meeting_room'}
              onClick={() => setMode('meeting_room')}
            />
            <ModeCard
              title="End-to-End"
              description="Full product lifecycle simulation."
              icon={<Target size={24} />}
              selected={mode === 'end_to_end'}
              onClick={() => setMode('end_to_end')}
            />
          </div>
        </section>

        {/* Difficulty & Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section>
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" />
              2. Difficulty
            </h2>
            <div className="space-y-2">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as Difficulty)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between",
                    difficulty === d
                      ? "bg-indigo-600/10 border-indigo-500 text-white"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800"
                  )}
                >
                  <span className="font-medium">{d}</span>
                  {difficulty === d && <CheckCircle2 size={18} className="text-indigo-400" />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-400" />
              3. Theme Focus
            </h2>
            <div className="space-y-2">
              {['AI-Heavy', 'Design Thinking-Heavy', 'Execution-Heavy', 'Data/Metrics-Heavy', 'Strategy-Heavy', 'General Everyday Scenario', 'Custom Theme'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as ThemeFocus)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between",
                    theme === t
                      ? "bg-emerald-600/10 border-emerald-500 text-white"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800"
                  )}
                >
                  <span className="font-medium">{t}</span>
                  {theme === t && <CheckCircle2 size={18} className="text-emerald-400" />}
                </button>
              ))}
              {theme === 'Custom Theme' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customTheme}
                    placeholder="Enter custom theme..."
                    className={cn(
                      "w-full bg-neutral-950 border rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all",
                      themeError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "border-neutral-800 focus:border-emerald-500 focus:ring-emerald-500"
                    )}
                    onChange={(e) => {
                      setCustomTheme(e.target.value);
                      if (themeError) setThemeError('');
                    }}
                  />
                  {themeError && (
                    <p className="text-rose-400 text-sm mt-2">{themeError}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Modifiers */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            4. Modifiers
          </h2>
          <label className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
            <div>
              <div className="font-medium text-white mb-1">Time Pressure</div>
              <div className="text-sm text-neutral-400">Applies a strict countdown timer to responses.</div>
            </div>
            <div className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              timePressure ? "bg-indigo-600" : "bg-neutral-700"
            )}>
              <div className={cn(
                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                timePressure ? "translate-x-6" : "translate-x-0"
              )} />
            </div>
            {/* Hidden input to make it accessible if needed, but div acts as toggle */}
            <input
              type="checkbox"
              className="hidden"
              checked={timePressure}
              onChange={(e) => setTimePressure(e.target.checked)}
            />
          </label>
        </section>

        {/* Action */}
        <div className="pt-6 border-t border-neutral-800 flex justify-end">
          <button
            onClick={handleStart}
            disabled={isValidating}
            className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-xl shadow-white/10"
          >
            {isValidating && <Loader2 size={20} className="animate-spin" />}
            Initialize Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ title, description, icon, selected, onClick }: { title: string, description: string, icon: React.ReactNode, selected: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl border text-left transition-all h-full flex flex-col",
        selected
          ? "bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10"
          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800"
      )}
    >
      <div className={cn("mb-4", selected ? "text-indigo-400" : "text-neutral-500")}>
        {icon}
      </div>
      <h3 className={cn("text-lg font-bold mb-2", selected ? "text-white" : "text-neutral-200")}>{title}</h3>
      <p className="text-sm text-neutral-400 mt-auto">{description}</p>
    </button>
  );
}
