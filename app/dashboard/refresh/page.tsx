'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

export default function RefreshPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Iniciando limpeza profunda...');

    useEffect(() => {
        const cleanEverything = async () => {
            try {
                // 1. Unregister all Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                        console.log('[Nexus] SW Unregistered');
                    }
                }

                // 2. Clear all Caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) {
                        await caches.delete(name);
                        console.log('[Nexus] Cache Deleted:', name);
                    }
                }

                // 3. Clear Local Storage and Session Storage
                localStorage.clear();
                sessionStorage.clear();

                setStatus('Limpeza concluída! Redirecionando...');
                
                // 4. Force reload and redirect
                setTimeout(() => {
                    window.location.href = '/dashboard/cleaners?force=' + Date.now();
                }, 1500);

            } catch (error) {
                console.error('Clean Error:', error);
                setStatus('Erro na limpeza, mas tentando redirecionar...');
                setTimeout(() => {
                    window.location.href = '/dashboard/cleaners';
                }, 1500);
            }
        };

        cleanEverything();
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
                <RefreshCw className="text-blue-500 animate-spin" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tighter">
                Resetando Mesa de Operações
            </h1>
            <p className="text-slate-400 font-bold mb-8">
                {status}
            </p>
            <Loader2 className="animate-spin text-slate-700" size={24} />
        </div>
    );
}
