'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const isLocalDemo = process.env.NODE_ENV !== 'production'
const demoEmail = 'admin@theviralfinds.my'
const demoPassword = 'admin123'
const loginNoiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E")`

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Akses ditolak. Sila semak emel dan kata laluan anda.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Ralat sistem. Sila cuba sebentar lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] overflow-hidden relative selection:bg-shopee/30">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-shopee/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-shopee-gold/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: loginNoiseDataUri }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        {/* Branding Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="inline-flex items-center justify-center p-4 mb-6 rounded-3xl bg-shopee/10 border border-shopee/20 backdrop-blur-xl shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-shopee/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img src="/logo-icon.png" alt="Logo" className="w-16 h-16 object-contain relative z-10 scale-[1.3]" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold tracking-tight text-white mb-2"
          >
            THE VIRAL FINDS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-shopee-gold" />
            Sistem Pengurusan Affiliate Pintar
          </motion.p>
        </div>

        {/* Login Form Card */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="glass-panel border-white/5 shadow-2xl overflow-visible">
              <CardContent className="pt-8 pb-8 px-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isLocalDemo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-xl border border-shopee/20 bg-shopee/10 px-4 py-3 text-xs text-left text-orange-50"
                    >
                      <p className="font-semibold tracking-wide text-shopee-gold">Demo login local</p>
                      <p className="mt-1 text-orange-100/80">
                        Emel: <span className="font-mono">{demoEmail}</span>
                      </p>
                      <p className="text-orange-100/80">
                        Kata laluan: <span className="font-mono">{demoPassword}</span>
                      </p>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Emel Admin
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder={demoEmail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 h-12 px-4 focus:ring-shopee/30 focus:border-shopee/50 transition-all rounded-xl placeholder:text-muted-foreground/30"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Kata Laluan
                      </Label>
                    </div>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isLocalDemo ? demoPassword : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 h-12 px-4 pr-12 focus:ring-shopee/30 focus:border-shopee/50 transition-all rounded-xl placeholder:text-muted-foreground/30"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="premium"
                    className="w-full h-12 text-sm font-bold tracking-wide rounded-xl shadow-[0_8px_20px_rgba(238,77,45,0.3)] hover:shadow-[0_12px_28px_rgba(238,77,45,0.4)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengesahkan...
                      </div>
                    ) : (
                      'MASUK DASHBOARD'
                    )}
                  </Button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-2 py-3 border-t border-white/5">
                   <ShieldCheck className="w-4 h-4 text-shopee-gold/80" />
                   <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Akses Admin Terhad</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-4">
             <div className="h-px bg-white/5 flex-1" />
             <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Bantuan Teknikal</span>
             <div className="h-px bg-white/5 flex-1" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            {isLocalDemo ? 'Gunakan demo login local di atas untuk preview pantas.' : (
              <>Lupa kata laluan? Hubungi <span className="text-shopee-gold hover:underline cursor-pointer">Support Team</span></>
            )}
          </p>
        </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-0 right-0 text-center"
      >
        <p className="text-[10px] text-white font-bold tracking-[0.3em] uppercase opacity-50">
          TheViralFinds &copy; {new Date().getFullYear()} PRO EDITION
        </p>
      </motion.div>
    </div>
  )
}
