'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, 
    Save, 
    Key, 
    Globe, 
    User, 
    Database, 
    CheckCircle,
    Info,
    ShieldCheck,
    Search,
    MessageSquare,
    Copy,
    Check
} from 'lucide-react';

interface GroupResult {
    id: string;
    name: string;
}

export default function NexusSettings() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [testLoading, setTestLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groups, setGroups] = useState<GroupResult[]>([]);
    const [groupsError, setGroupsError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const configDefinitions = [
        { key: 'SECULLUM_USERNAME', label: 'Secullum Username', icon: User, type: 'text', description: 'Usuário de acesso ao Ponto Web' },
        { key: 'SECULLUM_PASSWORD', label: 'Secullum Password', icon: Key, type: 'password', description: 'Senha de acesso ao Ponto Web' },
        { key: 'SECULLUM_DATABASE_ID', label: 'Secullum Database ID', icon: Database, type: 'text', description: 'ID do Banco de Dados no Secullum (ex: 85740)' },
        { key: 'ZAPI_INSTANCE_ID', label: 'Z-API Instance ID', icon: Globe, type: 'text', description: 'ID da Instância Z-API (3F1993DFB59E83474F...)' },
        { key: 'ZAPI_TOKEN', label: 'Z-API Token', icon: Key, type: 'password', description: 'Token da Instância Z-API (81087A6B5C...)' },
        { key: 'ZAPI_CLIENT_TOKEN', label: 'Z-API Client-Token', icon: ShieldCheck, type: 'password', description: 'Token de Segurança da Conta Z-API — obtido em app.z-api.io/app/security' },
        { key: 'WHATSAPP_GROUP_ID', label: 'WhatsApp Group ID', icon: MessageSquare, type: 'text', description: 'ID do Grupo (ex: 120363xxxxx@g.us) — use "Buscar Grupos" abaixo para encontrar' },
    ];

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/nexus/config');
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.configs || []);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const getConfigValue = (key: string) => configs.find(c => c.key === key)?.value || '';

    const handleSave = async (key: string, value: string) => {
        setSaving(key);
        try {
            const res = await fetch('/api/nexus/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setMessage(`Configuração "${key}" salva com sucesso!`);
                setMessageType('success');
                setTimeout(() => setMessage(null), 4000);
                await fetchConfigs();
            } else {
                const err = await res.json();
                setMessage(`Erro ao salvar: ${err.error}`);
                setMessageType('error');
            }
        } catch (error: any) {
            setMessage(`Erro técnico: ${error.message}`);
            setMessageType('error');
        } finally {
            setSaving(null);
        }
    };

    const updateLocalValue = (key: string, value: string) => {
        setConfigs(prev => {
            const exists = prev.find(c => c.key === key);
            if (exists) {
                return prev.map(c => c.key === key ? { ...c, value } : c);
            }
            return [...prev, { key, value }];
        });
    };

    const handleTestWhatsApp = async () => {
        setTestLoading(true);
        try {
            const res = await fetch('/api/nexus/test-whatsapp', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage('✅ WhatsApp OK! Mensagem de teste enviada ao grupo configurado.');
                setMessageType('success');
            } else {
                setMessage('❌ Falha WhatsApp: ' + data.message);
                setMessageType('error');
            }
            setTimeout(() => setMessage(null), 6000);
        } catch (e: any) {
            setMessage('❌ Erro técnico: ' + e.message);
            setMessageType('error');
        } finally {
            setTestLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setTestLoading(true);
        try {
            const res = await fetch('/api/nexus/test-secullum', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage('✅ Conexão Secullum OK! Nexus autenticado com sucesso.');
                setMessageType('success');
            } else {
                setMessage('❌ Falha Secullum: ' + data.error);
                setMessageType('error');
            }
            setTimeout(() => setMessage(null), 6000);
        } catch (e: any) {
            setMessage('❌ Erro técnico: ' + e.message);
            setMessageType('error');
        } finally {
            setTestLoading(false);
        }
    };

    const handleBuscarGrupos = async () => {
        setGroupsLoading(true);
        setGroups([]);
        setGroupsError(null);
        try {
            const res = await fetch('/api/nexus/debug/list-groups');
            const data = await res.json();
            if (!res.ok) {
                setGroupsError(JSON.stringify(data.error || data, null, 2));
            } else {
                setGroups(data.groups || []);
                if (!data.groups?.length) {
                    setGroupsError('Nenhum grupo encontrado. Verifique se o WhatsApp está conectado e se o ZAPI_CLIENT_TOKEN está correto.');
                }
            }
        } catch (e: any) {
            setGroupsError(e.message);
        } finally {
            setGroupsLoading(false);
        }
    };

    const handleCopyAndSaveGroup = async (groupId: string) => {
        setCopiedId(groupId);
        updateLocalValue('WHATSAPP_GROUP_ID', groupId);
        await handleSave('WHATSAPP_GROUP_ID', groupId);
        setTimeout(() => setCopiedId(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações Nexus</h1>
                <p className="text-gray-500 font-medium italic">Gestão de Credenciais, Z-API WhatsApp e Secullum</p>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${
                    messageType === 'success' 
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border border-red-100 text-red-700'
                }`}>
                    <CheckCircle size={20} />
                    {message}
                </div>
            )}

            {/* Config Fields */}
            <div className="grid grid-cols-1 gap-6">
                {configDefinitions.map((def) => {
                    const dbVal = getConfigValue(def.key);
                    const Icon = def.icon;
                    
                    return (
                        <div key={def.key} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100/50 border border-gray-100 hover:border-blue-100 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-800 tracking-tight uppercase text-xs mb-1">{def.label}</h3>
                                        <p className="text-sm text-gray-400 font-medium pr-4">{def.description}</p>
                                        {dbVal && (
                                            <p className="text-xs text-emerald-500 font-bold mt-1">
                                                ● Configurado — {dbVal.substring(0, 8)}...
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:w-1/2">
                                    <input
                                        type={def.type}
                                        value={dbVal}
                                        onChange={(e) => updateLocalValue(def.key, e.target.value)}
                                        className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        placeholder={`Digitar ${def.label.toLowerCase()}...`}
                                    />
                                    <button
                                        onClick={() => handleSave(def.key, getConfigValue(def.key))}
                                        disabled={saving === def.key}
                                        className="p-4 bg-gray-900 text-blue-400 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {saving === def.key ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Buscar Grupos Z-API */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100/50 border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                        <Search size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 tracking-tight">Buscar Grupos do WhatsApp</h3>
                        <p className="text-sm text-gray-400 font-medium">
                            Lista todos os grupos que o WhatsApp conectado participa via Z-API. 
                            Salve o ID com um clique.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleBuscarGrupos}
                    disabled={groupsLoading}
                    className="w-full p-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl shadow-green-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
                >
                    {groupsLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    {groupsLoading ? 'Buscando grupos...' : 'Buscar Grupos via Z-API'}
                </button>

                {groupsError && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4">
                        <p className="text-red-700 font-bold text-sm mb-1">❌ Erro ao buscar grupos:</p>
                        <pre className="text-red-600 text-xs font-mono whitespace-pre-wrap break-all">{groupsError}</pre>
                        <p className="text-red-500 text-xs mt-3 font-medium">
                            💡 Certifique-se de que o <strong>ZAPI_CLIENT_TOKEN</strong> está configurado corretamente acima (obtenha em app.z-api.io/app/security).
                        </p>
                    </div>
                )}

                {groups.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{groups.length} grupos encontrados — clique para selecionar</p>
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all group"
                            >
                                <div>
                                    <p className="font-black text-gray-800 text-sm">{group.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{group.id}</p>
                                </div>
                                <button
                                    onClick={() => handleCopyAndSaveGroup(group.id)}
                                    disabled={saving === 'WHATSAPP_GROUP_ID'}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {copiedId === group.id ? (
                                        <><Check size={14} /> Salvo!</>
                                    ) : (
                                        <><Copy size={14} /> Usar este</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="w-full p-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {testLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    Testar Conexão Secullum
                </button>

                <button
                    onClick={handleTestWhatsApp}
                    disabled={testLoading}
                    className="w-full p-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {testLoading ? <Loader2 className="animate-spin" /> : <MessageSquare />}
                    Testar Envio WhatsApp
                </button>

                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                    <Info className="text-blue-600 shrink-0" size={24} />
                    <div className="text-sm text-blue-700 font-medium">
                        <p className="font-black uppercase tracking-widest text-[10px] mb-2">Como obter o Client-Token Z-API</p>
                        Acesse <strong>app.z-api.io → Segurança → Token de segurança da conta</strong>. 
                        Cole o valor completo no campo <strong>Z-API Client-Token</strong> acima e salve. 
                        Em seguida, clique em <strong>&quot;Buscar Grupos&quot;</strong> para listar e selecionar o grupo correto automaticamente.
                    </div>
                </div>
            </div>
        </div>
    );
}
