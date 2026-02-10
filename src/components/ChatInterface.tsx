import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Loader2, Sparkles, MapPin, PackageSearch } from 'lucide-react';
import type { Message, ItemRequirement, Vendor } from '../types';
import { chatWithDeepSeek } from '../services/deepseek';
import { extractTextFromDocument } from '../services/documentParser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatInterfaceRef {
    sendMessage: (content: string) => void;
}

interface ChatInterfaceProps {
    onVendorsFound: (vendors: Vendor[]) => void;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    requirement: Partial<ItemRequirement>;
    setRequirement: React.Dispatch<React.SetStateAction<Partial<ItemRequirement>>>;
    step: 'initial' | 'chat';
    setStep: (step: 'initial' | 'chat') => void;
}

export const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({
    onVendorsFound,
    messages,
    setMessages,
    requirement,
    setRequirement,
    step,
    setStep
}, ref) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processMessage = async (history: Message[]) => {
        setIsLoading(true);
        try {
            // Convert to format for API
            const apiMessages = history.map(m => ({ role: m.role, content: m.content }));

            const response = await chatWithDeepSeek(apiMessages);

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.message,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (response.vendors && response.vendors.length > 0) {
                onVendorsFound(response.vendors);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('chat');

        const initialMessage = `I have a sourcing request for: ${requirement.itemName}. 
        
        Initial Details Provided:
        - Description: ${requirement.description}
        - Target Location: ${requirement.preferredLocation}
        - Quantity: ${requirement.quantity || 'Not specified'}
        - Additional Specs: ${requirement.additionalSpecs || 'None'}

        Please review these details. If you need more specific info (like material, standards, target price, or current benchmarks) to find the best manufacturers, please ask me those questions now. Do not provide a generic list yet.`;

        // Add user message to UI (hidden or summarized)
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: `I'm looking for suppliers for ${requirement.itemName} in ${requirement.preferredLocation}. \n\n${requirement.description}`,
            timestamp: Date.now()
        };

        setMessages([userMsg]);

        // Send the detailed prompt to AI, but keep UI message simple
        // We need to pass the "system" context essentially via this first user message
        const apiMsg: Message = { ...userMsg, content: initialMessage };
        await processMessage([apiMsg]);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        await processMessage(newMessages);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        try {
            const extractedText = await extractTextFromDocument(file);

            const attachmentLabel = `\n\n[Attached File: ${file.name}]\nContent:\n${extractedText}\n\n`;

            if (step === 'initial') {
                setRequirement(prev => ({
                    ...prev,
                    description: (prev.description || '') + attachmentLabel
                }));
            } else {
                setInput(prev => prev + attachmentLabel);
            }
        } catch (error) {
            console.error("File processing failed", error);
            alert("Failed to process file. Please try another format.");
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Expose sendMessage via ref
    useImperativeHandle(ref, () => ({
        sendMessage: (content: string) => {
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content,
                timestamp: Date.now()
            };
            setMessages(prev => {
                const updated = [...prev, userMsg];
                processMessage(updated);
                return updated;
            });
        }
    }));

    if (step === 'initial') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-2xl mx-auto mt-10"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <PackageSearch className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Start New Sourcing Request</h2>
                        <p className="text-slate-500 text-sm">Define your requirements to find the best suppliers.</p>
                    </div>
                </div>

                <form onSubmit={handleInitialSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Item Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. Industrial Valves"
                                value={requirement.itemName || ''}
                                onChange={e => setRequirement({ ...requirement, itemName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Target Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                    value={requirement.preferredLocation}
                                    onChange={e => setRequirement({ ...requirement, preferredLocation: e.target.value })}
                                >
                                    <optgroup label="Domestic (India)">
                                        <option value="All India">All India</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Gujarat">Gujarat</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Kolkata">Kolkata</option>
                                    </optgroup>
                                    <optgroup label="Overseas">
                                        <option value="China">China</option>
                                        <option value="All Overseas">All Overseas</option>
                                        <option value="Other Countries">Other Countries</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Detailed Description / Specs</label>
                        <textarea
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none placeholder:text-slate-400"
                            placeholder="Describe technical specifications, material requirements, dimensions, etc..."
                            value={requirement.description || ''}
                            onChange={e => setRequirement({ ...requirement, description: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingFile}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm disabled:opacity-50"
                        >
                            {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                            {isProcessingFile ? 'Processing...' : 'Attach Spec Sheet (PDF/Img/Doc)'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Start AI Sourcing
                    </button>
                </form>
                {/* Hidden Input for Initial Screen */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,.docx,.xlsx,.xls"
                />
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-700">Live Sourcing Agent</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                            ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none'}
                        `}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3" />
                                    AI Analyst
                                </div>
                            )}
                            <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'} max-w-none prose-p:my-0 prose-ul:my-2 prose-li:my-0`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Wait, I'm analyzing the market...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="relative flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingFile || isLoading}
                        className="p-3.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                        title="Attach File"
                    >
                        {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>

                    <input
                        type="text"
                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                        placeholder="Ask follow-up questions or request more suppliers..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                    {/* Re-use hidden input for Chat Mode too */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf,.docx,.xlsx,.xls"
                    />
                </div>
            </form>
        </div>
    );
});
