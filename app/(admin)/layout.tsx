"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // NOUVEAU : L'état qui bloque l'affichage tant qu'on n'est pas sûr
  const [isAuthorized, setIsAuthorized] = useState(false); 
  
  const router = useRouter();
  const pathname = usePathname();

  // 1. VÉRIFICATION DE SÉCURITÉ ET RÉCUPÉRATION DES DONNÉES
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // S'il manque le token, on jette dehors !
    if (!userData || !token) {
      router.push('/login');
      return; 
    }

    const parsed = JSON.parse(userData);
    const role = parsed.role;
    setUserRole(role);

    // 🛑 LE VRAI BLOCAGE FRONTEND EST ICI :
    // Si l'utilisateur n'est PAS admin, il n'a le droit de voir QUE le planning
    if (role !== 'admin' && !pathname.startsWith('/planning')) {
      console.warn("⛔ Tentative d'accès non autorisé bloquée");
      router.push('/planning'); // On le renvoie de force au travail !
      return; // On stoppe l'affichage de la page interdite
    }

    // Si on arrive là, c'est que l'accès est légitime
    setIsAuthorized(true); 

    // Récupération du nombre de clients (uniquement si admin)
    if (role === 'admin') {
      const fetchCount = async () => {
        try {
          const res = await apiFetch('/api/clients');
          if (res.ok) {
            const data = await res.json();
            setClientCount(data.length);
          }
        } catch (err) {
          console.error("Erreur compteur:", err);
        }
      };
      fetchCount();
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // 2. Configuration du menu avec filtrage par RÔLE
  const allMenuItems = [
    { name: 'Tableau de bord', icon: '📊', path: '/dashboard', roles: ['admin'] },
    { name: 'Calendrier', icon: '📅', path: '/planning', roles: ['admin', 'permanent', 'monitor'] },
    { 
      name: 'Prestations', 
      icon: '🪂', 
      path: '/prestations',
      roles: ['admin'],
      subItems: [{ name: 'Photos & Vidéos', path: '/prestations/complements' }]
    },
    { name: 'Moniteurs', icon: '👥', path: '/moniteurs', roles: ['admin'] }, 
    { name: 'Clients', icon: '👤', path: '/clients', badge: clientCount, roles: ['admin'] },
    { name: 'Bons Cadeaux', icon: '🎁', path: '/gift-cards', roles: ['admin'] },
    { name: 'Configurations', icon: '⚙️', path: '/config', roles: ['admin'] },
  ];

  const authorizedMenus = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  // ÉCRAN D'ATTENTE PENDANT LA VÉRIFICATION DU VIGILE
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <span className="text-4xl block mb-4 animate-bounce">🔒</span>
        <p className="text-sky-400 font-bold uppercase tracking-widest animate-pulse text-xs">Vérification de l'accréditation...</p>
      </div>
    );
  }

  // SI ON EST LÀ, C'EST QU'ON EST CONNECTÉ (Affichage normal)
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* SIDEBAR GAUCHE */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800 h-20">
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-black italic text-xl tracking-tighter leading-none">
                FLUIDE <span className="text-sky-400">PRO</span>
              </span>
              <span className="text-[8px] uppercase font-bold text-slate-500 mt-1 tracking-widest">
                {userRole === 'admin' ? '🛡️ Admin' : '🔑 Permanent'}
              </span>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hover:bg-slate-800 p-2 rounded-xl transition-colors"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {authorizedMenus.map((item) => {
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
              <p className="text-sm font-black text-slate-900 capitalize">
                {userName}
              </p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest text-right">En ligne</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white ${userRole === 'admin' ? 'bg-slate-900' : 'bg-sky-600'}`}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
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