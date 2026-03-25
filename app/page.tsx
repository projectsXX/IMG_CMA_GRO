'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Architecture, ErrorIcon, Person, Lock, EyeIcon, EyeOffIcon, ArrowForward } from '@/components/icons';

import { supabase, UserRole } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/dashboard');
    }
  }, [user, isAuthReady, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = username.includes('@') ? username : `${username}@cmagro.com`;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      if (data.user) {
        // Check if user exists in our public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('uid', data.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        if (!userData) {
          // If it's the admin we're creating for the first time in Supabase
          if (username === 'admin' || email === 'admin@cmagro.com') {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                uid: data.user.id,
                name: 'Administrador',
                email: 'admin@cmagro.com',
                role: 'admin' as UserRole
              });
            
            if (insertError) throw insertError;
          } else {
            // For other users, they might need to be pre-registered or we create a default profile
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                uid: data.user.id,
                name: data.user.email?.split('@')[0] || 'Usuário',
                email: data.user.email || '',
                role: 'operator' as UserRole
              });
            
            if (insertError) throw insertError;
          }
        } else if ((username === 'admin' || email === 'admin@cmagro.com') && userData.role !== 'admin') {
          // Force admin role if it's the master admin email but role is different
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' as UserRole })
            .eq('uid', data.user.id);
          
          if (updateError) throw updateError;
        }
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Falha na autenticação.';
      
      if (err.message === 'Invalid login credentials') {
        errorMessage = 'Usuário ou senha incorretos.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada.';
      } else {
        errorMessage = `Erro: ${err.message || 'Falha na autenticação'}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf8ff] font-sans text-[#131b2e] min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Visual/Editorial Branding */}
      <aside className="hidden md:flex md:w-1/2 lg:w-3/5 bg-black relative flex-col justify-end p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://raw.githubusercontent.com/projectsXX/APP_CMA_GRO/main/background.jpg"
            alt="Operational Workspace"
            fill
            className="object-cover opacity-85 brightness-110 contrast-125 saturate-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-4 max-w-xl"
        >
          <div className="flex items-center gap-3">
            <Architecture className="text-[#dbe1ff] text-4xl" />
            <h1 className="font-sans font-extrabold text-4xl tracking-tight text-white">CMA GRO</h1>
          </div>
        </motion.div>
      </aside>

      {/* Right Side: Login Form */}
      <main className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-10">
          <header className="space-y-2 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-6">
              <Architecture className="text-black text-5xl" />
            </div>
            <h2 className="font-sans font-bold text-3xl text-[#131b2e]">Bem-vindo de volta</h2>
            <p className="text-[#45464d]">Acesse sua conta para gerenciar suas rotinas Operacionais.</p>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/10"
            >
              <ErrorIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <div className="space-y-6">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#45464d]" htmlFor="username">Usuário / E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#45464d] group-focus-within:text-[#0053db] transition-colors">
                      <Person className="w-5 h-5" />
                    </div>
                    <input
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-[#c6c6cd]/15 rounded-xl text-[#131b2e] placeholder-[#76777d] focus:ring-2 focus:ring-[#0053db]/20 focus:border-[#0053db] outline-none transition-all duration-200"
                      id="username"
                      name="username"
                      placeholder="admin ou seu e-mail"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-[#45464d]" htmlFor="password">Senha</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#45464d] group-focus-within:text-[#0053db] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      className="block w-full pl-11 pr-12 py-3.5 bg-white border border-[#c6c6cd]/15 rounded-xl text-[#131b2e] placeholder-[#76777d] focus:ring-2 focus:ring-[#0053db]/20 focus:border-[#0053db] outline-none transition-all duration-200"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#45464d] hover:text-[#131b2e]"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-[#c6c6cd]/30 rounded-md bg-white peer-checked:bg-black peer-checked:border-black transition-all duration-200 flex items-center justify-center">
                      <svg 
                        className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${rememberMe ? 'opacity-100' : 'opacity-0'}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#45464d] group-hover:text-[#131b2e] transition-colors">Lembrar meu login</span>
                </label>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 px-6 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-[#00174b] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Autenticando...' : 'Entrar'}
                <ArrowForward className="w-5 h-5" />
              </button>
            </form>
          </div>

          <footer className="pt-8 text-center border-t border-[#eaedff]">
            <div className="flex justify-center gap-6">
              <button 
                onClick={() => setShowSupportModal(true)}
                className="text-xs text-[#76777d] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                Suporte
              </button>
            </div>
          </footer>
        </div>
      </main>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-[#76777d] hover:text-[#131b2e] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#eaedff] rounded-full flex items-center justify-center text-[#0053db]">
                <Architecture className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#131b2e]">Suporte Técnico</h3>
              <p className="text-[#45464d] leading-relaxed">
                Para contatar o suporte técnico ou solicitar acesso a aplicação favor enviar e-mail para:
              </p>
              <div className="p-4 bg-[#f5f7ff] rounded-xl border border-[#0053db]/10">
                <a 
                  href="mailto:nathalia.silva@vale.com" 
                  className="text-[#0053db] font-semibold break-all hover:underline"
                >
                  nathalia.silva@vale.com
                </a>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-[#00174b] transition-colors"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
