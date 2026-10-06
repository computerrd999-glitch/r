/* =============================================================
   RUDRA GYM TRACKER — Complete Application Logic
   script.js
   
   Features:
   - 6-day workout routine with auto day mapping
   - Monthly calendar with 12 months + leap year support
   - Workout completion with permanent localStorage persistence
   - Custom exercise add/edit/delete
   - Monthly progress dashboard with circular progress
   - Streak system (rest days don't break streaks)
   - Workout history (chronological, protected)
   - Export/Import/Backup data
   - Protected double-confirmation reset
   - Live digital clock
   - Fully responsive navigation
   ============================================================= */

// =============================================
// 1. DEFAULT WORKOUT DATA
// =============================================

/**
 * Default 6-day workout plan.
 * Day numbers map to weekdays: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7(rest)
 */
const DEFAULT_WORKOUT_PLAN = {
  1: {
    name: 'Chest + Triceps',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 10, rest: 90, category: 'Chest', notes: '' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 12, rest: 60, category: 'Chest', notes: '' },
      { name: 'Chest Fly', sets: 3, reps: 12, rest: 60, category: 'Chest', notes: '' },
      { name: 'Triceps Pushdown', sets: 3, reps: 15, rest: 60, category: 'Arms', notes: '' },
      { name: 'Overhead Triceps Extension', sets: 3, reps: 12, rest: 60, category: 'Arms', notes: '' }
    ]
  },
  2: {
    name: 'Back + Biceps',
    exercises: [
      { name: 'Lat Pulldown', sets: 4, reps: 10, rest: 90, category: 'Back', notes: '' },
      { name: 'Seated Cable Row', sets: 3, reps: 12, rest: 60, category: 'Back', notes: '' },
      { name: 'One-arm Dumbbell Row', sets: 3, reps: 12, rest: 60, category: 'Back', notes: 'Each arm' },
      { name: 'Dumbbell Curl', sets: 3, reps: 12, rest: 60, category: 'Arms', notes: '' },
      { name: 'Hammer Curl', sets: 3, reps: 12, rest: 60, category: 'Arms', notes: '' }
    ]
  },
  3: {
    name: 'Legs',
    exercises: [
      { name: 'Squat / Leg Press', sets: 4, reps: 10, rest: 120, category: 'Legs', notes: '' },
      { name: 'Leg Extension', sets: 3, reps: 15, rest: 60, category: 'Legs', notes: '' },
      { name: 'Leg Curl', sets: 3, reps: 15, rest: 60, category: 'Legs', notes: '' },
      { name: 'Calf Raise', sets: 4, reps: 15, rest: 45, category: 'Legs', notes: '' }
    ]
  },
  4: {
    name: 'Shoulders + Arms',
    exercises: [
      { name: 'Shoulder Press', sets: 4, reps: 10, rest: 90, category: 'Shoulders', notes: '' },
      { name: 'Lateral Raise', sets: 3, reps: 15, rest: 45, category: 'Shoulders', notes: '' },
      { name: 'Rear Delt Fly', sets: 3, reps: 15, rest: 45, category: 'Shoulders', notes: '' },
      { name: 'Biceps Curl', sets: 3, reps: 12, rest: 60, category: 'Arms', notes: '' },
      { name: 'Triceps Pushdown', sets: 3, reps: 15, rest: 60, category: 'Arms', notes: '' }
    ]
  },
  5: {
    name: 'Core / Abs + Light Cardio',
    exercises: [
      { name: 'Plank', sets: 3, reps: 60, rest: 30, category: 'Core', notes: 'Hold for 60 seconds' },
      { name: 'Reverse Crunch', sets: 3, reps: 15, rest: 30, category: 'Core', notes: '' },
      { name: 'Leg Raise', sets: 3, reps: 15, rest: 30, category: 'Core', notes: '' },
      { name: 'Dead Bug', sets: 3, reps: 12, rest: 30, category: 'Core', notes: 'Each side' },
      { name: 'Bicycle Crunch', sets: 3, reps: 20, rest: 30, category: 'Core', notes: '' },
      { name: '10–15 min Light Cardio', sets: 1, reps: 1, rest: 0, category: 'Cardio', notes: 'Treadmill / cycling / walking' }
    ]
  },
  6: {
    name: 'Full Body',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 12, rest: 60, category: 'Legs', notes: '' },
      { name: 'Lat Pulldown', sets: 3, reps: 12, rest: 60, category: 'Back', notes: '' },
      { name: 'Dumbbell Press', sets: 3, reps: 12, rest: 60, category: 'Chest', notes: '' },
      { name: 'Cable Row', sets: 3, reps: 12, rest: 60, category: 'Back', notes: '' },
      { name: 'Plank', sets: 3, reps: 60, rest: 30, category: 'Core', notes: 'Hold for 60 seconds' }
    ]
  },
  7: {
    name: 'REST / RECOVERY',
    exercises: []
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// =============================================
// 2. DATA STORAGE (localStorage)
// =============================================

const STORAGE_KEY = 'rudraGymTrackerData';

/** Default app data structure */
function getDefaultData() {
  return {
    completedWorkouts: {},   // { "2026-10-05": { timestamp: "...", dayNum: 4, dayName: "..." } }
    customExercises: [],     // [{ id, name, day, category, sets, reps, rest, notes }]
    preferences: { defaultSets: 3, defaultReps: 12, defaultRest: 60 },
    bestStreak: 0
  };
}

/** Load data from localStorage */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle missing fields from older versions
      const defaults = getDefaultData();
      return {
        completedWorkouts: parsed.completedWorkouts || defaults.completedWorkouts,
        customExercises: parsed.customExercises || defaults.customExercises,
        preferences: { ...defaults.preferences, ...(parsed.preferences || {}) },
        bestStreak: parsed.bestStreak || defaults.bestStreak
      };
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return getDefaultData();
}

/** Save data to localStorage */
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error('Error saving data:', e);
    showToast('Error saving data!', 'error');
  }
}

// Load app data on startup
let appData = loadData();

// =============================================
// 3. UTILITY FUNCTIONS
// =============================================

/** Format date as "YYYY-MM-DD" */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format date as "05 October 2026" */
function formatDateDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = MONTH_NAMES[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

/** Format date as "Monday, 05 October 2026" */
function formatDateFull(date) {
  return `${DAY_NAMES[date.getDay()]}, ${formatDateDisplay(date)}`;
}

/**
 * Get the workout day number (1-7) for a given JS Date.
 * Monday=1 ... Saturday=6, Sunday=7
 */
function getWorkoutDayNum(date) {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return jsDay === 0 ? 7 : jsDay;
}

/** Check if a workout day number is a rest day */
function isRestDay(dayNum) {
  return dayNum === 7;
}

/** Get the workout plan for a given day number (including custom exercises) */
function getWorkoutForDay(dayNum) {
  const base = DEFAULT_WORKOUT_PLAN[dayNum];
  if (!base) return null;

  // Merge custom exercises for this day
  const customForDay = appData.customExercises.filter(ex => ex.day === dayNum);
  return {
    name: base.name,
    exercises: [...base.exercises, ...customForDay]
  };
}

/** Get number of days in a month (handles leap years) */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Check if a date key is completed */
function isCompleted(dateKey) {
  return !!appData.completedWorkouts[dateKey];
}

/** Generate a simple unique ID */
function generateId() {
  return 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// =============================================
// 4. TOAST NOTIFICATIONS
// =============================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// =============================================
// 5. NAVIGATION
// =============================================

/** Switch between pages */
function navigateTo(pageName) {
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');

  // Update sidebar nav
  document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`.sidebar .nav-link[data-page="${pageName}"]`).forEach(l => l.classList.add('active'));

  // Update bottom nav
  document.querySelectorAll('.btm-nav-item').forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`.btm-nav-item[data-page="${pageName}"]`).forEach(l => l.classList.add('active'));

  // Refresh the page content
  switch (pageName) {
    case 'home': renderHomePage(); break;
    case 'calendar': renderCalendar(); break;
    case 'workout': renderWorkoutPlan(); break;
    case 'progress': renderProgressPage(); break;
    case 'settings': break; // Static, no dynamic render needed
  }

  // Scroll to top
  document.getElementById('main-content').scrollTop = 0;
  window.scrollTo(0, 0);
}

// Bind navigation clicks (sidebar + bottom nav)
function initNavigation() {
  // Sidebar navigation
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Bottom navigation
  document.querySelectorAll('.btm-nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });
}

// =============================================
// 6. LIVE CLOCK (Premium Aesthetic)
// =============================================

/** Previous digit values to detect changes for flip animation */
let prevDigits = { h1: '', h2: '', m1: '', m2: '', s1: '', s2: '' };

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  // Update each digit with flip animation on change
  const digits = { h1: h[0], h2: h[1], m1: m[0], m2: m[1], s1: s[0], s2: s[1] };
  Object.keys(digits).forEach(key => {
    const el = document.getElementById('clock-' + key);
    if (el && digits[key] !== prevDigits[key]) {
      el.textContent = digits[key];
      el.classList.add('flip');
      setTimeout(() => el.classList.remove('flip'), 150);
    }
  });
  prevDigits = { ...digits };

  // AM/PM indicator (24h format label)
  const ampmEl = document.getElementById('clock-ampm');
  if (ampmEl) {
    ampmEl.textContent = now.getHours() >= 12 ? 'PM' : 'AM';
  }

  // Day name
  const dayNameEl = document.getElementById('clock-day-name');
  if (dayNameEl) dayNameEl.textContent = DAY_NAMES[now.getDay()];

  // Full date
  const fullDateEl = document.getElementById('clock-full-date');
  if (fullDateEl) fullDateEl.textContent = formatDateDisplay(now);

  // Greeting based on time of day
  const greetingEl = document.getElementById('clock-greeting');
  if (greetingEl) {
    const hour = now.getHours();
    let greeting = '';
    if (hour >= 5 && hour < 12) greeting = '🌅 Good Morning — Rise and grind!';
    else if (hour >= 12 && hour < 17) greeting = '☀️ Good Afternoon — Stay strong!';
    else if (hour >= 17 && hour < 21) greeting = '🌇 Good Evening — Finish strong!';
    else greeting = '🌙 Night Owl — Rest well, recover hard!';
    greetingEl.textContent = greeting;
  }
}

// =============================================
// 7. HOME PAGE
// =============================================

function renderHomePage() {
  const today = new Date();
  const dateKey = formatDateKey(today);
  const dayNum = getWorkoutDayNum(today);
  const workout = getWorkoutForDay(dayNum);
  const completed = isCompleted(dateKey);

  // Date display
  document.getElementById('today-date').textContent = formatDateFull(today);

  // Day label
  const dayLabel = document.getElementById('today-day-label');
  if (isRestDay(dayNum)) {
    dayLabel.textContent = 'Day 7 — REST / RECOVERY';
  } else {
    dayLabel.textContent = `Day ${dayNum} — ${workout.name}`;
  }

  // Status badge
  const statusEl = document.getElementById('today-status');
  if (completed) {
    statusEl.innerHTML = '<span class="status-badge completed">✓ Completed</span>';
  } else if (isRestDay(dayNum)) {
    statusEl.innerHTML = '<span class="status-badge rest">😴 Rest Day</span>';
  } else {
    statusEl.innerHTML = '';
  }

  // Exercises list
  const exercisesEl = document.getElementById('today-exercises');
  if (isRestDay(dayNum)) {
    exercisesEl.innerHTML = `
      <div style="text-align:center; padding:24px 0; color:var(--text-secondary);">
        <div style="font-size:2.5rem; margin-bottom:8px;">😴</div>
        <p>Today is your rest day. Let your muscles recover!</p>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">Stretch, hydrate, and get some quality sleep.</p>
      </div>`;
  } else {
    exercisesEl.innerHTML = workout.exercises.map(ex => `
      <div class="exercise-row">
        <div>
          <div class="exercise-name">${ex.name}</div>
          ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
        </div>
        <div class="exercise-detail">${ex.sets} × ${ex.reps} | ${ex.rest}s rest</div>
      </div>
    `).join('');
  }

  // Action button
  const actionEl = document.getElementById('today-action');
  if (isRestDay(dayNum)) {
    actionEl.innerHTML = '';
  } else if (completed) {
    actionEl.innerHTML = '<p style="color:var(--green); font-weight:600; font-size:0.9rem;">✓ Workout completed for today!</p>';
  } else {
    actionEl.innerHTML = '<button class="btn-complete" id="btn-complete-today" onclick="completeToday()">✓ COMPLETE WORKOUT</button>';
  }

  // Quick stats
  updateHomeStats();
}

/** Update the 4 quick stat cards on home page */
function updateHomeStats() {
  const today = new Date();
  const streakData = calculateStreak();
  const monthStats = getMonthStats(today.getFullYear(), today.getMonth());

  document.getElementById('home-streak').textContent = streakData.current;
  document.getElementById('home-best-streak').textContent = streakData.best;
  document.getElementById('home-completed').textContent = monthStats.completed;
  document.getElementById('home-progress').textContent = monthStats.workoutDays > 0
    ? Math.round((monthStats.completed / monthStats.workoutDays) * 100) + '%'
    : '0%';
}

/** Mark today's workout as complete */
function completeToday() {
  const today = new Date();
  const dateKey = formatDateKey(today);
  const dayNum = getWorkoutDayNum(today);

  if (isRestDay(dayNum)) {
    showToast('Today is a rest day!', 'info');
    return;
  }

  if (isCompleted(dateKey)) {
    showToast('Already completed!', 'info');
    return;
  }

  const workout = getWorkoutForDay(dayNum);

  // Save completion permanently
  appData.completedWorkouts[dateKey] = {
    timestamp: new Date().toISOString(),
    dayNum: dayNum,
    dayName: workout.name
  };

  // Update best streak
  const streakData = calculateStreak();
  if (streakData.current > appData.bestStreak) {
    appData.bestStreak = streakData.current;
  }

  saveData();
  showToast('🎉 Workout completed! Great job!', 'success');
  renderHomePage();
}

// =============================================
// 8. CALENDAR PAGE
// =============================================

// Currently viewed month/year for the calendar
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();

function initCalendar() {
  // Set initial month/year
  document.getElementById('month-select').value = calMonth;

  // Populate year dropdown (current year -2 to +5)
  const yearSelect = document.getElementById('year-select');
  const thisYear = new Date().getFullYear();
  yearSelect.innerHTML = '';
  for (let y = thisYear - 2; y <= thisYear + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === calYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  // Event listeners
  document.getElementById('month-select').addEventListener('change', function () {
    calMonth = parseInt(this.value);
    renderCalendar();
  });
  document.getElementById('year-select').addEventListener('change', function () {
    calYear = parseInt(this.value);
    renderCalendar();
  });
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    document.getElementById('month-select').value = calMonth;
    document.getElementById('year-select').value = calYear;
    renderCalendar();
  });
  document.getElementById('btn-next-month').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    document.getElementById('month-select').value = calMonth;
    document.getElementById('year-select').value = calYear;
    renderCalendar();
  });
}

function renderCalendar() {
  const container = document.getElementById('calendar-days');
  container.innerHTML = '';

  const today = new Date();
  const todayKey = formatDateKey(today);
  const totalDays = getDaysInMonth(calYear, calMonth);

  // First day of month — which weekday? (0=Sun..6=Sat → convert to Mon-start: Mon=0..Sun=6)
  const firstDayJS = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const firstDayMon = firstDayJS === 0 ? 6 : firstDayJS - 1;  // Mon=0, Sun=6

  // Add empty cells before the first day
  for (let i = 0; i < firstDayMon; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  // Stats counters for the summary
  let monthCompleted = 0;
  let monthWorkoutDays = 0;
  let monthRestDays = 0;

  // Add each day of the month
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(calYear, calMonth, d);
    const dateKey = formatDateKey(date);
    const dayNum = getWorkoutDayNum(date);
    const rest = isRestDay(dayNum);
    const completed = isCompleted(dateKey);
    const isToday = dateKey === todayKey;

    if (rest) monthRestDays++;
    else monthWorkoutDays++;
    if (completed) monthCompleted++;

    // Determine CSS class
    let cls = 'cal-day';
    if (completed) cls += ' completed';
    else if (rest) cls += ' rest';
    else cls += ' planned';
    if (isToday) cls += ' today';

    const cell = document.createElement('div');
    cell.className = cls;
    cell.innerHTML = `<span class="cal-num">${d}</span><span class="cal-dot"></span>`;
    cell.title = `${d} ${MONTH_NAMES[calMonth]} — ${DAY_NAMES[date.getDay()]} — Day ${dayNum}: ${DEFAULT_WORKOUT_PLAN[dayNum].name}`;
    cell.addEventListener('click', () => openDayDetail(date));
    container.appendChild(cell);
  }

  // Render month summary
  const remaining = monthWorkoutDays - monthCompleted;
  const pct = monthWorkoutDays > 0 ? Math.round((monthCompleted / monthWorkoutDays) * 100) : 0;
  document.getElementById('calendar-month-summary').innerHTML = `
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-val accent">${monthWorkoutDays}</div>
        <div class="summary-lbl">Workout Days</div>
      </div>
      <div class="summary-item">
        <div class="summary-val green">${monthCompleted}</div>
        <div class="summary-lbl">Completed</div>
      </div>
      <div class="summary-item">
        <div class="summary-val" style="color:var(--yellow)">${remaining < 0 ? 0 : remaining}</div>
        <div class="summary-lbl">Remaining</div>
      </div>
      <div class="summary-item">
        <div class="summary-val blue">${monthRestDays}</div>
        <div class="summary-lbl">Rest Days</div>
      </div>
      <div class="summary-item">
        <div class="summary-val accent">${pct}%</div>
        <div class="summary-lbl">Progress</div>
      </div>
    </div>`;
}

/** Open the day detail modal when clicking a calendar date */
function openDayDetail(date) {
  const dateKey = formatDateKey(date);
  const dayNum = getWorkoutDayNum(date);
  const workout = getWorkoutForDay(dayNum);
  const completed = isCompleted(dateKey);
  const rest = isRestDay(dayNum);

  // Modal title
  document.getElementById('modal-day-title').textContent = formatDateDisplay(date);

  // Body content
  const body = document.getElementById('modal-day-body');
  let html = `<p class="day-detail-date">${DAY_NAMES[date.getDay()]}</p>`;

  if (rest) {
    html += `<p class="day-detail-label">Day 7 — REST / RECOVERY</p>`;
    html += `<div style="text-align:center; padding:16px; color:var(--text-secondary);">
               <div style="font-size:2rem; margin-bottom:8px;">😴</div>
               <p>Rest & Recovery Day</p>
             </div>`;
  } else {
    html += `<p class="day-detail-label">Day ${dayNum} — ${workout.name}</p>`;
    html += '<div class="day-detail-exercises">';
    workout.exercises.forEach(ex => {
      html += `
        <div class="exercise-row">
          <div>
            <div class="exercise-name">${ex.name}</div>
            ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
          </div>
          <div class="exercise-detail">${ex.sets} × ${ex.reps} | ${ex.rest}s</div>
        </div>`;
    });
    html += '</div>';
  }
  body.innerHTML = html;

  // Action area
  const actionEl = document.getElementById('modal-day-action');
  if (rest) {
    actionEl.innerHTML = '';
  } else if (completed) {
    const record = appData.completedWorkouts[dateKey];
    const ts = record && record.timestamp ? new Date(record.timestamp).toLocaleString() : '';
    actionEl.innerHTML = `
      <p style="color:var(--green); font-weight:600;">✓ Completed</p>
      ${ts ? `<p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Completed: ${ts}</p>` : ''}`;
  } else {
    // Only allow completion if date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateNorm = new Date(date);
    dateNorm.setHours(0, 0, 0, 0);

    if (dateNorm <= today) {
      actionEl.innerHTML = `<button class="btn-complete" onclick="completeDateFromModal('${dateKey}', ${dayNum})">✓ COMPLETE WORKOUT</button>`;
    } else {
      actionEl.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">Future workout — cannot mark complete yet.</p>`;
    }
  }

  openModal('modal-day-detail');
}

/** Complete a workout from the day detail modal */
function completeDateFromModal(dateKey, dayNum) {
  if (isCompleted(dateKey)) {
    showToast('Already completed!', 'info');
    return;
  }

  const workout = getWorkoutForDay(dayNum);
  appData.completedWorkouts[dateKey] = {
    timestamp: new Date().toISOString(),
    dayNum: dayNum,
    dayName: workout.name
  };

  // Update best streak
  const streakData = calculateStreak();
  if (streakData.current > appData.bestStreak) {
    appData.bestStreak = streakData.current;
  }

  saveData();
  showToast('🎉 Workout completed!', 'success');
  closeModal('modal-day-detail');
  renderCalendar();
  // Also refresh home page stats if visible
  updateHomeStats();
}

// =============================================
// 9. WORKOUT PLAN PAGE
// =============================================

function renderWorkoutPlan() {
  const container = document.getElementById('workout-plan');
  let html = '';

  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const workout = getWorkoutForDay(dayNum);
    const rest = isRestDay(dayNum);

    html += `<div class="workout-day-card glass-card">`;
    html += `<div class="workout-day-header">`;
    html += `<div class="workout-day-title"><span class="day-num">DAY ${dayNum}</span> — ${workout.name}</div>`;
    html += `<span class="workout-day-badge ${rest ? 'badge-rest' : 'badge-workout'}">${rest ? 'REST' : 'WORKOUT'}</span>`;
    html += `</div>`;

    if (rest) {
      html += `<div class="rest-message"><span class="rest-emoji">😴</span>Rest & Recovery. Let your muscles repair and grow stronger.</div>`;
    } else {
      html += `<div class="workout-exercises-list">`;
      workout.exercises.forEach(ex => {
        html += `
          <div class="exercise-row">
            <div>
              <div class="exercise-name">${ex.name}</div>
              ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
            </div>
            <div class="exercise-detail">${ex.sets} × ${ex.reps} | ${ex.rest}s rest</div>
          </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  }

  container.innerHTML = html;
}

// =============================================
// 10. PROGRESS PAGE
// =============================================

function getMonthStats(year, month) {
  const totalDays = getDaysInMonth(year, month);
  let workoutDays = 0;
  let restDays = 0;
  let completed = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dayNum = getWorkoutDayNum(date);
    const dateKey = formatDateKey(date);

    if (isRestDay(dayNum)) {
      restDays++;
    } else {
      workoutDays++;
      if (isCompleted(dateKey)) completed++;
    }
  }

  return { workoutDays, restDays, completed, remaining: workoutDays - completed, totalDays };
}

function renderProgressPage() {
  const today = new Date();
  const stats = getMonthStats(today.getFullYear(), today.getMonth());
  const pct = stats.workoutDays > 0 ? Math.round((stats.completed / stats.workoutDays) * 100) : 0;

  // Month title
  document.getElementById('progress-month-title').textContent = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  // Stats
  document.getElementById('ps-total').textContent = stats.workoutDays;
  document.getElementById('ps-completed').textContent = stats.completed;
  document.getElementById('ps-remaining').textContent = stats.remaining < 0 ? 0 : stats.remaining;
  document.getElementById('ps-rest').textContent = stats.restDays;

  // Progress percentage text
  document.getElementById('progress-pct').textContent = pct + '%';

  // Circular progress (SVG stroke offset)
  const circle = document.getElementById('progress-circle');
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (pct / 100) * circumference;
  // Use setTimeout to trigger the CSS transition
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);

  // Progress bar
  setTimeout(() => {
    document.getElementById('progress-bar-fill').style.width = pct + '%';
  }, 100);

  // Streak
  const streakData = calculateStreak();
  document.getElementById('streak-current').textContent = streakData.current;
  document.getElementById('streak-best-val').textContent = streakData.best;

  // History
  renderHistory();
}

// =============================================
// 11. STREAK SYSTEM
// =============================================

/**
 * Calculate current and best workout streaks.
 * Rest days do NOT break the streak.
 * Streak counts consecutive SCHEDULED workout days that were completed.
 */
function calculateStreak() {
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk backwards from today counting consecutive completed workout days
  let checkDate = new Date(today);

  // First, if today is a rest day, step back to the last non-rest day
  // If today is a workout day but NOT completed yet, start checking from yesterday
  let todayDayNum = getWorkoutDayNum(checkDate);
  if (!isRestDay(todayDayNum) && !isCompleted(formatDateKey(checkDate))) {
    // Today is a workout day but not done yet — start from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Now count the streak
  while (true) {
    const dayNum = getWorkoutDayNum(checkDate);
    const dateKey = formatDateKey(checkDate);

    if (isRestDay(dayNum)) {
      // Skip rest days — they don't break or count toward streak
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (isCompleted(dateKey)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }

    // Safety limit — don't go back more than 365 days
    const diff = Math.floor((today - checkDate) / (1000 * 60 * 60 * 24));
    if (diff > 365) break;
  }

  // Calculate best streak from all history
  let best = appData.bestStreak || 0;
  if (current > best) best = current;

  return { current, best };
}

// =============================================
// 12. WORKOUT HISTORY
// =============================================

function renderHistory() {
  const historyList = document.getElementById('history-list');
  const entries = Object.entries(appData.completedWorkouts);

  if (entries.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No completed workouts yet. Start your journey today!</p>';
    return;
  }

  // Sort by date descending (newest first)
  entries.sort((a, b) => b[0].localeCompare(a[0]));

  let html = '';
  entries.forEach(([dateKey, record]) => {
    const parts = dateKey.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayNum = record.dayNum || getWorkoutDayNum(date);
    const dayName = record.dayName || DEFAULT_WORKOUT_PLAN[dayNum].name;

    html += `
      <div class="history-item">
        <span class="history-check">✓</span>
        <div class="history-info">
          <div class="history-date">${formatDateDisplay(date)}</div>
          <div class="history-workout">Day ${dayNum} — ${dayName}</div>
        </div>
      </div>`;
  });

  historyList.innerHTML = html;
}

// =============================================
// 13. CUSTOM EXERCISES (Add / Edit / Delete)
// =============================================

function initExerciseForm() {
  const form = document.getElementById('form-exercise');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveExercise();
  });
}

/** Open add exercise modal (fresh) */
function openAddExercise() {
  document.getElementById('modal-exercise-title').textContent = 'Add Custom Exercise';
  document.getElementById('btn-save-exercise').textContent = 'Save Exercise';
  document.getElementById('form-exercise').reset();
  document.getElementById('inp-ex-edit-id').value = '';

  // Apply default preferences
  document.getElementById('inp-ex-sets').value = appData.preferences.defaultSets;
  document.getElementById('inp-ex-reps').value = appData.preferences.defaultReps;
  document.getElementById('inp-ex-rest').value = appData.preferences.defaultRest;

  openModal('modal-exercise');
}

/** Open edit exercise modal (pre-filled) */
function openEditExercise(exId) {
  const exercise = appData.customExercises.find(ex => ex.id === exId);
  if (!exercise) return;

  document.getElementById('modal-exercise-title').textContent = 'Edit Exercise';
  document.getElementById('btn-save-exercise').textContent = 'Update Exercise';
  document.getElementById('inp-ex-edit-id').value = exId;
  document.getElementById('inp-ex-name').value = exercise.name;
  document.getElementById('inp-ex-day').value = exercise.day;
  document.getElementById('inp-ex-category').value = exercise.category;
  document.getElementById('inp-ex-sets').value = exercise.sets;
  document.getElementById('inp-ex-reps').value = exercise.reps;
  document.getElementById('inp-ex-rest').value = exercise.rest;
  document.getElementById('inp-ex-notes').value = exercise.notes || '';

  openModal('modal-exercise');
}

/** Save or update a custom exercise */
function saveExercise() {
  const editId = document.getElementById('inp-ex-edit-id').value;
  const name = document.getElementById('inp-ex-name').value.trim();
  const day = parseInt(document.getElementById('inp-ex-day').value);
  const category = document.getElementById('inp-ex-category').value;
  const sets = parseInt(document.getElementById('inp-ex-sets').value) || 3;
  const reps = parseInt(document.getElementById('inp-ex-reps').value) || 12;
  const rest = parseInt(document.getElementById('inp-ex-rest').value) || 60;
  const notes = document.getElementById('inp-ex-notes').value.trim();

  if (!name) {
    showToast('Please enter an exercise name!', 'warning');
    return;
  }

  if (editId) {
    // Update existing exercise
    const idx = appData.customExercises.findIndex(ex => ex.id === editId);
    if (idx !== -1) {
      appData.customExercises[idx] = { id: editId, name, day, category, sets, reps, rest, notes };
      showToast('Exercise updated!', 'success');
    }
  } else {
    // Add new exercise
    appData.customExercises.push({
      id: generateId(),
      name, day, category, sets, reps, rest, notes
    });
    showToast('Exercise added!', 'success');
  }

  saveData();
  closeModal('modal-exercise');

  // Refresh relevant pages
  renderWorkoutPlan();
  renderHomePage();
}

/** Delete a custom exercise (only from edit modal) */
function deleteCustomExercise(exId) {
  if (!confirm('Delete this custom exercise?')) return;

  appData.customExercises = appData.customExercises.filter(ex => ex.id !== exId);
  saveData();
  showToast('Exercise deleted.', 'info');

  // Re-render the edit exercises list
  renderEditExercisesList();
  renderWorkoutPlan();
  renderHomePage();
}

/** Render the list inside the Edit Exercises modal */
function renderEditExercisesList() {
  const container = document.getElementById('edit-exercises-body');

  if (appData.customExercises.length === 0) {
    container.innerHTML = '<p class="empty-state">No custom exercises added yet.</p>';
    return;
  }

  let html = '';
  appData.customExercises.forEach(ex => {
    const dayInfo = DEFAULT_WORKOUT_PLAN[ex.day];
    html += `
      <div class="edit-ex-item">
        <div class="edit-ex-info">
          <div class="edit-ex-name">${ex.name}</div>
          <div class="edit-ex-meta">Day ${ex.day} — ${dayInfo.name} | ${ex.category} | ${ex.sets}×${ex.reps} | ${ex.rest}s rest</div>
          ${ex.notes ? `<div class="edit-ex-meta" style="font-style:italic;">${ex.notes}</div>` : ''}
        </div>
        <div class="edit-ex-actions">
          <button class="btn-edit-ex" onclick="closeModal('modal-edit-exercises'); openEditExercise('${ex.id}')">Edit</button>
          <button class="btn-del-ex" onclick="deleteCustomExercise('${ex.id}')">Delete</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

// =============================================
// 14. MODALS
// =============================================

function openModal(modalId) {
  document.getElementById(modalId).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
  document.body.style.overflow = '';
}

function initModals() {
  // Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      if (modalId) closeModal(modalId);
    });
  });

  // Click outside to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
}

// =============================================
// 15. SETTINGS
// =============================================

function initSettings() {
  // Add custom workout → opens add exercise modal
  document.getElementById('set-add-workout').addEventListener('click', openAddExercise);
  document.getElementById('btn-open-add-exercise').addEventListener('click', openAddExercise);

  // Edit workouts → opens edit exercises list modal
  document.getElementById('set-edit-workout').addEventListener('click', () => {
    renderEditExercisesList();
    openModal('modal-edit-exercises');
  });

  // Preferences
  document.getElementById('set-preferences').addEventListener('click', () => {
    document.getElementById('pref-sets').value = appData.preferences.defaultSets;
    document.getElementById('pref-reps').value = appData.preferences.defaultReps;
    document.getElementById('pref-rest').value = appData.preferences.defaultRest;
    openModal('modal-preferences');
  });

  document.getElementById('btn-save-prefs').addEventListener('click', () => {
    appData.preferences.defaultSets = parseInt(document.getElementById('pref-sets').value) || 3;
    appData.preferences.defaultReps = parseInt(document.getElementById('pref-reps').value) || 12;
    appData.preferences.defaultRest = parseInt(document.getElementById('pref-rest').value) || 60;
    saveData();
    showToast('Preferences saved!', 'success');
    closeModal('modal-preferences');
  });

  // Backup
  document.getElementById('set-backup').addEventListener('click', exportData);

  // Export
  document.getElementById('set-export').addEventListener('click', exportData);

  // Import
  document.getElementById('set-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', handleImport);

  // Reset — protected double confirmation
  initResetFlow();
}

// =============================================
// 16. EXPORT / IMPORT
// =============================================

function exportData() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  a.download = `rudra-gym-backup-${formatDateKey(now)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Data exported successfully!', 'success');
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const imported = JSON.parse(event.target.result);

      // Validate structure
      if (!imported.completedWorkouts || typeof imported.completedWorkouts !== 'object') {
        throw new Error('Invalid data format');
      }

      // Merge imported data (don't overwrite existing completions)
      const mergedCompleted = { ...appData.completedWorkouts };
      Object.entries(imported.completedWorkouts).forEach(([key, val]) => {
        if (!mergedCompleted[key]) {
          mergedCompleted[key] = val;
        }
      });
      appData.completedWorkouts = mergedCompleted;

      // Merge custom exercises (avoid duplicates by ID)
      if (imported.customExercises && Array.isArray(imported.customExercises)) {
        const existingIds = new Set(appData.customExercises.map(ex => ex.id));
        imported.customExercises.forEach(ex => {
          if (!existingIds.has(ex.id)) {
            appData.customExercises.push(ex);
          }
        });
      }

      // Import preferences
      if (imported.preferences) {
        appData.preferences = { ...appData.preferences, ...imported.preferences };
      }

      // Import best streak
      if (imported.bestStreak && imported.bestStreak > appData.bestStreak) {
        appData.bestStreak = imported.bestStreak;
      }

      saveData();
      showToast('Data imported successfully!', 'success');

      // Refresh all views
      renderHomePage();
      renderCalendar();
      renderWorkoutPlan();

    } catch (err) {
      console.error('Import error:', err);
      showToast('Invalid backup file!', 'error');
    }
  };
  reader.readAsText(file);

  // Reset file input so same file can be imported again
  e.target.value = '';
}

// =============================================
// 17. PROTECTED RESET (Double Confirmation)
// =============================================

function initResetFlow() {
  const resetInput = document.getElementById('reset-input');
  const btnStep1 = document.getElementById('btn-reset-step1');
  const step1 = document.getElementById('reset-step1');
  const step2 = document.getElementById('reset-step2');

  // Open reset modal
  document.getElementById('set-reset').addEventListener('click', () => {
    // Reset the modal to step 1
    resetInput.value = '';
    btnStep1.disabled = true;
    step1.classList.remove('hidden');
    step2.classList.add('hidden');
    openModal('modal-reset');
  });

  // Enable step 1 button only when user types "RESET"
  resetInput.addEventListener('input', () => {
    btnStep1.disabled = resetInput.value.trim() !== 'RESET';
  });

  // Step 1 → Step 2
  btnStep1.addEventListener('click', () => {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
  });

  // Final reset
  document.getElementById('btn-reset-final').addEventListener('click', () => {
    // Delete all data
    appData = getDefaultData();
    saveData();

    showToast('All data has been reset.', 'warning');
    closeModal('modal-reset');

    // Refresh everything
    renderHomePage();
    renderCalendar();
    renderWorkoutPlan();
  });

  // Cancel
  document.getElementById('btn-reset-cancel').addEventListener('click', () => {
    closeModal('modal-reset');
  });
}

// =============================================
// 18. INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function () {
  // Initialize all systems
  initNavigation();
  initModals();
  initCalendar();
  initExerciseForm();
  initSettings();

  // Render home page
  renderHomePage();

  // Start the live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Pre-render calendar for when user navigates to it
  renderCalendar();
});
