'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Sparkles,
  ShieldAlert, UserCheck, BookOpen, LogIn,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

type RoleOption = 'student' | 'faculty' | 'admin' | 'librarian';

const roleOptions: { role: RoleOption; label: string; icon: typeof GraduationCap; gradient: string; description: string }[] = [
  { role: 'student', label: 'Student', icon: GraduationCap, gradient: 'from-indigo-500 to-indigo-600', description: 'Courses, grades, fees & more' },
  { role: 'faculty', label: 'Faculty', icon: UserCheck, gradient: 'from-teal-500 to-teal-600', description: 'Teaching, grading & attendance' },
  { role: 'admin', label: 'Admin', icon: ShieldAlert, gradient: 'from-blue-600 to-blue-700', description: 'System oversight & management' },
  { role: 'librarian', label: 'Librarian', icon: BookOpen, gradient: 'from-amber-500 to-amber-600', description: 'Library & circulation' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get('role') as RoleOption | null;
    if (roleParam && roleOptions.some((r) => r.role === roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get('redirect') || '/dashboard';
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-gray-950 to-gray-950" />
        <div className="absolute top-1/3 left-1/4 h-72 w-72 animate-float rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-float rounded-full bg-blue-500/10 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-medium text-gray-400">HiSUP Portal</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25"
            >
              <GraduationCap className="h-7 w-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              {selectedRole ? `Welcome, ${roleOptions.find((r) => r.role === selectedRole)?.label}` : 'Welcome Back'}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {selectedRole
                ? `Sign in to your ${roleOptions.find((r) => r.role === selectedRole)?.label.toLowerCase()} portal`
                : 'Choose your role to get started'}
            </p>
          </motion.div>

          {/* Role Selection */}
          {!selectedRole ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3"
            >
              {roleOptions.map((role, i) => (
                <motion.button
                  key={role.role}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(role.role)}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient}`}>
                    <role.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-300" />
                </motion.button>
              ))}
              <Link
                href="/signup"
                className="mt-2 text-center text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                Don&apos;t have an account? <span className="font-medium text-indigo-400 hover:text-indigo-300">Create one</span>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Selected role indicator + back button */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => { setSelectedRole(null); setError(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Change role"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <div className={`flex items-center gap-2 rounded-lg bg-gradient-to-r ${roleOptions.find((r) => r.role === selectedRole)?.gradient} px-3 py-1.5`}>
                  {(() => {
                    const r = roleOptions.find((opt) => opt.role === selectedRole);
                    const Icon = r?.icon ?? GraduationCap;
                    return <Icon className="h-3.5 w-3.5 text-white" />;
                  })()}
                  <span className="text-xs font-medium text-white capitalize">{selectedRole}</span>
                </div>
              </div>

              {searchParams.get('error') === 'invalid_role' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
                  <Alert variant="warning" message="Your account has no assigned role. Contact the administrator." />
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
                  <Alert variant="error" message={error} onClose={() => setError(null)} />
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>

        {selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                Create one
              </Link>
            </p>
          </motion.div>
        )}


      </motion.div>
    </div>
  );
}
