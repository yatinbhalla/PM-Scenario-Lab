import { Play, TrendingUp, Clock, Target, AlertCircle, Loader2, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PastSession } from '../types';

interface DashboardProps {
  onStart: () => void;
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ onStart, user, onLogout }: DashboardProps) {
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const data = await response.json();
          setPastSessions(data);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">PM Scenario Lab</h1>
          <p className="text-neutral-400">Adaptive AI Training Simulator for Product Managers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
            <User size={16} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-300">
              {user?.name || user?.email || user?.phone || 'User'}
            </span>
            <button 
              onClick={onLogout}
              className="ml-2 p-1 text-neutral-500 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Play size={18} />
            New Scenario
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={20} />
              Recent Performance
            </h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-indigo-400" size={32} />
                  </div>
                ) : pastSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-4">
                      <TrendingUp className="text-indigo-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No scenarios completed yet</h3>
                    <p className="text-neutral-400 mb-6">Ready to test your product management skills? Start your first scenario to begin tracking your performance.</p>
                    <button
                      onClick={onStart}
                      className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Play size={16} />
                      Start First Scenario
                    </button>
                  </div>
                ) : (
                  pastSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-neutral-200">{session.config.mode.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400">{session.config.theme}</span>
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                          <Clock size={14} />
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{session.evaluation.overallScore.toFixed(1)}</div>
                        <div className="text-xs text-neutral-500">Overall Score</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="text-emerald-400" size={20} />
              Competency Radar
            </h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-[300px] flex items-center justify-center text-neutral-500">
              {/* Placeholder for Recharts Radar Chart */}
              <div className="text-center">
                <Target size={48} className="mx-auto mb-4 opacity-20" />
                <p>Complete more scenarios to unlock your competency radar.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="text-rose-400" size={20} />
              Blind Spots
            </h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-neutral-300">
                  <span className="text-rose-400 mt-0.5">•</span>
                  Risk Assessment: Often misses edge cases in technical implementation.
                </li>
                <li className="flex gap-3 text-sm text-neutral-300">
                  <span className="text-rose-400 mt-0.5">•</span>
                  Tradeoff Management: Tends to over-index on speed vs. quality.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
