'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  UserPlus,
  Edit2,
  Trash2,
  Factory,
  ArrowRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

import { supabase, UserRole } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { SCREENS, getAllowedScreens, canAccessScreen } from '@/lib/permissions';

export default function UsersPage() {
  const router = useRouter();
  const { user, role, isAuthReady, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Estado do formulário de novo usuário (campos exatos da tabela)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isAuthReady && !user) {
      router.push('/');
    }
  }, [user, isAuthReady, router]);

  // Verificar permissões
  useEffect(() => {
    if (isAuthReady && user && role) {
      if (!canAccessScreen(role, '/dashboard/users')) {
        router.push('/dashboard'); // Ou uma página de "não autorizado"
      }
    }
  }, [isAuthReady, user, role, router]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const fetchUsers = async () => {
      try {
        setFetchError(null);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        console.error('Erro ao buscar usuários:', err);
        setFetchError(err.message || 'Erro ao carregar dados do Supabase.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Inscrever-se para mudanças em tempo real
    const subscription = supabase
      .channel('users_changes_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthReady, user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormMessage(null);

    try {
      if (editingUser) {
        // Atualização de usuário existente
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: name,
            email: email,
            password: password,
            role: newRole
          })
          .eq('id', editingUser.id);

        if (updateError) {
          console.error('Erro do Supabase ao atualizar:', updateError);
          throw new Error(updateError.message || 'Erro ao atualizar dados na tabela.');
        }

        setFormMessage({ type: 'success', text: 'Usuário atualizado com sucesso!' });
        setEditingUser(null);
      } else {
        // Inserção direta na tabela 'users'
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            uid: crypto.randomUUID(), // UID sempre gerado automaticamente para evitar erro de formato
            name: name,
            email: email,
            password: password,
            role: newRole
          });

        if (insertError) {
          console.error('Erro do Supabase ao inserir:', insertError);
          const detailedError = insertError.details || insertError.hint || insertError.message;
          throw new Error(detailedError);
        }

        setFormMessage({ type: 'success', text: 'Usuário registrado na tabela com sucesso!' });
      }

      setName('');
      setEmail('');
      setPassword('');
      setNewRole('operator');
    } catch (err: any) {
      console.error('Erro na operação de usuário:', err);
      setFormMessage({ type: 'error', text: err.message || 'Erro ao processar usuário.' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword(u.password || '');
    setNewRole(u.role || 'operator');
    setFormMessage(null);
    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setNewRole('operator');
    setFormMessage(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      // O real-time cuidará de remover da lista
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      alert('Erro ao deletar usuário: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const allowedScreens = role ? getAllowedScreens(role) : [];

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffInMinutes < 5; // Considera online se visto nos últimos 5 minutos
  };

  if (!isAuthReady || loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#131b2e] animate-pulse">Carregando Usuários...</p>
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

            const isActive = screen.path === '/dashboard/users';

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
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold tracking-tight text-slate-900">CMA GRO</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-[#f2f3ff] px-3 py-1.5 rounded-full border border-[#c6c6cd]/10">
              <Search className="w-4 h-4 text-[#76777d]" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-[#76777d]" 
                placeholder="Buscar usuários..." 
                type="text" 
              />
            </div>
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
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">Gestão de Usuários</h1>
              <p className="text-[#45464d] text-sm mt-1">Painel Administrativo / Configuração</p>
            </motion.div>

            {/* Bento Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total de Usuários', value: users.length.toString() },
                { label: 'Ativos Agora', value: users.filter(u => isOnline(u.last_seen_at)).length.toString(), highlight: true },
                { label: 'Administradores', value: users.filter(u => u.role === 'admin').length.toString() }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-5 rounded-xl border border-[#c6c6cd]/15 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#45464d]">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.highlight ? 'text-[#497cff]' : ''}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#c6c6cd]/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f3ff]">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d]">Nome Completo</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d]">E-mail</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d]">Perfil</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d]">Criação</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d]">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#45464d] text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff]">
                    {fetchError ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-red-500">
                            <AlertCircle className="w-8 h-8" />
                            <p className="font-bold">{fetchError}</p>
                            <button 
                              onClick={() => window.location.reload()}
                              className="mt-2 text-xs underline hover:text-red-700"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#76777d]">
                          Nenhum usuário encontrado no banco de dados.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#f2f3ff] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#d5e3fc] flex items-center justify-center text-[#57657a] font-bold text-xs">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                              <span className="font-semibold text-[#131b2e]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#45464d]">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === 'admin' ? 'bg-black text-white' : 
                              u.role === 'manager' ? 'bg-[#497cff] text-white' :
                              'bg-[#e2e7ff] text-[#45464d]'
                            }`}>
                              {(u.role === 'admin' ? 'ADMINISTRADOR' : u.role === 'manager' ? 'GERENTE' : 'OPERADOR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#45464d]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isOnline(u.last_seen_at) ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                              <span className={`text-xs font-bold ${isOnline(u.last_seen_at) ? 'text-green-600' : 'text-slate-400'}`}>
                                {isOnline(u.last_seen_at) ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditClick(u)}
                                className="p-2 bg-white border border-[#c6c6cd]/20 hover:bg-[#e2e7ff] rounded-lg transition-all shadow-sm"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-[#45464d]" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 bg-white border border-[#c6c6cd]/20 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side: Sidebar Registration Form */}
          <div className="w-full lg:w-96">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-2xl shadow-xl border border-[#c6c6cd]/15 sticky top-24"
            >
              <h2 className="text-xl font-bold text-[#131b2e] mb-6 flex items-center gap-2">
                {editingUser ? <Edit2 className="w-6 h-6 text-black" /> : <UserPlus className="w-6 h-6 text-black" />}
                {editingUser ? 'Editar Usuário' : 'Cadastro de Novo Usuário'}
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-5">
                {formMessage && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {formMessage.text}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider ml-1">Nome (name)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg bg-[#f2f3ff] border-none ring-1 ring-[#c6c6cd]/20 focus:ring-2 focus:ring-[#0053db] focus:bg-white transition-all placeholder:text-[#76777d]/50" 
                    placeholder="ex: João Silva" 
                    required 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider ml-1">E-mail (email)</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg bg-[#f2f3ff] border-none ring-1 ring-[#c6c6cd]/20 focus:ring-2 focus:ring-[#0053db] focus:bg-white transition-all placeholder:text-[#76777d]/50" 
                    placeholder="joao@exemplo.com" 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider ml-1">Senha</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg bg-[#f2f3ff] border-none ring-1 ring-[#c6c6cd]/20 focus:ring-2 focus:ring-[#0053db] focus:bg-white transition-all placeholder:text-[#76777d]/50" 
                    placeholder="Digite a senha" 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider ml-1">Papel (role)</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg bg-[#f2f3ff] border-none ring-1 ring-[#c6c6cd]/20 focus:ring-2 focus:ring-[#0053db] focus:bg-white transition-all appearance-none cursor-pointer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="operator">OPERADOR</option>
                    <option value="manager">GERENTE</option>
                    <option value="admin">ADMINISTRADOR</option>
                  </select>
                </div>
                <div className="pt-4 space-y-3">
                  <button 
                    disabled={creating}
                    className="w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50" 
                    type="submit"
                  >
                    {creating ? (editingUser ? 'Atualizando...' : 'Registrando...') : (editingUser ? 'Atualizar Usuário' : 'Registrar na Tabela')}
                    {!creating && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                  {editingUser && (
                    <button 
                      type="button"
                      onClick={cancelEdit}
                      className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </form>
              <div className="mt-8 p-4 bg-[#f2f3ff] rounded-xl border border-dashed border-[#c6c6cd]">
                <p className="text-xs text-[#45464d] leading-relaxed">
                  <span className="font-bold text-[#131b2e]">Nota:</span> Contas de administrador têm acesso total às calibrações do sistema e gestão de usuários. Garanta nomes de usuário únicos para todos os cadastros.
                </p>
              </div>
            </motion.div>
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

          const isActive = screen.path === '/dashboard/users';

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
