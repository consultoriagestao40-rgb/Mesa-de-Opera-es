'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
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
    Clock,
    ChevronLeft,
    ChevronRight,
    Calendar,
    UserCheck,
    UserMinus,
    CalendarCheck,
    Coffee
} from 'lucide-react';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function NexusDashboard() {
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stats, setStats] = useState({ 
        totalActive: 0, 
        scheduled: 0, 
        present: 0, 
        punches: 0, 
        exceptions: 0, 
        offDuty: 0 
    });
    const [cycles, setCycles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const [userRes, nexusRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch(`/api/nexus/alerts?date=${dateStr}`)
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
                setStats(data.stats || { 
                    totalActive: 0, 
                    scheduled: 0, 
                    present: 0, 
                    punches: 0, 
                    exceptions: 0, 
                    offDuty: 0 
                });
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
    }, [selectedDate]);

    const handlePrevDate = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDate = () => setSelectedDate(prev => addDays(prev, 1));
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

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
                <div className="flex flex-col gap-6 w-full lg:w-auto">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full border-4",
                                isToday ? "bg-emerald-400 border-emerald-400/20 animate-pulse" : "bg-slate-300 border-slate-300/20"
                            )} />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                {isToday ? 'Live: Operação em Tempo Real' : 'Consulta: Histórico Operacional'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            Monitor de Exceções
                        </h1>
                        <p className="text-slate-500 font-bold mt-1">Sincronizado via <span className="text-blue-600">Secullum Ponto Web</span></p>
                    </div>

                    {/* Date Navigator UI (Matching Reference) */}
                    <div className="flex items-center bg-white border border-slate-100 rounded-3xl p-1 shadow-sm w-fit">
                        <button 
                            onClick={handlePrevDate}
                            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <div className="flex items-center gap-3 px-6 py-2 border-x border-slate-50 min-w-[200px] justify-center">
                            <Calendar size={18} className="text-slate-400" />
                            <span className="font-black text-slate-700 tracking-tight capitalize">
                                {format(selectedDate, "dd 'De' MMMM", { locale: ptBR })}
                            </span>
                        </div>

                        <button 
                            onClick={handleNextDate}
                            disabled={isToday}
                            className={cn(
                                "p-3 rounded-2xl transition-all active:scale-90",
                                isToday ? "text-slate-200 cursor-not-allowed" : "hover:bg-slate-50 text-slate-400"
                            )}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchData}
                        className="p-4 nexus-card flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-400"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="nexus-button-primary flex items-center gap-3 shadow-lg shadow-blue-200">
                        <BellRing size={20} className={isToday ? "animate-bounce" : ""} />
                        <span>Mesa de Operações</span>
                    </div>
                </div>
            </div>

            {/* Operational Matrix KPIs - 5 Cards Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                {/* 1. Na Escala */}
                <div className="nexus-card p-6 group relative overflow-hidden bg-white">
                    <div className="flex flex-col gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-all shadow-sm">
                            <CalendarCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Na Escala Hoje</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.scheduled}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Em Folga */}
                <div className="nexus-card p-6 group relative overflow-hidden bg-slate-50/30">
                    <div className="flex flex-col gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 transition-all shadow-sm">
                            <Coffee size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Folga</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.offDuty}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Pessoas Presentes */}
                <div className="nexus-card p-6 group relative bg-emerald-50/20 border-emerald-100 overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Pessoas Presentes</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.present}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Batidas Totais */}
                <div className="nexus-card p-6 group relative overflow-hidden bg-blue-50/20">
                    <div className="flex flex-col gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Batidas Totais</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.punches}</p>
                        </div>
                    </div>
                </div>

                {/* 5. Exceções Ativas (Table Match) */}
                <div className="nexus-card p-6 group border-red-100 overflow-hidden relative bg-red-50/10">
                    <div className={cn(
                        "flex flex-col gap-4",
                        stats.exceptions > 0 && "animate-nexus-pulse"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            stats.exceptions > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                        )}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-red-600/60 uppercase tracking-widest mb-1">Exceções Ativas</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.exceptions}</p>
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
