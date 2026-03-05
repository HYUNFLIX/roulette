/**
 * Survey page logic — Hyundai Motor Company pre-survey
 */
import {
  surveyService,
  SurveyConfig,
  Question,
  QuestionOption,
} from './services/survey';

// ── Survey Configuration ─────────────────────────────────────────────────────
// TODO: Replace with your actual survey content when ready.
// You can also load this from Firebase via surveyService.getSurveyConfig(id).

const SURVEY_ID = 'hyundai-survey-2025';

const PLACEHOLDER_CONFIG: SurveyConfig = {
  id: SURVEY_ID,
  title: '현대자동차 사전 설문',
  description: '본 설문은 행사 준비를 위한 사전 정보 수집 목적으로 진행됩니다.\n응답 내용은 행사 운영에만 활용됩니다.',
  questions: [
    // Questions will be populated when content is provided.
    {
      id: 'placeholder',
      type: 'text',
      required: false,
      text: '설문 내용이 곧 추가될 예정입니다.',
      placeholder: '준비 중입니다...',
    },
  ],
};

// ── DOM Helpers ──────────────────────────────────────────────────────────────

function el<T extends HTMLElement>(selector: string, parent: ParentNode = document): T {
  const found = parent.querySelector<T>(selector);
  if (!found) throw new Error(`Element not found: ${selector}`);
  return found;
}

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string>> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined) node.setAttribute(k, v);
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

// ── Question Renderers ───────────────────────────────────────────────────────

function renderOptions(q: Question): HTMLElement {
  const group = createEl('div', { class: 'options-group' });

  if (!q.options) return group;

  q.options.forEach((opt: QuestionOption) => {
    const inputType = q.type === 'checkbox' ? 'checkbox' : 'radio';
    const inputId = `${q.id}_${opt.value}`;

    const input = createEl('input', {
      type: inputType,
      id: inputId,
      name: q.id,
      value: opt.value,
      class: 'option-input',
    });

    const label = createEl('label', { for: inputId, class: 'option-label' }, [opt.label]);

    const wrapper = createEl('div', { class: 'option-item' }, [input, label]);
    group.appendChild(wrapper);
  });

  return group;
}

function renderSelect(q: Question): HTMLElement {
  const select = createEl('select', { name: q.id, id: q.id, class: 'form-select' });
  select.appendChild(createEl('option', { value: '' }, ['선택해주세요']));

  (q.options || []).forEach((opt: QuestionOption) => {
    select.appendChild(createEl('option', { value: opt.value }, [opt.label]));
  });

  return select;
}

function renderRating(q: Question): HTMLElement {
  const min = q.min ?? 1;
  const max = q.max ?? 5;
  const group = createEl('div', { class: 'rating-group' });

  for (let i = min; i <= max; i++) {
    const inputId = `${q.id}_${i}`;
    const input = createEl('input', {
      type: 'radio',
      id: inputId,
      name: q.id,
      value: String(i),
      class: 'rating-input',
    });
    const label = createEl('label', { for: inputId, class: 'rating-label' }, [String(i)]);
    group.append(input, label);
  }

  return group;
}

function renderQuestion(q: Question, index: number): HTMLElement {
  const section = createEl('div', {
    class: 'question-block',
    'data-question-id': q.id,
  });

  // Number + title
  const title = createEl('p', { class: 'question-title' }, [
    createEl('span', { class: 'question-number' }, [`Q${index + 1}.`]),
    ` ${q.text}`,
    ...(q.required ? [createEl('span', { class: 'required-mark' }, [' *'])] : []),
  ]);
  section.appendChild(title);

  // Description
  if (q.description) {
    section.appendChild(createEl('p', { class: 'question-desc' }, [q.description]));
  }

  // Input area
  let inputEl: HTMLElement;
  switch (q.type) {
    case 'radio':
    case 'checkbox':
      inputEl = renderOptions(q);
      break;
    case 'select':
      inputEl = renderSelect(q);
      break;
    case 'rating':
      inputEl = renderRating(q);
      break;
    case 'textarea':
      inputEl = createEl('textarea', {
        name: q.id,
        id: q.id,
        class: 'form-textarea',
        placeholder: q.placeholder || '',
        rows: '4',
      });
      break;
    default:
      inputEl = createEl('input', {
        type: 'text',
        name: q.id,
        id: q.id,
        class: 'form-input',
        placeholder: q.placeholder || '',
      });
  }

  // Error message placeholder
  const errorEl = createEl('p', { class: 'field-error', 'aria-live': 'polite' }, ['']);

  section.append(inputEl, errorEl);
  return section;
}

// ── Validation ───────────────────────────────────────────────────────────────

function getAnswer(form: HTMLFormElement, q: Question): string | string[] | null {
  if (q.type === 'checkbox') {
    const checked = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${q.id}"]:checked`)
    ).map((i) => i.value);
    return checked.length > 0 ? checked : null;
  }
  if (q.type === 'radio') {
    const checked = form.querySelector<HTMLInputElement>(`input[name="${q.id}"]:checked`);
    return checked ? checked.value : null;
  }
  if (q.type === 'rating') {
    const checked = form.querySelector<HTMLInputElement>(`input[name="${q.id}"]:checked`);
    return checked ? checked.value : null;
  }
  const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[name="${q.id}"]`
  );
  const val = el?.value.trim() || null;
  return val || null;
}

function validateForm(
  form: HTMLFormElement,
  questions: Question[]
): { valid: boolean; answers: Record<string, string | string[]> } {
  const answers: Record<string, string | string[]> = {};
  let valid = true;

  questions.forEach((q) => {
    const block = form.querySelector<HTMLElement>(`[data-question-id="${q.id}"]`);
    const errorEl = block?.querySelector<HTMLElement>('.field-error');

    const answer = getAnswer(form, q);

    if (q.required && answer === null) {
      if (errorEl) errorEl.textContent = '필수 항목입니다.';
      block?.classList.add('has-error');
      valid = false;
    } else {
      if (errorEl) errorEl.textContent = '';
      block?.classList.remove('has-error');
      if (answer !== null) answers[q.id] = answer;
    }
  });

  return { valid, answers };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const loadingEl = el<HTMLElement>('#loading');
  const surveyEl = el<HTMLElement>('#survey-container');
  const alreadyEl = el<HTMLElement>('#already-submitted');
  const successEl = el<HTMLElement>('#success-message');
  const errorBannerEl = el<HTMLElement>('#error-banner');

  // 1. Check for prior submission
  if (surveyService.hasSubmitted(SURVEY_ID)) {
    loadingEl.hidden = true;
    alreadyEl.hidden = false;
    return;
  }

  // 2. Load config (falls back to placeholder if not in Firebase)
  let config: SurveyConfig;
  try {
    const remote = await surveyService.getSurveyConfig(SURVEY_ID);
    config = remote ?? PLACEHOLDER_CONFIG;
  } catch {
    config = PLACEHOLDER_CONFIG;
  }

  // 3. Render survey
  const titleEl = el<HTMLHeadingElement>('#survey-title');
  const descEl = el<HTMLParagraphElement>('#survey-description');
  const questionsEl = el<HTMLElement>('#questions');
  const form = el<HTMLFormElement>('#survey-form');

  titleEl.textContent = config.title;
  if (config.description) {
    descEl.innerHTML = config.description.replace(/\n/g, '<br>');
  }

  config.questions.forEach((q, i) => {
    questionsEl.appendChild(renderQuestion(q, i));
  });

  loadingEl.hidden = true;
  surveyEl.hidden = false;

  // 4. Handle submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { valid, answers } = validateForm(form, config.questions);
    if (!valid) {
      const firstError = form.querySelector<HTMLElement>('.has-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const submitBtn = el<HTMLButtonElement>('#submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';
    errorBannerEl.hidden = true;

    const result = await surveyService.submitResponse(SURVEY_ID, answers);

    if (result.success) {
      surveyEl.hidden = true;
      successEl.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      errorBannerEl.textContent = `오류가 발생했습니다: ${result.error}`;
      errorBannerEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = '제출하기';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(console.error);
});
