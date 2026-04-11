'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  MousePointerClick,
  ShoppingCart,
  Percent,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Rocket,
  Crown,
  BarChart3,
  CircleDollarSign,
  ArrowUpRight,
  Info,
  Repeat,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
// import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// ─── Format number helper ───────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Calculation Engine ─────────────────────────────────────
interface CalcInputs {
  price: number
  commissionRate: number
  clicks: number
  conversionRate: number
}

interface CalcResults {
  commissionPerSale: number
  monthlySales: number
  monthlyEarnings: number
  annualEarnings: number
  dailyEarnings: number
}

function calculate(inputs: CalcInputs): CalcResults {
  const commissionPerSale = (inputs.price * inputs.commissionRate) / 100
  const monthlySales = Math.floor((inputs.clicks * inputs.conversionRate) / 100)
  const monthlyEarnings = commissionPerSale * monthlySales
  const annualEarnings = monthlyEarnings * 12
  const dailyEarnings = monthlyEarnings / 30
  return { commissionPerSale, monthlySales, monthlyEarnings, annualEarnings, dailyEarnings }
}

function getMotivation(earnings: number): { icon: React.ComponentType<{ className?: string }>; message: string; color: string } {
  if (earnings >= 10000) return { icon: Crown, message: 'You\'re a top earner! Scaling up further could make this a full-time income.', color: 'text-yellow-500' }
  if (earnings >= 3000) return { icon: Rocket, message: 'Excellent potential! Consistent effort here can build real wealth.', color: 'text-shopee' }
  if (earnings >= 1000) return { icon: TrendingUp, message: 'Great start! Focus on higher-converting products to boost earnings.', color: 'text-green-500' }
  if (earnings >= 200) return { icon: Zap, message: 'You\'re building momentum! Try increasing your click volume.', color: 'text-blue-500' }
  return { icon: Target, message: 'Every journey starts here! Optimize your links and watch it grow.', color: 'text-muted-foreground' }
}

const TIER_CLICKS = [500, 1000, 2500, 5000, 10000]

interface ScenarioInputs {
  price: number
  commissionRate: number
  clicks: number
  conversionRate: number
}

const defaultScenario: ScenarioInputs = {
  price: 50,
  commissionRate: 5,
  clicks: 1000,
  conversionRate: 3,
}

// ─── Main Component ─────────────────────────────────────────
export function CalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>({
    price: 50,
    commissionRate: 5,
    clicks: 1000,
    conversionRate: 3,
  })

  const [scenarioA, setScenarioA] = useState<ScenarioInputs>(defaultScenario)
  const [scenarioB, setScenarioB] = useState<ScenarioInputs>({
    ...defaultScenario,
    commissionRate: 8,
    clicks: 3000,
    conversionRate: 5,
  })

  const results = useMemo(() => calculate(inputs), [inputs])
  const motivation = useMemo(() => getMotivation(results.monthlyEarnings), [results.monthlyEarnings])

  const tiers = useMemo(
    () =>
      TIER_CLICKS.map((clicks) => {
        const r = calculate({ ...inputs, clicks })
        return { clicks, ...r }
      }),
    [inputs],
  )

  const resultsA = useMemo(() => calculate(scenarioA), [scenarioA])
  const resultsB = useMemo(() => calculate(scenarioB), [scenarioB])

  const updateInput = (key: keyof CalcInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const updateScenario = (scenario: 'a' | 'b', key: keyof ScenarioInputs, value: number) => {
    const setter = scenario === 'a' ? setScenarioA : setScenarioB
    setter((prev) => ({ ...prev, [key]: value }))
  }

  const MotivationIcon = motivation.icon

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-shopee" />
            Commission Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estimate your potential affiliate earnings with real-time calculations
          </p>
        </div>
        <Badge className="badge-gradient px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Live Preview
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left Column: Inputs ─────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="glass-card card-accent">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-shopee" />
                Calculator Inputs
              </CardTitle>
              <CardDescription>Adjust the values to see real-time results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Product Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-shopee" />
                  Product Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    RM
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={inputs.price}
                    onChange={(e) => updateInput('price', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-shopee" />
                  Commission Rate
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[inputs.commissionRate]}
                    onValueChange={([v]) => updateInput('commissionRate', v)}
                    min={1}
                    max={15}
                    step={0.5}
                    className="flex-1 shopee-slider"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    step={0.5}
                    value={inputs.commissionRate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) updateInput('commissionRate', Math.min(15, Math.max(1, v)))
                    }}
                    className="w-20 text-center"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground px-0.5">
                  <span>1%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Monthly Clicks */}
              <div className="space-y-2">
                <Label htmlFor="clicks" className="text-sm font-medium flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-shopee" />
                  Estimated Monthly Clicks
                </Label>
                <Input
                  id="clicks"
                  type="number"
                  min={0}
                  step={100}
                  value={inputs.clicks}
                  onChange={(e) => updateInput('clicks', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              {/* Conversion Rate */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-shopee" />
                  Conversion Rate
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[inputs.conversionRate]}
                    onValueChange={([v]) => updateInput('conversionRate', v)}
                    min={0.5}
                    max={10}
                    step={0.5}
                    className="flex-1 shopee-slider"
                  />
                  <Input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={inputs.conversionRate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) updateInput('conversionRate', Math.min(10, Math.max(0.5, v)))
                    }}
                    className="w-20 text-center"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground px-0.5">
                  <span>0.5%</span>
                  <span>10%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Columns: Results ──────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Main Result Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={results.monthlyEarnings}
              initial={{ opacity: 0.8, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-accent overflow-hidden">
                {/* Gradient top accent */}
                <div className="h-1.5 bg-gradient-to-r from-shopee via-shopee-light to-yellow-400" />
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <CircleDollarSign className="w-5 h-5 text-shopee" />
                    <span className="text-sm font-semibold text-foreground">Estimated Monthly Earnings</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2 mb-4">
                    <span className="text-4xl lg:text-5xl font-bold text-shopee">
                      RM {fmt(results.monthlyEarnings)}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      per month
                    </motion.span>
                  </div>

                  {/* Metric Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <MetricCard
                      icon={DollarSign}
                      label="Per Sale"
                      value={`RM ${fmt(results.commissionPerSale)}`}
                      color="text-shopee"
                    />
                    <MetricCard
                      icon={ShoppingCart}
                      label="Monthly Sales"
                      value={results.monthlySales.toLocaleString()}
                      color="text-green-500"
                    />
                    <MetricCard
                      icon={Calendar}
                      label="Annual"
                      value={`RM ${fmt(results.annualEarnings)}`}
                      color="text-blue-500"
                    />
                    <MetricCard
                      icon={TrendingUp}
                      label="Daily"
                      value={`RM ${fmt(results.dailyEarnings)}`}
                      color="text-purple-500"
                    />
                  </div>

                  {/* Motivational message */}
                  <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-shopee/5 dark:bg-shopee/10">
                    <MotivationIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${motivation.color}`} />
                    <p className="text-sm text-muted-foreground leading-relaxed">{motivation.message}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Tabs: Tiered Breakdown + Scenario Comparison */}
          <Tabs defaultValue="tiers" className="w-full">
            <TabsList>
              <TabsTrigger value="tiers" className="gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Earnings Tiers
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5">
                <Repeat className="w-3.5 h-3.5" />
                Scenario Compare
              </TabsTrigger>
            </TabsList>

            {/* ─── Tiered Breakdown ─────────────── */}
            <TabsContent value="tiers">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-shopee" />
                    Earnings at Different Click Volumes
                  </CardTitle>
                  <CardDescription>
                    See how your earnings scale with traffic — same commission rate & conversion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {tiers.map((tier, idx) => {
                      const maxEarnings = Math.max(...tiers.map((t) => t.monthlyEarnings), 1)
                      const widthPct = (tier.monthlyEarnings / maxEarnings) * 100
                      const isBase = tier.clicks === inputs.clicks
                      return (
                        <motion.div
                          key={tier.clicks}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isBase
                              ? 'bg-shopee/8 dark:bg-shopee/15 border border-shopee/20'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-20 flex-shrink-0">
                            <span className="text-sm font-semibold text-foreground">
                              {tier.clicks.toLocaleString()}
                            </span>
                            <p className="text-[11px] text-muted-foreground">clicks/mo</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-shopee to-shopee-light"
                                initial={{ width: 0 }}
                                animate={{ width: `${widthPct}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.05 }}
                              />
                            </div>
                          </div>
                          <div className="w-28 text-right flex-shrink-0">
                            <span className="text-sm font-bold text-shopee">
                              RM {fmt(tier.monthlyEarnings)}
                            </span>
                            <p className="text-[11px] text-muted-foreground">
                              {tier.monthlySales} sales
                            </p>
                          </div>
                          {isBase && (
                            <Badge className="badge-gradient text-[10px] px-1.5 py-0 flex-shrink-0">
                              Current
                            </Badge>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Scenario Comparison ───────────── */}
            <TabsContent value="compare">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scenario A */}
                <Card className="glass-card card-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Badge variant="outline" className="text-shopee border-shopee/30 text-xs font-bold">
                        A
                      </Badge>
                      Scenario A
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScenarioField
                      label="Price (RM)"
                      value={scenarioA.price}
                      onChange={(v) => updateScenario('a', 'price', v)}
                      step={1}
                    />
                    <ScenarioSlider
                      label="Commission %"
                      value={scenarioA.commissionRate}
                      onChange={(v) => updateScenario('a', 'commissionRate', v)}
                      min={1}
                      max={15}
                    />
                    <ScenarioField
                      label="Clicks"
                      value={scenarioA.clicks}
                      onChange={(v) => updateScenario('a', 'clicks', v)}
                      step={100}
                    />
                    <ScenarioSlider
                      label="Conversion %"
                      value={scenarioA.conversionRate}
                      onChange={(v) => updateScenario('a', 'conversionRate', v)}
                      min={0.5}
                      max={10}
                    />
                    <Separator />
                    <div className="text-center space-y-1">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Monthly Earnings
                      </p>
                      <p className="text-2xl font-bold text-shopee">RM {fmt(resultsA.monthlyEarnings)}</p>
                      <p className="text-xs text-muted-foreground">{resultsA.monthlySales} sales &middot; RM {fmt(resultsA.annualEarnings)}/year</p>
                    </div>
                  </CardContent>
                </Card>

                {/* VS Divider (visible on md+) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />

                {/* Scenario B */}
                <Card className="glass-card card-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-xs font-bold">
                        B
                      </Badge>
                      Scenario B
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScenarioField
                      label="Price (RM)"
                      value={scenarioB.price}
                      onChange={(v) => updateScenario('b', 'price', v)}
                      step={1}
                    />
                    <ScenarioSlider
                      label="Commission %"
                      value={scenarioB.commissionRate}
                      onChange={(v) => updateScenario('b', 'commissionRate', v)}
                      min={1}
                      max={15}
                    />
                    <ScenarioField
                      label="Clicks"
                      value={scenarioB.clicks}
                      onChange={(v) => updateScenario('b', 'clicks', v)}
                      step={100}
                    />
                    <ScenarioSlider
                      label="Conversion %"
                      value={scenarioB.conversionRate}
                      onChange={(v) => updateScenario('b', 'conversionRate', v)}
                      min={0.5}
                      max={10}
                    />
                    <Separator />
                    <div className="text-center space-y-1">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Monthly Earnings
                      </p>
                      <p className="text-2xl font-bold text-blue-500">RM {fmt(resultsB.monthlyEarnings)}</p>
                      <p className="text-xs text-muted-foreground">{resultsB.monthlySales} sales &middot; RM {fmt(resultsB.annualEarnings)}/year</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Result */}
              <Card className="mt-4 glass-card">
                <CardContent className="p-4">
                  <ComparisonSummary resultsA={resultsA} resultsB={resultsB} scenarioA={scenarioA} scenarioB={scenarioB} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// ─── Metric Card ────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 dark:bg-muted/30 stat-card-lift">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

// ─── Scenario Field ─────────────────────────────────────────
function ScenarioField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="w-28 h-8 text-sm text-right"
      />
    </div>
  )
}

// ─── Scenario Slider ────────────────────────────────────────
function ScenarioSlider({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={0.5}
        className="shopee-slider"
      />
    </div>
  )
}

// ─── Comparison Summary ─────────────────────────────────────
function ComparisonSummary({
  resultsA,
  resultsB,
  scenarioA: _scenarioA,
  scenarioB: _scenarioB,
}: {
  resultsA: CalcResults
  resultsB: CalcResults
  scenarioA: ScenarioInputs
  scenarioB: ScenarioInputs
}) {
  const diff = resultsB.monthlyEarnings - resultsA.monthlyEarnings
  const diffPct = resultsA.monthlyEarnings > 0 ? ((diff / resultsA.monthlyEarnings) * 100).toFixed(1) : '—'
  const isPositive = diff >= 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Info className="w-4 h-4 text-muted-foreground" />
          Comparison Summary
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {/* Monthly Diff */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Monthly Diff</p>
          <p className={`text-lg font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}RM {fmt(diff)}
          </p>
        </div>
        {/* Annual Diff */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Annual Diff</p>
          <p className={`text-lg font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}RM {fmt(diff * 12)}
          </p>
        </div>
        {/* % Change */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Change</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <p className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {diffPct === '—' ? '—' : `${isPositive ? '+' : ''}${diffPct}%`}
            </p>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowRight className="w-4 h-4 text-red-500 rotate-90" />
            )}
          </div>
        </div>
      </div>
      {diff !== 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Scenario B earns{' '}
          <span className={isPositive ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
            {isPositive ? 'more' : 'less'}
          </span>{' '}
          per month than Scenario A
        </p>
      )}
    </div>
  )
}
