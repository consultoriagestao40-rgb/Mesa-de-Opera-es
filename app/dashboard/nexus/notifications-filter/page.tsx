'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Loader2, 
    Save, 
    Building2, 
    Users, 
    Check, 
    X, 
    Search, 
    SlidersHorizontal, 
    Bell, 
    BellOff, 
    CheckCircle2, 
    AlertCircle, 
    RotateCcw,
    ShieldCheck
} from 'lucide-react';

interface ContractItem {
    name: string;
    count: number;
}

interface CollaboratorItem {
    id: string;
    name: string;
    posto: string | null;
    departamento: string | null;
    cpf: string | null;
    secullumId: string | null;
}

interface FilterRules {
    disabledContracts: string[];
    disabledCollaboratorIds: string[];
    enabledCollaboratorIds: string[];
}

export default function NotificationsFilterPage() {
    const [contracts, setContracts] = useState<ContractItem[]>([]);
    const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
    const [disabledContracts, setDisabledContracts] = useState<string[]>([]);
    const [disabledCollabIds, setDisabledCollabIds] = useState<string[]>([]);
    const [enabledCollabIds, setEnabledCollabIds] = useState<string[]>([]);

    const [activeTab, setActiveTab] = useState<'contracts' | 'collaborators'>('contracts');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/nexus/group-filter');
            if (res.ok) {
                const data = await res.json();
                setContracts(data.contracts || []);
                setCollaborators(data.collaborators || []);
                if (data.rules) {
                    setDisabledContracts(data.rules.disabledContracts || []);
                    setDisabledCollabIds(data.rules.disabledCollaboratorIds || []);
                    setEnabledCollabIds(data.rules.enabledCollaboratorIds || []);
                }
            } else {
                setFeedback({ message: 'Falha ao carregar dados do servidor', type: 'error' });
            }
        } catch (e: any) {
            setFeedback({ message: `Erro de conexão: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Toggle contract
    const toggleContract = (contractName: string) => {
        setDisabledContracts(prev => {
            if (prev.includes(contractName)) {
                return prev.filter(c => c !== contractName);
            } else {
                return [...prev, contractName];
            }
        });
    };

    // Enable/disable all contracts
    const enableAllContracts = () => setDisabledContracts([]);
    const disableAllContracts = () => setDisabledContracts(contracts.map(c => c.name));

    // Toggle individual collaborator
    const toggleCollaborator = (collabId: string, contractDisabled: boolean) => {
        if (contractDisabled) {
            // Se o contrato do colaborador está desativado, o switch controla se ele é uma EXCEÇÃO ATIVADA
            setEnabledCollabIds(prev => {
                if (prev.includes(collabId)) {
                    return prev.filter(id => id !== collabId);
                } else {
                    return [...prev, collabId];
                }
            });
        } else {
            // Se o contrato está ativado, o switch controla se ele está SILENCIADO
            setDisabledCollabIds(prev => {
                if (prev.includes(collabId)) {
                    return prev.filter(id => id !== collabId);
                } else {
                    return [...prev, collabId];
                }
            });
        }
    };

    // Save rules to API
    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/nexus/group-filter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disabledContracts,
                    disabledCollaboratorIds: disabledCollabIds,
                    enabledCollaboratorIds: enabledCollabIds
                })
            });

            if (res.ok) {
                setFeedback({ message: 'Regras de notificação salvas com sucesso!', type: 'success' });
                setTimeout(() => setFeedback(null), 4000);
            } else {
                const err = await res.json();
                setFeedback({ message: `Erro ao salvar: ${err.error || 'Erro desconhecido'}`, type: 'error' });
            }
        } catch (e: any) {
            setFeedback({ message: `Erro técnico: ${e.message}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Computed lists
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [contracts, searchTerm]);

    const filteredCollaborators = useMemo(() => {
        return collaborators.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.posto && c.posto.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.cpf && c.cpf.includes(searchTerm))
        );
    }, [collaborators, searchTerm]);

    const activeContractsCount = contracts.length - disabledContracts.length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
                <p className="text-slate-500 font-bold text-sm tracking-wide">Carregando contratos e colaboradores...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <SlidersHorizontal size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Filtros da Mesa de Operações</h1>
                            <p className="text-slate-400 font-medium text-xs md:text-sm">
                                Escolha quais contratos e colaboradores devem enviar alertas de atraso e compor o resumo no WhatsApp
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="text-blue-400" />}
                        Salvar Configurações
                    </button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-4 rounded-2xl font-bold flex items-center gap-3 animate-in zoom-in-95 duration-200 ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm">{feedback.message}</span>
                </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Contratos Ativos</p>
                        <p className="text-3xl font-black text-slate-800 mt-1">
                            {activeContractsCount} <span className="text-base text-slate-400 font-semibold">/ {contracts.length}</span>
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Building2 size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Contratos Silenciados</p>
                        <p className="text-3xl font-black text-slate-800 mt-1">
                            {disabledContracts.length}
                        </p>
                    </div>
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                        <BellOff size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Colaboradores</p>
                        <p className="text-3xl font-black text-slate-800 mt-1">{collaborators.length}</p>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            {/* Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => { setActiveTab('contracts'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto justify-center ${
                            activeTab === 'contracts'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Building2 size={16} />
                        Por Contrato ({contracts.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('collaborators'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto justify-center ${
                            activeTab === 'collaborators'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Users size={16} />
                        Por Funcionário ({collaborators.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'contracts' ? 'Buscar contrato...' : 'Buscar colaborador ou posto...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* TAB 1: CONTRACTS */}
            {activeTab === 'contracts' && (
                <div className="space-y-4">
                    {/* Batch Actions */}
                    <div className="flex items-center justify-between px-2">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {filteredContracts.length} contratos encontrados
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={enableAllContracts}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition-all"
                            >
                                Habilitar Todos
                            </button>
                            <button
                                onClick={disableAllContracts}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-black transition-all"
                            >
                                Silenciar Todos
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredContracts.map((contract) => {
                            const isEnabled = !disabledContracts.includes(contract.name);

                            return (
                                <div
                                    key={contract.name}
                                    onClick={() => toggleContract(contract.name)}
                                    className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between select-none ${
                                        isEnabled
                                            ? 'bg-white border-slate-200 shadow-lg shadow-slate-100 hover:border-blue-400'
                                            : 'bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-80'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 pr-4">
                                        <div className={`p-4 rounded-2xl transition-all ${
                                            isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            <Building2 size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm tracking-tight">{contract.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                                                {contract.count} {contract.count === 1 ? 'colaborador' : 'colaboradores'} vinculado(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                            isEnabled 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {isEnabled ? 'Notificar' : 'Silenciado'}
                                        </span>

                                        <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                                            isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                        }`}>
                                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: COLLABORATORS */}
            {activeTab === 'collaborators' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Ajuste Individual por Colaborador</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Ative ou silencie funcionários independentemente da configuração geral do contrato
                            </p>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {filteredCollaborators.length} Colaboradores
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {filteredCollaborators.map((collab) => {
                            const contractDisabled = collab.posto ? disabledContracts.includes(collab.posto.trim()) : false;
                            
                            // Determina se o colaborador está ativo para o grupo:
                            let isNotifying = false;
                            if (contractDisabled) {
                                // Se o contrato está silenciado, só notifica se for exceção explicitamente ativada
                                isNotifying = enabledCollabIds.includes(collab.id);
                            } else {
                                // Se o contrato está ativo, notifica a menos que esteja individualmente silenciado
                                isNotifying = !disabledCollabIds.includes(collab.id);
                            }

                            return (
                                <div 
                                    key={collab.id} 
                                    className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                                            isNotifying ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {collab.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{collab.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                                                <span>{collab.posto || 'Sem Posto Definido'}</span>
                                                {collab.departamento && <span>• {collab.departamento}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                            isNotifying 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {isNotifying ? 'Notificar' : 'Silenciado'}
                                        </span>

                                        <button
                                            onClick={() => toggleCollaborator(collab.id, contractDisabled)}
                                            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                                                isNotifying ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                                                isNotifying ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
