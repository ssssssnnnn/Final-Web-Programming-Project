import React, { useState } from 'react';
import DashboardView from './features/dashboard/DashboardView';
import RoomsView from './features/rooms/RoomsView';
import MeetingsView from './features/meetings/MeetingsView';
import ParticipantsView from './features/participants/ParticipantsView';

// Navigation items configuration
const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'rooms', label: '🏢 Rooms' },
  { id: 'meetings', label: '📅 Meetings' },
  { id: 'participants', label: '👥 People' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Map tabs to components
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'rooms':
        return <RoomsView />;
      case 'meetings':
        return <MeetingsView />;
      case 'participants':
        return <ParticipantsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-6 text-2xl font-black tracking-wider border-b border-slate-700 text-blue-400">
          Meeting Scheduler
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 text-sm ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center font-medium">
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </div>

    </div>
  );
}
