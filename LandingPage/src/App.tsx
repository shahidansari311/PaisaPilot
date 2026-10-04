import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Menu, X, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Phone, HomeScreen, TripScreen, screens } from './AppScreens'
import {
  Download, WifiOff, MessageSquareText, Users, Home, HandCoins, FileDown,
  CalendarDays, ShieldCheck, Zap, Star, ArrowUpRight, Plus, Minus, Check, Smartphone,
} from 'lucide-react'

function Github({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z"/></svg>
}

const REPO = 'https://github.com/shahidansari311/PaisaPilot'
const DOWNLOAD = `${REPO}/releases/latest`
const ext = { target: '_blank', rel: 'noreferrer' }

function DownloadBtn({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <a href={DOWNLOAD} {...ext}
      className={`group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-mint to-emerald font-bold text-white shadow-[0_10px_40px_-10px] shadow-emerald/70 transition hover:-translate-y-0.5 hover:shadow-emerald ${size === 'lg' ? 'px-6 py-4' : 'px-4 py-2.5 text-sm'}`}>
      <Download className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2.5} />
      {size === 'lg' ? (
        <span className="text-left leading-tight">
          <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-70">Free · Android APK</span>
          Download from GitHub
        </span>
      ) : 'Download APK'}
    </a>
  )
}

const bento = [
  { icon: MessageSquareText, t: 'SMS parser', d: 'Paste a bank SMS. Amount, merchant and date — logged in one tap.', span: 'md:col-span-2', demo: true },
  { icon: WifiOff, t: 'Offline-first', d: 'SQLite on-device. Works in the metro, the hostel basement, anywhere.' },
  { icon: Users, t: 'Live split groups', d: 'Trip bills split in realtime with Supabase sync.' },
  { icon: Home, t: 'Roommate ledger', d: 'Rent, Wi-Fi, groceries — one running tab for the flat.' },
  { icon: HandCoins, t: 'Borrow & lend', d: 'Who owes whom, with one-tap WhatsApp nudges.' },
  { icon: CalendarDays, t: 'Your month, your dates', d: 'Salaried? Start your budget month on payday — the 1st, 7th or 25th. Every report follows your cycle.', span: 'md:col-span-2', salary: true },
  { icon: FileDown, t: 'PDF · CSV · Excel', d: 'Clean reports, ready to share or analyse.', span: 'md:col-span-2' },
  { icon: Zap, t: 'Calendar view', d: 'Spot the days your wallet bleeds.' },
]

const faqs = [
  ['Why is it not on the Play Store?', "PaisaPilot is in open beta. Until the Play Store listing goes live, every build is published on GitHub Releases — same app, straight from the source."],
  ['How do I install the APK?', 'Open the download link on your Android phone, tap the .apk file, and allow "Install unknown apps" for your browser when prompted. Takes under a minute.'],
  ['Is it safe to install from GitHub?', 'Yes. The entire source code is public, so anyone can audit exactly what the app does. Builds are produced with Expo EAS.'],
  ['Where is my data stored?', 'Personal transactions and budgets stay on your phone. Only Shared Rooms and Live Split Groups sync to the cloud so friends can see them.'],
  ['I get paid on the 25th. Will budgets still work?', 'Yes. Set your month to start on any date — your salary day — and budgets, limits and reports all follow that custom cycle instead of the calendar month.'],
  ['Does it support dark mode?', 'Fully — it follows your system Light / Dark setting automatically.'],
]

export default function App() {
  const [open, setOpen] = useState(0)
  const [menu, setMenu] = useState(false)
  const [shot, setShot] = useState(0)
  const [light, setLight] = useState(() =>
    typeof window !== 'undefined' && (localStorage.getItem('pp-theme') ?? 'light') === 'light')
  const rail = useRef<HTMLDivElement>(null)
  const go = (i: number) => {
    const el = rail.current?.children[i] as HTMLElement | undefined
    if (el && rail.current) rail.current.scrollTo({ left: el.offsetLeft - (rail.current.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }
  const raf = useRef(0)
  const paint = () => {
    const r = rail.current
    if (!r) return
    const mid = r.scrollLeft + r.clientWidth / 2
    let best = 0, bestD = Infinity
    Array.from(r.children).forEach((c, i) => {
      const el = c as HTMLElement
      const d = (el.offsetLeft + el.offsetWidth / 2 - mid) / (el.offsetWidth + 32)
      const a = Math.min(Math.abs(d), 2)
      el.style.transform = `perspective(1400px) translateZ(${-a * 60}px) rotateY(${Math.max(-2, Math.min(2, d)) * -14}deg) scale(${1 - a * 0.08})`
      el.style.opacity = String(1 - a * 0.3)
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i }
    })
    setShot((p) => (p === best ? p : best))
  }
  const onRail = () => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(paint)
  }
  useEffect(() => {
    paint()
    window.addEventListener('resize', onRail)
    return () => window.removeEventListener('resize', onRail)
  }, [])
  const drag = useRef<{ x: number; left: number } | null>(null)
  const moved = useRef(false)
  useEffect(() => {
    document.documentElement.classList.toggle('light', light)
    localStorage.setItem('pp-theme', light ? 'light' : 'dark')
  }, [light])
  return (
    <div className="min-h-screen overflow-x-hidden bg-night font-sans text-ink antialiased selection:bg-mint/30">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-night/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <a href="#" className="flex items-center gap-2.5">
            <img src="/icon.png" alt="PaisaPilot" className="h-9 w-9 rounded-xl" />
            <span className="font-display text-lg font-bold">Paisa<span className="text-mint">Pilot</span></span>
          </a>
          <div className="hidden gap-8 text-sm text-fog md:flex">
            {['Features', 'Screens', 'Install', 'FAQ'].map((l) => <a key={l} href={`#${l.toLowerCase()}`} className="transition hover:text-ink">{l}</a>)}
          </div>
          <div className="flex items-center gap-2">
            <a href={REPO} {...ext} className="hidden items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm font-semibold transition hover:border-mint/50 sm:flex"><Github className="h-4 w-4" />Star</a>
            <button onClick={() => setLight(!light)} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-xl border border-line transition hover:border-mint/50">
              {light ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px] text-gold" />}
            </button>
            <span className="hidden sm:block"><DownloadBtn size="sm" /></span>
            <button onClick={() => setMenu(!menu)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-xl border border-line md:hidden">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="border-t border-line/60 px-6 pb-6 pt-2 md:hidden">
            {['Features', 'Screens', 'Install', 'FAQ'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenu(false)} className="block border-b border-line py-4 font-display text-lg font-semibold">{l}</a>
            ))}
            <div className="mt-5 flex flex-col gap-3"><DownloadBtn /><a href={REPO} {...ext} className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3.5 font-semibold"><Github className="h-5 w-5" />Star on GitHub</a></div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <header className="relative pt-24 md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_30%,rgba(168,85,247,.25),transparent),radial-gradient(40%_40%_at_10%_10%,rgba(16,185,129,.10),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--t-ink)_5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--t-ink)_5%,transparent)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-16 sm:px-6 md:pb-24 lg:gap-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <a href={DOWNLOAD} {...ext} className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 py-1 pl-1 pr-3 text-xs font-semibold text-mint">
              <span className="rounded-full bg-mint px-2 py-0.5 text-white">NEW</span> v1.0 beta is live on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              Track. Plan.<br />
              <span className="bg-gradient-to-r from-[#c084fc] via-mint to-emerald bg-clip-text text-transparent">Grow every ₹.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-fog sm:text-lg">
              The offline-first money app for students and salaried pros — start your month on payday, not the 1st. Budgets, bill splits, roommate tabs and IOUs — without a single ad.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <DownloadBtn />
              <a href={REPO} {...ext} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line px-5 py-4 font-semibold transition hover:border-ink/30 hover:bg-ink/5">
                <Github className="h-5 w-5" /> View source
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
              {['No Play Store needed', 'Open source', 'Works offline'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-mint" />{t}</span>
              ))}
            </div>
          </div>

          <div className="relative h-[480px] min-w-0 sm:h-[640px]">
            <div className="absolute left-1/2 top-0 h-[640px] w-[480px] -translate-x-1/2 origin-top scale-[.7] sm:scale-100">
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/20" />
              <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line" />
              <div className="absolute right-0 top-20 z-0 rotate-6 scale-[.86] opacity-90"><Phone><TripScreen /></Phone></div>
              <div className="absolute left-4 top-2 z-10 -rotate-3"><div className="animate-float"><Phone tab={0}><HomeScreen /></Phone></div></div>
              <div className="absolute bottom-10 left-0 z-20 sm:-left-10 sm:bottom-16 flex items-center gap-3 rounded-2xl border border-line bg-panel/95 p-3 pr-5 shadow-2xl backdrop-blur">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 font-bold text-gold">₹</span>
                <div><p className="text-xs text-fog">Saved this month</p><p className="font-display font-bold text-success">+ ₹4,350</p></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Marquee */}
      <div className="relative border-y border-line/60 bg-navy py-5">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-lg font-semibold text-fog/70">
          {Array(2).fill(['Budgets', 'Salary-date cycles', 'SMS parsing', 'Live splits', 'Roommate ledger', 'WhatsApp reminders', 'PDF reports', 'Dark mode', 'Offline sync', 'Calendar view']).flat().map((t, i) => (
            <span key={i} className="flex items-center gap-12">{t}<Star className="h-4 w-4 fill-gold text-gold" /></span>
          ))}
        </div>
      </div>

      {/* Bento features */}
      <section id="features" className="mx-auto max-w-6xl px-5 sm:px-6 py-20 md:py-28">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-mint">Features</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl font-extrabold tracking-tight md:text-5xl">One app for your wallet, your trips and your flatmates.</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-14 md:grid-cols-4">
          {bento.map(({ icon: Icon, t, d, span, demo, salary }: { icon: typeof Zap; t: string; d: string; span?: string; demo?: boolean; salary?: boolean }) => (
            <div key={t} className={`group relative overflow-hidden rounded-2xl border border-line bg-panel/60 p-4 transition hover:border-mint/40 sm:rounded-3xl sm:p-7 ${span ? `col-span-2 ${span}` : ''}`}>
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-mint/0 blur-2xl transition group-hover:bg-mint/20" />
              <Icon className="h-5 w-5 text-mint sm:h-6 sm:w-6" />
              <h3 className="mt-3 font-display text-base font-bold sm:mt-5 sm:text-xl">{t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-fog sm:mt-2 sm:text-sm">{d}</p>
              {salary && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                    {Array.from({ length: 14 }, (_, k) => 19 + k).map((n) => {
                      const d = n > 31 ? n - 31 : n
                      return <span key={n} className={`grid h-7 w-7 place-items-center rounded-lg ${d === 25 ? 'bg-mint font-bold text-white' : d > 25 || n > 31 ? 'bg-mint/10 text-ink' : 'text-fog'}`}>{d}</span>
                    })}
                  </div>
                  <div className="rounded-xl border border-mint/30 bg-mint/5 px-4 py-3 text-xs">
                    <p className="text-fog">Budget cycle</p>
                    <p className="font-display text-base font-bold">25 Oct → 24 Nov</p>
                    <p className="text-success font-semibold">Salary day 💰</p>
                  </div>
                </div>
              )}
              {demo && (
                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="rounded-xl bg-night p-3 font-mono text-[11px] leading-relaxed text-fog">Rs.249.00 debited from A/c XX4821 to SWIGGY on 03-10-26. UPI Ref 4402…</div>
                  <Zap className="mx-auto h-5 w-5 rotate-90 text-gold sm:rotate-0" />
                  <div className="rounded-xl border border-mint/30 bg-mint/5 p-3 text-xs">
                    <p className="flex justify-between"><span className="text-fog">Merchant</span><b>Swiggy</b></p>
                    <p className="flex justify-between"><span className="text-fog">Amount</span><b className="text-mint">₹249</b></p>
                    <p className="flex justify-between"><span className="text-fog">Category</span><b>Food</b></p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Screens */}
      <section id="screens" className="overflow-hidden border-y border-line/60 bg-navy py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-mint">Inside the app</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">Take a look around.</h2>
          <p className="mt-3 text-fog">Swipe or scroll through the screens. Toggle the site theme — the screens follow, just like the app.</p>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            {screens.map((s, i) => (
              <button key={s.key} onClick={() => go(i)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${shot === i ? 'border-mint bg-mint text-white' : 'border-line text-fog hover:text-ink'}`}>{s.key}</button>
            ))}
          </div>
        </div>
        <div ref={rail} onScroll={onRail}
          onPointerDown={(e) => { if (e.pointerType !== 'mouse') return; drag.current = { x: e.clientX, left: rail.current!.scrollLeft }; moved.current = false; rail.current!.style.scrollSnapType = 'none' }}
          onPointerMove={(e) => { if (drag.current) { if (Math.abs(e.clientX - drag.current.x) > 5) moved.current = true } if (drag.current) rail.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x) }}
          onPointerUp={() => { if (!drag.current) return; drag.current = null; rail.current!.style.scrollSnapType = ''; go(shot) }}
          onPointerLeave={() => { if (!drag.current) return; drag.current = null; rail.current!.style.scrollSnapType = ''; go(shot) }}
          className="mt-12 flex cursor-grab touch-pan-x select-none snap-x snap-mandatory gap-8 overflow-x-auto overscroll-x-contain active:cursor-grabbing px-[max(1.25rem,calc(50vw-130px))] pb-8 pt-2 [scrollbar-width:none] sm:pb-10 sm:pt-4 [&::-webkit-scrollbar]:hidden">
          {screens.map((s, i) => (
            <button key={s.key} onClick={() => !moved.current && go(i)}
              className="relative snap-center snap-always will-change-transform [transform-style:preserve-3d]">
              <Phone tab={s.tab}>{s.el}</Phone>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => go(Math.max(0, shot - 1))} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-mint disabled:opacity-30" disabled={shot === 0}><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex gap-1.5">{screens.map((s, i) => <span key={s.key} className={`h-1.5 rounded-full transition-all ${shot === i ? 'w-6 bg-mint' : 'w-1.5 bg-line'}`} />)}</div>
          <button onClick={() => go(Math.min(screens.length - 1, shot + 1))} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-mint disabled:opacity-30" disabled={shot === screens.length - 1}><ChevronRight className="h-5 w-5" /></button>
        </div>
        <p className="mt-6 px-5 text-center font-display text-base font-semibold sm:mt-8 sm:text-lg">{screens[shot].d}</p>
      </section>

      {/* Privacy */}
      <section id="privacy" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
        <div className="relative grid overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel to-navy md:grid-cols-2">
          <div className="p-7 sm:p-10 md:p-14">
            <ShieldCheck className="h-10 w-10 text-mint" />
            <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your money data<br />stays on your phone.</h2>
            <p className="mt-4 text-fog">PaisaPilot is local-first by design. Nothing personal touches a server unless you choose to share it.</p>
          </div>
          <div className="grid gap-px bg-line md:border-l md:border-line">
            {[['On device only', 'Budgets, transactions, reminders', 'text-success'], ['Synced when shared', 'Shared Rooms & Live Split Groups', 'text-violet'], ['Never collected', 'Contacts, location, mic, camera', 'text-gold']].map(([a, b, c]) => (
              <div key={a} className="bg-navy p-6 sm:p-8">
                <p className={`font-display text-lg font-bold ${c}`}>{a}</p><p className="text-sm text-fog">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-y border-line/60 bg-navy py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-mint">Install</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">Cleared for take-off<br />in under a minute.</h2>
            </div>
            <p className="max-w-sm text-fog">Not on the Play Store yet — so you get it straight from the source, before everyone else.</p>
          </div>
          <div className="relative mt-10 grid gap-3 sm:gap-4 md:mt-14 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-mint/40 to-transparent md:block" />
            {[[Download, 'Download the APK', 'Open the GitHub Releases link on your Android phone and grab the latest .apk.'],
              [ShieldCheck, 'Allow the install', 'Tap the file and enable "Install unknown apps" for your browser when asked.'],
              [Smartphone, 'Set your budget', 'Open PaisaPilot, set a monthly limit, and log your first chai.']].map(([Icon, t, d], i) => {
              const I = Icon as typeof Download
              return (
                <div key={t as string} className="relative rounded-3xl border border-line bg-night p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-mint to-emerald text-white"><I className="h-5 w-5" /></span>
                    <span className="font-display text-4xl font-extrabold text-ink/10 sm:text-5xl">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold">{t as string}</h3>
                  <p className="mt-2 text-sm text-fog">{d as string}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6 py-20 text-center">
        <p className="text-sm text-fog">Built with</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {['React Native', 'Expo SDK 57', 'Expo Router', 'Zustand', 'SQLite', 'Supabase Realtime'].map((t) => (
            <span key={t} className="rounded-full border border-line px-4 py-2 font-display text-sm font-semibold text-ink/80">{t}</span>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-6xl gap-12 px-6 pb-28 md:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-mint">FAQ</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Questions,<br />answered.</h2>
          <p className="mt-4 text-fog">Something else? <a href={`${REPO}/issues`} {...ext} className="text-mint underline-offset-4 hover:underline">Open an issue on GitHub</a>.</p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-6 py-5 text-left font-display text-base sm:py-6 sm:text-lg font-semibold">
                {q}
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${open === i ? 'border-mint bg-mint text-white' : 'border-line'}`}>
                  {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}>
                <p className="overflow-hidden text-fog">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#a855f7] to-[#7e22ce] px-6 py-12 text-center sm:p-12 md:p-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
          <img src="/icon.png" alt="" className="mx-auto h-20 w-20 rounded-3xl shadow-2xl ring-4 ring-white/20" />
          <h2 className="relative mt-8 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-6xl">Take control of your paisa.</h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/80">Free forever. Open source. On your phone in 60 seconds.</p>
          <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <a href={DOWNLOAD} {...ext} className="inline-flex items-center justify-center gap-3 rounded-2xl bg-night px-7 py-4 font-bold text-ink shadow-xl transition hover:-translate-y-0.5"><Download className="h-5 w-5 text-mint" />Download APK</a>
            <a href={REPO} {...ext} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-7 py-4 font-bold text-white transition hover:bg-white/10"><Star className="h-5 w-5" />Star on GitHub</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-fog text-center md:flex-row">
          <span className="flex items-center gap-2"><img src="/icon.png" alt="" className="h-6 w-6 rounded-md" /> PaisaPilot · Track • Plan • Grow</span>
          <span>© 2026 Shahid Ansari · Open source</span>
          <a href={REPO} {...ext} className="flex items-center gap-1.5 hover:text-ink"><Github className="h-4 w-4" />shahidansari311/PaisaPilot</a>
        </div>
      </footer>
    </div>
  )
}
