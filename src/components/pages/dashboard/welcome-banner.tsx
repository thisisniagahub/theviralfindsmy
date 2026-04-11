'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Printer, TrendingUp, Calendar, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRM } from './dashboard-shared'

interface WelcomeBannerProps {
  totalEarnings: number
  todayStr: string
  onExportCSV: () => void
  onExportPDF: () => void
}

export function WelcomeBanner({ totalEarnings, todayStr, onExportCSV, onExportPDF }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="glass-panel overflow-hidden relative border-shopee/10 shadow-2xl card-shine group">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-50px] right-[-20px] w-[200px] h-[200px] bg-shopee/10 rounded-full blur-[80px] group-hover:bg-shopee/20 transition-colors duration-700" />
        <div className="absolute bottom-[-30px] left-[20%] w-[150px] h-[150px] bg-shopee-gold/5 rounded-full blur-[60px]" />

        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-shopee font-bold text-xs uppercase tracking-[0.2em]">
                    <Zap className="w-3.5 h-3.5 fill-shopee" />
                    Status: Premium Account
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    Selamat Kembali, <span className="text-gradient-shopee">Ahmad!</span> 👋
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/30 w-fit px-3 py-1 rounded-full border border-border/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {todayStr}
                  </div>
               </div>

               <div className="max-w-md p-5 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/5 shadow-inner">
                  <div className="flex items-end justify-between mb-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendapatan Bulan Ini</p>
                      <p className="text-2xl font-black text-foreground">{formatRM(totalEarnings)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                      <TrendingUp className="w-3 h-3" />
                      +14.2%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Sasaran Harian</span>
                      <span className="text-shopee">73% Dicapai</span>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden p-0.5 border border-white/20 dark:border-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-shopee via-shopee-light to-shopee-gold relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: '73.5%' }}
                        transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                         <motion.div 
                          className="absolute inset-0 bg-white/30"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                         />
                      </motion.div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="premium" className="w-full sm:w-auto h-12 px-6">
                    <Download className="w-4 h-4 mr-2" />
                    Laporan Prestasi
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel w-48 p-1">
                  <DropdownMenuItem onClick={onExportCSV} className="rounded-lg py-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExportPDF} className="rounded-lg py-2 cursor-pointer">
                    <Printer className="w-4 h-4 mr-2 text-shopee" />
                    Cetak PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" className="w-full sm:w-auto h-12 px-6 border-white/20 hover:bg-white/10 glass-panel">
                 Urus Affiliate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
