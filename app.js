// ══════════════════════════════════════════════════════════
//  GIFTSWAP — app.js
//  Sistema de Intercambio de Regalos
//  Tecnologías Web — Miniproyecto #1
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════
//  LOCALSTORAGE HELPERS
// ══════════════════════════════════
const LS_KEY = "giftswap_data";

function saveLS(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function loadLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

function patchLS(obj) {
  const cur = loadLS();
  saveLS({ ...cur, ...obj });
}

// ══════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════
let currentScreen = 0;
const TOTAL_STEPS = 6;

function goTo(n) {
  // Ocultar todas las secciones
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.add("hidden"));

  // Mostrar la pantalla destino (0 = splash)
  const screenId = n === 0 ? "screen-splash" : "screen-" + n;
  const el = document.getElementById(screenId);
  if (el) el.classList.remove("hidden");
  currentScreen = n;

  // Manejar barra de pasos y texto del header
  const bar = document.getElementById("stepBar");
  const hStep = document.getElementById("headerStep");

  if (n === 0) {
    bar.classList.add("hidden");
    hStep.textContent = "";
  } else if (n <= 7) {
    bar.classList.remove("hidden");
    updateStepBar(n <= 6 ? n : 7);
    hStep.textContent = n <= 6 ? `Paso ${n} de ${TOTAL_STEPS}` : "";
  } else {
    bar.classList.add("hidden");
    hStep.textContent = "";
  }

  // Inicialización específica por pantalla
  if (n === 2) initParticipantScreen();
  if (n === 3) initExclusionScreen();
  if (n === 5) initDateScreen();
  if (n === 8) renderInfo();
  if (n === 9) initDrawScreen();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepBar(active) {
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById("sd" + i);
    dot.classList.remove("active", "done");
    if (i < active) dot.classList.add("done");
    if (i === active) dot.classList.add("active");
  }
  for (let i = 1; i <= 5; i++) {
    const line = document.getElementById("sl" + i + (i + 1));
    if (line) {
      line.classList.remove("done");
      if (i < active) line.classList.add("done");
    }
  }
}

// ══════════════════════════════════
//  STEP 1 — ORGANIZADOR
// ══════════════════════════════════
function step1Next() {
  const name = document.getElementById("organizerName").value.trim();
  if (!name) {
    toast("Por favor ingresa tu nombre 😊");
    return;
  }
  const inc = document.getElementById("includeOrganizer").checked;
  patchLS({ organizer: name, includeOrganizer: inc });
  goTo(2);
}

// ══════════════════════════════════
//  STEP 2 — PARTICIPANTES (DRAG & DROP)
// ══════════════════════════════════
let dragSrc = null;

function initParticipantScreen() {
  const data = loadLS();
  const organizer = data.organizer || "";
  const inc = data.includeOrganizer !== false;
  let parts = data.participants || [];

  // Sembrar lista inicial si está vacía
  if (parts.length === 0) {
    if (inc) parts.push(organizer);
    parts.push("", ""); // dos espacios vacíos
    patchLS({ participants: parts });
  }
  renderParticipants();
}

function renderParticipants() {
  const parts = loadLS().participants || [];
  const list = document.getElementById("participantList");
  list.innerHTML = "";

  parts.forEach((p, i) => {
    const initials = p ? p.charAt(0).toUpperCase() : "?";
    const div = document.createElement("div");
    div.className = "participant-item";
    div.draggable = true;
    div.dataset.index = i;
    div.innerHTML = `
      <span class="drag-handle">⠿</span>
      <div class="avatar">${initials}</div>
      <input type="text" value="${escHtml(p)}"
        placeholder="Nombre del participante ${i + 1}"
        oninput="updateParticipant(${i}, this.value)"
        onkeydown="if(event.key==='Enter') addParticipant()"/>
      <button class="btn-sm-icon" onclick="removeParticipant(${i})" title="Eliminar">✕</button>
    `;

    // ── DRAG & DROP API ──
    div.addEventListener("dragstart", (e) => {
      dragSrc = div;
      div.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      document
        .querySelectorAll(".participant-item")
        .forEach((el) => el.classList.remove("drag-over"));
    });
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      document
        .querySelectorAll(".participant-item")
        .forEach((el) => el.classList.remove("drag-over"));
      if (div !== dragSrc) div.classList.add("drag-over");
    });
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragSrc && dragSrc !== div) {
        const fromIdx = +dragSrc.dataset.index;
        const toIdx = +div.dataset.index;
        const partsCopy = loadLS().participants || [];
        const [moved] = partsCopy.splice(fromIdx, 1);
        partsCopy.splice(toIdx, 0, moved);
        patchLS({ participants: partsCopy });
        renderParticipants();
        toast("Orden actualizado 🔀");
      }
    });

    list.appendChild(div);
  });
}

function updateParticipant(i, val) {
  const parts = loadLS().participants || [];
  parts[i] = val;
  patchLS({ participants: parts });
  // Actualizar letra del avatar en tiempo real
  const items = document.querySelectorAll(".participant-item");
  if (items[i]) {
    const av = items[i].querySelector(".avatar");
    if (av) av.textContent = val ? val.charAt(0).toUpperCase() : "?";
  }
}

function addParticipant() {
  const parts = loadLS().participants || [];
  parts.push("");
  patchLS({ participants: parts });
  renderParticipants();
  // Enfocar el último input
  setTimeout(() => {
    const inputs = document.querySelectorAll("#participantList input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 50);
}

function removeParticipant(i) {
  const parts = loadLS().participants || [];
  parts.splice(i, 1);
  patchLS({ participants: parts });
  renderParticipants();
}

function step2Next() {
  const parts = (loadLS().participants || []).filter((p) => p.trim());
  if (parts.length < 2) {
    toast("Necesitas al menos 2 participantes 👥");
    return;
  }
  patchLS({ participants: parts, exclusions: {} });
  goTo(3);
}

// ══════════════════════════════════
//  STEP 3 — EXCLUSIONES
// ══════════════════════════════════
let usingExclusions = false;

function initExclusionScreen() {
  usingExclusions = false;
  document.getElementById("exclusionPanel").classList.add("hidden");
}

function setExclusions(val) {
  usingExclusions = val;
  const panel = document.getElementById("exclusionPanel");
  if (val) {
    panel.classList.remove("hidden");
    renderExclusions();
  } else {
    panel.classList.add("hidden");
    patchLS({ exclusions: {} });
  }
}

function renderExclusions() {
  const parts = (loadLS().participants || []).filter((p) => p.trim());
  const excl = loadLS().exclusions || {};
  const list = document.getElementById("exclusionList");
  list.innerHTML = "";

  parts.forEach((person) => {
    const others = parts.filter((p) => p !== person);
    const exclForPerson = excl[person] || [];
    const details = document.createElement("details");
    details.className = "exclusion-row";

    details.innerHTML = `
      <summary>
        <span>🚫 <strong>${escHtml(person)}</strong> no sortea a:</span>
        <span class="ms-2 text-muted" style="font-size:.8rem;">
          (${exclForPerson.length} excluido${exclForPerson.length !== 1 ? "s" : ""})
        </span>
      </summary>
      <div class="mt-2">
        ${others
          .map(
            (o) => `
          <label class="excl-check">
            <input type="checkbox"
              ${exclForPerson.includes(o) ? "checked" : ""}
              onchange="toggleExcl('${escJs(person)}','${escJs(o)}',this.checked)"/>
            <span>${escHtml(o)}</span>
          </label>
        `,
          )
          .join("")}
      </div>
    `;
    list.appendChild(details);
  });
}

function toggleExcl(person, target, checked) {
  const excl = loadLS().exclusions || {};
  if (!excl[person]) excl[person] = [];
  if (checked) {
    if (!excl[person].includes(target)) excl[person].push(target);
  } else {
    excl[person] = excl[person].filter((x) => x !== target);
  }
  patchLS({ exclusions: excl });
  renderExclusions();
}

function step3Next() {
  goTo(4);
}

// ══════════════════════════════════
//  STEP 4 — TIPO DE EVENTO
// ══════════════════════════════════
let selectedEventType = "";
let showMoreVisible = false;

function selectEvent(chip, type) {
  document
    .querySelectorAll(".event-chip")
    .forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  selectedEventType = type;
  patchLS({ eventType: type });
}

function toggleShowMore() {
  showMoreVisible = !showMoreVisible;
  const sec = document.getElementById("showMoreSection");
  sec.classList.toggle("hidden", !showMoreVisible);
}

function step4Next() {
  if (!selectedEventType) {
    toast("Selecciona un tipo de evento 🎊");
    return;
  }
  const custom = document.getElementById("customEventName").value.trim();
  const name = custom || selectedEventType;
  patchLS({ eventName: name });
  goTo(5);
}

// ══════════════════════════════════
//  STEP 5 — FECHA
// ══════════════════════════════════
let calYear, calMonth;
let selectedDate = null;

function initDateScreen() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  selectedDate = loadLS().eventDate || null;

  const title = document.getElementById("dateSectionTitle");
  title.textContent = `¿Cuándo se celebra ${loadLS().eventName || "el evento"}?`;

  renderSuggestions();
  if (selectedDate) showSelectedDate(selectedDate);
}

function renderSuggestions() {
  const today = new Date();
  const sugg = document.getElementById("suggestedDates");
  const dates = [];

  // Sugerir las próximas 3 semanas
  for (let d = 1; d <= 3; d++) {
    const dd = new Date(today);
    dd.setDate(today.getDate() + d * 7);
    dates.push(dd);
  }

  sugg.innerHTML = dates
    .map((d) => {
      const iso = d.toISOString().split("T")[0];
      const lbl = d.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const cls = selectedDate === iso ? "selected" : "";
      return `<div class="date-suggestion ${cls}" onclick="pickSuggestion('${iso}','${escJs(lbl)}')">${lbl}</div>`;
    })
    .join("");

  const otherSel =
    selectedDate &&
    !dates.some((d) => d.toISOString().split("T")[0] === selectedDate);
  sugg.innerHTML += `<div class="date-suggestion ${otherSel ? "selected" : ""}" onclick="openCalendar()">📅 Otro (elegir en calendario)</div>`;
}

function pickSuggestion(iso, label) {
  selectedDate = iso;
  patchLS({ eventDate: iso });
  document.getElementById("calendarSection").classList.add("hidden");
  showSelectedDate(label);
  renderSuggestions();
}

function openCalendar() {
  const sec = document.getElementById("calendarSection");
  sec.classList.toggle("hidden");
  renderCalendar();
}

function renderCalendar() {
  const now = new Date();
  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);

  document.getElementById("calMonthLabel").textContent =
    first.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  // Día de la semana del primer día (Lunes = 0)
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const grid = document.getElementById("calDays");
  grid.innerHTML = "";

  // Celdas vacías antes del primer día
  for (let i = 0; i < startDay; i++) {
    const d = document.createElement("div");
    d.className = "cal-day other-month";
    grid.appendChild(d);
  }

  // Días del mes
  for (let d = 1; d <= last.getDate(); d++) {
    const dd = new Date(calYear, calMonth, d);
    const iso = dd.toISOString().split("T")[0];
    const isT = dd.toDateString() === now.toDateString();
    const isSel = selectedDate === iso;
    const div = document.createElement("div");
    div.className =
      "cal-day" + (isT ? " today" : "") + (isSel ? " selected" : "");
    div.textContent = d;
    div.onclick = () => {
      selectedDate = iso;
      patchLS({ eventDate: iso });
      const lbl = dd.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      showSelectedDate(lbl);
      renderCalendar();
      renderSuggestions();
    };
    grid.appendChild(div);
  }
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCalendar();
}

function showSelectedDate(lbl) {
  const el = document.getElementById("selectedDateDisplay");
  el.textContent = "📅 " + lbl;
  el.classList.remove("hidden");
}

function step5Next() {
  if (!selectedDate) {
    toast("Por favor selecciona una fecha 📅");
    return;
  }
  goTo(6);
}

// ══════════════════════════════════
//  STEP 6 — PRESUPUESTO
// ══════════════════════════════════
let selectedBudget = null;
let otherBudgetOpen = false;

function selectBudget(chip, amount) {
  document
    .querySelectorAll(".budget-chip")
    .forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  selectedBudget = amount;
  otherBudgetOpen = false;
  document.getElementById("otherBudgetField").classList.add("hidden");
  patchLS({ budget: amount });
}

function toggleOtherBudget(chip) {
  document
    .querySelectorAll(".budget-chip")
    .forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  otherBudgetOpen = true;
  selectedBudget = null;
  document.getElementById("otherBudgetField").classList.remove("hidden");
  document.getElementById("customBudget").focus();
}

function step6Next() {
  let budget = selectedBudget;
  if (otherBudgetOpen) {
    const v = parseFloat(document.getElementById("customBudget").value);
    if (!v || v <= 0) {
      toast("Ingresa un presupuesto válido 💰");
      return;
    }
    budget = v;
  }
  if (!budget) {
    toast("Selecciona un presupuesto 💰");
    return;
  }
  patchLS({ budget });
  toast("¡Datos guardados en LocalStorage! 🎉");
  goTo(7);
}

// ══════════════════════════════════
//  SCREEN 8 — RESUMEN (desde LocalStorage)
// ══════════════════════════════════
function renderInfo() {
  // ⚠️ Lee DIRECTAMENTE de localStorage — NO usa variables en memoria RAM
  const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  const cont = document.getElementById("infoContent");

  const excl = data.exclusions || {};
  const parts = (data.participants || []).filter((p) => p.trim());
  const budget = data.budget ? `$${data.budget}` : "—";
  const evDate = data.eventDate
    ? new Date(data.eventDate + "T12:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const exclHtml =
    Object.entries(excl)
      .filter(([, v]) => v.length)
      .map(
        ([k, v]) =>
          `<div class="mb-1">
        <span class="chip">${escHtml(k)}</span> no sortea a:
        ${v.map((x) => `<span class="chip excl">${escHtml(x)}</span>`).join(" ")}
      </div>`,
      )
      .join("") || '<span style="color:#aaa">Ninguna</span>';

  cont.innerHTML = `
    <div class="info-row">
      <span class="info-label">👤 Organizador/a</span>
      <span class="info-value">${escHtml(data.organizer || "—")}</span>
    </div>
    <div class="info-row">
      <span class="info-label">🎊 Celebración</span>
      <span class="info-value">${escHtml(data.eventName || "—")}</span>
    </div>
    <div class="info-row">
      <span class="info-label">📅 Fecha del evento</span>
      <span class="info-value">${evDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">💰 Presupuesto</span>
      <span class="info-value">${budget}</span>
    </div>
    <div class="info-row">
      <span class="info-label">👥 Participantes (${parts.length})</span>
      <span class="info-value">
        <div class="chip-list">
          ${parts.map((p) => `<span class="chip">${escHtml(p)}</span>`).join("")}
        </div>
      </span>
    </div>
    <div class="info-row">
      <span class="info-label">🚫 Exclusiones</span>
      <span class="info-value">${exclHtml}</span>
    </div>
    <div class="mt-4 p-3 rounded"
      style="background:#f0fff8;border:1px solid #c8eee0;font-size:.8rem;color:#2a9d8f;">
      ✅ <strong>Fuente:</strong> Datos leídos directamente de
      <code>localStorage</code> (clave: <code>${LS_KEY}</code>)
    </div>
  `;
}

// ══════════════════════════════════
//  SCREEN 9 — SORTEO
// ══════════════════════════════════
function initDrawScreen() {
  document.getElementById("drawResults").classList.add("hidden");
  document.getElementById("resultList").innerHTML = "";
}

function performDraw() {
  const data = loadLS();
  const parts = (data.participants || []).filter((p) => p.trim());
  const excl = data.exclusions || {};

  if (parts.length < 2) {
    toast("No hay suficientes participantes");
    return;
  }

  const btn = document.getElementById("drawBtn");
  btn.classList.add("spinning");
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove("spinning");
    btn.disabled = false;

    const result = shuffleWithExclusions(parts, excl);
    if (!result) {
      toast(
        "No fue posible respetar todas las exclusiones. Intenta de nuevo o reduce exclusiones. 🔄",
      );
      return;
    }

    const list = document.getElementById("resultList");
    list.innerHTML = "";
    result.forEach(([giver, receiver], i) => {
      const div = document.createElement("div");
      div.className = "draw-result-item";
      div.style.animationDelay = `${i * 0.12}s`;
      div.innerHTML = `
        <span style="font-size:1.2rem">🎁</span>
        <span class="giver">${escHtml(giver)}</span>
        <span class="arrow">→</span>
        <span class="receiver">${escHtml(receiver)}</span>
      `;
      list.appendChild(div);
    });

    document.getElementById("drawResults").classList.remove("hidden");
    patchLS({ lastDraw: result, lastDrawDate: new Date().toISOString() });
    toast("¡Sorteo realizado con éxito! 🎉");
  }, 1400);
}

/**
 * Algoritmo Fisher-Yates con validación de exclusiones.
 * Intenta hasta 200 veces respetar: sin auto-asignación y sin exclusiones.
 * @param {string[]} parts    - Lista de participantes
 * @param {Object}   excl     - Mapa de exclusiones { persona: [excluidos] }
 * @returns {Array[]|null}    - Array de pares [quien_da, quien_recibe] o null si no fue posible
 */
function shuffleWithExclusions(parts, excl) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const givers = [...parts];
    const receivers = [...parts];

    // Mezclar receptores aleatoriamente
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }

    // Validar: sin auto-asignación ni violación de exclusiones
    let valid = true;
    for (let i = 0; i < givers.length; i++) {
      const giver = givers[i];
      const receiver = receivers[i];
      if (giver === receiver) {
        valid = false;
        break;
      }
      const ex = excl[giver] || [];
      if (ex.includes(receiver)) {
        valid = false;
        break;
      }
    }

    if (valid) return givers.map((g, i) => [g, receivers[i]]);
  }
  return null; // No se encontró solución válida
}

// ══════════════════════════════════
//  RESET
// ══════════════════════════════════
function confirmReset() {
  if (
    confirm(
      "¿Estás seguro de que deseas borrar todos los datos y comenzar desde cero?",
    )
  ) {
    localStorage.removeItem(LS_KEY);
    toast("Datos borrados 🗑️");
    setTimeout(() => goTo(0), 600);
  }
}

// ══════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════
function toast(msg) {
  const c = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = "toast-msg";
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// ══════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════

/** Escapa caracteres especiales HTML para evitar XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapa comillas simples para uso en atributos onclick inline */
function escJs(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// ══════════════════════════════════
//  INICIALIZACIÓN
// ══════════════════════════════════
(function init() {
  const data = loadLS();
  // Si ya existe un sorteo previo guardado, ir directo al dashboard
  if (
    data.organizer &&
    data.participants &&
    data.budget &&
    data.eventDate &&
    data.eventName
  ) {
    goTo(7);
  } else {
    goTo(0);
  }
})();
