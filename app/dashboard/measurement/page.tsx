'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Ruler, 
  Users, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Factory,
  ChevronLeft
} from 'lucide-react';

import { supabase, UserRole } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { SCREENS, getAllowedScreens, canAccessScreen } from '@/lib/permissions';

export default function MeasurementPage() {
  const router = useRouter();
  const { user, role, isAuthReady } = useAuth();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.push('/');
    }
  }, [user, isAuthReady, router]);

  // Check permissions
  useEffect(() => {
    if (isAuthReady && user && role) {
      if (!canAccessScreen(role, '/dashboard/measurement')) {
        router.push('/dashboard');
      }
    }
  }, [isAuthReady, user, role, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const allowedScreens = role ? getAllowedScreens(role) : [];

  if (!isAuthReady || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#131b2e] animate-pulse">Carregando Medições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex font-sans">
      {/* SideNavBar (Desktop) */}
      <aside className="hidden md:flex flex-col p-4 space-y-2 h-screen w-64 fixed left-0 top-0 bg-[#f8fafc] dark:bg-slate-950 font-medium z-40 border-r border-[#c6c6cd]/15">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">CMA GRO</h2>
            <p className="text-xs text-slate-500 font-medium">{role?.toUpperCase() || 'PERFIL'}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {allowedScreens.map((screen) => {
            const IconComponent = {
              LayoutDashboard,
              Ruler,
              Users,
              Settings
            }[screen.icon] || LayoutDashboard;

            const isActive = screen.path === '/dashboard/measurement';

            return (
              <a 
                key={screen.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm border border-[#c6c6cd]/15' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`} 
                href={screen.path}
              >
                <IconComponent className="w-5 h-5" />
                {screen.label}
              </a>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="w-full sticky top-0 z-50 bg-white flex items-center justify-between px-6 h-16 shadow-sm border-b border-[#c6c6cd]/15">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold tracking-tight text-slate-900">CMA GRO</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#dae2fd] overflow-hidden relative">
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Perfil do usuário"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-[#131b2e]">{user?.email}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                role === 'admin' ? 'bg-black text-white' : 
                role === 'manager' ? 'bg-[#497cff] text-white' : 
                'bg-[#e2e7ff] text-[#45464d]'
              }`}>
                {role === 'admin' ? 'ADMINISTRADOR' : role === 'manager' ? 'GERENTE' : 'OPERADOR'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">Medições de Campo</h1>
            <p className="text-[#45464d] text-sm mt-1">Registro de Dados Técnicos / Calibração</p>
            
            <div className="bg-white p-12 rounded-2xl border border-dashed border-[#c6c6cd] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#f2f3ff] rounded-full flex items-center justify-center text-[#0053db]">
                <Ruler className="w-8 h-8" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold text-[#131b2e]">Módulo de Medição</h3>
                <p className="text-sm text-[#45464d]">Este módulo permite o registro de medições em tempo real. Selecione um equipamento ou talhão para iniciar.</p>
              </div>
              <button className="px-6 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-[#00174b] transition-all">
                Iniciar Nova Medição
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-2xl bg-white/80 backdrop-blur-lg flex justify-around items-center h-20 px-6 border-t border-[#eaedff] shadow-lg">
        {allowedScreens.map((screen) => {
          const IconComponent = {
            LayoutDashboard,
            Ruler,
            Users,
            Settings
          }[screen.icon] || LayoutDashboard;

          const isActive = screen.path === '/dashboard/measurement';

          return (
            <button 
              key={screen.id}
              onClick={() => router.push(screen.path)}
              className={`flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'text-black bg-slate-100 rounded-xl px-4 py-1' 
                  : 'text-slate-400'
              } text-[10px] font-bold uppercase tracking-wider`}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              {screen.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
