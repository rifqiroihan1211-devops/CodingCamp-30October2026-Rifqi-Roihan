/* =============================================
   MY PRODUCTIVITY DASHBOARD — app.js
   Stack  : Vanilla JavaScript (no frameworks)
   Storage: Browser LocalStorage (client-side only)
   ============================================= */

'use strict';

/* -----------------------------------------------
   CONSTANTS & HELPERS
   ----------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const LS = {
  get:    (key, fallback = null) => { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (key, val)             => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full */ } },
  remove: (key)                  => { try { localStorage.removeItem(key); } catch {} }
};

/* -----------------------------------------------
   1. GREETING + CLOCK
   ----------------------------------------------- */
const greetingText  = $('#greeting-text');
const datetimeText  = $('#datetime-text');
const usernameInput = $('#username-input');
const saveNameBtn   = $('#save-name-btn');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function updateClock() {
  const now   = new Date();
  const hour  = now.getHours();
  const min   = String(now.getMinutes()).padStart(2, '0');
  const sec   = String(now.getSeconds()).padStart(2, '0');
  const day   = DAYS[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();

  const name  = LS.get('username', '');
  const greet = getGreeting(hour);

  greetingText.textContent  = name ? `${greet}, ${name}! 👋` : `${greet}! 👋`;
  datetimeText.textContent  = `${day}, ${month} ${date}, ${year}  —  ${hour}:${min}:${sec}`;
}

function initGreeting() {
  const savedName = LS.get('username', '');
  if (savedName) usernameInput.value = savedName;

  saveNameBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    LS.set('username', name);
    updateClock();
    showToast(name ? `Name saved as "${name}" ✔` : 'Name cleared');
  });

  usernameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveNameBtn.click();
  });

  updateClock();
  setInterval(updateClock, 1000);
}

/* -----------------------------------------------
   2. LIGHT / DARK MODE (Challenge #1)
   ----------------------------------------------- */
const themeToggle = $('#theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = LS.get('theme', 'light');
  applyTheme(saved);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    LS.set('theme', next);
    applyTheme(next);
  });
}

/* -----------------------------------------------
   3. FOCUS TIMER — Pomodoro (Challenge #3: Change time)
   ----------------------------------------------- */
const timerDisplay     = $('#timer-display');
const timerProgressBar = $('#timer-progress-bar');
const timerStatus      = $('#timer-status');
const startBtn         = $('#start-btn');
const stopBtn          = $('#stop-btn');
const resetBtn         = $('#reset-btn');
const durationInput    = $('#pomodoro-duration');
const applyDurationBtn = $('#apply-duration-btn');

let timerInterval    = null;
let totalSeconds     = 25 * 60;   // default 25 min
let remainingSeconds = totalSeconds;
let isRunning        = false;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
  timerProgressBar.style.width = `${pct}%`;
}

function tickTimer() {
  if (remainingSeconds <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning     = false;
    timerDisplay.classList.add('timer-done');
    timerStatus.textContent = '🎉 Time\'s up! Great focus session!';
    showToast('Pomodoro session complete! 🎉');
    return;
  }
  remainingSeconds--;
  updateTimerUI();
}

function startTimer() {
  if (isRunning) return;
  if (remainingSeconds <= 0) resetTimer();
  isRunning = true;
  timerDisplay.classList.remove('timer-done');
  timerStatus.textContent = '🔥 Stay focused!';
  timerInterval = setInterval(tickTimer, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning     = false;
  timerStatus.textContent = '⏸ Paused — come back soon!';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval    = null;
  isRunning        = false;
  remainingSeconds = totalSeconds;
  timerDisplay.classList.remove('timer-done');
  timerStatus.textContent = 'Ready to focus!';
  updateTimerUI();
}

function initTimer() {
  const savedDuration = LS.get('pomodoroDuration', 25);
  durationInput.value  = savedDuration;
  totalSeconds         = savedDuration * 60;
  remainingSeconds     = totalSeconds;
  updateTimerUI();

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  applyDurationBtn.addEventListener('click', () => {
    const val = parseInt(durationInput.value, 10);
    if (!val || val < 1 || val > 120) {
      showToast('Please enter a duration between 1 and 120 minutes.', 'error');
      return;
    }
    LS.set('pomodoroDuration', val);
    totalSeconds     = val * 60;
    remainingSeconds = totalSeconds;
    clearInterval(timerInterval);
    timerInterval    = null;
    isRunning        = false;
    timerDisplay.classList.remove('timer-done');
    timerStatus.textContent = `Timer set to ${val} min. Ready to focus!`;
    updateTimerUI();
    showToast(`Pomodoro set to ${val} minutes ✔`);
  });
}

/* -----------------------------------------------
   4. TO-DO LIST (Challenge #4: Prevent duplicates, #5: Sort tasks)
   ----------------------------------------------- */
const todoInput  = $('#todo-input');
const todoAddBtn = $('#todo-add-btn');
const todoList   = $('#todo-list');
const todoEmpty  = $('#todo-empty');
const sortSelect = $('#sort-select');

let tasks = [];   // [{ id, text, done }]

function saveTasks() {
  LS.set('tasks', tasks);
}

function loadTasks() {
  tasks = LS.get('tasks', []);
}

function getSortedTasks() {
  const sort = sortSelect.value;
  const copy = [...tasks];
  if (sort === 'az')    return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')    return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done')  return copy.sort((a, b) => a.done - b.done);   // undone first
  if (sort === 'undone')return copy.sort((a, b) => b.done - a.done);   // done first
  return copy; // default: insertion order
}

function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    todoEmpty.style.display = 'block';
    return;
  }
  todoEmpty.style.display = 'none';

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = task.done;
    cb.title   = task.done ? 'Mark as undone' : 'Mark as done';
    cb.addEventListener('change', () => toggleTask(task.id));

    // Editable text (inline edit — click to edit)
    const span = document.createElement('input');
    span.type      = 'text';
    span.className = 'task-text';
    span.value     = task.text;
    span.maxLength = 100;
    span.title     = 'Click to edit task';
    span.addEventListener('blur', () => {
      const newText = span.value.trim();
      if (!newText) { span.value = task.text; return; }   // revert if empty
      // Prevent duplicate on edit
      if (newText.toLowerCase() !== task.text.toLowerCase()) {
        const isDup = tasks.some(t => t.id !== task.id && t.text.toLowerCase() === newText.toLowerCase());
        if (isDup) { showToast('A task with that name already exists.', 'error'); span.value = task.text; return; }
      }
      editTask(task.id, newText);
    });
    span.addEventListener('keydown', e => {
      if (e.key === 'Enter') span.blur();
      if (e.key === 'Escape') { span.value = task.text; span.blur(); }
    });

    // Delete button
    const del = document.createElement('button');
    del.className   = 'delete-task-btn';
    del.textContent = '✕';
    del.title       = 'Delete task';
    del.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(del);
    todoList.appendChild(li);
  });
}

function addTask(text) {
  const clean = text.trim();
  if (!clean) { showToast('Task cannot be empty.', 'error'); return; }

  // Challenge: Prevent duplicate tasks
  const isDuplicate = tasks.some(t => t.text.toLowerCase() === clean.toLowerCase());
  if (isDuplicate) { showToast('This task already exists.', 'error'); return; }

  tasks.push({ id: Date.now(), text: clean, done: false });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.done = !task.done; saveTasks(); renderTasks(); }
}

function editTask(id, newText) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.text = newText; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function initTodo() {
  loadTasks();
  renderTasks();

  todoAddBtn.addEventListener('click', () => {
    addTask(todoInput.value);
    todoInput.value = '';
    todoInput.focus();
  });

  todoInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') todoAddBtn.click();
  });

  sortSelect.addEventListener('change', renderTasks);
}

/* -----------------------------------------------
   5. QUICK LINKS
   ----------------------------------------------- */
const linkNameInput = $('#link-name-input');
const linkUrlInput  = $('#link-url-input');
const linkAddBtn    = $('#link-add-btn');
const linksGrid     = $('#links-grid');
const linksEmpty    = $('#links-empty');

let links = [];  // [{ id, name, url }]

function saveLinks() {
  LS.set('quickLinks', links);
}

function loadLinks() {
  links = LS.get('quickLinks', []);
}

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  if (links.length === 0) {
    linksEmpty.style.display = 'block';
    return;
  }
  linksEmpty.style.display = 'none';

  links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';

    const a = document.createElement('a');
    a.href      = link.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.className = 'link-item';
    a.title     = link.url;

    const faviconSrc = getFavicon(link.url);
    if (faviconSrc) {
      const img = document.createElement('img');
      img.className = 'link-favicon';
      img.src = faviconSrc;
      img.alt = '';
      img.onerror = () => { img.style.display = 'none'; };
      a.appendChild(img);
    }

    const label = document.createElement('span');
    label.textContent = link.name;
    a.appendChild(label);

    // Delete button (inside anchor but stops propagation)
    const del = document.createElement('button');
    del.className   = 'delete-link-btn';
    del.textContent = '✕';
    del.title       = 'Remove link';
    del.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });
    a.appendChild(del);

    wrapper.appendChild(a);
    linksGrid.appendChild(wrapper);
  });
}

function addLink(name, url) {
  const cleanName = name.trim();
  const cleanUrl  = url.trim();

  if (!cleanName) { showToast('Please enter a site name.', 'error'); return; }
  if (!cleanUrl)  { showToast('Please enter a URL.', 'error'); return; }

  // Validate URL
  try { new URL(cleanUrl); } catch {
    showToast('Invalid URL. Include http:// or https://', 'error');
    return;
  }

  links.push({ id: Date.now(), name: cleanName, url: cleanUrl });
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

function initLinks() {
  loadLinks();
  renderLinks();

  linkAddBtn.addEventListener('click', () => {
    addLink(linkNameInput.value, linkUrlInput.value);
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkNameInput.focus();
  });

  linkUrlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') linkAddBtn.click();
  });
}

/* -----------------------------------------------
   6. TOAST NOTIFICATIONS
   ----------------------------------------------- */
function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = $('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;

  Object.assign(toast.style, {
    position:        'fixed',
    bottom:          '1.5rem',
    right:           '1.5rem',
    background:      type === 'error' ? 'var(--danger)' : 'var(--success)',
    color:           '#fff',
    padding:         '0.65rem 1.1rem',
    borderRadius:    '8px',
    fontSize:        '0.875rem',
    fontWeight:      '500',
    boxShadow:       '0 4px 16px rgba(0,0,0,0.2)',
    zIndex:          '9999',
    opacity:         '0',
    transform:       'translateY(8px)',
    transition:      'opacity 0.25s ease, transform 0.25s ease',
    maxWidth:        '320px',
    pointerEvents:   'none',
  });

  document.body.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto-remove after 2.8 s
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* -----------------------------------------------
   INIT — Bootstrap all modules
   ----------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGreeting();
  initTimer();
  initTodo();
  initLinks();
});
