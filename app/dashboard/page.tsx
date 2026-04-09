'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    Loader2, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Users, 
    ShieldAlert, 
    Settings,
    BellRing
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
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusStyle = (step: number) => {
        if (step === 3) return 'bg-red-500 text-white animate-pulse';
        if (step === 2) return 'bg-orange-500 text-white';
        if (step === 1) return 'bg-yellow-500 text-white';
        return 'bg-gray-100 text-gray-500';
    };

    const getStepLabel = (step: number) => {
        if (step === 0) return 'Monitorando';
        return `${step}º AVISO`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-gray-500 font-bold animate-pulse">Iniciando Nexus Operacional...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-blue-600" size={32} />
                        Monitor de Exceções
                    </h1>
                    <p className="text-gray-500 font-medium">Mesa de Operação Automática • Nexus v1.0</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-600 active:scale-95"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2">
                        <BellRing size={20} className="animate-bounce" />
                        Live Monitoring
                    </div>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Equipe Nexus</p>
                            <p className="text-4xl font-black text-gray-900">{stats.total}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <Users size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-emerald-50 relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Presença Confirmada</p>
                            <p className="text-4xl font-black text-emerald-900">{stats.completed}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500">
                            <CheckCircle size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-red-50 relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Exceções Ativas</p>
                            <p className="text-4xl font-black text-red-900">{stats.alerts}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl text-red-500 animate-pulse">
                            <AlertTriangle size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Exceptions Grid */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Fila de Alertas em Tempo Real</h3>
                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase">Ciclo Ativo</span>
                </div>

                <div className="overflow-x-auto">
                    {cycles.length === 0 ? (
                        <div className="p-20 text-center">
                            <CheckCircle size={64} className="mx-auto text-emerald-100 mb-4" />
                            <p className="text-gray-400 font-bold text-lg">Nenhuma exceção detectada no momento.</p>
                            <p className="text-gray-300 text-sm">Todas as metas de ponto do Secullum estão em dia.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-8 py-5">Colaborador</th>
                                    <th className="px-8 py-5">Posto</th>
                                    <th className="px-8 py-5">Evento</th>
                                    <th className="px-8 py-5">Previsto</th>
                                    <th className="px-8 py-5 text-center">Status do Ciclo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cycles.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all cursor-default group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {item.collaborator.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-800">{item.collaborator.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-gray-500 uppercase bg-gray-100 px-3 py-1.5 rounded-lg">
                                                {item.collaborator.posto || 'Geral'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                {item.event_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-bold text-sm">
                                            {format(new Date(item.expected_time), 'HH:mm')}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusStyle(item.current_step)}`}>
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

            {/* Floating Quick Settings for Admin */}
            {user?.role === 'ADMIN' && (
                <div className="fixed bottom-8 right-8 cursor-pointer group" onClick={() => router.push('/dashboard/nexus/settings')}>
                    <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 hover:bg-black transition-all">
                        <Settings className="group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-black text-xs uppercase tracking-widest hidden group-hover:block pr-2">Nexus Config</span>
                    </div>
                </div>
            )}
        </div>
    );
}
