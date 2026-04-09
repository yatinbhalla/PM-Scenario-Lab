import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ConfigScreen from './components/ConfigScreen';
import SimulationScreen from './components/SimulationScreen';
import EvaluationScreen from './components/EvaluationScreen';
import LoginScreen from './components/LoginScreen';
import { SimulationConfig, EvaluationResult, PastSession } from './types';
import { Loader2 } from 'lucide-react';
import { auth, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ScreenState = 'dashboard' | 'config' | 'simulation' | 'evaluation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('dashboard');
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [selectedPastEvaluation, setSelectedPastEvaluation] = useState<EvaluationResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [resumeSession, setResumeSession] = useState<PastSession | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const startConfig = () => {
    setResumeSession(null);
    setCurrentScreen('config');
  };
  
  const startSimulation = (newConfig: SimulationConfig) => {
    setConfig(newConfig);
    setResumeSession(null);
    setCurrentScreen('simulation');
  };

  const handleResumeSimulation = (session: PastSession) => {
    setConfig(session.config);
    setResumeSession(session);
    setCurrentScreen('simulation');
  };

  const finishSimulation = (result: EvaluationResult) => {
    setEvaluation(result);
    setSelectedPastEvaluation(null); // Clear any previously selected past evaluation
    setCurrentScreen('evaluation');
  };

  const viewPastEvaluation = (result: EvaluationResult) => {
    setSelectedPastEvaluation(result);
    setEvaluation(null); // Clear current simulation evaluation
    setCurrentScreen('evaluation');
  };

  const returnToDashboard = () => {
    setConfig(null);
    setEvaluation(null);
    setSelectedPastEvaluation(null); // Clear selected past evaluation
    setResumeSession(null);
    setCurrentScreen('dashboard');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {currentScreen === 'dashboard' && <Dashboard onStart={startConfig} user={user} onLogout={handleLogout} onViewPast={viewPastEvaluation} onResumeSession={handleResumeSimulation} />}
      {currentScreen === 'config' && <ConfigScreen onStart={startSimulation} onCancel={returnToDashboard} />}
      {currentScreen === 'simulation' && config && <SimulationScreen config={config} onFinish={finishSimulation} onCancel={returnToDashboard} initialSession={resumeSession} />}
      {currentScreen === 'evaluation' && (evaluation || selectedPastEvaluation) && <EvaluationScreen result={evaluation || selectedPastEvaluation!} onReturn={returnToDashboard} />}
    </div>
  );
}
