'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
    Loader2, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle, 
    Users, 
    ShieldAlert, 
    Settings,
    BellRing,
    Activity,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NexusDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, alerts: 0 });
    const [cycles, setCycles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const [userRes, nexusRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/nexus/alerts')
            ]);

            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData.user);
            } else {
                router.push('/login');
            }

            if (nexusRes.ok) {
                const data = await nexusRes.json();
                setCycles(data.cycles || []);
                setStats(data.stats || { total: 0, completed: 0, alerts: 0 });
            }
        } catch (error) {
            console.error('Error fetching Nexus data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusStyle = (step: number) => {
        if (step === 3) return 'bg-red-500 text-white shadow-lg shadow-red-200 animate-nexus-pulse';
        if (step === 2) return 'bg-orange-500 text-white shadow-lg shadow-orange-200';
        if (step === 1) return 'bg-yellow-500 text-white shadow-lg shadow-yellow-100';
        return 'bg-slate-100 text-slate-500 font-black uppercase text-[10px]';
    };

    const getStepLabel = (step: number) => {
        if (step === 0) return 'Monitorando...';
        return `${step}º AVISO`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-200 animate-nexus-pulse">
                    <ShieldAlert className="text-white" size={48} />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] animate-pulse">Iniciando Nexus Engine</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            {/* Command Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse border-4 border-emerald-400/20" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live: Operação em Tempo Real</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        Monitor de Exceções
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">Sincronizado via <span className="text-blue-600">Secullum Ponto Web</span></p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchData}
                        className="p-4 nexus-card flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-400"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="nexus-button-primary flex items-center gap-3">
                        <BellRing size={20} className="animate-bounce" />
                        <span>Mesa de Operações</span>
                    </div>
                </div>
            </div>

            {/* Matrix KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="nexus-card p-8 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[4rem] transition-all group-hover:bg-blue-600/5" />
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Colaboradores</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tight">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="nexus-card p-8 group relative border-emerald-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-[4rem]" />
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Presença Confirmada</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tight">{stats.completed}</p>
                        </div>
                    </div>
                </div>

                <div className="nexus-card p-8 group border-red-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-bl-[4rem]" />
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 animate-nexus-pulse">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-red-600/60 uppercase tracking-widest mb-1">Exceções Ativas</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tight">{stats.alerts}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Table */}
            <div className="nexus-card overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <Activity size={20} className="text-blue-600 animate-pulse" />
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Fila de Exceções de Ponto</h3>
                    </div>
                    <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest">Nexus Engine v1.0</span>
                </div>

                <div className="overflow-x-auto">
                    {cycles.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={48} className="text-emerald-300" />
                            </div>
                            <p className="text-slate-400 font-black text-xl uppercase tracking-tighter">Operação 100% Limpa</p>
                            <p className="text-slate-300 text-sm font-bold mt-1">Nenhum atraso ou falta detectada no Secullum.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/10">
                                    <th className="px-10 py-6">Colaborador</th>
                                    <th className="px-10 py-6">Departamento</th>
                                    <th className="px-10 py-6">Posto de Trabalho</th>
                                    <th className="px-10 py-6">Evento Esperado</th>
                                    <th className="px-10 py-6">Previsto</th>
                                    <th className="px-10 py-6 text-center">Ciclo de Alerta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {cycles.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all cursor-default group">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {item.collaborator.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 tracking-tight">{item.collaborator.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {item.collaborator.secullumId || '---'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                {item.collaborator.departamento || '---'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-7">
                                            <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-4 py-2 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {item.collaborator.posto || 'Geral'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                                                    {item.event_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-2 text-slate-500 font-black text-sm">
                                                <Clock size={14} className="opacity-50" />
                                                {format(new Date(item.expected_time), 'HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex justify-center">
                                                <span className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all ${getStatusStyle(item.current_step)}`}>
                                                    {getStepLabel(item.current_step)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Nexus Quick Access for Admin */}
            {user?.role === 'ADMIN' && (
                <div className="fixed bottom-12 right-12 cursor-pointer group z-50" onClick={() => router.push('/dashboard/nexus/settings')}>
                    <div className="bg-slate-900 border border-white/10 text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 hover:bg-black transition-all duration-500 active:scale-95">
                        <Settings className="group-hover:rotate-180 transition-transform duration-700 text-blue-400" />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] hidden group-hover:block animate-in fade-in slide-in-from-right-2 pr-4">Config Nexus</span>
                    </div>
                </div>
            )}
        </div>
    );
}
