// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { ShieldCheck, Loader2, AlertCircle, Moon, Sun } from 'lucide-react';
// import { useTheme } from '@/components/theme-provider';

// export default function LoginPage() {
//   const router = useRouter();
//   const { theme, toggleTheme } = useTheme();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   async function handleLogin(e) {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         setError(data.error || 'Login failed');
//         setLoading(false);
//         return;
//       }

//       localStorage.setItem('token', data.token);
//       router.push('/dashboard');
//     } catch (err) {
//       setError('Cannot connect to server');
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background px-4">
//       <div className="absolute top-4 right-4">
//         <button
//           onClick={toggleTheme}
//           className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
//           title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
//         >
//           {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
//         </button>
//       </div>
//       <div className="bg-card rounded-2xl shadow-lg border w-full max-w-sm p-8">
//         <div className="flex flex-col items-center mb-8">
//           <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-4">
//             <ShieldCheck size={24} />
//           </div>
//           <h1 className="text-xl font-bold">Finify Match</h1>
//           <p className="text-sm text-muted-foreground mt-1">Three-Way Match Engine</p>
//         </div>

//         <form onSubmit={handleLogin} className="space-y-4">
//           <div>
//             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-background"
//               placeholder="admin@example.com"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-background"
//               placeholder="admin123"
//               required
//             />
//           </div>

//           {error && (
//             <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 p-3 rounded-lg">
//               <AlertCircle size={16} className="shrink-0" />
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
//           >
//             {loading && <Loader2 size={16} className="animate-spin" />}
//             {loading ? 'Logging in...' : 'Login'}
//           </button>
//         </form>

//         <p className="text-xs text-muted-foreground mt-6 text-center">
//           Use: admin@example.com / admin123
//         </p>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Loader2, AlertCircle, Moon, Sun, Eye, EyeOff,
  CheckCircle2, Mail, Lock, Sparkles, ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError('Cannot connect to server');
      setLoading(false);
    }
  }

  const features = [
    'Automated three-way invoice matching',
    'Audit-ready reconciliation trail',
    'Real-time exception detection',
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(24px, -30px) scale(1.08); }
          66% { transform: translate(-18px, 18px) scale(0.95); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-in { animation: fade-in 0.4s ease-out both; }
        .animate-shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .animate-blob { animation: blob 9s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 16s linear infinite; }
        .animate-pulse-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* ── Left: brand panel ─────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary-600/40 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-10 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-primary-700/30 blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <ShieldCheck size={20} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Finify Match</span>
        </div>

        <div className="relative z-10 max-w-md animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Reconciliation, without the spreadsheet chaos.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Match purchase orders, receipts, and invoices automatically —
            catch exceptions before they reach the ledger.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((f, i) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-sm text-zinc-300 animate-fade-in-up"
                style={{ animationDelay: `${140 + i * 70}ms` }}
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-zinc-600 animate-fade-in" style={{ animationDelay: '300ms' }}>
          © {new Date().getFullYear()} Finify. All rights reserved.
        </p>
      </div>

      {/* ── Right: form panel (richer variant) ───────────────────── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        {/* ambient background, right side only */}
        <div
          className="absolute inset-0 dark:opacity-40 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.12), transparent), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(99,102,241,0.10), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            color: 'rgb(148 163 184)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />

        {/* decorative floating rings */}
        <div className="absolute right-[12%] top-[18%] hidden xl:block animate-float-slow">
          <div className="h-14 w-14 rounded-2xl border border-primary-500/20 bg-primary-500/5 backdrop-blur-sm" />
        </div>
        <div className="absolute right-[20%] bottom-[20%] hidden xl:block animate-float-slow animation-delay-1000">
          <div className="h-9 w-9 rounded-full border border-indigo-400/20 bg-indigo-400/5 backdrop-blur-sm" />
        </div>
        <div className="absolute left-[10%] top-[26%] hidden xl:block animate-spin-slow">
          <Sparkles size={18} className="text-primary-400/30" />
        </div>

        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
          {/* mobile-only brand mark */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-bold">Finify Match</h1>
            <p className="mt-1 text-sm text-muted-foreground">Three-Way Match Engine</p>
          </div>

          <div className="relative rounded-[28px] bg-gradient-to-b from-primary-500/40 via-primary-500/10 to-transparent p-[1px]">
            <div className="rounded-[27px] bg-card border border-border/60 shadow-2xl shadow-black/[0.06] dark:shadow-black/40 p-8 sm:p-9">
              {/* eyebrow badge */}
              <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 px-3 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-400 mb-5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 animate-pulse-dot" />
                </span>
                Secure sign in
              </div>

              <div className="mb-7 hidden lg:block">
                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Sign in to continue to your workspace
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="group">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 transition-colors group-focus-within:text-primary-600">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary-500"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-background"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted-foreground transition-colors group-focus-within:text-primary-600">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary-500"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-background"
                      placeholder="admin123"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 p-3 rounded-xl animate-shake">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-muted-foreground mt-6 text-center">
                Use: admin@example.com / admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}