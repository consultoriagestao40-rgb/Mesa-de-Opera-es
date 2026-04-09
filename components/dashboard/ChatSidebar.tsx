'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, RefreshCw, User, MessageCircle } from 'lucide-react';

interface Chat {
    name: string;
    phone: string;
}

export default function ChatSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchChats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dev-tools/chats');
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (e) {
            console.error('Erro ao buscar chats:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchChats();
        }
    }, [isOpen]);

    return (
        <div 
            className={`fixed inset-y-0 right-0 w-80 bg-gray-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] border-l border-gray-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-blue-400">Mesa de Operação</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Chat Logístico • Z-API</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sincronizando WhatsApp...</p>
                    </div>
                ) : chats.length > 0 ? (
                    chats.map((chat, idx) => (
                        <div 
                            key={idx} 
                            className="group p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-sm truncate text-gray-100 group-hover:text-white">{chat.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold group-hover:text-gray-400">{chat.phone}</p>
                                </div>
                            </div>
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all"></div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                            <MessageSquare className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Nenhuma conversa ativa no momento.</p>
                        <button 
                            onClick={fetchChats}
                            className="mt-4 text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 bg-gray-950/30">
                <button 
                    onClick={fetchChats}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Sincronizando...' : 'Atualizar Conversas'}
                </button>
                <p className="text-[9px] text-center text-gray-600 mt-4 font-bold uppercase tracking-tighter">
                    Status da Instância: <span className="text-green-500">Conectado</span>
                </p>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1f2937;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #374151;
                }
            `}</style>
        </div>
    );
}
