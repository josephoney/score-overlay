import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const app = initializeApp({ databaseURL: 'https://scoreboard-e139e-default-rtdb.firebaseio.com' }, 'ovl');
const db  = getDatabase(app);
const mRef = ref(db, 'match');

let prevA = 0, prevB = 0;
let localSec = 0, localOn = false, localIv = null;

const $ = id => document.getElementById(id);

function flash(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

function renderTimer() {
  const m = String(Math.floor(localSec/60)).padStart(2,'0');
  const s = String(localSec%60).padStart(2,'0');
  $('ct').textContent = m+':'+s;
}

function startLocal() {
  if (localIv) return;
  localIv = setInterval(() => { localSec++; renderTimer(); }, 1000);
}

function stopLocal() {
  clearInterval(localIv); localIv = null;
}

onValue(mRef, snap => {
  const s = snap.val();
  if (!s) return;

  $('na').textContent = (s.nameA||'LOCAL').toUpperCase();
  $('nb').textContent = (s.nameB||'VISITA').toUpperCase();

  const sa = s.scoreA ?? 0;
  const sb = s.scoreB ?? 0;
  if (sa !== prevA) { flash($('sa')); prevA = sa; }
  if (sb !== prevB) { flash($('sb')); prevB = sb; }
  $('sa').textContent = sa;
  $('sb').textContent = sb;

  $('cp').textContent = s.period || '';

  const ex = s.extra || '';
  $('extra-bar').textContent = ex;
  $('extra-bar').className = 'extra-bar' + (ex ? ' on' : '');

  stopLocal();
  localSec = s.timerSeconds || 0;
  localOn  = !!s.timerRunning;
  renderTimer();
  if (localOn) startLocal();
});
