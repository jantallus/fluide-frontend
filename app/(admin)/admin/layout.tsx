"use client";
import { useState, useEffect } from 'react'; // Ajout de useEffect
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api'; // Import pour le compteur

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clientCount, setClientCount] = useState(0); // État pour le compteur
  const router = useRouter();
  const pathname = usePathname();

  // Récupération du nombre de clients sans casser le reste
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await apiFetch('/api/admin/clients');
        if (res.ok) {
          const data = await res.json();
          setClientCount(data.length);
        }
      } catch (err) {
        console.error("Erreur compteur:", err);
      }
    };
    fetchCount();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Menu conservé à l'identique avec l'ajout de la propriété "badge" pour les clients
  const menuItems = [
    { name: 'Tableau de bord', icon: '📊', path: '/admin/dashboard' },
    { name: 'Calendrier', icon: '📅', path: '/admin/planning' },
    { 
      name: 'Prestations', 
      icon: '🪂', 
      path: '/admin/prestations',
      subItems: [{ name: 'Photos & Vidéos', path: '/admin/prestations/complements' }]
    },
    { name: 'Moniteurs', icon: '👥', path: '/admin/moniteurs' },
    { name: 'Clients', icon: '👤', path: '/admin/clients', badge: clientCount }, // On injecte le compteur
    { name: 'Bons Cadeaux', icon: '🎁', path: '/admin/gift-cards' },
    { name: 'Configurations', icon: '⚙️', path: '/admin/config' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* SIDEBAR GAUCHE */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800 h-20">
          {!isCollapsed && (
            <span className="font-black italic text-xl tracking-tighter">
              FLUIDE <span className="text-sky-400">PRO</span>
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hover:bg-slate-800 p-2 rounded-xl transition-colors"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            
            return (
              <div key={item.name} className="space-y-1">
                <Link 
                  href={item.path} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                    isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{item.icon}</span>
                    {!isCollapsed && <span className="font-bold text-sm">{item.name}</span>}
                  </div>

                  {/* AJOUT DU BADGE VISUEL DANS LE LIEN */}
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-sky-600' : 'bg-sky-500/20 text-sky-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
                
                {!isCollapsed && item.subItems && isActive && (
                  <div className="ml-10 space-y-1">
                    {item.subItems.map(sub => (
                      <Link 
                        key={sub.name} 
                        href={sub.path} 
                        className={`block text-xs py-2 transition-colors ${
                          pathname === sub.path ? 'text-white font-bold' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        • {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 text-rose-400 hover:bg-rose-500/10 w-full rounded-xl transition-colors font-bold text-sm"
          >
            <span className="text-xl">🚪</span>
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPALE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Poste de pilotage</span>
            <span className="text-sm font-bold text-slate-700 capitalize">
              {pathname.split('/').pop()?.replace('-', ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900">Ju Admin</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">En ligne</p>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">
              J
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}