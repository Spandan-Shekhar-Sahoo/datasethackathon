
import React, { useState } from 'react';
import { AppSection } from './types';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import HomePage from './components/HomePage';
import SidePanelChat from './components/SidePanelChat';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.HOME);
  const [currentContext, setCurrentContext] = useState<string | undefined>(undefined);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  if (activeSection === AppSection.HOME) {
    return <HomePage onNavigate={setActiveSection} />;
  }

  // Calculate right margin based on side panel state to "squeeze" content
  // w-96 is 24rem (384px), w-12 is 3rem (48px)
  const mainContentStyle = {
    marginRight: isSidePanelOpen ? '24rem' : '3rem'
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      
      <main 
        className="flex-1 flex flex-col min-w-0 bg-slate-50 relative transition-all duration-300 ease-in-out"
        style={activeSection !== AppSection.GENERAL ? mainContentStyle : {}}
      >
        {/* Subtle background gradient for light mode */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/50 via-white to-white pointer-events-none"></div>
        
        {activeSection === AppSection.GENERAL ? (
          <div className="flex-1 p-4 md:p-6 h-full max-w-7xl mx-auto w-full z-10">
            <ChatInterface onBack={() => setActiveSection(AppSection.HOME)} />
          </div>
        ) : (
          <div className="flex-1 h-full w-full z-10">
             <Dashboard 
               section={activeSection} 
               onBack={() => setActiveSection(AppSection.HOME)}
               onContextUpdate={setCurrentContext}
             />
          </div>
        )}
      </main>
      
      {/* Persistent Side Panel for Non-General sections */}
      {activeSection !== AppSection.GENERAL && (
          <SidePanelChat 
            currentContext={currentContext} 
            isOpen={isSidePanelOpen}
            setIsOpen={setIsSidePanelOpen}
          />
      )}
    </div>
  );
};

export default App;
