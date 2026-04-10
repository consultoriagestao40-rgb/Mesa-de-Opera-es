'use client';
import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit2, X, Check, AlertTriangle, Briefcase, User as UserIcon, Search } from 'lucide-react';

interface Collaborator {
    id: string;
    name: string;
    active: boolean;
    posto?: string;
    pis?: string;
    secullumId?: string;
}

export default function CollaboratorsPage() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Create State
    const [newName, setNewName] = useState('');
    const [newPosto, setNewPosto] = useState('');
    const [newPis, setNewPis] = useState('');
    const [newSecullumId, setNewSecullumId] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPosto, setEditPosto] = useState('');
    const [editPis, setEditPis] = useState('');
    const [editSecullumId, setEditSecullumId] = useState('');
    const [updating, setUpdating] = useState(false);

    // Delete State
    const [itemToDelete, setItemToDelete] = useState<Collaborator | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCollaborators = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cleaners');
            if (res.ok) {
                const data = await res.json();
                setCollaborators(data.cleaners);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setAdding(true);
        try {
            const res = await fetch('/api/cleaners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName,
                    posto: newPosto,
                    pis: newPis,
                    secullumId: newSecullumId
                })
            });

            if (res.ok) {
                setNewName('');
                setNewPosto('');
                setNewPis('');
                setNewSecullumId('');
                fetchCollaborators();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (item: Collaborator) => {
        setEditingId(item.id);
        setEditName(item.name || '');
        setEditPosto(item.posto || '');
        setEditPis(item.pis || '');
        setEditSecullumId(item.secullumId || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async () => {
        if (!editName.trim() || !editingId) return;

        setUpdating(true);
        try {
            const res = await fetch('/api/cleaners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: editingId, 
                    name: editName, 
                    posto: editPosto,
                    pis: editPis,
                    secullumId: editSecullumId,
                    active: true 
                })
            });

            if (res.ok) {
                setEditingId(null);
                fetchCollaborators();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/cleaners?id=${itemToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setItemToDelete(null);
                fetchCollaborators();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleting(false);
        }
    };

    const filteredCollaborators = collaborators.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.posto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.secullumId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Gestão de Colaboradores</h1>
                    <p className="text-slate-500 font-bold mt-1">Base unificada de monitoramento Nexus</p>
                </div>
                
                <div className="relative w-full lg:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 nexus-card border-none text-sm focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-300 font-bold"
                    />
                </div>
            </div>

            {/* Quick Registration Form */}
            <div className="nexus-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-bl-[4rem]" />
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Plus size={14} />
                    </div>
                    Novo Cadastro Operacional
                </h3>
                
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: Cristiano Silva"
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Posto de Trabalho</label>
                        <input
                            type="text"
                            value={newPosto}
                            onChange={(e) => setNewPosto(e.target.value)}
                            placeholder="Ex: Portaria Norte"
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-300"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ID Secullum</label>
                        <input
                            type="text"
                            value={newSecullumId}
                            onChange={(e) => setNewSecullumId(e.target.value)}
                            placeholder="Código do Ponto"
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !newName.trim()}
                        className="nexus-button-primary w-full flex items-center justify-center gap-3 h-[52px]"
                    >
                        {adding ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                        <span>Confirmar Cadastro</span>
                    </button>
                </form>
            </div>

            {/* List Table */}
            <div className="nexus-card overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Base de Colaboradores Ativos</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{filteredCollaborators.length} Registros</span>
                </div>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Acessando Banco Nexus...</p>
                    </div>
                ) : filteredCollaborators.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserIcon size={40} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-tighter text-lg">Nenhum resultado encontrado</p>
                        <p className="text-slate-300 text-sm font-bold mt-1">Refine sua busca ou cadastre um novo colaborador.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/10">
                                    <th className="px-10 py-6">Colaborador</th>
                                    <th className="px-10 py-6">Posto de Trabalho</th>
                                    <th className="px-10 py-6">Secullum ID</th>
                                    <th className="px-10 py-6 text-right">Ações de Comando</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCollaborators.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all cursor-default group">
                                        <td className="px-10 py-7">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-sm font-bold focus:ring-0 focus:border-blue-600 outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <span className="font-black text-slate-800 tracking-tight">{item.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-7">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editPosto}
                                                    onChange={(e) => setEditPosto(e.target.value)}
                                                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-sm font-bold focus:ring-0 focus:border-blue-600 outline-none"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-4 py-2 rounded-xl group-hover:bg-white transition-all">
                                                    {item.posto || '---'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-7">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editSecullumId}
                                                    onChange={(e) => setEditSecullumId(e.target.value)}
                                                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-sm font-bold focus:ring-0 focus:border-blue-600 outline-none"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                                                    {item.secullumId || '---'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-7 text-right">
                                            {editingId === item.id ? (
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={saveEdit} disabled={updating} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        {updating ? <Loader2 className="animate-spin w-5 h-5" /> : <Check size={20} />}
                                                    </button>
                                                    <button onClick={cancelEdit} disabled={updating} className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-600 hover:text-white transition-all shadow-sm">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEdit(item)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => setItemToDelete(item)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Premium Delete Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 mx-auto animate-nexus-pulse">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 text-center tracking-tighter">Eliminar Registro?</h3>
                        <p className="text-slate-500 font-bold text-center mb-10 leading-relaxed px-4">
                            Você está removendo o monitoramento de <span className="text-slate-900">{itemToDelete.name}</span>. Esta ação é definitiva na Mesa de Operações.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button onClick={confirmDelete} disabled={deleting} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95">
                                {deleting ? 'Executando...' : 'Confirmar Exclusão'}
                            </button>
                            <button onClick={() => setItemToDelete(null)} className="w-full py-5 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
                                Abortar Operação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
