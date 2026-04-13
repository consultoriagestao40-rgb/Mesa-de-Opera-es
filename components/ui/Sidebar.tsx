'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Home, 
    Users, 
    Settings, 
    History, 
    ShieldAlert, 
    LogOut,
    Menu,
    X,
    BellRing
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function NexusSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(() => {});
    }, []);

    const menuItems = [
        { name: 'Monitor de Exceções', href: '/dashboard', icon: Home, roles: ['ADMIN', 'OPERATOR', 'MANAGER', 'CLIENT'] },
        { name: 'Colaboradores', href: '/dashboard/cleaners', icon: Users, roles: ['ADMIN', 'OPERATOR', 'MANAGER'] },
        { name: 'Histórico de Alertas', href: '/dashboard/nexus/history', icon: History, roles: ['ADMIN', 'MANAGER', 'CLIENT'] },
        { name: 'Configurações', href: '/dashboard/nexus/settings', icon: Settings, roles: ['ADMIN'] },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const isAuthorized = (roles: string[]) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <div 
            className={cn(
                "h-screen sticky top-0 bg-[#0f172a] text-white flex flex-col transition-all duration-300 ease-in-out z-50",
                collapsed ? "w-20" : "w-72 shadow-2xl shadow-blue-900/20"
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "p-8 flex items-center gap-4 border-b border-white/5 relative",
                collapsed && "justify-center p-6"
            )}>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                    <ShieldAlert size={24} className="text-white animate-pulse" />
                </div>
                {!collapsed && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <h1 className="font-black text-xl tracking-tighter uppercase">Nexus</h1>
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] -mt-1 opacity-80">Operacional</p>
                    </div>
                )}
                
                {/* Collapse Toggle Button */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "absolute -right-3 top-10 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[60]",
                        collapsed && "rotate-180 -right-3"
                    )}
                >
                    <X size={12} className={collapsed ? "hidden" : "block"} />
                    <Menu size={12} className={collapsed ? "block" : "hidden"} />
                </button>
            </div>

            {/* User Info */}
            {!collapsed && user && (
                <div className="p-6 mx-4 mt-6 bg-white/5 rounded-3xl border border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 text-center">Status: Operante</p>
                    <p className="text-sm font-bold truncate text-center">{user.name}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase text-center">{user.role}</p>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2 mt-2">
                {menuItems.filter(item => isAuthorized(item.roles)).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
                                isActive 
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                                    : "text-white/50 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon size={22} className={cn(isActive ? "animate-bounce" : "group-hover:scale-110 transition-transform")} />
                            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
                            {isActive && !collapsed && (
                                <div className="absolute right-4 w-2 h-2 bg-white rounded-full animate-ping" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Secondary Actions */}
            <div className="p-6 border-t border-white/5">
                <div className="mb-6 px-4">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse border-4 border-emerald-400/20" />
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Build v0.1.9</span>}
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
                >
                    <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    {!collapsed && <span className="font-bold text-sm">Sair do Nexus</span>}
                </button>
            </div>
        </div>
    );
}
