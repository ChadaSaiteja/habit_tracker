const STORAGE_KEY = "habit-tracker-lite.v2";
const SUGGESTED_HABITS = ["Workout", "Reading", "Meditation", "Sleep by 11"];

const app = document.querySelector("#app");

if (!app) {
  throw new Error("App root not found.");
}

const state = {
  tracker: loadTracker(),
  selectedMonth: monthKey(new Date()),
  dragHabitId: null,
  editingHabitId: null,
  storageAvailable: true
};

render();

app.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-add-form]")) {
    return;
  }

  event.preventDefault();
  const input = event.target.querySelector("input[name='habit']");
  const value = input instanceof HTMLInputElement ? input.value.trim() : "";
  if (!value) {
    return;
  }

  addHabit(value);
  event.target.reset();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.matches("[data-toggle]")) {
    return;
  }

  toggleCompletion(target.dataset.habitId || "", target.dataset.dayKey || "", target.checked);
});

app.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest("[data-action]") : null;
  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "prev-month") {
    state.selectedMonth = shiftMonth(state.selectedMonth, -1);
    render();
    return;
  }

  if (action === "next-month") {
    const next = shiftMonth(state.selectedMonth, 1);
    if (next <= monthKey(new Date())) {
      state.selectedMonth = next;
      render();
    }
    return;
  }

  if (action === "remove-habit") {
    removeHabit(target.dataset.habitId || "");
    return;
  }

  if (action === "start-edit") {
    state.editingHabitId = target.dataset.habitId || null;
    render();

    if (state.editingHabitId) {
      requestAnimationFrame(() => {
        const editInput = app.querySelector(`[data-edit-form][data-habit-id="${state.editingHabitId}"] input[name='habitName']`);
        if (editInput instanceof HTMLInputElement) {
          editInput.focus();
          editInput.select();
        }
      });
    }
    return;
  }

  if (action === "cancel-edit") {
    state.editingHabitId = null;
    render();
    return;
  }

  if (action === "add-suggestion") {
    addHabit(target.dataset.name || "");
    return;
  }
});

app.addEventListener("dragstart", (event) => {
  const row = event.target instanceof HTMLElement ? event.target.closest("[data-habit-row]") : null;
  if (!row) {
    return;
  }

  state.dragHabitId = row.dataset.habitRow || null;
  row.classList.add("is-dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", state.dragHabitId || "");
  }
});

app.addEventListener("dragover", (event) => {
  const row = event.target instanceof HTMLElement ? event.target.closest("[data-habit-row]") : null;
  if (!row || !state.dragHabitId || row.dataset.habitRow === state.dragHabitId) {
    return;
  }

  event.preventDefault();
  clearDragTargets();
  row.classList.add("drag-target");
});

app.addEventListener("drop", (event) => {
  const row = event.target instanceof HTMLElement ? event.target.closest("[data-habit-row]") : null;
  if (!row || !state.dragHabitId) {
    return;
  }

  event.preventDefault();
  moveHabit(state.dragHabitId, row.dataset.habitRow || "");
});

app.addEventListener("dragend", () => {
  state.dragHabitId = null;
  clearDragTargets();
  app.querySelectorAll(".task-row.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
});

app.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-edit-form]")) {
    return;
  }

  event.preventDefault();
  const habitId = event.target.dataset.habitId || "";
  const input = event.target.querySelector("input[name='habitName']");
  const value = input instanceof HTMLInputElement ? input.value.trim() : "";
  renameHabit(habitId, value);
});

function render() {
  const today = new Date();
  const todayKey = dateKey(today);
  const currentMonth = monthKey(today);
  const days = getMonthDays(state.selectedMonth);
  const summary = getSummary(days, todayKey);

  const streakEmoji = summary.bestStreak >= 7 ? "🔥" : summary.bestStreak >= 3 ? "✨" : "💫";
  const consistencyColor = summary.consistency >= 80 ? "#3ecf8e" : summary.consistency >= 50 ? "#f4b860" : "#f87171";

  app.innerHTML = `
    <main class="shell">
      ${state.storageAvailable ? "" : `
        <section class="panel storage-warning" role="status" aria-live="polite">
          <strong>Storage is unavailable.</strong>
          <p>Your habits may not be saved in this browser session.</p>
        </section>
      `}

      <section class="panel hero">
        <div class="hero-inner">
          <div>
            <div class="hero-brand">
              <span class="hero-icon">📋</span>
              <div>
                <h1>Habit Tracker</h1>
                <p class="hero-tagline">Build streaks. Stay consistent. Own your day.</p>
              </div>
            </div>
            <div class="hero-stats">
              <span class="stat-chip"><span class="stat-icon">✅</span> Today: ${summary.todayDone} / ${summary.totalHabits}</span>
              <span class="stat-chip" style="color:${consistencyColor}; border-color:${consistencyColor}40;"><span class="stat-icon">📊</span> Consistency: ${summary.consistency}%</span>
              <span class="stat-chip"><span class="stat-icon">${streakEmoji}</span> Best streak: ${summary.bestStreak} day${summary.bestStreak !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel controls">
        <div class="controls-top">
          <div class="controls-label">
            <strong>📅 Monthly Sheet</strong>
            <small>${formatMonth(state.selectedMonth)} &nbsp;·&nbsp; only today is editable</small>
          </div>
          <div class="month-bar">
            <button type="button" data-action="prev-month">← Prev</button>
            <strong>${formatMonth(state.selectedMonth)}</strong>
            <button type="button" data-action="next-month" ${state.selectedMonth < currentMonth ? "" : "disabled"}>Next →</button>
          </div>
        </div>

        <form class="add-form" data-add-form>
          <input type="text" name="habit" maxlength="50" placeholder="+ Add a new habit or task…" aria-label="Add a task or habit" />
          <button type="submit">Add</button>
        </form>
      </section>

      <section class="panel">
        ${
          state.tracker.habits.length === 0
            ? renderEmpty()
            : `
              <div class="sheet-wrap">
                <table class="sheet" aria-label="Habit tracker sheet">
                  <thead>
                    <tr>
                      <th class="task-col">Habit</th>
                      ${days.map((day) => renderHeaderCell(day, todayKey)).join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${state.tracker.habits.map((habit) => renderHabitRow(habit, days, todayKey)).join("")}
                  </tbody>
                </table>
              </div>
              <div class="legend">
                <span><i class="done"></i> Completed</span>
                <span><i class="today"></i> Today</span>
                <span><i class="future"></i> Future</span>
              </div>
            `
        }
      </section>

      <section class="panel chart-panel">
        <div class="chart-head">
          <div class="chart-head-text">
            <h2>📈 Daily Progress</h2>
            <p>Habit completions per day for ${formatMonth(state.selectedMonth)}</p>
          </div>
          <span class="chart-badge">${summary.consistency}% this month</span>
        </div>
        <div class="chart-box">
          ${renderGraph(summary.dailyCounts)}
        </div>
      </section>
    </main>
  `;
}

function renderEmpty() {
  return `
    <div class="empty-state">
      <div class="empty-icon">🌱</div>
      <strong>No habits yet — let's start!</strong>
      <p>Add your first habit below, or pick a suggestion to get going straight away.</p>
      <div class="suggestions">
        ${SUGGESTED_HABITS.map((name) => `
          <button type="button" data-action="add-suggestion" data-name="${escapeHtml(name)}">+ ${escapeHtml(name)}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderHeaderCell(day, todayKey) {
  const isToday = day.key === todayKey;
  return `
    <th class="date-head ${isToday ? "is-today" : ""}" title="${day.key}${isToday ? " — Today" : ""}">
      <div>${day.day}</div>
    </th>
  `;
}

function renderHabitRow(habit, days, todayKey) {
  const streakAnchor = monthKeyFromDateKey(todayKey) === state.selectedMonth ? todayKey : lastDayOfMonthKey(state.selectedMonth);
  const streak = calculateCurrentStreak(habit.id, streakAnchor);
  const isEditing = state.editingHabitId === habit.id;

  return `
    <tr class="task-row" draggable="true" data-habit-row="${habit.id}">
      <th class="task-col">
        <div class="task-name">
          <button type="button" class="drag-handle" aria-label="Drag to reorder ${escapeHtml(habit.name)}" title="Drag to reorder"></button>
          ${
            isEditing
              ? `
                <form data-edit-form data-habit-id="${habit.id}">
                  <input class="edit-task-input" type="text" name="habitName" maxlength="50" value="${escapeHtml(habit.name)}" aria-label="Edit ${escapeHtml(habit.name)}" />
                  <div class="edit-actions">
                    <button type="submit" class="mini-button">Save</button>
                    <button type="button" class="mini-button" data-action="cancel-edit">Cancel</button>
                  </div>
                </form>
              `
              : `<button type="button" class="task-title" data-action="start-edit" data-habit-id="${habit.id}" title="Edit ${escapeHtml(habit.name)}"><strong>${escapeHtml(habit.name)}</strong></button>`
          }
          <small>${streak > 0 ? `<span class="streak-fire">${streak >= 7 ? "🔥" : "⚡"}</span> ${streak} day streak` : '<span style="opacity:0.6">No streak yet</span>'}</small>
          <button type="button" class="remove-button" data-action="remove-habit" data-habit-id="${habit.id}" aria-label="Remove ${escapeHtml(habit.name)}" title="Remove">×</button>
        </div>
      </th>
      ${days.map((day) => renderDayCell(habit.id, day, todayKey)).join("")}
    </tr>
  `;
}

function renderDayCell(habitId, day, todayKey) {
  const checked = isCompleted(habitId, day.key);
  const isToday = day.key === todayKey;

  if (isToday) {
    return `
      <td>
        <label class="cell ${checked ? "is-done" : ""}">
          <input type="checkbox" data-toggle data-habit-id="${habitId}" data-day-key="${day.key}" ${checked ? "checked" : ""} aria-label="Mark habit complete for ${day.key}" />
        </label>
      </td>
    `;
  }

  if (day.isFuture) {
    return `
      <td>
        <div class="cell is-future"><span class="cell-mark">-</span></div>
      </td>
    `;
  }

  return `
    <td>
      <div class="cell is-locked ${checked ? "is-done" : ""}"><span class="cell-mark">${checked ? "✓" : ""}</span></div>
    </td>
  `;
}

function renderGraph(dailyCounts) {
  const width = 920;
  const height = 240;
  const padding = { top: 16, right: 18, bottom: 34, left: 42 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const maxCount = Math.max(state.tracker.habits.length, 1);
  const step = dailyCounts.length > 1 ? graphWidth / (dailyCounts.length - 1) : graphWidth;

  const points = dailyCounts.map((item, index) => {
    const x = padding.left + index * step;
    const y = padding.top + graphHeight - (item.count / maxCount) * graphHeight;
    return { ...item, x, y };
  });

  const labels = points
    .filter((point, index) => index === 0 || index === points.length - 1 || point.day % 5 === 0)
    .map((point) => `<text class="label" x="${point.x}" y="${height - 10}" text-anchor="middle">${point.day}</text>`)
    .join("");

  const yTicks = Array.from({ length: maxCount + 1 }, (_, index) => maxCount - index)
    .map((value) => {
      const y = padding.top + graphHeight - (value / maxCount) * graphHeight;
      return `
        <g>
          <line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
          <text class="label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${value}</text>
        </g>
      `;
    })
    .join("");

  const pathD = points.length > 0
    ? `M ${points.map((point) => `${point.x},${point.y}`).join(" L ")}`
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`
    : "";

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Line graph of daily completion count">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4fa8e8"/>
          <stop offset="100%" stop-color="#3ecf8e"/>
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3ecf8e" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#3ecf8e" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yTicks}
      <line class="axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + graphHeight}"></line>
      <line class="axis" x1="${padding.left}" y1="${padding.top + graphHeight}" x2="${width - padding.right}" y2="${padding.top + graphHeight}"></line>
      ${areaD ? `<path class="area" d="${areaD}"></path>` : ""}
      ${pathD ? `<path class="line" d="${pathD}"></path>` : ""}
      ${points.map((point) => `<circle class="point" cx="${point.x}" cy="${point.y}" r="3.5"></circle>`).join("")}
      ${labels}
    </svg>
  `;
}

function getSummary(days, todayKey) {
  const totalHabits = state.tracker.habits.length;
  const visibleDays = state.selectedMonth === monthKey(new Date()) ? days.filter((day) => !day.isFuture) : days;
  const totalChecks = visibleDays.reduce((sum, day) => sum + countForDay(day.key), 0);
  const maxChecks = Math.max(visibleDays.length * Math.max(totalHabits, 1), 1);
  const consistency = totalHabits === 0 ? 0 : Math.round((totalChecks / maxChecks) * 100);
  const bestStreak = state.tracker.habits.reduce((best, habit) => Math.max(best, calculateCurrentStreak(habit.id, todayKey)), 0);

  return {
    todayDone: countForDay(todayKey),
    totalHabits,
    consistency,
    bestStreak,
    dailyCounts: days.map((day) => ({ day: day.day, key: day.key, count: countForDay(day.key) }))
  };
}

function addHabit(name) {
  const value = name.trim();
  if (!value) {
    return;
  }

  if (state.tracker.habits.some((habit) => habit.name.toLowerCase() === value.toLowerCase())) {
    return;
  }

  state.tracker.habits.push({ id: createHabitId(), name: value });
  saveTracker();
  render();
}

function removeHabit(habitId) {
  state.tracker.habits = state.tracker.habits.filter((habit) => habit.id !== habitId);
  Object.keys(state.tracker.completions).forEach((key) => {
    state.tracker.completions[key] = (state.tracker.completions[key] || []).filter((id) => id !== habitId);
    if (state.tracker.completions[key].length === 0) {
      delete state.tracker.completions[key];
    }
  });
  saveTracker();
  render();
}

function moveHabit(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) {
    clearDragTargets();
    render();
    return;
  }

  const habits = [...state.tracker.habits];
  const sourceIndex = habits.findIndex((habit) => habit.id === sourceId);
  const targetIndex = habits.findIndex((habit) => habit.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    clearDragTargets();
    render();
    return;
  }

  const [moved] = habits.splice(sourceIndex, 1);
  habits.splice(targetIndex, 0, moved);
  state.tracker.habits = habits;
  state.dragHabitId = null;
  saveTracker();
  render();
}

function toggleCompletion(habitId, dayKey, checked) {
  const today = dateKey(new Date());
  if (dayKey !== today) {
    return;
  }

  const set = new Set(state.tracker.completions[dayKey] || []);
  if (checked) {
    set.add(habitId);
  } else {
    set.delete(habitId);
  }
  state.tracker.completions[dayKey] = Array.from(set);
  saveTracker();

  const checkbox = app.querySelector(
    `input[data-habit-id="${habitId}"][data-day-key="${dayKey}"]`
  );
  const label = checkbox instanceof HTMLInputElement ? checkbox.closest("label") : null;
  if (label) {
    label.classList.toggle("is-done", checked);
  }

  const streakEl = app.querySelector(`[data-habit-row="${habitId}"] .task-name small`);
  if (streakEl) {
    const streak = calculateCurrentStreak(habitId, today);
    streakEl.innerHTML = streak > 0
      ? `<span class="streak-fire">${streak >= 7 ? "🔥" : "⚡"}</span> ${streak} day streak`
      : '<span style="opacity:0.6">No streak yet</span>';
  }

  patchStats();
}

function patchStats() {
  const today = new Date();
  const todayKey = dateKey(today);
  const days = getMonthDays(state.selectedMonth);
  const summary = getSummary(days, todayKey);

  const consistencyColor =
    summary.consistency >= 80 ? "#3ecf8e" :
    summary.consistency >= 50 ? "#f4b860" : "#f87171";
  const streakEmoji = summary.bestStreak >= 7 ? "🔥" : summary.bestStreak >= 3 ? "✨" : "💫";

  const chips = app.querySelectorAll(".stat-chip");
  if (chips[0]) chips[0].innerHTML = `<span class="stat-icon">✅</span> Today: ${summary.todayDone} / ${summary.totalHabits}`;
  if (chips[1]) {
    chips[1].innerHTML = `<span class="stat-icon">📊</span> Consistency: ${summary.consistency}%`;
    chips[1].style.color = consistencyColor;
    chips[1].style.borderColor = `${consistencyColor}40`;
  }
  if (chips[2]) chips[2].innerHTML = `<span class="stat-icon">${streakEmoji}</span> Best streak: ${summary.bestStreak} day${summary.bestStreak !== 1 ? "s" : ""}`;

  const badge = app.querySelector(".chart-badge");
  if (badge) badge.textContent = `${summary.consistency}% this month`;

  const chartBox = app.querySelector(".chart-box");
  if (chartBox) chartBox.innerHTML = renderGraph(summary.dailyCounts);
}

function countForDay(dayKey) {
  return (state.tracker.completions[dayKey] || []).length;
}

function renameHabit(habitId, nextName) {
  const normalizedName = nextName.trim();
  if (!habitId || !normalizedName) {
    return;
  }

  const currentHabit = state.tracker.habits.find((habit) => habit.id === habitId);
  if (!currentHabit) {
    return;
  }

  if (currentHabit.name === normalizedName) {
    state.editingHabitId = null;
    render();
    return;
  }

  const duplicate = state.tracker.habits.some(
    (habit) => habit.id !== habitId && habit.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (duplicate) {
    return;
  }

  state.tracker.habits = state.tracker.habits.map((habit) =>
    habit.id === habitId ? { ...habit, name: normalizedName } : habit
  );
  state.editingHabitId = null;
  saveTracker();
  render();
}

function isCompleted(habitId, dayKey) {
  return (state.tracker.completions[dayKey] || []).includes(habitId);
}

function loadTracker() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.storageAvailable = true;
    if (!raw) {
      return { habits: [], completions: {} };
    }

    const parsed = JSON.parse(raw);
    const habits = Array.isArray(parsed?.habits)
      ? parsed.habits.filter((habit) => habit && typeof habit.id === "string" && typeof habit.name === "string")
      : [];
    const completions =
      parsed?.completions && typeof parsed.completions === "object"
        ? Object.fromEntries(
            Object.entries(parsed.completions)
              .filter(([key, value]) => typeof key === "string" && Array.isArray(value))
              .map(([key, value]) => [key, value.filter((item) => typeof item === "string")])
          )
        : {};

    return { habits, completions };
  } catch {
    state.storageAvailable = false;
    return { habits: [], completions: {} };
  }
}

function saveTracker() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tracker));
    state.storageAvailable = true;
  } catch {
    state.storageAvailable = false;
  }
}

function createHabitId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clearDragTargets() {
  app.querySelectorAll(".drag-target").forEach((row) => row.classList.remove("drag-target"));
}

function getMonthDays(selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const today = dateKey(new Date());

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    const key = dateKey(date);
    return {
      key,
      day: index + 1,
      isFuture: key > today
    };
  });
}

function calculateCurrentStreak(habitId, fromDateKey) {
  let date = new Date(`${fromDateKey}T00:00:00`);
  let streak = 0;
  while (isCompleted(habitId, dateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function monthKeyFromDateKey(value) {
  return value.slice(0, 7);
}

function shiftMonth(selectedMonth, amount) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + amount, 1));
}

function formatMonth(selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function lastDayOfMonthKey(selectedMonth) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return dateKey(new Date(year, month, 0));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
