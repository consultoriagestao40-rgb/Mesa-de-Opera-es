'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
    Loader2, 
    RefreshCw, 
    History,
    CheckCircle,
    XCircle,
    AlertCircle,
    User
} from 'lucide-react';

export default function NexusHistory() {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/nexus/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONCLUIDO':
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">Resolvido</span>;
            case 'EM_ALERTA':
                return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase">Ativo</span>;
            case 'ENCERRADO':
                return <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase">Finalizado</span>;
            default:
                return <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <History className="text-blue-600" />
                        Histórico de Alertas
                    </h1>
                    <p className="text-gray-500 font-medium">Log de ocorrências e exceções do Nexus</p>
                </div>
                <button onClick={fetchHistory} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
                            <th className="px-8 py-5">Data/Hora</th>
                            <th className="px-8 py-5">Colaborador</th>
                            <th className="px-8 py-5">Departamento</th>
                            <th className="px-8 py-5">Evento</th>
                            <th className="px-8 py-5">Status Final</th>
                            <th className="px-8 py-5">Último Aviso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">
                                    Nenhum log encontrado.
                                </td>
                            </tr>
                        ) : (
                            history.map((log: any) => (
                                <tr key={log.id} className="hover:bg-blue-50/10 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-gray-800">
                                            {format(new Date(log.date), 'dd/MM')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase">
                                            Previsto: {format(new Date(log.expected_time), 'HH:mm')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-800 block">{log.collaborator?.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{log.collaborator?.departamento || '---'}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-gray-600">{log.event_type}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {getStatusBadge(log.status)}
                                    </td>
                                    <td className="px-8 py-6 text-xs text-gray-400 font-medium">
                                        {log.current_step > 0 ? `${log.current_step}º AVISO` : 'Sem aviso'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
