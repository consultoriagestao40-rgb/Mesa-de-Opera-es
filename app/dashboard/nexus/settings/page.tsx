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
    ShieldCheck
} from 'lucide-react';

export default function NexusSettings() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [testLoading, setTestLoading] = useState(false);

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

    const handleSave = async (key: string, value: string) => {
        setSaving(key);
        try {
            const res = await fetch('/api/nexus/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setMessage(`Configuração ${key} salva com sucesso!`);
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(null);
        }
    };

    const updateLocalValue = (key: string, value: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    };

    const handleTestConnection = async () => {
        setTestLoading(true);
        try {
            const res = await fetch('/api/nexus/test-secullum', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('✅ CONEXÃO COM SUCESSO! O Nexus conseguiu logar na Secullum.');
            } else {
                alert('❌ FALHA NA CONEXÃO: ' + data.error);
            }
        } catch (e: any) {
            alert('❌ ERRO TÉCNICO: ' + e.message);
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    // Default required configs if they don't exist in DB yet
    const configDefinitions = [
        { key: 'SECULLUM_USERNAME', label: 'Secullum Username', icon: User, type: 'text', description: 'Usuário de acesso ao Ponto Web' },
        { key: 'SECULLUM_PASSWORD', label: 'Secullum Password', icon: Key, type: 'password', description: 'Senha de acesso ao Ponto Web' },
        { key: 'SECULLUM_DATABASE_ID', label: 'Secullum Database ID', icon: Database, type: 'text', description: 'ID do Banco de Dados no Secullum (ex: 4a2ff5...)' },
        { key: 'ZAPI_INSTANCE_ID', label: 'Z-API Instance ID', icon: Globe, type: 'text', description: 'ID da Instância Z-API' },
        { key: 'ZAPI_TOKEN', label: 'Z-API Token', icon: ShieldCheck, type: 'password', description: 'Token de Segurança da Z-API' },
        { key: 'WHATSAPP_GROUP_ID', label: 'WhatsApp Target ID', icon: Globe, type: 'text', description: 'Número ou ID do Grupo para alertas' },
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações Nexus</h1>
                <p className="text-gray-500 font-medium italic">Gestão de Credenciais e Diagnóstico Secullum</p>
            </div>

            {message && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <CheckCircle size={20} />
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {configDefinitions.map((def) => {
                    const dbVal = configs.find(c => c.key === def.key)?.value || '';
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
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:w-1/2">
                                    <input
                                        type={def.type}
                                        value={dbVal}
                                        onChange={(e) => {
                                            if (!configs.find(c => c.key === def.key)) {
                                                setConfigs([...configs, { key: def.key, value: e.target.value }]);
                                            } else {
                                                updateLocalValue(def.key, e.target.value);
                                            }
                                        }}
                                        className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        placeholder={`Digitar ${def.label.toLowerCase()}...`}
                                    />
                                    <button
                                        onClick={() => handleSave(def.key, dbVal)}
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

            <div className="flex flex-col gap-4">
                <button
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="w-full p-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {testLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    Testar Conexão Secullum
                </button>

                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                    <Info className="text-blue-600 shrink-0" size={24} />
                    <div className="text-sm text-blue-700 font-medium">
                        <p className="font-black uppercase tracking-widest text-[10px] mb-2">Segurança Nexus</p>
                        As credenciais são armazenadas de forma segura. Utilize o botão azul para validar se a sua conta Secullum permite o acesso do Nexus.
                    </div>
                </div>
            </div>
        </div>
    );
}
