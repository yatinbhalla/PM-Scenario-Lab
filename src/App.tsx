import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ConfigScreen from './components/ConfigScreen';
import SimulationScreen from './components/SimulationScreen';
import EvaluationScreen from './components/EvaluationScreen';
import LoginScreen from './components/LoginScreen';
import { SimulationConfig, EvaluationResult } from './types';
import { Loader2 } from 'lucide-react';

type ScreenState = 'dashboard' | 'config' | 'simulation' | 'evaluation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('dashboard');
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const startConfig = () => setCurrentScreen('config');
  
  const startSimulation = (newConfig: SimulationConfig) => {
    setConfig(newConfig);
    setCurrentScreen('simulation');
  };

  const finishSimulation = (result: EvaluationResult) => {
    setEvaluation(result);
    setCurrentScreen('evaluation');
  };

  const returnToDashboard = () => {
    setConfig(null);
    setEvaluation(null);
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
    return <LoginScreen onLoginSuccess={fetchUser} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {currentScreen === 'dashboard' && <Dashboard onStart={startConfig} user={user} onLogout={handleLogout} />}
      {currentScreen === 'config' && <ConfigScreen onStart={startSimulation} onCancel={returnToDashboard} />}
      {currentScreen === 'simulation' && config && <SimulationScreen config={config} onFinish={finishSimulation} onCancel={returnToDashboard} />}
      {currentScreen === 'evaluation' && evaluation && <EvaluationScreen result={evaluation} onReturn={returnToDashboard} />}
    </div>
  );
}
