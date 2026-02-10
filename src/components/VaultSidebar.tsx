import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Plus, Trash2, History, Package } from 'lucide-react';
import type { Session } from '../types';

interface VaultSidebarProps {
    sessions: Session[];
    currentSessionId: string | null;
    onSelectSession: (session: Session) => void;
    onNewSession: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewSession,
    onDeleteSession,
    isOpen,
    setIsOpen
}) => {
    return (
        <>
            {/* Mobile Toggle & Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.div
                className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 w-72 shadow-2xl lg:shadow-none lg:static lg:block transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Archive className="w-4 h-4" />
                            Sourcing Vault
                        </h2>
                        <button
                            onClick={onNewSession}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
                        >
                            <Plus className="w-4 h-4" />
                            New Sourcing Task
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {sessions.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No past sessions</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => onSelectSession(session)}
                                    className={`
                                        group relative p-3 rounded-xl cursor-pointer border transition-all duration-200
                                        ${session.id === currentSessionId
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-1.5 rounded-lg ${session.id === currentSessionId ? 'bg-blue-200/50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <Package className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-medium text-sm truncate ${session.id === currentSessionId ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {session.title || 'Untitled Request'}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                                {new Date(session.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {/* Delete Button (visible on hover) */}
                                        <button
                                            onClick={(e) => onDeleteSession(session.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Active Indicator */}
                                    {session.id === currentSessionId && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-md" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
};
