'use client';
import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit2, X, Check, AlertTriangle, Briefcase, User as UserIcon } from 'lucide-react';

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
            const res = await fetch('/api/cleaners'); // Kept endpoint name for now
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
            } else {
                alert('Erro ao adicionar colaborador');
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
            } else {
                alert('Erro ao atualizar colaborador');
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
            } else {
                alert('Erro ao excluir colaborador');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Colaboradores</h1>
                   <p className="text-gray-500 font-medium">Nexus Operacional • Base de Dados Secullum</p>
                </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 p-8 border border-gray-100">
                <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    Novo Colaborador
                </h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Posto / Local</label>
                        <input
                            type="text"
                            value={newPosto}
                            onChange={(e) => setNewPosto(e.target.value)}
                            placeholder="Ex: Portaria A"
                            className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">ID Secullum</label>
                        <input
                            type="text"
                            value={newSecullumId}
                            onChange={(e) => setNewSecullumId(e.target.value)}
                            placeholder="Ex: 12345"
                            className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={adding || !newName.trim()}
                            className="w-full bg-blue-600 text-white p-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {adding ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                            Cadastrar
                        </button>
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Base de Colaboradores Ativos</h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
                    </div>
                ) : collaborators.length === 0 ? (
                    <div className="p-20 text-center">
                        <UserIcon size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">Nenhum colaborador encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-8 py-5">Nome</th>
                                    <th className="px-8 py-5">Posto</th>
                                    <th className="px-8 py-5">Secullum ID</th>
                                    <th className="px-8 py-5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {collaborators.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6 font-bold text-gray-800">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    {item.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editPosto}
                                                    onChange={(e) => setEditPosto(e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            ) : (
                                                <span className="text-xs font-black text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-lg">
                                                    {item.posto || 'Geral'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editSecullumId}
                                                    onChange={(e) => setEditSecullumId(e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            ) : (
                                                item.secullumId || '--'
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {editingId === item.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={saveEdit} disabled={updating} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                                        {updating ? <Loader2 className="animate-spin w-4 h-4" /> : <Check size={18} />}
                                                    </button>
                                                    <button onClick={cancelEdit} disabled={updating} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-600 hover:text-white transition-all">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => setItemToDelete(item)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                                        <Trash2 size={16} />
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

            {/* Delete Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Colaborador</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Você está prestes a remover <strong>{itemToDelete.name}</strong> da base operacional. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setItemToDelete(null)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                Melhor não
                            </button>
                            <button onClick={confirmDelete} disabled={deleting} className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50">
                                {deleting ? 'Removendo...' : 'Sim, Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
