import { useState } from 'react';
import TeamPage from './screens/TeamPage';
import TasksPage from './screens/TasksPage';
import DashboardPage from './screens/DashboardPage';
import OptimizePage from './screens/OptimizePage';

type Tab = 'team' | 'tasks' | 'dashboard' | 'optimize';

const NAV_ITEMS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: 'team',
    label: 'Team',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M17 17h.01M14 17h.01M17 14h.01M20 17h.01M20 14h.01M17 20h.01M20 20h.01M14 20h.01"/>
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 10l3 3 2-2 3 3"/>
      </svg>
    ),
  },
  {
    id: 'optimize',
    label: 'Optimize',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('team');

  const renderPage = () => {
    switch (activeTab) {
      case 'team': return <TeamPage />;
      case 'tasks': return <TasksPage />;
      case 'dashboard': return <DashboardPage />;
      case 'optimize': return <OptimizePage />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-primary shadow-sm">
        <div className="text-center py-5 px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Skill Coverage Optimizer</h1>
          <p className="text-white/80 text-sm mt-1">Balance workloads and optimize task management</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={activeTab === item.id ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {renderPage()}
      </main>
    </div>
  );
}
