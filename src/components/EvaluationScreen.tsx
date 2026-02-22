import { EvaluationResult } from '../types';
import { ArrowLeft, Trophy, AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface EvaluationScreenProps {
  result: EvaluationResult;
  onReturn: () => void;
}

export default function EvaluationScreen({ result, onReturn }: EvaluationScreenProps) {
  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-400';
    if (score >= 7) return 'text-indigo-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 9) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 7) return 'bg-indigo-500/10 border-indigo-500/20';
    if (score >= 5) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-12">
      <button
        onClick={onReturn}
        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        Return to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overall Score & Summary */}
        <div className="lg:col-span-1 space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-8 rounded-3xl border text-center flex flex-col items-center justify-center",
              getScoreBg(result.overallScore)
            )}
          >
            <Trophy size={48} className={cn("mb-4", getScoreColor(result.overallScore))} />
            <div className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-2">Overall Score</div>
            <div className={cn("text-7xl font-bold tracking-tighter mb-4", getScoreColor(result.overallScore))}>
              {result.overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-neutral-300">
              {result.overallScore >= 9 ? "Expert Level Performance" :
               result.overallScore >= 7 ? "Strong Performance" :
               result.overallScore >= 5 ? "Passing Standard" :
               "Needs Improvement"}
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={18} className="text-indigo-400" />
              Executive Summary
            </h2>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {result.summary}
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-rose-400" />
              Improvement Vectors
            </h2>
            <ul className="space-y-3">
              {result.improvementVectors.map((vector, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-neutral-300">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{vector}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Right Column: Competency Breakdown */}
        <div className="lg:col-span-2">
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-400" />
              Competency Breakdown
            </h2>
            
            <div className="space-y-6">
              {result.scores.map((score, idx) => (
                <div key={idx} className="border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-neutral-200">{score.competency}</h3>
                    <div className={cn("font-bold text-lg", getScoreColor(score.score))}>
                      {score.score.toFixed(1)} / 10
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-neutral-800 rounded-full mb-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(score.score / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                      className={cn("h-full rounded-full", getScoreBg(score.score).split(' ')[0].replace('/10', ''))}
                    />
                  </div>
                  
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {score.feedback}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
