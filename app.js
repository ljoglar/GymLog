(() => {
  'use strict';

  const STORAGE_KEY = 'gym_tracker_v1';
  const DATA = window.GYMLOG_DATA || {
    I18N: { es: {}, en: {} },
    CATEGORY_META: {},
    EQUIPMENT_META: {},
    MUSCLEWIKI_EXERCISES: []
  };

  const { I18N, CATEGORY_META, EQUIPMENT_META, MUSCLEWIKI_EXERCISES } = DATA;
  const CATEGORIES = [
    'All',
    'Recent',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Legs',
    'Glutes',
    'Calves',
    'Core',
    'Forearms',
    'Custom'
  ];

  // ---------- State & Initialization ----------

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function getLocalDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function shiftDateStr(dateStr, deltaDays) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    return getLocalDateStr(dt);
  }

  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function normalizeText(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function mergeCatalogExercises(savedExercises = []) {
    const savedMap = new Map(savedExercises.map((ex) => [ex.id, ex]));
    const catalogIds = new Set(MUSCLEWIKI_EXERCISES.map((ex) => ex.id));
    const now = new Date().toISOString();

    const customExercises = savedExercises
      .filter((ex) => !catalogIds.has(ex.id))
      .map((ex) => ({
        ...ex,
        nameEs: ex.nameEs || ex.name || '',
        nameEn: ex.nameEn || ex.name || '',
        category: ex.category || 'Custom',
        equipment: ex.equipment || '',
        muscleSlug: ex.muscleSlug || CATEGORY_META[ex.category]?.muscleSlug || '',
        mwSlug: ex.mwSlug || '',
        keywords: ex.keywords || '',
        comfortableWeight: String(ex.comfortableWeight ?? ''),
        challengeWeight: String(ex.challengeWeight ?? ''),
        increaseNextTime: Boolean(ex.increaseNextTime)
      }));

    const catalogMerged = MUSCLEWIKI_EXERCISES.map((tpl) => {
      const existing = savedMap.get(tpl.id);
      return {
        id: tpl.id,
        name: tpl.nameEn,
        nameEs: tpl.nameEs,
        nameEn: tpl.nameEn,
        category: tpl.category,
        equipment: tpl.equipment,
        muscleSlug: tpl.muscleSlug,
        mwSlug: tpl.mwSlug,
        keywords: tpl.keywords || '',
        comfortableWeight: existing ? String(existing.comfortableWeight ?? '') : '',
        challengeWeight: existing ? String(existing.challengeWeight ?? '') : '',
        increaseNextTime: existing ? Boolean(existing.increaseNextTime) : false,
        customVideoUrl: existing?.customVideoUrl || '',
        createdAt: existing?.createdAt || now
      };
    });

    return [...customExercises, ...catalogMerged];
  }

  function buildDemoState(preferredLang = 'es') {
    const exercises = mergeCatalogExercises([]);
    const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

    if (exMap.ex_bench_press) {
      exMap.ex_bench_press.comfortableWeight = '50';
      exMap.ex_bench_press.challengeWeight = '60';
      exMap.ex_bench_press.increaseNextTime = true;
    }
    if (exMap.ex_lat_pulldown) {
      exMap.ex_lat_pulldown.comfortableWeight = '45';
      exMap.ex_lat_pulldown.challengeWeight = '55';
    }
    if (exMap.ex_barbell_squat) {
      exMap.ex_barbell_squat.comfortableWeight = '60';
      exMap.ex_barbell_squat.challengeWeight = '75';
    }
    if (exMap.ex_lateral_raises) {
      exMap.ex_lateral_raises.comfortableWeight = '8';
      exMap.ex_lateral_raises.challengeWeight = '10';
      exMap.ex_lateral_raises.increaseNextTime = true;
    }
    if (exMap.ex_seated_cable_row) {
      exMap.ex_seated_cable_row.comfortableWeight = '45';
      exMap.ex_seated_cable_row.challengeWeight = '55';
    }
    if (exMap.ex_leg_press) {
      exMap.ex_leg_press.comfortableWeight = '100';
      exMap.ex_leg_press.challengeWeight = '120';
    }
    if (exMap.ex_tricep_pushdown) {
      exMap.ex_tricep_pushdown.comfortableWeight = '20';
      exMap.ex_tricep_pushdown.challengeWeight = '25';
    }

    const today = getLocalDateStr();
    const d2 = shiftDateStr(today, -2);
    const d5 = shiftDateStr(today, -5);
    const d9 = shiftDateStr(today, -9);

    const makeSeries = (rows) =>
      rows.map(([weight, reps], idx) => ({
        id: uid(`s${idx}`),
        weight: String(weight),
        reps: String(reps),
        completed: true
      }));

    const isEs = preferredLang !== 'en';

    const sessions = [
      {
        id: `session_${d2}`,
        date: d2,
        notes: isEs ? 'Entreno de tren superior con monitor' : 'Upper body focus with coach',
        entries: [
          {
            id: uid('ent'),
            exerciseId: 'ex_bench_press',
            series: makeSeries([[50, 12], [55, 10], [55, 10]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_seated_cable_row',
            series: makeSeries([[45, 12], [50, 10], [50, 10]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_tricep_pushdown',
            series: makeSeries([[20, 12], [22.5, 10], [22.5, 10]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_lateral_raises',
            series: makeSeries([[8, 15], [8, 14], [10, 10]])
          }
        ]
      },
      {
        id: `session_${d5}`,
        date: d5,
        notes: isEs ? 'Circuito de pierna y espalda' : 'Lower body & back circuit',
        entries: [
          {
            id: uid('ent'),
            exerciseId: 'ex_barbell_squat',
            series: makeSeries([[60, 10], [70, 8], [70, 8]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_lat_pulldown',
            series: makeSeries([[45, 12], [50, 10], [50, 9]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_leg_press',
            series: makeSeries([[100, 12], [110, 10], [120, 8]])
          }
        ]
      },
      {
        id: `session_${d9}`,
        date: d9,
        notes: '',
        entries: [
          {
            id: uid('ent'),
            exerciseId: 'ex_bench_press',
            series: makeSeries([[45, 12], [50, 10], [50, 9]])
          },
          {
            id: uid('ent'),
            exerciseId: 'ex_lat_pulldown',
            series: makeSeries([[40, 12], [45, 10], [45, 10]])
          }
        ]
      }
    ];

    return {
      exercises,
      sessions,
      settings: {
        unit: 'kg',
        lang: preferredLang === 'en' ? 'en' : 'es',
        isDemo: true
      }
    };
  }

  function sortSessionsNewestFirst(sessions) {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }

  function saveStateData(nextState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.exercises) && Array.isArray(parsed.sessions)) {
          const upgraded = {
            exercises: mergeCatalogExercises(parsed.exercises),
            sessions: sortSessionsNewestFirst(parsed.sessions),
            settings: {
              unit: parsed.settings?.unit === 'lb' ? 'lb' : 'kg',
              lang: parsed.settings?.lang === 'en' ? 'en' : 'es',
              isDemo: Boolean(parsed.settings?.isDemo)
            }
          };
          saveStateData(upgraded);
          return upgraded;
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved state, initializing demo state:', err);
    }

    const demo = buildDemoState('es');
    saveStateData(demo);
    return demo;
  }

  let state = loadState();
  let activeDate = getLocalDateStr();
  let activeTab = 'session';
  let addModalCategory = 'All';
  let catalogCategory = 'All';
  let currentHistoryExerciseId = null;
  const collapsedEntries = new Set();

  function saveState() {
    state.sessions = sortSessionsNewestFirst(state.sessions);
    saveStateData(state);
  }

  // ---------- i18n & Localization Helpers ----------

  function getLang() {
    return state.settings.lang === 'en' ? 'en' : 'es';
  }

  function getLocaleCode() {
    return getLang() === 'es' ? 'es-ES' : 'en-US';
  }

  function t(key, vars = {}) {
    const lang = getLang();
    let str = I18N[lang]?.[key] ?? I18N.en?.[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, String(v));
    });
    return str;
  }

  function getCategoryLabel(categoryKey) {
    const lang = getLang();
    return CATEGORY_META[categoryKey]?.[lang] || categoryKey || '';
  }

  function getEquipmentLabel(equipmentKey) {
    if (!equipmentKey) return '';
    const lang = getLang();
    return EQUIPMENT_META[equipmentKey]?.[lang] || '';
  }

  function getExerciseDisplayName(exercise) {
    if (!exercise) return '';
    if (getLang() === 'es') {
      return exercise.nameEs || exercise.name || exercise.nameEn || '';
    }
    return exercise.nameEn || exercise.name || exercise.nameEs || '';
  }

  function getExerciseSecondaryName(exercise) {
    if (!exercise) return '';
    const primary = getExerciseDisplayName(exercise);
    const secondary = getLang() === 'es'
      ? (exercise.nameEn || '')
      : (exercise.nameEs || '');
    if (!secondary || normalizeText(secondary) === normalizeText(primary)) return '';
    return secondary;
  }

  function getExerciseMuscleSlug(exercise) {
    if (!exercise) return '';
    return exercise.muscleSlug || CATEGORY_META[exercise.category]?.muscleSlug || '';
  }

  function sanitizeHttpUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return '';
  }

  function getExerciseVideoUrl(exercise) {
    const customUrl = sanitizeHttpUrl(exercise?.customVideoUrl);
    if (customUrl) return customUrl;

    const prefix = getLang() === 'es' ? 'https://musclewiki.com/es-es' : 'https://musclewiki.com';
    const muscleSlug = getExerciseMuscleSlug(exercise);
    const mwSlug = exercise?.mwSlug || '';

    if (mwSlug) {
      return `${prefix}/exercise/${mwSlug}`;
    }
    if (muscleSlug) {
      return `${prefix}/exercises/${muscleSlug}`;
    }
    return `${prefix}/exercises`;
  }

  function getExerciseMuscleDirectoryUrl(exercise) {
    const prefix = getLang() === 'es' ? 'https://musclewiki.com/es-es' : 'https://musclewiki.com';
    const muscleSlug = getExerciseMuscleSlug(exercise);
    return muscleSlug ? `${prefix}/exercises/${muscleSlug}` : `${prefix}/exercises`;
  }

  function formatDisplayDate(dateStr) {
    const dt = parseLocalDate(dateStr);
    const formatted = dt.toLocaleDateString(getLocaleCode(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    return capitalizeFirst(formatted);
  }

  function formatShortDate(dateStr) {
    const dt = parseLocalDate(dateStr);
    return dt.toLocaleDateString(getLocaleCode(), {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatRelativeDate(dateStr) {
    const todayStr = getLocalDateStr();
    const diffMs = parseLocalDate(todayStr) - parseLocalDate(dateStr);
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 0) return t('relToday');
    if (diffDays === 1) return t('relYesterday');
    if (diffDays > 1 && diffDays < 30) return t('relDaysAgo', { days: diffDays });
    if (diffDays < 0) return t('relUpcoming');
    return formatDisplayDate(dateStr);
  }

  function syncSelectOptions(selectEl, keys, labelGetter) {
    if (!selectEl) return;
    const prevValue = selectEl.value;
    selectEl.innerHTML = keys
      .map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(labelGetter(k))}</option>`)
      .join('');
    if (keys.includes(prevValue)) {
      selectEl.value = prevValue;
    }
  }

  function applyTranslations() {
    const lang = getLang();
    if (document.documentElement) {
      document.documentElement.lang = lang;
    }
    document.title = t('appTitle');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    const prevBtn = document.getElementById('btn-prev-day');
    const nextBtn = document.getElementById('btn-next-day');
    const settingsBtn = document.getElementById('btn-open-settings');
    if (prevBtn) prevBtn.setAttribute('aria-label', t('prevDayLabel'));
    if (nextBtn) nextBtn.setAttribute('aria-label', t('nextDayLabel'));
    if (settingsBtn) settingsBtn.setAttribute('aria-label', t('settingsLabel'));

    const quickCatKeys = ['Custom', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core', 'Forearms'];
    syncSelectOptions(document.getElementById('quick-create-category'), quickCatKeys, getCategoryLabel);

    const newCatKeys = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core', 'Forearms', 'Custom'];
    syncSelectOptions(document.getElementById('new-ex-category'), newCatKeys, getCategoryLabel);

    const eqKeys = Object.keys(EQUIPMENT_META);
    syncSelectOptions(document.getElementById('new-ex-equipment'), eqKeys, getEquipmentLabel);

    document.querySelectorAll('.lang-opt').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });
    document.querySelectorAll('.lang-choice-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.setLang === lang);
    });
  }

  // ---------- Pure Domain Helpers ----------

  function getExerciseById(exerciseId) {
    return state.exercises.find((e) => e.id === exerciseId) || null;
  }

  function getSessionByDate(dateStr) {
    return state.sessions.find((s) => s.date === dateStr) || null;
  }

  function ensureSessionForDate(dateStr) {
    let session = getSessionByDate(dateStr);
    if (!session) {
      session = {
        id: `session_${dateStr}`,
        date: dateStr,
        notes: '',
        entries: []
      };
      state.sessions.push(session);
      state.sessions = sortSessionsNewestFirst(state.sessions);
    }
    return session;
  }

  function getLastSessionForExercise(exerciseId, currentSessionId) {
    const currentSession = state.sessions.find((s) => s.id === currentSessionId);
    const cutoffDate = currentSession ? currentSession.date : activeDate;

    for (const session of state.sessions) {
      if (session.id === currentSessionId) continue;
      if (session.date >= cutoffDate) continue;
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (entry) {
        return { session, entry };
      }
    }
    return null;
  }

  function getExerciseHistory(exerciseId) {
    const items = [];
    for (const session of state.sessions) {
      const matchingEntries = session.entries.filter((e) => e.exerciseId === exerciseId);
      for (const entry of matchingEntries) {
        items.push({ session, entry });
      }
    }
    return items;
  }

  function getLastPerformedAnySession(exerciseId) {
    for (const session of state.sessions) {
      const entry = session.entries.find((e) => e.exerciseId === exerciseId);
      if (entry) return { session, entry };
    }
    return null;
  }

  function createDefaultSeries() {
    return [1, 2, 3].map(() => ({
      id: uid('ser'),
      weight: '',
      reps: '',
      completed: false
    }));
  }

  function addExerciseToSession(sessionId, exerciseId) {
    let session = state.sessions.find((s) => s.id === sessionId);
    if (!session) {
      session = ensureSessionForDate(activeDate);
    }

    const entry = {
      id: uid('ent'),
      exerciseId,
      series: createDefaultSeries()
    };

    session.entries.push(entry);
    saveState();
    return entry;
  }

  function removeEntryFromSession(sessionId, entryId) {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.entries = session.entries.filter((e) => e.id !== entryId);
    collapsedEntries.delete(entryId);
    if (session.entries.length === 0 && !session.notes.trim()) {
      state.sessions = state.sessions.filter((s) => s.id !== sessionId);
    }
    saveState();
  }

  function updateExerciseGeneralFields(exerciseId, updates) {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return null;

    if (Object.prototype.hasOwnProperty.call(updates, 'comfortableWeight')) {
      exercise.comfortableWeight = String(updates.comfortableWeight ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'challengeWeight')) {
      exercise.challengeWeight = String(updates.challengeWeight ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'increaseNextTime')) {
      exercise.increaseNextTime = Boolean(updates.increaseNextTime);
    }
    saveState();
    return exercise;
  }

  function updateSeries(sessionId, entryId, seriesId, updates) {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const entry = session.entries.find((e) => e.id === entryId);
    if (!entry) return;
    const series = entry.series.find((s) => s.id === seriesId);
    if (!series) return;

    if (Object.prototype.hasOwnProperty.call(updates, 'weight')) {
      series.weight = String(updates.weight ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'reps')) {
      series.reps = String(updates.reps ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'completed')) {
      series.completed = Boolean(updates.completed);
    }
    saveState();
  }

  function addSeries(sessionId, entryId) {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const entry = session.entries.find((e) => e.id === entryId);
    if (!entry) return;

    const prev = entry.series[entry.series.length - 1];
    entry.series.push({
      id: uid('ser'),
      weight: prev ? prev.weight : '',
      reps: '',
      completed: false
    });
    saveState();
  }

  function removeSeries(sessionId, entryId, seriesId) {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const entry = session.entries.find((e) => e.id === entryId);
    if (!entry) return;
    entry.series = entry.series.filter((s) => s.id !== seriesId);
    saveState();
  }

  function createExercise({
    name,
    category = 'Custom',
    equipment = '',
    customVideoUrl = '',
    comfortableWeight = '',
    challengeWeight = '',
    increaseNextTime = false
  }) {
    const cleanName = name.trim();
    const cleanUrl = sanitizeHttpUrl(customVideoUrl);
    const slugMatch = cleanUrl.match(/\/exercise\/([a-z0-9-]+)\/?(?:[?#].*)?$/i);
    const exercise = {
      id: uid('ex'),
      name: cleanName,
      nameEs: cleanName,
      nameEn: cleanName,
      category: category || 'Custom',
      equipment: equipment || '',
      muscleSlug: CATEGORY_META[category]?.muscleSlug || '',
      mwSlug: slugMatch ? slugMatch[1].toLowerCase() : '',
      keywords: '',
      customVideoUrl: cleanUrl,
      comfortableWeight: String(comfortableWeight || ''),
      challengeWeight: String(challengeWeight || ''),
      increaseNextTime: Boolean(increaseNextTime),
      createdAt: new Date().toISOString()
    };
    state.exercises.unshift(exercise);
    saveState();
    return exercise;
  }

  function formatSeriesSummary(series, unit) {
    const nonEmpty = series.filter((s) => s.weight !== '' || s.reps !== '');
    if (nonEmpty.length === 0) return t('noWeightsLogged');
    return nonEmpty
      .map((s) => {
        const w = s.weight !== '' ? `${s.weight}${unit}` : '—';
        const r = s.reps !== '' ? `× ${s.reps}` : '× —';
        return `${w} ${r}`;
      })
      .join(' · ');
  }

  // ---------- Toast ----------

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 2200);
  }

  // ---------- Rendering ----------

  function renderHeader() {
    const todayStr = getLocalDateStr();
    const kicker = document.getElementById('header-kicker');
    const title = document.getElementById('header-date-label');
    const dateInput = document.getElementById('session-date-input');
    const jumpTodayBtn = document.getElementById('btn-jump-today');

    dateInput.value = activeDate;
    title.textContent = formatDisplayDate(activeDate);

    if (activeDate === todayStr) {
      kicker.textContent = t('kickerToday');
      jumpTodayBtn.classList.add('hidden');
    } else if (activeDate < todayStr) {
      kicker.textContent = t('kickerPast');
      jumpTodayBtn.classList.remove('hidden');
    } else {
      kicker.textContent = t('kickerPlanned');
      jumpTodayBtn.classList.remove('hidden');
    }

    document.querySelectorAll('.unit-opt').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.unit === state.settings.unit);
    });

    document.querySelectorAll('[data-unit-label]').forEach((el) => {
      el.textContent = state.settings.unit;
    });
  }

  function updateSessionStatsBar() {
    const session = getSessionByDate(activeDate);
    const statsEl = document.getElementById('session-stats-text');
    const entries = session ? session.entries : [];
    const totalSeries = entries.reduce((sum, e) => sum + e.series.length, 0);
    const doneSeries = entries.reduce(
      (sum, e) => sum + e.series.filter((s) => s.completed).length,
      0
    );

    const exWord = entries.length === 1 ? t('exerciseWordOne') : t('exerciseWordMany');
    if (doneSeries > 0) {
      statsEl.textContent = t('setsDoneSummary', {
        exCount: entries.length,
        exWord,
        done: doneSeries,
        total: totalSeries
      });
    } else {
      statsEl.textContent = t('setsTotalSummary', {
        exCount: entries.length,
        exWord,
        total: totalSeries
      });
    }
  }

  function renderSessionView() {
    const demoBanner = document.getElementById('demo-banner');
    demoBanner.classList.toggle('hidden', !state.settings.isDemo);

    const session = getSessionByDate(activeDate);
    const notesInput = document.getElementById('session-notes-input');
    notesInput.value = session ? session.notes || '' : '';

    const listEl = document.getElementById('session-exercises-list');
    const emptyEl = document.getElementById('session-empty-state');
    const fabEl = document.getElementById('fab-add-exercise');
    const metaEl = document.getElementById('session-meta-bar');

    updateSessionStatsBar();

    const entries = session ? session.entries : [];
    if (entries.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      metaEl.classList.add('hidden');
      fabEl.classList.add('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    metaEl.classList.remove('hidden');
    fabEl.classList.toggle('hidden', activeTab !== 'session');

    const unit = state.settings.unit;

    listEl.innerHTML = entries
      .map((entry, idx) => {
        const exercise = getExerciseById(entry.exerciseId);
        if (!exercise) return '';

        const displayName = getExerciseDisplayName(exercise);
        const categoryLabel = getCategoryLabel(exercise.category);
        const equipmentLabel = getEquipmentLabel(exercise.equipment);
        const videoUrl = getExerciseVideoUrl(exercise);

        const isCollapsed = collapsedEntries.has(entry.id);
        const lastRecord = getLastSessionForExercise(exercise.id, session.id);
        const lastSeries = lastRecord ? lastRecord.entry.series : [];

        const lastBoxHtml = lastRecord
          ? `
            <button type="button" class="last-time-box" data-action="open-history" data-exercise-id="${escapeHtml(exercise.id)}">
              <div class="last-time-content">
                <span class="last-time-label">${escapeHtml(t('lastTimeLabel', { date: formatShortDate(lastRecord.session.date) }))}</span>
                <span class="last-time-sets">${escapeHtml(formatSeriesSummary(lastRecord.entry.series, unit))}</span>
              </div>
              <span class="last-time-action">${escapeHtml(t('historyLinkArrow'))}</span>
            </button>
          `
          : `
            <button type="button" class="last-time-box no-history" data-action="open-history" data-exercise-id="${escapeHtml(exercise.id)}">
              <div class="last-time-content">
                <span class="last-time-label">${escapeHtml(t('firstTimeLabel'))}</span>
              </div>
              <span class="last-time-action">${escapeHtml(t('historyLinkArrow'))}</span>
            </button>
          `;

        const seriesRowsHtml = entry.series
          .map((s, sIdx) => {
            const prevSet = lastSeries[sIdx];
            const weightPh = prevSet && prevSet.weight !== ''
              ? prevSet.weight
              : (exercise.comfortableWeight || unit);
            const repsPh = prevSet && prevSet.reps !== '' ? prevSet.reps : t('repsPlaceholder');

            return `
              <div class="series-row ${s.completed ? 'completed' : ''}" data-series-id="${escapeHtml(s.id)}">
                <span class="series-num">${sIdx + 1}</span>
                <input
                  type="text"
                  inputmode="decimal"
                  class="series-input"
                  data-field="series-weight"
                  data-session-id="${escapeHtml(session.id)}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  data-series-id="${escapeHtml(s.id)}"
                  value="${escapeHtml(s.weight)}"
                  placeholder="${escapeHtml(weightPh)}"
                  aria-label="${escapeHtml(t('setCol'))} ${sIdx + 1} ${escapeHtml(unit)}"
                />
                <input
                  type="text"
                  inputmode="numeric"
                  class="series-input"
                  data-field="series-reps"
                  data-session-id="${escapeHtml(session.id)}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  data-series-id="${escapeHtml(s.id)}"
                  value="${escapeHtml(s.reps)}"
                  placeholder="${escapeHtml(repsPh)}"
                  aria-label="${escapeHtml(t('setCol'))} ${sIdx + 1} ${escapeHtml(t('repsCol'))}"
                />
                <button
                  type="button"
                  class="btn-series-check ${s.completed ? 'done' : ''}"
                  data-action="toggle-series-done"
                  data-session-id="${escapeHtml(session.id)}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  data-series-id="${escapeHtml(s.id)}"
                  aria-label="${escapeHtml(t('doneCol'))}"
                >✓</button>
                <button
                  type="button"
                  class="btn-series-remove"
                  data-action="remove-series"
                  data-session-id="${escapeHtml(session.id)}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  data-series-id="${escapeHtml(s.id)}"
                  aria-label="Remove"
                >×</button>
              </div>
            `;
          })
          .join('');

        const metaParts = [categoryLabel];
        if (equipmentLabel) metaParts.push(equipmentLabel);
        metaParts.push(`${entry.series.length} ${t('setsWord')}`);

        return `
          <article class="exercise-card ${exercise.increaseNextTime ? 'is-increase' : ''} ${isCollapsed ? 'collapsed' : ''}" data-entry-id="${escapeHtml(entry.id)}" data-exercise-id="${escapeHtml(exercise.id)}">
            <div class="card-header">
              <div class="card-title-group">
                <span class="order-badge">#${idx + 1}</span>
                <div class="card-title-text">
                  <h3 class="card-exercise-name">${escapeHtml(displayName)}</h3>
                  <span class="card-exercise-cat">${escapeHtml(metaParts.join(' · '))}</span>
                </div>
              </div>
              <div class="card-actions">
                <a class="btn-video-pill" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t('watchVideoMuscleWiki'))}: ${escapeHtml(displayName)}">
                  <span aria-hidden="true">🎬</span>
                  <span>${escapeHtml(t('videoBtn'))}</span>
                </a>
                <button type="button" class="btn-history-pill" data-action="open-history" data-exercise-id="${escapeHtml(exercise.id)}">${escapeHtml(t('historyBtn'))}</button>
                <button type="button" class="btn-card-icon" data-action="toggle-collapse" data-entry-id="${escapeHtml(entry.id)}" aria-label="${isCollapsed ? 'Expand' : 'Collapse'}">
                  ${isCollapsed ? '▾' : '▴'}
                </button>
                <button type="button" class="btn-card-icon danger" data-action="remove-entry" data-session-id="${escapeHtml(session.id)}" data-entry-id="${escapeHtml(entry.id)}" aria-label="Remove">
                  ✕
                </button>
              </div>
            </div>

            <div class="card-body">
              <button
                type="button"
                class="increase-toggle-btn ${exercise.increaseNextTime ? 'active' : ''}"
                data-action="toggle-increase"
                data-exercise-id="${escapeHtml(exercise.id)}"
              >
                <span class="check-box">✓</span>
                <span class="increase-text">${escapeHtml(t('increaseToggleText'))}</span>
                <span class="increase-arrow">⬆️</span>
              </button>

              <div class="general-weights-grid">
                <label class="weight-stat-field comfortable">
                  <span class="field-label">${escapeHtml(t('comfortableShort'))}</span>
                  <div class="input-with-unit">
                    <input
                      type="text"
                      inputmode="decimal"
                      data-field="comfortable-weight"
                      data-exercise-id="${escapeHtml(exercise.id)}"
                      value="${escapeHtml(exercise.comfortableWeight)}"
                      placeholder="—"
                      aria-label="${escapeHtml(t('comfortableLabel'))}"
                    />
                    <span class="unit-suffix">${escapeHtml(unit)}</span>
                  </div>
                </label>
                <label class="weight-stat-field challenge">
                  <span class="field-label">${escapeHtml(t('challengeShort'))}</span>
                  <div class="input-with-unit">
                    <input
                      type="text"
                      inputmode="decimal"
                      data-field="challenge-weight"
                      data-exercise-id="${escapeHtml(exercise.id)}"
                      value="${escapeHtml(exercise.challengeWeight)}"
                      placeholder="—"
                      aria-label="${escapeHtml(t('challengeLabel'))}"
                    />
                    <span class="unit-suffix">${escapeHtml(unit)}</span>
                  </div>
                </label>
              </div>

              ${lastBoxHtml}

              <div class="series-section">
                <div class="series-header-row">
                  <span>${escapeHtml(t('setCol'))}</span>
                  <span>${escapeHtml(t('weightCol', { unit }))}</span>
                  <span>${escapeHtml(t('repsCol'))}</span>
                  <span>${escapeHtml(t('doneCol'))}</span>
                  <span></span>
                </div>
                <div class="series-rows">
                  ${seriesRowsHtml}
                </div>
                <button
                  type="button"
                  class="btn-add-series"
                  data-action="add-series"
                  data-session-id="${escapeHtml(session.id)}"
                  data-entry-id="${escapeHtml(entry.id)}"
                >${escapeHtml(t('btnAddSeries'))}</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function buildSearchHaystack(ex) {
    const catMeta = CATEGORY_META[ex.category];
    const eqMeta = EQUIPMENT_META[ex.equipment];
    return normalizeText([
      ex.nameEs,
      ex.nameEn,
      ex.name,
      ex.keywords,
      ex.category,
      catMeta?.es,
      catMeta?.en,
      ex.equipment,
      eqMeta?.es,
      eqMeta?.en,
      ex.muscleSlug
    ].filter(Boolean).join(' '));
  }

  function getFilteredExercises(query, category) {
    const q = normalizeText(query);
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    let list = [...state.exercises];

    if (category === 'Recent') {
      const seenOrder = new Map();
      state.sessions.forEach((s) => {
        s.entries.forEach((e) => {
          if (!seenOrder.has(e.exerciseId)) {
            seenOrder.set(e.exerciseId, s.date);
          }
        });
      });
      list = list
        .filter((ex) => seenOrder.has(ex.id))
        .sort((a, b) => seenOrder.get(b.id).localeCompare(seenOrder.get(a.id)));
    } else if (category === 'Increase') {
      list = list.filter((ex) => ex.increaseNextTime);
    } else if (category && category !== 'All') {
      list = list.filter((ex) => ex.category === category);
    }

    if (tokens.length > 0) {
      list = list.filter((ex) => {
        const haystack = buildSearchHaystack(ex);
        return tokens.every((tok) => haystack.includes(tok));
      });

      const scoreExercise = (ex) => {
        const primary = normalizeText(getExerciseDisplayName(ex));
        if (primary.startsWith(q)) return 0;
        if (primary.includes(q)) return 1;
        if (tokens.every((tok) => primary.includes(tok))) return 2;
        return 3;
      };

      list.sort((a, b) => {
        const diff = scoreExercise(a) - scoreExercise(b);
        if (diff !== 0) return diff;
        return getExerciseDisplayName(a).localeCompare(getExerciseDisplayName(b), getLocaleCode());
      });
    }

    return list;
  }

  function renderCategoryPills(containerEl, activeCat, includeIncrease = false) {
    const cats = includeIncrease
      ? ['All', 'Increase', ...CATEGORIES.slice(1)]
      : CATEGORIES;

    containerEl.innerHTML = cats
      .map((cat) => {
        const label = cat === 'Increase' ? t('filterIncreaseNext') : getCategoryLabel(cat);
        const extraClass = cat === 'Increase' ? 'pill-amber' : '';
        return `<button type="button" class="pill ${extraClass} ${activeCat === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
      })
      .join('');
  }

  function renderAddExerciseResults() {
    const searchInput = document.getElementById('add-exercise-search');
    const clearBtn = document.getElementById('btn-clear-add-search');
    const quickWrap = document.getElementById('quick-create-wrap');
    const quickNameEl = document.getElementById('quick-create-name');
    const resultsEl = document.getElementById('add-exercise-results');

    const rawQuery = searchInput.value.trim();
    const normQuery = normalizeText(rawQuery);
    clearBtn.classList.toggle('hidden', rawQuery.length === 0);

    const exactExists =
      rawQuery.length > 0 &&
      state.exercises.some(
        (ex) =>
          normalizeText(ex.nameEs) === normQuery ||
          normalizeText(ex.nameEn) === normQuery ||
          normalizeText(ex.name) === normQuery
      );

    if (rawQuery.length > 0 && !exactExists) {
      quickWrap.classList.remove('hidden');
      quickNameEl.textContent = rawQuery;
    } else {
      quickWrap.classList.add('hidden');
    }

    const filtered = getFilteredExercises(rawQuery, addModalCategory);
    const currentSession = getSessionByDate(activeDate);
    const inTodayIds = new Set(
      currentSession ? currentSession.entries.map((e) => e.exerciseId) : []
    );
    const unit = state.settings.unit;

    if (filtered.length === 0) {
      resultsEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px 8px;">${escapeHtml(t('noSearchMatches', { query: rawQuery }))}</p>`;
      return;
    }

    resultsEl.innerHTML = filtered
      .map((ex) => {
        const displayName = getExerciseDisplayName(ex);
        const altName = getExerciseSecondaryName(ex);
        const catLabel = getCategoryLabel(ex.category);
        const eqLabel = getEquipmentLabel(ex.equipment);
        const videoUrl = getExerciseVideoUrl(ex);

        const last = getLastPerformedAnySession(ex.id);
        const subParts = [];
        if (ex.comfortableWeight) subParts.push(`${t('comfortableShort')}: ${ex.comfortableWeight}${unit}`);
        if (ex.challengeWeight) subParts.push(`${t('challengeShort')}: ${ex.challengeWeight}${unit}`);
        if (last) {
          const weights = last.entry.series
            .map((s) => s.weight)
            .filter((w) => w !== '');
          if (weights.length > 0) {
            subParts.push(`${t('lastShort')} (${formatShortDate(last.session.date)}): ${weights.join('/')}${unit}`);
          }
        }

        return `
          <div class="search-result-row">
            <button type="button" class="search-result-item" data-action="pick-add-exercise" data-exercise-id="${escapeHtml(ex.id)}">
              <div class="item-main">
                <div class="item-title-row">
                  <span class="item-title">${escapeHtml(displayName)}</span>
                  <span class="category-badge">${escapeHtml(catLabel)}</span>
                  ${eqLabel ? `<span class="equipment-badge">${escapeHtml(eqLabel)}</span>` : ''}
                  ${ex.increaseNextTime ? `<span class="increase-badge">⬆️ ${escapeHtml(t('increaseBadge'))}</span>` : ''}
                  ${inTodayIds.has(ex.id) ? `<span class="category-badge" style="color:#93c5fd;">${escapeHtml(t('inSessionBadge'))}</span>` : ''}
                </div>
                ${altName ? `<div class="item-alt-name">${escapeHtml(altName)}</div>` : ''}
                ${subParts.length ? `<div class="item-sub"><span>${escapeHtml(subParts.join(' · '))}</span></div>` : ''}
              </div>
              <span class="item-chevron">+</span>
            </button>
            <a class="search-result-video-btn" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t('watchVideoMuscleWiki'))}: ${escapeHtml(displayName)}" title="${escapeHtml(t('watchVideoMuscleWiki'))}">🎬</a>
          </div>
        `;
      })
      .join('');
  }

  function renderCatalogView() {
    const pillsEl = document.getElementById('catalog-category-pills');
    renderCategoryPills(pillsEl, catalogCategory, true);

    const query = document.getElementById('catalog-search-input').value;
    const filtered = getFilteredExercises(query, catalogCategory);
    const listEl = document.getElementById('catalog-exercises-list');
    const unit = state.settings.unit;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>${escapeHtml(t('noCatalogMatches'))}</p></div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((ex) => {
        const displayName = getExerciseDisplayName(ex);
        const altName = getExerciseSecondaryName(ex);
        const catLabel = getCategoryLabel(ex.category);
        const eqLabel = getEquipmentLabel(ex.equipment);
        const videoUrl = getExerciseVideoUrl(ex);

        const last = getLastPerformedAnySession(ex.id);
        const subParts = [];
        subParts.push(`${t('comfortableShort')}: ${ex.comfortableWeight ? `${ex.comfortableWeight}${unit}` : '—'}`);
        subParts.push(`${t('challengeShort')}: ${ex.challengeWeight ? `${ex.challengeWeight}${unit}` : '—'}`);
        if (last) subParts.push(`${t('lastShort')}: ${formatShortDate(last.session.date)}`);

        return `
          <div class="search-result-row">
            <button type="button" class="catalog-item" data-action="open-history" data-exercise-id="${escapeHtml(ex.id)}">
              <div class="item-main">
                <div class="item-title-row">
                  <span class="item-title">${escapeHtml(displayName)}</span>
                  <span class="category-badge">${escapeHtml(catLabel)}</span>
                  ${eqLabel ? `<span class="equipment-badge">${escapeHtml(eqLabel)}</span>` : ''}
                  ${ex.increaseNextTime ? `<span class="increase-badge">⬆️ ${escapeHtml(t('increaseBadge'))}</span>` : ''}
                </div>
                ${altName ? `<div class="item-alt-name">${escapeHtml(altName)}</div>` : ''}
                <div class="item-sub">
                  <span>${escapeHtml(subParts.join(' · '))}</span>
                </div>
              </div>
              <span class="item-chevron">›</span>
            </button>
            <a class="search-result-video-btn" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t('watchVideoMuscleWiki'))}: ${escapeHtml(displayName)}" title="${escapeHtml(t('watchVideoMuscleWiki'))}">🎬</a>
          </div>
        `;
      })
      .join('');
  }

  function renderPastSessionsView() {
    const listEl = document.getElementById('past-sessions-list');
    const nonEmptySessions = state.sessions.filter(
      (s) => s.entries.length > 0 || (s.notes && s.notes.trim().length > 0)
    );

    if (nonEmptySessions.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h2>${escapeHtml(t('noSessionsTitle'))}</h2>
          <p>${escapeHtml(t('noSessionsDesc'))}</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = nonEmptySessions
      .map((s) => {
        const totalSets = s.entries.reduce((sum, e) => sum + e.series.length, 0);
        const names = s.entries
          .map((e) => {
            const ex = getExerciseById(e.exerciseId);
            return ex ? getExerciseDisplayName(ex) : '';
          })
          .filter(Boolean);
        const exWord = s.entries.length === 1 ? t('exerciseWordOne') : t('exerciseWordMany');

        return `
          <button type="button" class="session-day-card" data-action="open-session-date" data-date="${escapeHtml(s.date)}">
            <div class="item-main">
              <div class="item-title-row">
                <span class="item-title">${escapeHtml(formatDisplayDate(s.date))}</span>
                <span class="category-badge">${escapeHtml(formatRelativeDate(s.date))}</span>
              </div>
              <div class="item-sub">
                <span>${s.entries.length} ${escapeHtml(exWord)} · ${totalSets} ${escapeHtml(t('setsWord'))}</span>
              </div>
              ${names.length ? `<div class="item-sub" style="color: var(--text-muted);"><span>${escapeHtml(names.join(', '))}</span></div>` : ''}
            </div>
            <span class="item-chevron">›</span>
          </button>
        `;
      })
      .join('');
  }

  function renderHistoryModal(exerciseId) {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;
    currentHistoryExerciseId = exerciseId;

    const catLabel = getCategoryLabel(exercise.category);
    const eqLabel = getEquipmentLabel(exercise.equipment);
    const altName = getExerciseSecondaryName(exercise);

    document.getElementById('history-exercise-category').textContent = catLabel;

    const eqBadge = document.getElementById('history-exercise-equipment');
    if (eqLabel) {
      eqBadge.textContent = eqLabel;
      eqBadge.classList.remove('hidden');
    } else {
      eqBadge.classList.add('hidden');
    }

    document.getElementById('history-exercise-title').textContent = getExerciseDisplayName(exercise);

    const altEl = document.getElementById('history-exercise-alt-name');
    if (altName) {
      altEl.textContent = altName;
      altEl.classList.remove('hidden');
    } else {
      altEl.classList.add('hidden');
    }

    document.getElementById('history-video-link').href = getExerciseVideoUrl(exercise);
    document.getElementById('history-muscle-link').href = getExerciseMuscleDirectoryUrl(exercise);
    document.getElementById('history-muscle-link-label').textContent = t('allMuscleVideos', {
      muscle: catLabel
    });

    const toggleBtn = document.getElementById('history-increase-toggle');
    toggleBtn.classList.toggle('active', Boolean(exercise.increaseNextTime));

    document.getElementById('history-comfortable-input').value = exercise.comfortableWeight || '';
    document.getElementById('history-challenge-input').value = exercise.challengeWeight || '';

    const todayStr = getLocalDateStr();
    const history = getExerciseHistory(exerciseId).filter(({ session, entry }) => {
      if (session.date !== todayStr) return true;
      return entry.series.some((s) => s.weight !== '' || s.reps !== '' || s.completed);
    });
    const countEl = document.getElementById('history-session-count');
    const sessionWord = history.length === 1 ? t('sessionWordOne') : t('sessionWordMany');
    countEl.textContent = `${history.length} ${sessionWord}`;

    const listEl = document.getElementById('history-sessions-list');
    const unit = state.settings.unit;

    if (history.length === 0) {
      listEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 18px 0;">${escapeHtml(t('noHistoryForExercise'))}</p>`;
      return;
    }

    listEl.innerHTML = history
      .map(({ session, entry }) => {
        const chips = entry.series
          .map((s, i) => {
            const w = s.weight !== '' ? `${s.weight}${unit}` : '—';
            const r = s.reps !== '' ? `× ${s.reps}` : '× —';
            return `<span class="set-chip ${s.completed ? 'done' : ''}">#${i + 1}: ${escapeHtml(w)} ${escapeHtml(r)}</span>`;
          })
          .join('');

        return `
          <div class="history-session-card">
            <div class="history-session-top">
              <span class="history-session-date">${escapeHtml(formatDisplayDate(session.date))}</span>
              <span class="history-session-rel">${escapeHtml(formatRelativeDate(session.date))}</span>
            </div>
            <div class="history-sets-chips">${chips}</div>
          </div>
        `;
      })
      .join('');
  }

  function renderAll() {
    applyTranslations();
    renderHeader();
    renderSessionView();
    if (activeTab === 'exercises') renderCatalogView();
    if (activeTab === 'sessions') renderPastSessionsView();
  }

  // ---------- Navigation, Language & Modals ----------

  function setLanguage(nextLang) {
    state.settings.lang = nextLang === 'en' ? 'en' : 'es';
    saveState();
    renderAll();

    if (!document.getElementById('modal-add-exercise').classList.contains('hidden')) {
      renderCategoryPills(document.getElementById('add-exercise-pills'), addModalCategory, false);
      renderAddExerciseResults();
    }
    if (currentHistoryExerciseId) {
      renderHistoryModal(currentHistoryExerciseId);
    }

    showToast(t('toastLangSwitched'));
  }

  function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${tabName}`);
    });

    if (tabName === 'session') {
      renderSessionView();
    } else {
      document.getElementById('fab-add-exercise').classList.add('hidden');
      if (tabName === 'exercises') renderCatalogView();
      if (tabName === 'sessions') renderPastSessionsView();
    }
  }

  function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    if (id === 'modal-exercise-history') {
      currentHistoryExerciseId = null;
    }
  }

  function openAddExerciseModal() {
    addModalCategory = 'All';
    const searchInput = document.getElementById('add-exercise-search');
    searchInput.value = '';
    const quickVideoInput = document.getElementById('quick-create-video');
    if (quickVideoInput) quickVideoInput.value = '';
    renderCategoryPills(document.getElementById('add-exercise-pills'), addModalCategory, false);
    renderAddExerciseResults();
    openModal('modal-add-exercise');
    setTimeout(() => searchInput.focus(), 60);
  }

  function openExerciseHistoryModal(exerciseId) {
    renderHistoryModal(exerciseId);
    renderHeader();
    openModal('modal-exercise-history');
  }

  function handleSelectExerciseForSession(exerciseId) {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;
    const session = ensureSessionForDate(activeDate);
    const entry = addExerciseToSession(session.id, exercise.id);

    closeModal('modal-add-exercise');
    switchTab('session');
    renderSessionView();

    const newCard = document.querySelector(`[data-entry-id="${CSS.escape(entry.id)}"]`);
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast(t('toastAdded', { name: getExerciseDisplayName(exercise) }));
  }

  // ---------- Event Wiring ----------

  function bindEvents() {
    // Bottom Tabs
    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Language toggle in Header & Settings
    document.getElementById('btn-lang-toggle').addEventListener('click', () => {
      setLanguage(getLang() === 'es' ? 'en' : 'es');
    });

    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.setLang));
    });

    // Date navigation
    document.getElementById('btn-prev-day').addEventListener('click', () => {
      activeDate = shiftDateStr(activeDate, -1);
      renderAll();
    });

    document.getElementById('btn-next-day').addEventListener('click', () => {
      activeDate = shiftDateStr(activeDate, 1);
      renderAll();
    });

    document.getElementById('session-date-input').addEventListener('change', (e) => {
      if (e.target.value) {
        activeDate = e.target.value;
        switchTab('session');
        renderAll();
      }
    });

    document.getElementById('jump-session-date-input').addEventListener('change', (e) => {
      if (e.target.value) {
        activeDate = e.target.value;
        switchTab('session');
        renderAll();
      }
    });

    document.getElementById('btn-jump-today').addEventListener('click', () => {
      activeDate = getLocalDateStr();
      switchTab('session');
      renderAll();
    });

    // Unit Toggle
    document.getElementById('btn-unit-toggle').addEventListener('click', () => {
      state.settings.unit = state.settings.unit === 'kg' ? 'lb' : 'kg';
      saveState();
      renderAll();
      if (currentHistoryExerciseId) renderHistoryModal(currentHistoryExerciseId);
      showToast(t('toastUnitSwitched', { unit: state.settings.unit }));
    });

    // Session notes
    document.getElementById('session-notes-input').addEventListener('input', (e) => {
      const session = ensureSessionForDate(activeDate);
      session.notes = e.target.value;
      saveState();
    });

    // Demo clear banner button
    document.getElementById('btn-clear-demo').addEventListener('click', () => {
      state.sessions = [];
      state.exercises.forEach((ex) => {
        ex.comfortableWeight = '';
        ex.challengeWeight = '';
        ex.increaseNextTime = false;
      });
      state.settings.isDemo = false;
      saveState();
      renderAll();
      showToast(t('toastFresh'));
    });

    // Open Add Exercise triggers
    document.getElementById('btn-open-add-exercise').addEventListener('click', openAddExerciseModal);
    document.getElementById('btn-empty-add').addEventListener('click', openAddExerciseModal);
    document.getElementById('fab-add-exercise').addEventListener('click', openAddExerciseModal);

    // Add Exercise Modal Search & Pills
    document.getElementById('add-exercise-search').addEventListener('input', renderAddExerciseResults);
    document.getElementById('btn-clear-add-search').addEventListener('click', () => {
      const inp = document.getElementById('add-exercise-search');
      inp.value = '';
      const quickVideoInput = document.getElementById('quick-create-video');
      if (quickVideoInput) quickVideoInput.value = '';
      renderAddExerciseResults();
      inp.focus();
    });

    document.getElementById('add-exercise-pills').addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      addModalCategory = pill.dataset.category;
      renderCategoryPills(document.getElementById('add-exercise-pills'), addModalCategory, false);
      renderAddExerciseResults();
    });

    document.getElementById('btn-quick-create-add').addEventListener('click', () => {
      const name = document.getElementById('add-exercise-search').value.trim();
      const category = document.getElementById('quick-create-category').value;
      const customVideoUrl = document.getElementById('quick-create-video')?.value.trim() || '';
      if (!name) return;
      const newEx = createExercise({ name, category, customVideoUrl });
      handleSelectExerciseForSession(newEx.id);
    });

    document.getElementById('add-exercise-results').addEventListener('click', (e) => {
      const item = e.target.closest('[data-action="pick-add-exercise"]');
      if (!item) return;
      handleSelectExerciseForSession(item.dataset.exerciseId);
    });

    // Delegated Input & Click handlers on Session Exercise Cards
    const sessionList = document.getElementById('session-exercises-list');

    sessionList.addEventListener('input', (e) => {
      const target = e.target;
      const field = target.dataset.field;
      if (!field) return;

      if (field === 'comfortable-weight') {
        updateExerciseGeneralFields(target.dataset.exerciseId, {
          comfortableWeight: target.value
        });
      } else if (field === 'challenge-weight') {
        updateExerciseGeneralFields(target.dataset.exerciseId, {
          challengeWeight: target.value
        });
      } else if (field === 'series-weight') {
        updateSeries(target.dataset.sessionId, target.dataset.entryId, target.dataset.seriesId, {
          weight: target.value
        });
      } else if (field === 'series-reps') {
        updateSeries(target.dataset.sessionId, target.dataset.entryId, target.dataset.seriesId, {
          reps: target.value
        });
      }
    });

    sessionList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'toggle-increase') {
        const ex = getExerciseById(btn.dataset.exerciseId);
        if (!ex) return;
        const nextVal = !ex.increaseNextTime;
        updateExerciseGeneralFields(ex.id, { increaseNextTime: nextVal });
        document.querySelectorAll(`.exercise-card[data-exercise-id="${CSS.escape(ex.id)}"]`).forEach((card) => {
          card.classList.toggle('is-increase', nextVal);
          const toggle = card.querySelector('[data-action="toggle-increase"]');
          if (toggle) toggle.classList.toggle('active', nextVal);
        });
        showToast(nextVal ? t('toastIncreaseOn') : t('toastIncreaseOff'));
      } else if (action === 'open-history') {
        openExerciseHistoryModal(btn.dataset.exerciseId);
      } else if (action === 'toggle-collapse') {
        const entryId = btn.dataset.entryId;
        const card = btn.closest('.exercise-card');
        if (collapsedEntries.has(entryId)) {
          collapsedEntries.delete(entryId);
          card.classList.remove('collapsed');
          btn.textContent = '▴';
        } else {
          collapsedEntries.add(entryId);
          card.classList.add('collapsed');
          btn.textContent = '▾';
        }
      } else if (action === 'remove-entry') {
        removeEntryFromSession(btn.dataset.sessionId, btn.dataset.entryId);
        renderSessionView();
      } else if (action === 'toggle-series-done') {
        const row = btn.closest('.series-row');
        const nextDone = !btn.classList.contains('done');
        updateSeries(btn.dataset.sessionId, btn.dataset.entryId, btn.dataset.seriesId, {
          completed: nextDone
        });
        btn.classList.toggle('done', nextDone);
        row.classList.toggle('completed', nextDone);
        updateSessionStatsBar();
      } else if (action === 'add-series') {
        addSeries(btn.dataset.sessionId, btn.dataset.entryId);
        renderSessionView();
      } else if (action === 'remove-series') {
        removeSeries(btn.dataset.sessionId, btn.dataset.entryId, btn.dataset.seriesId);
        renderSessionView();
      }
    });

    // History Modal Events
    document.getElementById('history-increase-toggle').addEventListener('click', () => {
      if (!currentHistoryExerciseId) return;
      const ex = getExerciseById(currentHistoryExerciseId);
      if (!ex) return;
      const nextVal = !ex.increaseNextTime;
      updateExerciseGeneralFields(ex.id, { increaseNextTime: nextVal });
      document.getElementById('history-increase-toggle').classList.toggle('active', nextVal);
      renderSessionView();
      if (activeTab === 'exercises') renderCatalogView();
    });

    document.getElementById('history-comfortable-input').addEventListener('input', (e) => {
      if (!currentHistoryExerciseId) return;
      updateExerciseGeneralFields(currentHistoryExerciseId, {
        comfortableWeight: e.target.value
      });
      renderSessionView();
      if (activeTab === 'exercises') renderCatalogView();
    });

    document.getElementById('history-challenge-input').addEventListener('input', (e) => {
      if (!currentHistoryExerciseId) return;
      updateExerciseGeneralFields(currentHistoryExerciseId, {
        challengeWeight: e.target.value
      });
      renderSessionView();
      if (activeTab === 'exercises') renderCatalogView();
    });

    // Catalog View Events
    document.getElementById('catalog-search-input').addEventListener('input', renderCatalogView);

    document.getElementById('catalog-category-pills').addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      catalogCategory = pill.dataset.category;
      renderCatalogView();
    });

    document.getElementById('catalog-exercises-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-action="open-history"]');
      if (!item) return;
      openExerciseHistoryModal(item.dataset.exerciseId);
    });

    document.getElementById('btn-new-exercise').addEventListener('click', () => {
      document.getElementById('form-new-exercise').reset();
      applyTranslations();
      openModal('modal-new-exercise');
      setTimeout(() => document.getElementById('new-ex-name').focus(), 60);
    });

    document.getElementById('form-new-exercise').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-ex-name').value.trim();
      if (!name) return;
      const newEx = createExercise({
        name,
        category: document.getElementById('new-ex-category').value,
        equipment: document.getElementById('new-ex-equipment').value,
        customVideoUrl: document.getElementById('new-ex-video').value.trim(),
        comfortableWeight: document.getElementById('new-ex-comfortable').value.trim(),
        challengeWeight: document.getElementById('new-ex-challenge').value.trim(),
        increaseNextTime: document.getElementById('new-ex-increase').checked
      });
      closeModal('modal-new-exercise');
      renderCatalogView();
      showToast(t('toastCreated', { name: getExerciseDisplayName(newEx) }));
    });

    // Past Sessions View Events
    document.getElementById('past-sessions-list').addEventListener('click', (e) => {
      const card = e.target.closest('[data-action="open-session-date"]');
      if (!card) return;
      activeDate = card.dataset.date;
      switchTab('session');
      renderAll();
    });

    // Settings & Backup Modal
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      openModal('modal-settings');
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
      const payload = JSON.stringify(state, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymlog-backup-${getLocalDateStr()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(t('toastExported'));
    });

    document.getElementById('input-import-json').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.exercises) || !Array.isArray(parsed.sessions)) {
            showToast(t('toastInvalidJson'));
            return;
          }
          state = {
            exercises: mergeCatalogExercises(parsed.exercises),
            sessions: sortSessionsNewestFirst(parsed.sessions),
            settings: {
              unit: parsed.settings?.unit === 'lb' ? 'lb' : 'kg',
              lang: parsed.settings?.lang === 'en' ? 'en' : getLang(),
              isDemo: Boolean(parsed.settings?.isDemo)
            }
          };
          saveState();
          closeModal('modal-settings');
          renderAll();
          showToast(t('toastRestored'));
        } catch (err) {
          showToast(t('toastJsonError'));
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('btn-load-demo').addEventListener('click', () => {
      state = buildDemoState(getLang());
      activeDate = getLocalDateStr();
      saveState();
      closeModal('modal-settings');
      switchTab('session');
      renderAll();
      showToast(t('toastDemoLoaded'));
    });

    document.getElementById('btn-clear-sessions').addEventListener('click', () => {
      state.sessions = [];
      state.exercises.forEach((ex) => {
        ex.comfortableWeight = '';
        ex.challengeWeight = '';
        ex.increaseNextTime = false;
      });
      state.settings.isDemo = false;
      saveState();
      closeModal('modal-settings');
      renderAll();
      showToast(t('toastSessionsCleared'));
    });

    // Modal close buttons & backdrop clicks
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop.id);
      });
    });
  }

  // ---------- Service Worker Registration ----------

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Ignore registration errors when opening directly via file://
      });
    }
  }

  // ---------- Boot ----------

  bindEvents();
  renderAll();
  registerServiceWorker();
})();
