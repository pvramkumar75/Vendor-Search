import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Globe, ShieldCheck } from 'lucide-react';

export const Header = () => {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-white/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                VendorNexus
                            </h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">INTELLIGENT SOURCING AI</p>
                        </div>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span>Global Reach</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Verified Sources</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
