import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const app = initializeApp({ databaseURL: 'https://scoreboard-e139e-default-rtdb.firebaseio.com' }, 'ctrl');
const db  = getDatabase(app);
const mRef = ref(db, 'match');

let timerSec = 0, timerOn = false, timerIv = null, syncT = null, skipRemote = false;
const st = { nameA:'Local', nameB:'Visita', scoreA:0, scoreB:0, period:'', extra:'', timerSeconds:0, timerRunning:false };

const $  = id => document.getElementById(id);
const ss = (id,v) => $(id).textContent = v;

function status(ok, msg) {
  $('sdot').className = 'status-dot ' + (ok ? 'on' : 'err');
  $('slbl').textContent = msg;
}

function push() {
  st.nameA = $('na').value || 'Local';
  st.nameB = $('nb').value || 'Visita';
  st.period = $('per').value;
  st.extra  = $('ext').value;
  st.timerSeconds = timerSec;
  st.timerRunning = timerOn;
  skipRemote = true;
  set(mRef, { ...st, ts: Date.now() })
    .then(() => { status(true,'Sincronizado'); setTimeout(()=>skipRemote=false,600); })
    .catch(() => status(false,'Error al guardar'));
}

function previews() {
  $('dna').textContent = ($('na').value||'Local').toUpperCase();
  $('dnb').textContent = ($('nb').value||'Visita').toUpperCase();
}

window.sync = function() { previews(); clearTimeout(syncT); syncT = setTimeout(push, 400); };

window.chScore = function(t, d) {
  if (t==='a') { st.scoreA = Math.max(0,st.scoreA+d); ss('sav',st.scoreA); ss('dsa',st.scoreA); }
  else         { st.scoreB = Math.max(0,st.scoreB+d); ss('sbv',st.scoreB); ss('dsb',st.scoreB); }
  push();
};

function renderT() {
  const m = String(Math.floor(timerSec/60)).padStart(2,'0');
  const s = String(timerSec%60).padStart(2,'0');
  $('td').textContent = m+':'+s;
  $('td').className = 'tt ' + (timerOn ? 'r' : timerSec>0 ? 'p' : 's');
}

window.startTimer = function() {
  if (timerOn) return;
  timerOn = true;
  $('btn-start').disabled = true; $('btn-pause').disabled = false;
  timerIv = setInterval(() => { timerSec++; renderT(); if(timerSec%5===0) push(); }, 1000);
  renderT(); push();
};

window.pauseTimer = function() {
  if (!timerOn) return;
  timerOn = false; clearInterval(timerIv);
  $('btn-start').disabled = false; $('btn-pause').disabled = true;
  renderT(); push();
};

window.stopTimer = function() {
  timerOn = false; clearInterval(timerIv);
  $('btn-start').disabled = false; $('btn-pause').disabled = true;
  renderT(); push();
};

window.resetTimer = function() {
  window.stopTimer(); timerSec = 0; renderT(); push();
};

onValue(mRef, snap => {
  if (skipRemote) return;
  const s = snap.val();
  if (!s) { status(true,'Conectado'); return; }
  status(true,'Sincronizado');
  Object.assign(st, s);
  $('na').value = s.nameA||'Local'; $('nb').value = s.nameB||'Visita';
  ss('sav',s.scoreA??0); ss('sbv',s.scoreB??0);
  ss('dsa',s.scoreA??0); ss('dsb',s.scoreB??0);
  $('per').value = s.period||''; $('ext').value = s.extra||'';
  previews();
  if (!timerOn) { timerSec = s.timerSeconds||0; renderT(); }
}, () => status(false,'Sin conexión'));

status(false,'Conectando...'); renderT();
