// ── التخزين المحلي — يعمل بدون إنترنت ────────────────────────────────────────

const KEY_BALANCE  = 'waqti_balance'
const KEY_DONE     = 'waqti_done_today'
const KEY_CODES    = 'waqti_codes'
const KEY_LAST_DAY = 'waqti_last_day'

// إعادة ضبط المهام يومياً
function checkDayReset() {
  const today = new Date().toDateString()
  const last  = localStorage.getItem(KEY_LAST_DAY)
  if (last !== today) {
    localStorage.setItem(KEY_LAST_DAY, today)
    localStorage.setItem(KEY_DONE, JSON.stringify([]))
  }
}

export function getBalance() {
  return parseInt(localStorage.getItem(KEY_BALANCE) || '0', 10)
}
export function addBalance(mins) {
  const b = getBalance() + mins
  localStorage.setItem(KEY_BALANCE, b)
  return b
}
export function setBalance(mins) {
  localStorage.setItem(KEY_BALANCE, mins)
}

export function getDoneTasks() {
  checkDayReset()
  return JSON.parse(localStorage.getItem(KEY_DONE) || '[]')
}
export function markTaskDone(id) {
  const done = getDoneTasks()
  if (!done.includes(id)) {
    done.push(id)
    localStorage.setItem(KEY_DONE, JSON.stringify(done))
  }
}

export function saveCodes(codes) {
  localStorage.setItem(KEY_CODES, JSON.stringify(codes))
}
export function loadCodes() {
  return JSON.parse(localStorage.getItem(KEY_CODES) || '[]')
}
export function clearExpiredCodes() {
  const now = Date.now()
  const valid = loadCodes().filter(c => c.expiresAt > now)
  saveCodes(valid)
  return valid
}
