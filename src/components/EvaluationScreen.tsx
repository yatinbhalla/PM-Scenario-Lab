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
        {/* Left Column: Overall Score & Executive Summary */}
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
              {result.executiveSummary}
            </p>
          </motion.section>
        </div>

        {/* Middle Column: Reality Gap & Hidden Board */}
        <div className="lg:col-span-1 space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              The Reality Gap
            </h2>
            <h3 className="font-semibold text-neutral-200 mb-2">Your Approach:</h3>
            <p className="text-neutral-300 leading-relaxed text-sm mb-4">
              {result.yourApproach}
            </p>
            <h3 className="font-semibold text-neutral-200 mb-2">The Ideal Approach:</h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {result.idealApproach}
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} 
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              The "Hidden Board"
            </h2>
            <h3 className="font-semibold text-neutral-200 mb-2">Unread Politics:</h3>
            <p className="text-neutral-300 leading-relaxed text-sm mb-4">
              {result.unreadPolitics}
            </p>
            <h3 className="font-semibold text-neutral-200 mb-2">Alternative Strategic Paths:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
              {result.alternativeStrategicPaths.map((path, idx) => (
                <li key={idx}>{path}</li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Right Column: Growth Prescription & Competency Breakdown */}
        <div className="lg:col-span-1 space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-rose-400" />
              The Growth Prescription
            </h2>
            <h3 className="font-semibold text-neutral-200 mb-2">Targeted Areas for Improvement:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300 mb-4">
              {result.targetedAreasForImprovement.map((area, idx) => (
                <li key={idx}>{area}</li>
              ))}
            </ul>
            <h3 className="font-semibold text-neutral-200 mb-2">Thinking to Invoke:</h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {result.thinkingToInvoke}
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={18} className="text-indigo-400" />
              Competency Breakdown (Weakest Dimensions)
            </h2>
            <div className="space-y-6">
              {result.competencyBreakdown.map((score, idx) => (
                <div key={idx} className="border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-neutral-200">{score.competency}</h3>
                    <div className={cn("font-bold text-lg", getScoreColor(score.score))}>
                      {score.score.toFixed(1)} / 10
                    </div>
                  </div>
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

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={18} className="text-indigo-400" />
              Actionable Next Step
            </h2>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {result.actionableNextStep}
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
