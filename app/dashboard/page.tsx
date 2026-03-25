'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Ruler, 
  Users, 
  LogOut, 
  Bell, 
  Settings, 
  Factory,
  ArrowRight
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { getAllowedScreens } from '@/lib/permissions';

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, isAuthReady, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const allowedScreens = role ? getAllowedScreens(role) : [];

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#131b2e] animate-pulse">Carregando CMA GRO...</p>
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

            const isActive = screen.path === '/dashboard';

            return (
              <Link 
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
              </Link>
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
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-black text-[#131b2e] tracking-tight">Bem-vindo ao CMA GRO</h1>
              <p className="text-[#45464d] text-lg mt-2">Sistema de Gestão Agrícola e Medições de Precisão</p>
            </motion.div>

            {/* Bento Grid Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stat 1 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-3xl border border-[#c6c6cd]/15 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#f2f3ff] rounded-2xl flex items-center justify-center text-black mb-6">
                  <Ruler className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#45464d] uppercase tracking-widest">Medições Realizadas</h3>
                <p className="text-4xl font-black mt-2">1.284</p>
                <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
                  <ArrowRight className="w-3 h-3 -rotate-45" />
                  <span>+12% este mês</span>
                </div>
              </motion.div>

              {/* Stat 2 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-3xl border border-[#c6c6cd]/15 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#f2f3ff] rounded-2xl flex items-center justify-center text-black mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#45464d] uppercase tracking-widest">Equipe Ativa</h3>
                <p className="text-4xl font-black mt-2">24</p>
                <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <span>Operadores em campo</span>
                </div>
              </motion.div>

              {/* Stat 3 - Action Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-black p-8 rounded-3xl shadow-xl text-white flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Acesso Rápido</h3>
                  <p className="text-2xl font-bold mt-2 leading-tight">Iniciar nova coleta de dados técnicos</p>
                </div>
                <button 
                  onClick={() => router.push('/dashboard/measurement')}
                  className="mt-6 w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                >
                  Ir para Medições
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-3xl border border-[#c6c6cd]/15 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#c6c6cd]/10 flex justify-between items-center">
                <h3 className="font-bold text-lg">Atividade Recente</h3>
                <button className="text-xs font-bold text-[#497cff] hover:underline">Ver tudo</button>
              </div>
              <div className="p-0">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-[#c6c6cd]/5 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Medição de Solo - Talhão {item * 4}</p>
                        <p className="text-xs text-slate-400">Realizada por Operador {item} • Há 2 horas</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">Sincronizado</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

          const isActive = screen.path === '/dashboard';

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
