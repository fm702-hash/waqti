import { useState, useEffect, useRef } from 'react'
import { TASKS, CODE_TTL, MAX_DAILY_MINUTES } from './data.js'
import {
  getBalance, addBalance, getDoneTasks, markTaskDone,
  saveCodes, clearExpiredCodes
} from './storage.js'

// ── helpers ───────────────────────────────────────────────────────────────────
const genCode = () => Math.floor(1000 + Math.random() * 9000).toString()

const G = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%;background:#0F0F1A}
input{-webkit-appearance:none}
@keyframes fadeUp {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop    {0%{transform:scale(.72);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes float  {0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes blink  {0%,100%{opacity:1}50%{opacity:.25}}
@keyframes scan   {0%{top:-30px}100%{top:110%}}
@keyframes conf   {0%{opacity:1;transform:translate(0,0) rotate(0deg)}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr)deg)}}
@keyframes pulse  {0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
`

// ── tiny shared components ────────────────────────────────────────────────────
function Btn({ children, onClick, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Cairo',sans-serif", fontWeight: 700,
        opacity: disabled ? .4 : 1, transition: 'transform .13s, opacity .2s',
        ...style
      }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(.96)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'scale(1.03)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
      {children}
    </button>
  )
}

function Confetti({ active }) {
  if (!active) return null
  const p = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    cx: (Math.random() * 360 - 180) + 'px',
    cy: (Math.random() * -340 - 40) + 'px',
    cr: Math.random() * 720 - 360,
    color: ['#FFD700','#FF6B6B','#4ECDC4','#A8E6CF','#C3A6FF','#fff'][i % 6],
    size: 6 + Math.random() * 9,
    delay: Math.random() * .35,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {p.map(x => (
        <div key={x.id} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: x.size, height: x.size, borderRadius: 2, background: x.color,
          '--cx': x.cx, '--cy': x.cy, '--cr': x.cr,
          animation: `conf 1.7s ease-out ${x.delay}s forwards`,
        }} />
      ))}
    </div>
  )
}

function Ring({ value, max, size = 200, stroke = 16, color = '#FFD700', label, sub }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#rg)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * .22, fontWeight: 900 }}>{label}</div>
        {sub && <div style={{ fontSize: size * .07, color: '#aaa', fontFamily: 'Cairo' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── SPLASH ────────────────────────────────────────────────────────────────────
function Splash({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t) }, [])
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column',
      background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div style={{ fontSize: 88, animation: 'float 2s ease-in-out infinite' }}>⏱️</div>
      <div style={{ fontSize: 52, fontWeight: 900, marginTop: 12,
        background: 'linear-gradient(90deg,#FFD700,#FF6B6B,#4ECDC4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>وقتي</div>
      <div style={{ color: '#666', fontSize: 14, marginTop: 8, fontFamily: 'Cairo' }}>
        أنجز مهامك • اكسب وقتك
      </div>
    </div>
  )
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onSelect }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#0F0F1A,#1a1a3e)', padding: '0 28px' }}>
      <div style={{ fontSize: 70, animation: 'float 3s ease-in-out infinite', marginBottom: 10 }}>⏱️</div>
      <div style={{ fontSize: 44, fontWeight: 900,
        background: 'linear-gradient(90deg,#FFD700,#FF6B6B)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>وقتي</div>
      <div style={{ color: '#555', fontSize: 13, marginBottom: 44, fontFamily: 'Cairo' }}>ادخل بصفتك</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        {[
          { type: 'parent', icon: '👨‍👩‍👧', label: 'ولي الأمر',
            sub: 'إدارة المهام والمكافآت', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
          { type: 'child', icon: '👦', label: 'الطفل',
            sub: 'حل مهامي واكسب وقتي', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
        ].map(u => (
          <Btn key={u.type} onClick={() => onSelect(u.type)}
            style={{ background: u.bg, borderRadius: 22, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right',
              boxShadow: '0 8px 32px rgba(0,0,0,.4)', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 44 }}>{u.icon}</div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'Cairo', fontWeight: 700, fontSize: 19 }}>{u.label}</div>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontFamily: 'Cairo', marginTop: 3 }}>{u.sub}</div>
            </div>
          </Btn>
        ))}
      </div>
    </div>
  )
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
function Quiz({ task, onDone, onBack }) {
  const [step, setStep]   = useState(0)
  const [sel, setSel]     = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone]   = useState(false)
  const q = task.questions[step]
  const total = task.questions.length

  const pick = i => {
    if (sel !== null) return
    setSel(i)
    if (i === q.ans) setScore(s => s + 1)
    setTimeout(() => {
      if (step + 1 < total) { setStep(s => s + 1); setSel(null) }
      else setDone(true)
    }, 950)
  }
  const earned = done ? Math.round((score / total) * task.reward) : 0

  return (
    <div style={{ padding: '24px 20px', animation: 'fadeUp .3s ease' }}>
      <Btn onClick={onBack} style={{ background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.12)', borderRadius: 12,
        padding: '8px 16px', color: '#aaa', fontSize: 13, marginBottom: 22 }}>
        ← رجوع
      </Btn>
      {!done ? (<>
        {/* progress bar */}
        <div style={{ background: 'rgba(255,255,255,.09)', borderRadius: 99, height: 8, marginBottom: 6 }}>
          <div style={{ background: `linear-gradient(90deg,${task.color},#FFD700)`,
            borderRadius: 99, height: 8, width: `${(step / total) * 100}%`, transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: '#888', marginBottom: 26, fontFamily: 'Cairo' }}>
          <span>سؤال {step + 1} من {total}</span>
          <span>🎁 +{task.reward} دقيقة</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 24,
          padding: '28px 22px', marginBottom: 22, textAlign: 'center', animation: 'fadeUp .3s ease' }}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.7 }}>{q.q}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {q.opts.map((opt, i) => {
            const correct = i === q.ans, picked = sel === i
            let bg = 'rgba(255,255,255,.07)', border = '2px solid rgba(255,255,255,.1)'
            if (sel !== null) {
              if (correct)       { bg = 'rgba(78,205,196,.22)';  border = '2px solid #4ECDC4' }
              else if (picked)   { bg = 'rgba(255,107,107,.22)'; border = '2px solid #FF6B6B' }
            }
            return (
              <Btn key={i} onClick={() => pick(i)}
                style={{ background: bg, border, borderRadius: 16,
                  padding: '16px 18px', color: '#fff', fontSize: 16,
                  textAlign: 'right', animation: `pop .3s ease ${i * .07}s both` }}>
                {opt}
              </Btn>
            )
          })}
        </div>
      </>) : (
        <div style={{ textAlign: 'center', paddingTop: 20, animation: 'fadeUp .4s ease' }}>
          <div style={{ fontSize: 80, animation: 'float 2s ease-in-out infinite' }}>
            {score === total ? '🏆' : score >= total / 2 ? '🌟' : '💪'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, margin: '16px 0 8px' }}>
            {score === total ? 'ممتاز!' : score >= total / 2 ? 'أحسنت!' : 'حاول مجدداً'}
          </div>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>
            {score} / {total} إجابات صحيحة
          </div>
          <div style={{ background: 'linear-gradient(135deg,#FFD700,#FF6B6B)',
            borderRadius: 22, padding: '22px', marginBottom: 28, display: 'inline-block', minWidth: 180 }}>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,.5)' }}>ربحت</div>
            <div style={{ fontSize: 54, fontWeight: 900, color: '#000' }}>+{earned}</div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,.5)' }}>دقيقة ⏱️</div>
          </div>
          <br />
          <Btn onClick={() => onDone(earned)}
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)',
              borderRadius: 16, padding: '16px 48px', color: '#fff', fontSize: 17 }}>
            احصل على الكود 🎁
          </Btn>
        </div>
      )}
    </div>
  )
}

// ── CODE DISPLAY ──────────────────────────────────────────────────────────────
function CodeDisplay({ code, earned, onClose }) {
  const [secs, setSecs] = useState(CODE_TTL)
  const [burst, setBurst] = useState(true)
  useEffect(() => { setTimeout(() => setBurst(false), 2800) }, [])
  useEffect(() => {
    if (secs <= 0) { onClose(); return }
    const t = setTimeout(() => setSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])

  const urgent = secs <= 30
  const r = 28, circ = 2 * Math.PI * r

  return (
    <div style={{ padding: '28px 20px', animation: 'fadeUp .4s ease' }}>
      <Confetti active={burst} />
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ fontSize: 58, animation: 'float 2s ease-in-out infinite' }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>مهمتك اكتملت!</div>
        <div style={{ color: '#aaa', fontSize: 14, marginTop: 4, fontFamily: 'Cairo' }}>
          ربحت <span style={{ color: '#FFD700', fontWeight: 700 }}>+{earned} دقيقة</span> وقت شاشة
        </div>
      </div>

      {/* code card */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a3e,#2a1a3e)',
        borderRadius: 28, padding: '28px 20px', marginBottom: 18,
        border: '2px solid rgba(255,215,0,.22)',
        boxShadow: '0 0 40px rgba(255,215,0,.07)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 32,
          background: 'linear-gradient(transparent,rgba(255,215,0,.05),transparent)',
          animation: 'scan 3s linear infinite', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: '#777', marginBottom: 14, letterSpacing: 2 }}>كود المكافأة</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          {code.split('').map((d, i) => (
            <div key={i} style={{
              width: 62, height: 74, borderRadius: 16,
              background: 'rgba(255,215,0,.07)', border: '2px solid rgba(255,215,0,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#FFD700',
              animation: `pop .4s ease ${i * .08}s both`,
              boxShadow: 'inset 0 0 20px rgba(255,215,0,.04)'
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(78,205,196,.13)', border: '1px solid rgba(78,205,196,.3)',
          borderRadius: 99, padding: '6px 18px' }}>
          <span style={{ fontSize: 15 }}>⏱️</span>
          <span style={{ color: '#4ECDC4', fontWeight: 700, fontSize: 15 }}>{earned} دقيقة</span>
        </div>
      </div>

      {/* countdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(255,255,255,.05)', borderRadius: 20,
        padding: '14px 18px', marginBottom: 18,
        border: `1.5px solid ${urgent ? 'rgba(255,107,107,.3)' : 'rgba(255,255,255,.08)'}`,
        transition: 'border-color .3s' }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="5" />
            <circle cx="32" cy="32" r={r} fill="none"
              stroke={urgent ? '#FF6B6B' : '#FFD700'} strokeWidth="5"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - secs / CODE_TTL)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: urgent ? 'blink 1s infinite' : 'none' }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: urgent ? '#FF6B6B' : '#FFD700' }}>{secs}</span>
            <span style={{ fontSize: 8, color: '#888' }}>ثانية</span>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>الكود ينتهي قريباً</div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 3, fontFamily: 'Cairo', lineHeight: 1.5 }}>
            أعطِ الكود لوليّ الأمر الآن
          </div>
        </div>
      </div>

      {/* steps */}
      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 20,
        padding: '18px', border: '1px solid rgba(255,255,255,.07)', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12 }}>📋 الخطوات</div>
        {[
          { n: '١', t: 'أعطِ الكود لوليّ الأمر',           c: '#FFD700' },
          { n: '٢', t: 'ولي الأمر يدخله في قسمه',          c: '#4ECDC4' },
          { n: '٣', t: 'يضبط Screen Time بالوقت المكتسب',  c: '#C3A6FF' },
          { n: '٤', t: 'العب واستمتع! 🎮',                 c: '#FF6B6B' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%',
              background: `${s.c}20`, border: `1.5px solid ${s.c}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: s.c, flexShrink: 0 }}>{s.n}</div>
            <span style={{ fontSize: 13 }}>{s.t}</span>
          </div>
        ))}
      </div>

      <Btn onClick={onClose}
        style={{ width: '100%', background: 'rgba(255,255,255,.07)',
          border: '1px solid rgba(255,255,255,.12)', borderRadius: 14,
          padding: '13px', color: '#aaa', fontSize: 14 }}>
        العودة للمهام
      </Btn>
    </div>
  )
}

// ── CHILD HOME ────────────────────────────────────────────────────────────────
function ChildHome({ onBack, onStartQuiz, onShowCode, balance, done, codes }) {
  const [tab, setTab] = useState('tasks')
  const activeCodes = codes.filter(c => c.expiresAt > Date.now())
  const tabs = [
    { id: 'tasks',  icon: '📋', label: 'مهامي'     },
    { id: 'time',   icon: '⏱️', label: 'وقتي'      },
    { id: 'badges', icon: '🏅', label: 'إنجازاتي'  },
  ]
  const badges = [
    { icon: '⭐', t: 'نجم اليوم',      d: 'أكمل 3 مهام',       ok: done.length >= 3 },
    { icon: '🏆', t: 'بطل الأسبوع',    d: 'أكمل 15 مهمة',      ok: false },
    { icon: '🎯', t: 'دقيق جداً',      d: 'إجابات 100% صحيحة', ok: false },
    { icon: '🚀', t: 'متفوق',          d: '5 كويزات متتالية',  ok: done.length >= 2 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontFamily: 'Cairo' }}>مرحباً 👋</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>فارس</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {activeCodes.length > 0 && (
              <Btn onClick={onShowCode}
                style={{ background: 'rgba(255,215,0,.15)', border: '1px solid rgba(255,215,0,.3)',
                  borderRadius: 12, padding: '8px 12px', color: '#FFD700', fontSize: 12 }}>
                🔢 كودي
              </Btn>
            )}
            <Btn onClick={onBack}
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 12, padding: '8px 12px', color: '#aaa', fontSize: 12 }}>
              تبديل
            </Btn>
          </div>
        </div>
        {/* balance bar */}
        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 18,
          padding: '14px 16px', marginBottom: 18, border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Cairo', fontSize: 13, color: '#aaa' }}>⏱️ رصيد اليوم</span>
            <span style={{ fontFamily: 'Cairo', fontWeight: 700, color: '#FFD700' }}>{balance} دقيقة</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,.09)', borderRadius: 99, height: 9 }}>
            <div style={{ background: 'linear-gradient(90deg,#FFD700,#FF6B6B)', borderRadius: 99, height: 9,
              width: `${Math.min((balance / MAX_DAILY_MINUTES) * 100, 100)}%`, transition: 'width .5s ease' }} />
          </div>
        </div>
      </div>

      {/* tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 80 }}>
        {tab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>مهام اليوم 📋</div>
            {TASKS.map((task, i) => {
              const isDone = done.includes(task.id)
              return (
                <div key={task.id} style={{
                  background: isDone ? 'rgba(78,205,196,.08)' : 'rgba(255,255,255,.05)',
                  borderRadius: 20, padding: '16px 18px',
                  border: `1.5px solid ${isDone ? 'rgba(78,205,196,.3)' : 'rgba(255,255,255,.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  animation: `pop .3s ease ${i * .07}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14,
                      background: `${task.color}18`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 24 }}>{task.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isDone ? '#4ECDC4' : '#fff' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>🎁 +{task.reward} دقيقة</div>
                    </div>
                  </div>
                  {isDone
                    ? <div style={{ fontSize: 26 }}>✅</div>
                    : <Btn onClick={() => onStartQuiz(task)}
                        style={{ background: `linear-gradient(135deg,${task.color},${task.color}cc)`,
                          borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13 }}>
                        {task.questions.length > 0 ? 'ابدأ 🚀' : 'تم ✓'}
                      </Btn>
                  }
                </div>
              )
            })}
          </div>
        )}

        {tab === 'time' && (
          <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 24 }}>⏱️ رصيد وقت الشاشة</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <Ring value={balance} max={MAX_DAILY_MINUTES} label={balance} sub="دقيقة" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'مكتسبة اليوم', v: `${balance} دق`, i: '⬆️' },
                { l: 'مهام منجزة',   v: done.length,     i: '✅' },
                { l: 'أقصى يومي',    v: `${MAX_DAILY_MINUTES} دق`, i: '🏆' },
                { l: 'المتبقي',      v: `${Math.max(MAX_DAILY_MINUTES - balance, 0)} دق`, i: '🎯' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 16,
                  padding: '14px', border: '1px solid rgba(255,255,255,.07)',
                  animation: `pop .3s ease ${i * .06}s both` }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.i}</div>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'Cairo', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'badges' && (
          <div style={{ animation: 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🏅 إنجازاتي</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {badges.map((b, i) => (
                <div key={i} style={{ background: b.ok ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.04)',
                  borderRadius: 20, padding: '20px 14px', textAlign: 'center',
                  border: `1.5px solid ${b.ok ? 'rgba(255,215,0,.25)' : 'rgba(255,255,255,.07)'}`,
                  filter: b.ok ? 'none' : 'grayscale(1) opacity(.45)',
                  animation: `pop .3s ease ${i * .07}s both` }}>
                  <div style={{ fontSize: 46, marginBottom: 8, animation: b.ok ? 'float 2s ease-in-out infinite' : 'none' }}>{b.icon}</div>
                  <div style={{ fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, color: b.ok ? '#FFD700' : '#888' }}>{b.t}</div>
                  <div style={{ fontFamily: 'Cairo', fontSize: 11, color: '#666', marginTop: 4 }}>{b.d}</div>
                  {b.ok && <div style={{ marginTop: 8, fontSize: 11, color: '#4ECDC4', fontFamily: 'Cairo' }}>✓ محقق</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 400,
        margin: '0 auto', background: 'rgba(15,15,26,.96)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', padding: '8px 0', zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: 'none', border: 'none', padding: '8px 0',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Cairo', fontSize: 11,
              color: tab === t.id ? '#FFD700' : '#555',
              fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
            {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFD700' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── PARENT VERIFY ─────────────────────────────────────────────────────────────
function ParentVerify({ codes, onBack }) {
  const [input, setInput] = useState(['', '', '', ''])
  const [status, setStatus] = useState(null)
  const [earnedMin, setEarnedMin] = useState(0)
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const handle = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...input]; next[i] = val; setInput(next)
    if (val && i < 3) refs[i + 1].current.focus()
    setStatus(null)
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !input[i] && i > 0) refs[i - 1].current.focus()
  }
  const verify = () => {
    const code = input.join('')
    const now = Date.now()
    const found = codes.find(c => c.code === code && c.expiresAt > now)
    if (found) { setStatus('ok'); setEarnedMin(found.earned) }
    else setStatus('err')
  }

  return (
    <div style={{ padding: '28px 20px', animation: 'fadeUp .4s ease' }}>
      <Confetti active={status === 'ok'} />
      <Btn onClick={onBack} style={{ background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.12)', borderRadius: 12,
        padding: '8px 16px', color: '#aaa', fontSize: 13, marginBottom: 28 }}>
        ← رجوع
      </Btn>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 56, animation: 'float 2s ease-in-out infinite' }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>تحقق من الكود</div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4, fontFamily: 'Cairo' }}>
          أدخل الكود الذي أحضره طفلك
        </div>
      </div>
      {/* digit inputs */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 26 }}>
        {[0, 1, 2, 3].map(i => (
          <input key={i} ref={refs[i]} value={input[i]} maxLength={1}
            onChange={e => handle(i, e.target.value)}
            onKeyDown={e => onKey(i, e)}
            inputMode="numeric"
            style={{
              width: 64, height: 72, borderRadius: 16, textAlign: 'center',
              fontSize: 34, fontWeight: 900, background: 'rgba(255,255,255,.07)',
              border: `2px solid ${status === 'ok' ? '#4ECDC4' : status === 'err' ? '#FF6B6B' : input[i] ? 'rgba(255,215,0,.5)' : 'rgba(255,255,255,.15)'}`,
              color: status === 'ok' ? '#4ECDC4' : status === 'err' ? '#FF6B6B' : '#FFD700',
              outline: 'none', fontFamily: 'Cairo', transition: 'border .2s, color .2s',
              caretColor: '#FFD700',
            }} />
        ))}
      </div>
      {status === 'ok' && (
        <div style={{ background: 'rgba(78,205,196,.1)', border: '1.5px solid rgba(78,205,196,.35)',
          borderRadius: 20, padding: '22px', textAlign: 'center', marginBottom: 20, animation: 'pop .4s ease' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#4ECDC4' }}>كود صحيح!</div>
          <div style={{ color: '#aaa', fontSize: 14, marginTop: 6, fontFamily: 'Cairo' }}>
            أضف <span style={{ color: '#FFD700', fontWeight: 700 }}>{earnedMin} دقيقة</span> لوقت الشاشة
          </div>
          <div style={{ marginTop: 18, background: 'rgba(255,255,255,.05)', borderRadius: 14,
            padding: '14px', fontSize: 12, color: '#888', textAlign: 'right', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>📱 كيف تضبط وقت الشاشة؟</div>
            <div>iPhone: الإعدادات ← وقت الشاشة ← وقت استخدام التطبيق</div>
            <div>Android: الإعدادات ← الرفاه الرقمي ← مؤقتات التطبيقات</div>
          </div>
        </div>
      )}
      {status === 'err' && (
        <div style={{ background: 'rgba(255,107,107,.09)', border: '1.5px solid rgba(255,107,107,.28)',
          borderRadius: 16, padding: '14px', textAlign: 'center', marginBottom: 20, animation: 'pop .3s ease' }}>
          <div style={{ color: '#FF6B6B', fontWeight: 700 }}>❌ كود غير صحيح أو منتهي</div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 4, fontFamily: 'Cairo' }}>
            تأكد من الأرقام أو اطلب كوداً جديداً
          </div>
        </div>
      )}
      <Btn onClick={verify} disabled={input.some(d => d === '')}
        style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)',
          borderRadius: 16, padding: '16px', color: '#fff', fontSize: 17 }}>
        تحقق من الكود 🔍
      </Btn>
    </div>
  )
}

// ── PARENT HOME ───────────────────────────────────────────────────────────────
function ParentHome({ onBack, balance, done, codes }) {
  const [tab, setTab] = useState('dashboard')
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
    { id: 'verify',    icon: '🔐', label: 'تحقق من الكود' },
    { id: 'settings',  icon: '⚙️', label: 'الإعدادات' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontFamily: 'Cairo' }}>لوحة الوالدين 👨‍👩‍👧</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>عائلة العمري</div>
          </div>
          <Btn onClick={onBack} style={{ background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
            padding: '8px 14px', color: '#aaa', fontSize: 12 }}>تبديل</Btn>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 80 }}>
        {tab === 'dashboard' && (
          <div style={{ animation: 'fadeUp .3s ease' }}>
            {/* child card */}
            <div style={{ background: 'linear-gradient(135deg,#667eea1a,#764ba21a)',
              borderRadius: 24, padding: '20px', marginBottom: 20,
              border: '1px solid rgba(102,126,234,.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 50, height: 50, borderRadius: 16,
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Cairo', fontWeight: 700, fontSize: 16 }}>فارس</div>
                  <div style={{ fontFamily: 'Cairo', fontSize: 12, color: '#888' }}>الصف الثالث الابتدائي</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cairo', fontWeight: 900, fontSize: 24, color: '#FFD700' }}>{balance}</div>
                  <div style={{ fontFamily: 'Cairo', fontSize: 10, color: '#888' }}>دقيقة</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { v: done.length,                  l: 'منجز', c: '#4ECDC4' },
                  { v: TASKS.length - done.length,   l: 'متبقي', c: '#FF6B6B' },
                  { v: `${Math.round((done.length / TASKS.length) * 100)}%`, l: 'نسبة', c: '#FFD700' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12,
                    padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Cairo', fontWeight: 700, fontSize: 20, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: 'Cairo', fontSize: 10, color: '#888' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 مهام اليوم</div>
            {TASKS.map((task, i) => {
              const isDone = done.includes(task.id)
              return (
                <div key={task.id} style={{ background: 'rgba(255,255,255,.04)',
                  borderRadius: 16, padding: '14px 16px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: `1px solid ${isDone ? 'rgba(78,205,196,.25)' : 'rgba(255,255,255,.06)'}`,
                  animation: `pop .3s ease ${i * .05}s both` }}>
                  <div style={{ fontSize: 26 }}>{task.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Cairo', fontWeight: 600, fontSize: 14,
                      color: isDone ? '#4ECDC4' : '#fff' }}>{task.title}</div>
                    <div style={{ fontFamily: 'Cairo', fontSize: 11, color: '#888' }}>+{task.reward} دقيقة</div>
                  </div>
                  <div style={{ fontSize: 18 }}>{isDone ? '✅' : '⏳'}</div>
                </div>
              )
            })}
          </div>
        )}
        {tab === 'verify' && <ParentVerify codes={codes} onBack={() => setTab('dashboard')} />}
        {tab === 'settings' && (
          <div style={{ animation: 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⚙️ الإعدادات</div>
            {[
              { icon: '⏰', l: 'وقت الشاشة الأقصى يومياً', v: `${MAX_DAILY_MINUTES} دقيقة`, c: '#4ECDC4' },
              { icon: '🔔', l: 'تنبيهات الإنجاز',           v: 'مفعّلة',        c: '#FFD700'  },
              { icon: '👦', l: 'عدد الأطفال',               v: '1 طفل',         c: '#C3A6FF'  },
              { icon: '📊', l: 'تقارير أسبوعية',            v: 'مفعّلة',        c: '#A8E6CF'  },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 16,
                padding: '16px 18px', marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,.07)',
                animation: `pop .3s ease ${i * .07}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Cairo', fontSize: 14 }}>{s.l}</div>
                </div>
                <div style={{ fontFamily: 'Cairo', fontSize: 13, color: s.c, fontWeight: 700 }}>{s.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 400,
        margin: '0 auto', background: 'rgba(15,15,26,.96)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', padding: '8px 0', zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: 'none', border: 'none', padding: '8px 0',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Cairo', fontSize: 10,
              color: tab === t.id ? '#FFD700' : '#555',
              fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
            {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFD700' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,  setScreen]  = useState('splash')  // splash|login|child|parent|quiz|code
  const [balance, setBalance] = useState(() => getBalance())
  const [done,    setDone]    = useState(() => getDoneTasks())
  const [codes,   setCodes]   = useState(() => clearExpiredCodes())
  const [activeTask, setTask] = useState(null)
  const [lastCode,   setLast] = useState(null)

  // persist balance changes
  useEffect(() => { saveCodes(codes) }, [codes])

  const startQuiz = task => {
    if (task.questions.length === 0) {
      // manual task — instant complete
      earnReward(task, task.reward)
    } else {
      setTask(task); setScreen('quiz')
    }
  }

  const earnReward = (task, earned) => {
    const newBal = addBalance(earned)
    setBalance(newBal)
    markTaskDone(task.id)
    setDone(getDoneTasks())
    const code = genCode()
    const entry = { code, earned, expiresAt: Date.now() + CODE_TTL * 1000 }
    const updated = [...clearExpiredCodes(), entry]
    setCodes(updated)
    saveCodes(updated)
    setLast(entry)
    setScreen('code')
  }

  const onQuizDone = earned => {
    earnReward(activeTask, earned)
    setTask(null)
  }

  const wrapStyle = {
    fontFamily: "'Cairo',sans-serif", direction: 'rtl',
    height: '100vh', background: '#0F0F1A', color: '#fff',
    display: 'flex', justifyContent: 'center', overflowX: 'hidden',
  }
  const phoneStyle = {
    width: '100%', maxWidth: 400, height: '100%',
    position: 'relative', overflowY: 'auto', overflowX: 'hidden',
  }

  return (
    <div style={wrapStyle}>
      <style>{G}</style>
      <div style={phoneStyle}>
        {screen === 'splash' && <Splash onDone={() => setScreen('login')} />}
        {screen === 'login'  && <Login onSelect={t => setScreen(t)} />}
        {screen === 'child'  && (
          <ChildHome
            onBack={() => setScreen('login')}
            onStartQuiz={startQuiz}
            onShowCode={() => setScreen('code')}
            balance={balance} done={done} codes={codes} />
        )}
        {screen === 'parent' && (
          <ParentHome
            onBack={() => setScreen('login')}
            balance={balance} done={done} codes={codes} />
        )}
        {screen === 'quiz' && activeTask && (
          <div style={{ padding: 0 }}>
            <Quiz task={activeTask} onDone={onQuizDone} onBack={() => setScreen('child')} />
          </div>
        )}
        {screen === 'code' && lastCode && (
          <div style={{ overflowY: 'auto' }}>
            <CodeDisplay
              code={lastCode.code} earned={lastCode.earned}
              onClose={() => setScreen('child')} />
          </div>
        )}
      </div>
    </div>
  )
}
