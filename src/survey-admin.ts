/**
 * Hyundai Motor Company — Survey Admin Dashboard
 *
 * Admin PIN:  HYUNDAI2025  ← Change before deployment
 */
import { surveyService, SurveyConfig, SurveyResponse, Question } from './services/survey';
import QRCode from 'qrcode';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ── Constants ──────────────────────────────────────────────────────────────────
const SURVEY_ID  = 'hyundai-survey-2025';
const ADMIN_PIN  = 'HYUNDAI2025';  // ← Change this before deployment
const SURVEY_URL = (() => {
  const base = window.location.href.replace('survey-admin.html', '');
  return base + 'survey.html';
})();

const CHART_COLORS = [
  '#003087', '#0073e6', '#47a3ff', '#1a936f',
  '#88d498', '#f4a261', '#e76f51', '#e9c46a',
  '#6c757d', '#adb5bd',
];

// ── State ──────────────────────────────────────────────────────────────────────
let config: SurveyConfig | null = null;
let responses: SurveyResponse[] = [];
const charts: Record<string, Chart> = {};
let stopListening: (() => void) | null = null;
let currentPage = 1;
const PAGE_SIZE  = 20;
let searchQuery  = '';

// ── DOM helper ─────────────────────────────────────────────────────────────────
function $<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(epoch: number): string {
  return new Date(epoch).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

function timeAgo(epoch: number): string {
  const diff = Date.now() - epoch;
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTypeLabel(type: string): string {
  const m: Record<string, string> = {
    radio: '단일 선택', checkbox: '복수 선택', select: '드롭다운',
    rating: '평점', text: '단답형', textarea: '장문형',
  };
  return m[type] ?? type;
}

function destroyChart(id: string): void {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ── Auth ────────────────────────────────────────────────────────────────────────
function isAuthed(): boolean {
  return sessionStorage.getItem('hmc_admin_auth') === 'ok';
}
function doLogin(pin: string): boolean {
  if (pin.trim() === ADMIN_PIN) {
    sessionStorage.setItem('hmc_admin_auth', 'ok');
    return true;
  }
  return false;
}
function doLogout(): void {
  sessionStorage.removeItem('hmc_admin_auth');
  location.reload();
}

// ── Tab navigation ─────────────────────────────────────────────────────────────
function switchTab(name: string): void {
  document.querySelectorAll<HTMLElement>('.tab-content').forEach(el => { el.hidden = true; });
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const section = $(`tab-${name}`);
  if (section) section.hidden = false;
  const btn = document.querySelector<HTMLElement>(`[data-tab="${name}"]`);
  if (btn) btn.classList.add('active');

  // Render the newly visible tab
  if (name === 'overview')   renderOverview();
  if (name === 'analytics')  renderAnalytics();
  if (name === 'responses')  renderResponsesTable();
}

// ── QR Code ────────────────────────────────────────────────────────────────────
async function generateQR(): Promise<void> {
  const canvas = $<HTMLCanvasElement>('qr-canvas');
  const urlEl  = $('survey-url-display');
  urlEl.textContent = SURVEY_URL;

  await QRCode.toCanvas(canvas, SURVEY_URL, {
    width: 200, margin: 2,
    color: { dark: '#003087', light: '#ffffff' },
  });
}

function downloadQR(): void {
  const canvas = $<HTMLCanvasElement>('qr-canvas');
  const link = document.createElement('a');
  link.download = 'hyundai-survey-qr.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function copyUrl(): Promise<void> {
  await navigator.clipboard.writeText(SURVEY_URL);
  const btn = $('copy-url');
  const orig = btn.textContent!;
  btn.textContent = '✅ 복사됨';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

// ── Header stats ───────────────────────────────────────────────────────────────
function updateHeaderStats(): void {
  $('header-total').textContent = String(responses.length);

  const todayStr = new Date().toDateString();
  const todayCount = responses.filter(r => new Date(r.submittedAt).toDateString() === todayStr).length;
  $('header-today').textContent = String(todayCount);

  if (responses.length > 0) {
    const lastBadge = $('header-last-badge');
    lastBadge.style.display = '';
    $('header-last').textContent = timeAgo(responses[responses.length - 1].submittedAt);
  }
}

// ── Overview tab ───────────────────────────────────────────────────────────────
function renderOverview(): void {
  const total = responses.length;
  $('stat-total').textContent = String(total);

  const todayStr = new Date().toDateString();
  const todayCount = responses.filter(r => new Date(r.submittedAt).toDateString() === todayStr).length;
  $('stat-today').textContent = String(todayCount);
  $('stat-today-date').textContent = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  if (total > 0) {
    $('stat-last').textContent = timeAgo(responses[total - 1].submittedAt);
  }

  if (config) {
    const required = config.questions.filter(q => q.required);
    if (required.length > 0) {
      const complete = responses.filter(r =>
        required.every(q => r.answers[q.id] !== undefined && r.answers[q.id] !== '')
      ).length;
      const rate = total > 0 ? Math.round((complete / total) * 100) : 0;
      $('stat-completion').textContent = `${rate}%`;
    } else {
      $('stat-completion').textContent = '100%';
    }
  }

  renderTimelineChart();
}

function renderTimelineChart(): void {
  const canvas = $<HTMLCanvasElement>('timeline-chart');
  if (!canvas) return;

  // Build 14-day buckets
  const dayMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap[formatDateShort(d.getTime())] = 0;
  }
  responses.forEach(r => {
    const key = formatDateShort(r.submittedAt);
    if (key in dayMap) dayMap[key]++;
  });

  destroyChart('timeline');
  charts['timeline'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Object.keys(dayMap),
      datasets: [{
        label: '응답 수',
        data: Object.values(dayMap),
        borderColor: '#003087',
        backgroundColor: 'rgba(0,48,135,0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: '#003087',
        pointRadius: 4,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });
}

// ── Analytics tab ──────────────────────────────────────────────────────────────
function renderAnalytics(): void {
  if (!config) return;
  const container = $('analytics-container');
  container.innerHTML = '';

  config.questions.forEach((q, idx) => {
    const answered = responses.filter(r => {
      const a = r.answers[q.id];
      return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
    });
    container.appendChild(buildQuestionCard(q, idx, answered));
  });
}

function buildQuestionCard(q: Question, idx: number, answered: SurveyResponse[]): HTMLElement {
  const total = responses.length;
  const count = answered.length;
  const rate  = total > 0 ? Math.round((count / total) * 100) : 0;

  const card = document.createElement('div');
  card.className = 'analytics-card';
  card.innerHTML = `
    <div class="analytics-card-header">
      <div class="q-meta">
        <span class="q-badge">Q${idx + 1}</span>
        <span class="q-type-badge">${escHtml(getTypeLabel(q.type))}</span>
        ${q.required ? '<span class="q-required-badge">필수</span>' : ''}
      </div>
      <span class="q-response-rate">응답 ${count}/${total} (${rate}%)</span>
    </div>
    <h3 class="analytics-q-title">${escHtml(q.text)}</h3>
    <div class="analytics-chart-area" id="ca-${q.id}"></div>
    <div class="analytics-insight" id="ci-${q.id}"></div>
  `;

  // Defer rendering so the element is in the DOM
  requestAnimationFrame(() => {
    const area = card.querySelector<HTMLElement>(`#ca-${q.id}`)!;
    renderQuestionViz(q, answered, area, card);
  });

  return card;
}

function renderQuestionViz(
  q: Question,
  answered: SurveyResponse[],
  area: HTMLElement,
  card: HTMLElement
): void {
  const insightEl = card.querySelector<HTMLElement>(`#ci-${q.id}`)!;

  if (answered.length === 0) {
    area.innerHTML = '<p class="no-data">아직 응답이 없습니다.</p>';
    return;
  }

  if (q.type === 'text' || q.type === 'textarea') {
    renderTextList(q, answered, area);
    return;
  }
  if (q.type === 'rating') {
    renderRatingViz(q, answered, area, insightEl);
    return;
  }
  // radio / checkbox / select
  renderChoiceChart(q, answered, area, insightEl);
}

function renderChoiceChart(
  q: Question,
  answered: SurveyResponse[],
  area: HTMLElement,
  insightEl: HTMLElement
): void {
  if (!q.options?.length) return;

  const counts: Record<string, number> = {};
  q.options.forEach(o => { counts[o.value] = 0; });

  answered.forEach(r => {
    const a = r.answers[q.id];
    const vals = Array.isArray(a) ? a : [a as string];
    vals.forEach(v => { if (v in counts) counts[v]++; });
  });

  const labels = q.options.map(o => o.label);
  const data   = q.options.map(o => counts[o.value]);
  const N      = answered.length;

  area.innerHTML = '<canvas style="max-height:300px"></canvas>';
  const canvas = area.querySelector<HTMLCanvasElement>('canvas')!;

  destroyChart(`q-${q.id}`);
  charts[`q-${q.id}`] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, data.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              return ` ${v}명 (${N > 0 ? Math.round((v / N) * 100) : 0}%)`;
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        y: { grid: { display: false } },
      },
    },
  });

  // Insight: top answer
  const top = q.options.reduce((a, b) => (counts[a.value] >= counts[b.value] ? a : b));
  const topPct = N > 0 ? Math.round((counts[top.value] / N) * 100) : 0;
  if (topPct > 0) {
    insightEl.innerHTML =
      `💡 가장 많이 선택: <strong>${escHtml(top.label)}</strong> — ${counts[top.value]}명 (${topPct}%)`;
  }
}

function renderRatingViz(
  q: Question,
  answered: SurveyResponse[],
  area: HTMLElement,
  insightEl: HTMLElement
): void {
  const min = q.min ?? 1;
  const max = q.max ?? 5;
  const counts: Record<number, number> = {};
  for (let i = min; i <= max; i++) counts[i] = 0;

  const nums: number[] = [];
  answered.forEach(r => {
    const a = r.answers[q.id];
    const v = parseInt(Array.isArray(a) ? a[0] : (a as string), 10);
    if (!isNaN(v) && v >= min && v <= max) { counts[v]++; nums.push(v); }
  });

  const avg = nums.length > 0 ? (nums.reduce((s, n) => s + n, 0) / nums.length) : 0;

  area.innerHTML = `
    <div class="rating-avg">평균 <strong>${avg.toFixed(2)}</strong> / ${max}점</div>
    <canvas style="max-height:200px"></canvas>
  `;
  const canvas = area.querySelector<HTMLCanvasElement>('canvas')!;

  destroyChart(`q-${q.id}`);
  charts[`q-${q.id}`] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(counts).map(k => `${k}점`),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: CHART_COLORS.slice(0, max - min + 1),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });

  // Insight
  if (avg >= max * 0.8) insightEl.innerHTML = `💡 <strong>긍정적</strong> 응답 우세 (평균 ${avg.toFixed(2)}점 / ${max}점)`;
  else if (avg <= max * 0.4) insightEl.innerHTML = `💡 <strong>낮은</strong> 점수 경향 (평균 ${avg.toFixed(2)}점 / ${max}점)`;
  else insightEl.innerHTML = `💡 평균 <strong>${avg.toFixed(2)}점</strong> (${max}점 만점)`;
}

function renderTextList(q: Question, answered: SurveyResponse[], area: HTMLElement): void {
  const texts = answered
    .map(r => { const a = r.answers[q.id]; return Array.isArray(a) ? a.join(', ') : a as string; })
    .filter(Boolean);

  area.innerHTML = `
    <div class="text-responses">
      ${texts.map((t, i) => `
        <div class="text-response-item">
          <span class="text-response-num">${i + 1}</span>
          <span class="text-response-content">${escHtml(t)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Responses table ────────────────────────────────────────────────────────────
function renderResponsesTable(): void {
  if (!config) return;

  const filtered = searchQuery
    ? responses.filter(r => JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase()))
    : responses;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  $('response-count').textContent = `총 ${filtered.length}개 응답`;

  const container = $('responses-table-container');
  if (filtered.length === 0) {
    container.innerHTML = '<p class="no-data">응답이 없습니다.</p>';
    $('pagination').innerHTML = '';
    return;
  }

  const cols = config.questions.map(q => ({ id: q.id, text: q.text }));

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="responses-table">
        <thead>
          <tr>
            <th>#</th>
            <th>제출 시각</th>
            ${cols.map(c => `<th title="${escHtml(c.text)}">${escHtml(c.text.length > 14 ? c.text.slice(0, 14) + '…' : c.text)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((r, i) => `
            <tr>
              <td>${(currentPage - 1) * PAGE_SIZE + i + 1}</td>
              <td class="nowrap">${formatDate(r.submittedAt)}</td>
              ${cols.map(c => {
                const a = r.answers[c.id];
                const txt = Array.isArray(a) ? a.join(', ') : (a ?? '—');
                const display = String(txt).length > 28 ? String(txt).slice(0, 28) + '…' : String(txt);
                return `<td title="${escHtml(String(txt))}">${escHtml(display)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Pagination
  const paginationEl = $('pagination');
  paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map(p => `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`)
    .join('');
  paginationEl.querySelectorAll<HTMLElement>('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset['page']!, 10);
      renderResponsesTable();
    });
  });
}

// ── Export ─────────────────────────────────────────────────────────────────────
function exportCSV(): void {
  if (!config || responses.length === 0) { alert('내보낼 응답이 없습니다.'); return; }

  const qs = config.questions;
  const header = ['번호', '제출시각', '응답자ID', ...qs.map(q => q.text)];
  const rows = responses.map((r, i) => [
    String(i + 1),
    formatDate(r.submittedAt),
    r.respondentId,
    ...qs.map(q => {
      const a = r.answers[q.id];
      return Array.isArray(a) ? a.join(' | ') : (a ?? '');
    }),
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom  = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `hyundai-survey-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(): void {
  if (responses.length === 0) { alert('내보낼 응답이 없습니다.'); return; }
  const blob = new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `hyundai-survey-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportSummary(): Promise<void> {
  if (!config || responses.length === 0) { alert('요약할 응답이 없습니다.'); return; }

  const lines: string[] = [
    `현대자동차 교육 사전설문 결과 요약`,
    `생성일시: ${new Date().toLocaleString('ko-KR')}`,
    `총 응답 수: ${responses.length}명`,
    '',
  ];

  config.questions.forEach((q, idx) => {
    const answered = responses.filter(r => r.answers[q.id] !== undefined);
    lines.push(`Q${idx + 1}. ${q.text}`);
    lines.push(`   응답 수: ${answered.length}명`);

    if (q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') {
      const counts: Record<string, number> = {};
      answered.forEach(r => {
        const a = r.answers[q.id];
        const vals = Array.isArray(a) ? a : [a as string];
        vals.forEach(v => { if (v) counts[v] = (counts[v] ?? 0) + 1; });
      });
      q.options?.forEach(o => {
        const n = counts[o.value] ?? 0;
        const pct = answered.length > 0 ? Math.round((n / answered.length) * 100) : 0;
        lines.push(`   • ${o.label}: ${n}명 (${pct}%)`);
      });
    } else if (q.type === 'rating') {
      const nums = answered.map(r => {
        const a = r.answers[q.id];
        return parseInt(Array.isArray(a) ? a[0] : (a as string), 10);
      }).filter(n => !isNaN(n));
      const avg = nums.length > 0 ? (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2) : '—';
      lines.push(`   평균: ${avg}점 / ${q.max ?? 5}점`);
    } else {
      lines.push(`   (주관식 응답 ${answered.length}건)`);
    }
    lines.push('');
  });

  await navigator.clipboard.writeText(lines.join('\n'));
  const btn = $('export-summary');
  const orig = btn.textContent!;
  btn.textContent = '✅ 복사됨!';
  setTimeout(() => { btn.textContent = orig; }, 2500);
}

// ── Real-time data ──────────────────────────────────────────────────────────────
function startListening(): void {
  stopListening = surveyService.onResponses(SURVEY_ID, (newResponses) => {
    responses = newResponses;
    updateHeaderStats();

    // Refresh whichever tab is active
    const activeTab = document.querySelector<HTMLElement>('.nav-item.active')?.dataset['tab'];
    if (activeTab === 'overview')  renderOverview();
    if (activeTab === 'analytics') renderAnalytics();
    if (activeTab === 'responses') renderResponsesTable();
  });
}

// ── Init ────────────────────────────────────────────────────────────────────────
async function initAdmin(): Promise<void> {
  config = await surveyService.getSurveyConfig(SURVEY_ID);
  startListening();
  await generateQR();
  renderOverview();
}

function init(): void {
  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (isAuthed()) {
    $('login-screen').hidden = true;
    $('admin-app').hidden = false;
    initAdmin().catch(console.error);
  }

  $('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const pin = $<HTMLInputElement>('pin-input').value;
    if (doLogin(pin)) {
      $('login-screen').hidden = true;
      $('admin-app').hidden = false;
      initAdmin().catch(console.error);
    } else {
      $('login-error').hidden = false;
      ($<HTMLInputElement>('pin-input')).value = '';
    }
  });

  $('logout-btn').addEventListener('click', doLogout);

  // ── Menu toggle (mobile) ─────────────────────────────────────────────────────
  $('menu-toggle').addEventListener('click', () => {
    $('sidebar').classList.toggle('open');
  });

  // ── Tab nav ──────────────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLElement>('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset['tab']!);
      $('sidebar').classList.remove('open');
    });
  });

  // ── QR actions ───────────────────────────────────────────────────────────────
  $('download-qr').addEventListener('click', downloadQR);
  $('copy-url').addEventListener('click', () => { copyUrl().catch(console.error); });

  // ── Search ───────────────────────────────────────────────────────────────────
  $('response-search').addEventListener('input', e => {
    searchQuery  = (e.target as HTMLInputElement).value;
    currentPage  = 1;
    renderResponsesTable();
  });

  // ── Export ───────────────────────────────────────────────────────────────────
  $('export-csv').addEventListener('click', exportCSV);
  $('export-json').addEventListener('click', exportJSON);
  $('export-summary').addEventListener('click', () => { exportSummary().catch(console.error); });
}

document.addEventListener('DOMContentLoaded', init);
