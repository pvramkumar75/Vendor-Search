import { useState, useRef, useEffect } from 'react'
import { Header } from './components/Header'
import { ChatInterface, type ChatInterfaceRef } from './components/ChatInterface'
import { VendorTable } from './components/VendorTable'
import { VaultSidebar } from './components/VaultSidebar'
import type { Vendor, Message, ItemRequirement, Session } from './types'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import { saveSession, getSessions, deleteSession } from './utils/storage'

function App() {
  // --- App State (Lifted from ChatInterface) ---
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [requirement, setRequirement] = useState<Partial<ItemRequirement>>({
    preferredLocation: 'Hyderabad'
  });
  const [step, setStep] = useState<'initial' | 'chat'>('initial');

  // --- Session Management ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chatRef = useRef<ChatInterfaceRef>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await getSessions();
    setSessions(history);
  };

  const handleVendorsFound = (newVendors: Vendor[]) => {
    setVendors(prev => {
      const existingNames = new Set(prev.map(v => v.name));
      const textToId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

      const filteredNew = newVendors.filter(v => !existingNames.has(v.name)).map(v => ({
        ...v,
        id: v.id || textToId(v.name)
      }));

      const combined = [...prev, ...filteredNew];
      return combined.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    });
  };

  // Auto-save current session when state changes (debounced ideal, but simple for now)
  useEffect(() => {
    if (messages.length > 0 || vendors.length > 0 || (requirement.itemName && step === 'chat')) {
      saveCurrentState();
    }
  }, [messages, vendors, requirement, step]);

  const saveCurrentState = async () => {
    const sessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const session: Session = {
      id: sessionId,
      timestamp: Date.now(),
      title: requirement.itemName || 'Untitled Sourcing Request',
      requirement,
      messages,
      vendors
    };

    await saveSession(session);
    loadHistory(); // Refresh list
  };

  const startNewSession = async () => {
    // 1. Ensure current is saved if meaningful
    if (messages.length > 0) {
      await saveCurrentState();
    }

    // 2. Reset State
    setVendors([]);
    setMessages([]);
    setRequirement({ preferredLocation: 'Hyderabad' });
    setStep('initial');
    setCurrentSessionId(null);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const loadSession = (session: Session) => {
    setCurrentSessionId(session.id);
    setRequirement(session.requirement);
    setMessages(session.messages);
    setVendors(session.vendors);
    setStep('chat'); // Jump to chat view
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(id);
      if (currentSessionId === id) {
        startNewSession();
      }
      loadHistory();
    }
  };

  const handleLoadMore = () => {
    if (chatRef.current) {
      chatRef.current.sendMessage("Please find 5 more different suppliers for the same requirement.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Sidebar (Vault) */}
      <VaultSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewSession={startNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-900">VendorNexus</span>
          <div className="w-8" />
        </div>

        <div className="pb-20">
          <Header />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Chat & Controls */}
              <div className="lg:col-span-5 space-y-6">
                <ChatInterface
                  ref={chatRef}
                  onVendorsFound={handleVendorsFound}
                  // Pass State Down
                  messages={messages}
                  setMessages={setMessages}
                  requirement={requirement}
                  setRequirement={setRequirement}
                  step={step}
                  setStep={setStep}
                />

                {/* Status Card */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/40 shadow-sm"
                >
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Status</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DeepSeek V3 Neural Network Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Database: Global (India/China Focus)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Vault Storage: Active</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Results & Table */}
              <div className="lg:col-span-7">
                <AnimatePresence mode='wait'>
                  {vendors.length > 0 ? (
                    <VendorTable vendors={vendors} onLoadMore={handleLoadMore} />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center p-12 text-center h-[600px] border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
                    >
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-ping absolute" />
                        <svg className="w-8 h-8 text-blue-500 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">No Suppliers Found Yet</h3>
                      <p className="text-slate-500 max-w-sm mt-2">Start a conversation with the AI Analyst to identify and vet potential suppliers for your specific requirements.</p>
                      {step === 'initial' && (
                        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 max-w-md">
                          <strong>Tip:</strong> Be specific about specs and quantity for faster results. The AI will interview you if details are missing.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}

export default App
