'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Mail, Lock, LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Credenciais inválidas');
            }
        } catch (err) {
            setError('Erro inesperado no servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Branding */}
                <div className="text-center mb-10 transform transition-all duration-700">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 rounded-3xl border border-blue-500/20 mb-6 shadow-2xl shadow-blue-500/10">
                        <LayoutDashboard className="w-12 h-12 text-blue-500" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
                        MESA DE <span className="text-blue-500">OPERAÇÕES</span>
                    </h1>
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400">
                        Painel Logístico • Torre de Controle
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group transition-all duration-500 hover:border-blue-500/30">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 text-[11px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl flex items-center gap-3 animate-shake">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Acesso do Operador</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com.br"
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha Privada</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group/btn py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-xl shadow-blue-900/40 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Acessar Sistema <ShieldCheck size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Gradient Border Accent */}
                    <div className="absolute inset-0 border-[2px] border-transparent rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    Segurança Criptografada • Mesa de Operações © 2026
                </p>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}
