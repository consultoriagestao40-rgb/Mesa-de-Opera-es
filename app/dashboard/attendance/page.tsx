'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AttendanceDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [cleaners, setCleaners] = useState<any[]>([]);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/cleaners');
            if (res.ok) {
                const data = await res.json();
                setCleaners(data.cleaners);
            } else {
                setError('Erro ao carregar colaboradores');
            }
        } catch (err) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const runCheck = async () => {
        setRunning(true);
        try {
            const res = await fetch('/api/cron/check-attendance');
            const data = await res.json();
            setResults(data);
            fetchData(); // Refresh list to see any updates
        } catch (err) {
            alert('Erro ao executar verificação');
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredCleaners = cleaners.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pis?.includes(searchTerm) ||
        c.secullumId?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Mesa de Operações: Attendance</h1>
                    <p className="text-gray-500 text-sm">Monitoramento em tempo real do ponto Secullum</p>
                </div>
                <button 
                    onClick={runCheck}
                    disabled={running}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                        running ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                    }`}
                >
                    {running ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    {running ? 'Verificando...' : 'Sincronizar Agora'}
                </button>
            </div>

            {/* Configured Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-50 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Total Equipe</p>
                            <p className="text-3xl font-black text-blue-900">{cleaners.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-green-50 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Integrados Secullum</p>
                            <p className="text-3xl font-black text-green-900">{cleaners.filter(c => c.pis || c.secullumId).length}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-amber-50 border-l-4 border-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Última Verificação</p>
                            <p className="text-3xl font-black text-amber-900">{results?.alerts_triggered ?? 0} Alertas</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <Clock size={24} />
                        </div>
                    </div>
                    {results && (
                        <p className="text-[10px] text-amber-500 mt-2 font-medium">Executado em: {format(new Date(), 'HH:mm:ss')}</p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center gap-4">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, PIS ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Secullum ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">PIS</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Status Integração</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                        Carregando equipe...
                                    </td>
                                </tr>
                            ) : filteredCleaners.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum colaborador encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredCleaners.map((cleaner) => (
                                    <tr key={cleaner.id} className="hover:bg-gray-50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {cleaner.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-700">{cleaner.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-mono">
                                                {cleaner.secullumId || '---'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-mono">
                                                {cleaner.pis || '---'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {cleaner.secullumId || cleaner.pis ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wide">
                                                    <CheckCircle size={12} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-wide">
                                                    <AlertCircle size={12} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
