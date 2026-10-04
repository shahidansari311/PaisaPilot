import type { ReactNode } from 'react'
import {
  User, Moon, ChevronLeft, ChevronRight, Trophy, Minus, Plus, TrendingUp, TrendingDown,
  AlertTriangle, Repeat, Home, List, Users, Menu, ArrowLeft, Share, UserPlus, Receipt,
  MessageCircle, LogOut, Copy, Wifi, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'

/* Demo data only — names and amounts are fictional. */

export function Phone({ children, className = '', tab }: { children: ReactNode; className?: string; tab?: number }) {
  return (
    <div className={`w-[260px] shrink-0 rounded-[2.6rem] bg-gradient-to-b from-[#3f3f46] to-[#18181b] p-[7px] shadow-[0_40px_80px_-20px_rgba(0,0,0,.45)] ring-1 ring-white/10 ${className}`}>
      <div className="app-screen relative flex h-[540px] flex-col overflow-hidden rounded-[2.1rem] bg-[var(--s-bg)] text-[var(--s-ink)]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative flex-1 overflow-hidden">{children}</div>
        {tab !== undefined && <TabBar active={tab} />}
      </div>
    </div>
  )
}

function TabBar({ active }: { active: number }) {
  return (
    <div className="flex justify-around border-t border-[var(--s-line)] bg-[var(--s-card)] px-2 pb-3 pt-2">
      {[Home, List, Repeat, Users, Menu].map((I, i) => (
        <span key={i} className={`relative grid h-9 w-11 place-items-center rounded-xl ${i === active ? 'bg-[var(--s-soft)] text-[var(--s-ink)]' : 'text-[var(--s-muted)]'}`}>
          <I className="h-4 w-4" />
          {i === active && <span className="absolute bottom-1 h-0.5 w-3 rounded-full bg-lime-500" />}
        </span>
      ))}
    </div>
  )
}

const Header = ({ children, round = true }: { children: ReactNode; round?: boolean }) => (
  <div className={`s-grad px-4 pb-5 pt-10 text-white ${round ? 'rounded-b-[1.6rem]' : ''}`}>{children}</div>
)
const Fab = () => (
  <span className="s-grad absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg"><Plus className="h-5 w-5" /></span>
)
const card = 'rounded-2xl border border-[var(--s-line)] bg-[var(--s-card)]'

export function HomeScreen() {
  return (
    <>
      <div className="s-grad rounded-b-[2rem] px-4 pb-14 pt-10 text-center text-white">
        <div className="flex items-center justify-between">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20"><User className="h-4 w-4" /></span>
          <span className="flex items-center gap-3 rounded-full bg-white/20 px-2 py-1 text-[11px] font-semibold"><ChevronLeft className="h-3 w-3" />Oct 26<ChevronRight className="h-3 w-3 opacity-50" /></span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20"><Moon className="h-4 w-4" /></span>
        </div>
        <p className="mt-4 text-[11px] text-white/80">Current Balance</p>
        <p className="font-display text-4xl font-extrabold">₹4,350</p>
        <span className="mt-1 inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-semibold">Evening, Aarav</span>
      </div>
      <div className="relative -mt-9 space-y-2.5 px-3">
        <div className={`${card} flex items-center gap-2.5 p-2.5 shadow-sm`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Trophy className="h-4 w-4" /></span>
          <div className="flex-1"><p className="text-[11px] font-bold">Level 3: Budget Pro</p><p className="text-[9px] text-[var(--s-muted)]">Tap to view all badges</p></div>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--s-muted)]" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-white">
          <span className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 py-2"><Minus className="h-3 w-3" />Expense</span>
          <span className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 py-2"><Plus className="h-3 w-3" />Income</span>
        </div>
        <p className="pt-1 text-[11px] font-bold">Your Money</p>
        <div className="grid grid-cols-2 gap-2">
          {[[TrendingUp, 'Income', '₹6,000', 'text-emerald-500 bg-emerald-500/15'], [TrendingDown, 'Expenses', '₹1,650', 'text-red-500 bg-red-500/15']].map(([I, l, v, c]) => {
            const Ic = I as typeof User
            return (
              <div key={l as string} className={`${card} p-2.5`}>
                <p className="flex items-center gap-1.5 text-[9px] text-[var(--s-muted)]"><span className={`grid h-5 w-5 place-items-center rounded-full ${c}`}><Ic className="h-3 w-3" /></span>{l as string}</p>
                <p className="mt-1 text-sm font-bold">{v as string}</p>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-500">
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-500" />Over today's limit</span>-₹45
        </div>
        <div className={`${card} flex items-center gap-2.5 p-2.5`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Repeat className="h-4 w-4" /></span>
          <div className="flex-1"><p className="text-[11px] font-bold">Homies Owe / You Owe</p><p className="text-[9px] font-semibold"><span className="text-red-500">You owe ₹800</span> <span className="ml-1 text-emerald-500">Get ₹1,450</span></p></div>
        </div>
      </div>
    </>
  )
}

export function HistoryScreen() {
  const segs = [['Food', 42, '#f59e0b'], ['Travel', 28, '#a855f7'], ['Shopping', 18, '#10b981'], ['Other', 12, '#94a3b8']] as const
  let acc = 0
  const stops = segs.map(([, p, c]) => `${c} ${acc}% ${(acc += p)}%`).join(',')
  return (
    <>
      <Header>
        <div className="flex items-start justify-between">
          <div><p className="font-display text-xl font-extrabold">History</p><p className="text-[10px] text-white/80">View past transactions</p></div>
          <span className="flex items-center gap-2 rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold"><ChevronLeft className="h-3 w-3" />Oct 2026<ChevronRight className="h-3 w-3 opacity-50" /></span>
        </div>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-white/15 p-1 text-center text-[10px] font-semibold"><span className="py-1">List</span><span className="rounded-full bg-white/25 py-1">Report</span></div>
      </Header>
      <div className="px-3 pt-3">
        <div className={`${card} grid grid-cols-2 p-1 text-center text-[10px] font-semibold`}><span className="rounded-xl bg-[var(--s-soft)] py-1.5">Expenses</span><span className="py-1.5 text-[var(--s-muted)]">Income</span></div>
        <div className="relative mx-auto my-4 h-32 w-32 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
          <div className="absolute inset-[14px] grid place-items-center rounded-full bg-[var(--s-bg)] text-center">
            <div><p className="text-[9px] text-[var(--s-muted)]">Total Expenses</p><p className="text-base font-bold">₹1,650</p></div>
          </div>
        </div>
        <p className="flex justify-between text-[11px] font-bold"><span>All Expenses</span><span>Total ₹1,650</span></p>
        <div className={`${card} mt-2 space-y-2 p-2.5`}>
          {segs.slice(0, 3).map(([n, p, c]) => (
            <div key={n} className="text-[10px]">
              <p className="flex justify-between font-semibold"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{n}</span><span className="text-[var(--s-muted)]">{p}%</span></p>
              <div className="mt-1 h-1 rounded-full bg-[var(--s-soft)]"><div className="h-full rounded-full" style={{ width: `${p * 2}%`, background: c }} /></div>
            </div>
          ))}
        </div>
      </div>
      <Fab />
    </>
  )
}

export function DebtScreen() {
  return (
    <>
      <Header><p className="font-display text-xl font-extrabold">Debt Tracker</p><p className="text-[10px] text-white/80">Long press a record to delete</p></Header>
      <div className="space-y-2.5 px-3 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className={`${card} p-2.5`}><p className="text-[8px] font-bold uppercase text-[var(--s-muted)]">Homies owe me</p><p className="text-base font-bold text-emerald-500">₹1,450</p></div>
          <div className={`${card} p-2.5`}><p className="text-[8px] font-bold uppercase text-[var(--s-muted)]">I owe homies</p><p className="text-base font-bold text-red-500">₹800</p></div>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-[var(--s-soft)] p-1 text-center text-[10px] font-bold"><span className="rounded-lg py-1.5 text-[var(--s-muted)]">I BORROWED</span><span className="rounded-lg bg-[var(--s-card)] py-1.5 text-emerald-500 shadow-sm">I LENT</span></div>
        {[['R', 'Rohan', '₹950', '3d late 💀', true], ['M', 'Meera', '₹500', 'Due in 2d', false]].map(([i, n, a, s, late]) => (
          <div key={n as string} className={`${card} overflow-hidden`}>
            <div className={`h-1 ${late ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-500">{i}</span>
                <div className="flex-1"><p className="text-[11px] font-bold">{n}</p><p className={`flex items-center gap-1 text-[9px] font-semibold ${late ? 'text-red-500' : 'text-amber-500'}`}><AlertTriangle className="h-2.5 w-2.5" />{s}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-emerald-500">{a}</p><span className="rounded-full bg-amber-500/15 px-1.5 text-[8px] font-bold text-amber-500">PENDING</span></div>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 py-1.5 text-[10px] font-bold text-green-500"><MessageCircle className="h-3 w-3" />Send via WhatsApp</p>
            </div>
          </div>
        ))}
      </div>
      <Fab />
    </>
  )
}

export function TripScreen() {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-[var(--s-line)] bg-[var(--s-card)] px-4 pb-3 pt-10">
        <ArrowLeft className="h-4 w-4" /><p className="flex-1 text-sm font-bold">Manali Trip</p>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--s-accent-soft)] text-[var(--s-accent)]"><Share className="h-3.5 w-3.5" /></span>
      </div>
      <div className="space-y-3 px-3 pt-3">
        <div className="rounded-2xl border border-[var(--s-accent)]/30 bg-[var(--s-accent-soft)] p-3">
          <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-[.15em] text-[var(--s-accent)]"><Users className="h-3 w-3" />WHO OWES WHO?</p>
          {[['Kabir', 'Aarav', '₹1,240.00'], ['Isha', 'Aarav', '₹385.50'], ['Isha', 'Dev', '₹910.00']].map(([a, b, v]) => (
            <p key={a + b} className="flex justify-between border-b border-[var(--s-accent)]/15 py-1.5 text-[11px] last:border-0">
              <span><b>{a}</b> <span className="text-[var(--s-muted)]">owes</span> <b>{b}</b></span><span className="font-bold text-red-500">{v}</span>
            </p>
          ))}
        </div>
        <p className="flex items-center justify-between text-[8px] font-bold tracking-[.2em] text-[var(--s-muted)]">PARTICIPANTS<UserPlus className="h-3.5 w-3.5 text-[var(--s-accent)]" /></p>
        <div className="flex flex-wrap gap-1.5">
          {['Aarav', 'Kabir', 'Isha', 'Dev'].map((n) => <span key={n} className="rounded-full border border-[var(--s-accent)]/30 bg-[var(--s-accent-soft)] px-2.5 py-1 text-[10px] font-semibold">{n}</span>)}
        </div>
        <p className="flex items-center justify-between text-[8px] font-bold tracking-[.2em] text-[var(--s-muted)]">EXPENSES<Receipt className="h-3.5 w-3.5 text-[var(--s-accent)]" /></p>
        <div className={`${card} divide-y divide-[var(--s-line)]`}>
          {[['Hotel booking', 'Aarav', '₹4,800'], ['Taxi to Solang', 'Dev', '₹1,200'], ['Maggi point', 'Aarav', '₹240']].map(([t, p, v]) => (
            <div key={t} className="flex items-center justify-between px-3 py-2"><div><p className="text-[11px] font-semibold">{t}</p><p className="text-[9px] text-[var(--s-muted)]">Paid by {p}</p></div><p className="text-[11px] font-bold">{v}</p></div>
          ))}
        </div>
      </div>
    </>
  )
}

export function RoomScreen() {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-[var(--s-line)] bg-[var(--s-card)] px-4 pb-3 pt-10">
        <ArrowLeft className="h-4 w-4" />
        <div className="flex-1"><p className="text-sm font-bold">Flat 302</p><p className="flex items-center gap-1 text-[9px] text-[var(--s-muted)]"><Wifi className="h-2.5 w-2.5 text-[var(--s-accent)]" /><span className="font-semibold text-[var(--s-accent)]">Live Synced</span> · K7R2Q9</p></div>
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-500"><LogOut className="h-3.5 w-3.5" /></span>
      </div>
      <div className="space-y-3 px-3 pt-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-[8px] font-bold tracking-[.2em] text-[var(--s-muted)]">YOUR BALANCE</p>
          <p className="text-xl font-bold text-emerald-500">₹3,250</p>
          <p className="text-[10px] font-semibold text-emerald-500">You will receive</p>
        </div>
        <div className={`${card} p-3`}>
          <p className="flex items-center justify-between text-[11px] font-bold"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[var(--s-accent)]" />Members (2)</span><span className="flex items-center gap-1 rounded-full bg-[var(--s-accent-soft)] px-2 py-0.5 text-[9px] text-[var(--s-accent)]"><Copy className="h-2.5 w-2.5" />K7R2Q9</span></p>
          <div className="mt-2 flex gap-1.5 text-[10px] font-semibold">
            <span className="flex items-center gap-1 rounded-full border border-[var(--s-accent)]/30 bg-[var(--s-accent-soft)] py-0.5 pl-0.5 pr-2 text-[var(--s-accent)]"><span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--s-accent)] text-[8px] text-white">A</span>Aarav (You)</span>
            <span className="flex items-center gap-1 rounded-full bg-[var(--s-soft)] py-0.5 pl-0.5 pr-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] text-white">V</span>Vikram</span>
          </div>
        </div>
        <p className="text-[11px] font-bold">Entries</p>
        <div className={`${card} divide-y divide-[var(--s-line)]`}>
          {[['Rent share', 'AARAV PAID', '₹6,500', true], ['Electricity', 'AARAV PAID', '₹840', true], ['Groceries', 'VIKRAM PAID', '₹620', false]].map(([t, p, v, me]) => (
            <div key={t as string} className="flex items-center gap-2 px-2.5 py-2">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${me ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>{me ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}</span>
              <div className="flex-1"><p className="text-[11px] font-semibold">{t as string}</p><span className={`rounded px-1 text-[8px] font-bold ${me ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>{p as string}</span></div>
              <p className={`text-[11px] font-bold ${me ? 'text-emerald-500' : 'text-red-500'}`}>{v as string}</p>
            </div>
          ))}
        </div>
      </div>
      <Fab />
    </>
  )
}

export const screens = [
  { key: 'Home', el: <HomeScreen />, tab: 0, d: 'Balance, daily limit and who-owes-whom at a glance.' },
  { key: 'History', el: <HistoryScreen />, tab: 1, d: 'Category reports for every month.' },
  { key: 'Debt Tracker', el: <DebtScreen />, tab: 2, d: 'Borrowed and lent, with WhatsApp nudges.' },
  { key: 'Trip Split', el: <TripScreen />, d: 'Settle trip expenses in the fewest transfers.' },
  { key: 'Shared Room', el: <RoomScreen />, d: 'A live-synced ledger for you and your flatmates.' },
]
