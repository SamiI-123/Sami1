import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { 
  LayoutDashboard, Drone, ShieldAlert, Thermometer, 
  Users, Settings, LogOut, Loader2, Sparkles,
  TreePine, TrendingUp, CloudRain, Wind, Droplets,
  Menu, X, Info
} from 'lucide-react';
import { cn } from './lib/utils';

// Views
import Dashboard from './views/Dashboard';
import Diagnostics from './views/Diagnostics';
import Sensors from './views/Sensors';
import Community from './views/Community';
import Profile from './views/Profile';
import ExpertConsole from './views/ExpertConsole';
import AdminDashboard from './views/AdminDashboard';
import SettingsView from './views/Settings';
import About from './views/About';
import Auth from './views/Auth';
import Landing from './views/Landing';
import QuickActions from './components/QuickActions';
import { NAV_ITEMS } from './constants';

function MainApp() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [showAuth, setShowAuth] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Guest fallback
  const guestUser = {
    id: 'guest_user',
    displayName: 'Samson Abreham',
    email: 'guest@agrinovia.tech',
    role: 'farmer' as const,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samson'
  };

  const userRole = user ? user.role : 'farmer';

  // Listen to popstate event (browser back/forward) to synchronize URL and active Tab
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setActiveTab('admin');
      } else if (path === '/expert') {
        setActiveTab('expert');
      } else if (path === '/farmer') {
        setActiveTab('dashboard');
      } else if (path === '/') {
        if (user) {
          if (user.role === 'admin') setActiveTab('admin');
          else if (user.role === 'expert') setActiveTab('expert');
          else setActiveTab('dashboard');
        } else {
          setActiveTab('landing');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    // Sync initial pathname
    handleLocationChange();

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [user]);

  // Handle role-based redirections upon authentication state change
  React.useEffect(() => {
    if (user) {
      setShowAuth(false);
      const role = user.role;
      const currentPath = window.location.pathname;

      if (role === 'admin') {
        if (currentPath !== '/admin') {
          window.history.pushState({}, "", "/admin");
          setActiveTab('admin');
        }
      } else if (role === 'expert') {
        if (currentPath !== '/expert') {
          window.history.pushState({}, "", "/expert");
          setActiveTab('expert');
        }
      } else if (role === 'farmer') {
        // Only redirect if they aren't on other valid subpages of farmer
        const validFarmerPaths = ['/farmer', '/diagnostics', '/sensors', '/community', '/profile', '/settings', '/about'];
        if (!validFarmerPaths.includes(currentPath)) {
          window.history.pushState({}, "", "/farmer");
          setActiveTab('dashboard');
        }
      }
    } else {
      // If logged out and not on root landing, reset path to root
      if (window.location.pathname !== '/') {
        window.history.pushState({}, "", "/");
        setActiveTab('landing');
      }
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-green animate-spin" />
      </div>
    );
  }

  // Marketing page for non-logged in or explicit choice
  if (activeTab === 'landing' && !user) {
    return <Landing onStart={() => setActiveTab('dashboard')} />;
  }

  if (showAuth && !user) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  const currentUser = user || guestUser;

  return (
    <div className="min-h-screen bg-natural-bg flex text-natural-text">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-primary-green flex flex-col fixed inset-y-0 left-0 z-50 text-white p-6 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden group relative">
              <img src="/src/assets/images/agrinovia_logo_1779002221032.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <TreePine className="text-primary-green w-6 h-6 absolute" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tighter block leading-none">AGRINOVIA</span>
              <span className="text-[8px] font-black tracking-[0.2em] uppercase text-accent-tan">Technology</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.filter(item => {
            if (item.id === 'expert') return userRole === 'expert' || userRole === 'admin';
            if (item.id === 'admin') return userRole === 'admin';
            return true;
          }).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
                // Synchronize URL path with active tab selection
                if (item.id === 'admin') {
                  window.history.pushState({}, "", "/admin");
                } else if (item.id === 'expert') {
                  window.history.pushState({}, "", "/expert");
                } else if (item.id === 'dashboard') {
                  window.history.pushState({}, "", "/farmer");
                } else {
                  window.history.pushState({}, "", `/${item.id}`);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-primary-green-light text-white shadow-lg shadow-black/10" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn(activeTab === item.id ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-6">
          <div className="bg-primary-green-dark p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Active Drone</p>
            <p className="text-sm font-bold mb-3">AGRI-FLYER V.4</p>
            <div className="w-full bg-primary-green-light h-1.5 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-accent-tan transition-all duration-1000"></div>
            </div>
            <p className="text-[10px] mt-2 text-white/40 text-right font-mono">75% Battery</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4 p-2">
              <div className="relative">
                <img src={currentUser.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border-2 border-accent-tan shadow-sm" />
                {userRole === 'expert' && <div className="absolute -top-1 -right-1 bg-blue-500 w-4 h-4 rounded-full flex items-center justify-center text-[10px] border-2 border-primary-green-dark">🎓</div>}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate flex items-center gap-1">
                  {currentUser.displayName}
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                    userRole === 'expert' ? "bg-blue-500/20 text-blue-200" : "bg-accent-tan/20 text-accent-tan"
                  )}>
                    {userRole === 'expert' ? 'Agricultural Expert' : 'Member'}
                  </span>
                </div>
              </div>
            </div>
            {user ? (
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-accent-tan hover:bg-accent-tan/10 transition-all"
              >
                <Sparkles size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-natural-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-natural-bg rounded-xl border border-natural-border text-natural-muted hover:text-primary-green transition-all"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm lg:text-lg font-bold">North Ridge Estate</h1>
              <p className="text-[10px] lg:text-xs text-natural-muted font-medium">Active Monitoring: Sector A, B, and D</p>
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden sm:flex items-center gap-4 bg-natural-bg/50 px-4 py-2 rounded-2xl border border-natural-border">
               <div className="text-right border-r border-natural-border pr-4">
                 <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">Weather</p>
                 <p className="text-sm font-bold">24°C Sunny</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">Wind</p>
                  <p className="text-sm font-bold">12 km/h NW</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('settings')}
                className="hidden sm:flex p-2.5 rounded-xl bg-natural-bg border border-natural-border text-natural-muted hover:text-primary-green transition-all"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#E9EDC6] border-2 border-accent-tan overflow-hidden shadow-sm">
                 {currentUser.photoURL && <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />}
              </div>
              <button 
                onClick={() => {
                  if (user) {
                    logout();
                  } else {
                    setShowAuth(true);
                  }
                }}
                className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100 active:scale-90"
                title={user ? "Sign Out" : "Exit Guest Mode"}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-h-full"
            >
              {activeTab === 'landing' && <Landing onStart={() => setActiveTab('dashboard')} />}
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === 'diagnostics' && <Diagnostics />}
              {activeTab === 'sensors' && <Sensors />}
              {activeTab === 'community' && <Community />}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'expert' && <ExpertConsole />}
              {activeTab === 'admin' && <AdminDashboard />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'about' && <About />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <QuickActions userRole={userRole} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
