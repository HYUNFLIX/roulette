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

// ── Placeholder questions (replace with actual content when ready) ────────────
// To customize: edit the questions array below, or upload a config to Firebase
// via surveyService.saveSurveyConfig(config) and it will load automatically.

const PLACEHOLDER_CONFIG: SurveyConfig = {
  id: SURVEY_ID,
  title: '현대자동차 교육 사전 설문',
  description:
    '본 설문은 교육 프로그램의 효과적인 운영을 위해 사전 정보를 수집합니다.\n' +
    '응답 내용은 교육 준비에만 활용되며, 개인 정보는 철저히 보호됩니다.\n' +
    '소요 시간: 약 3분',
  questions: [
    {
      id: 'dept',
      type: 'select',
      required: true,
      text: '귀하의 소속 부서(사업부)를 선택해주세요.',
      options: [
        { value: 'rd', label: '연구개발' },
        { value: 'production', label: '생산·품질' },
        { value: 'sales', label: '영업·마케팅' },
        { value: 'hr', label: '인사·조직문화' },
        { value: 'finance', label: '재무·경영지원' },
        { value: 'it', label: 'IT·디지털혁신' },
        { value: 'strategy', label: '전략기획' },
        { value: 'other', label: '기타' },
      ],
    },
    {
      id: 'career_years',
      type: 'radio',
      required: true,
      text: '현대자동차그룹 근속 연수를 선택해주세요.',
      options: [
        { value: '0-1', label: '1년 미만' },
        { value: '1-3', label: '1 ~ 3년' },
        { value: '4-7', label: '4 ~ 7년' },
        { value: '8-15', label: '8 ~ 15년' },
        { value: '16+', label: '16년 이상' },
      ],
    },
    {
      id: 'prior_knowledge',
      type: 'rating',
      required: true,
      text: '이번 교육 주제에 대한 현재 본인의 이해도는 어느 정도입니까?',
      description: '1점: 전혀 모름 → 5점: 전문가 수준으로 잘 알고 있음',
      min: 1,
      max: 5,
    },
    {
      id: 'objectives',
      type: 'checkbox',
      required: true,
      text: '이번 교육을 통해 얻고 싶은 것을 모두 선택해주세요. (복수 선택 가능)',
      options: [
        { value: 'knowledge', label: '새로운 지식·최신 트렌드 습득' },
        { value: 'skills', label: '실무 적용 가능한 스킬 향상' },
        { value: 'network', label: '타 부서 동료와의 네트워킹' },
        { value: 'career', label: '경력 개발 방향 탐색' },
        { value: 'problem', label: '현업 문제 해결 아이디어 획득' },
        { value: 'certification', label: '자격·이수 인증' },
      ],
    },
    {
      id: 'learning_style',
      type: 'radio',
      required: false,
      text: '가장 선호하는 학습 방식은 무엇입니까?',
      options: [
        { value: 'lecture', label: '강의형 (강사 주도 설명 중심)' },
        { value: 'workshop', label: '워크숍형 (소그룹 실습·토의)' },
        { value: 'case', label: '케이스 스터디형 (실제 사례 분석)' },
        { value: 'discussion', label: '토론·발표형 (참가자 주도)' },
        { value: 'online', label: '자기주도형 온라인 학습' },
      ],
    },
    {
      id: 'satisfaction_expectation',
      type: 'rating',
      required: false,
      text: '이번 교육에 대한 기대 수준은 어느 정도입니까?',
      description: '1점: 기대하지 않음 → 5점: 매우 기대됨',
      min: 1,
      max: 5,
    },
    {
      id: 'concerns',
      type: 'textarea',
      required: false,
      text: '교육에 대해 기대하는 점이나 사전에 다뤄주었으면 하는 내용이 있다면 자유롭게 적어주세요.',
      placeholder: '예) 특정 기술·도구에 대한 심화 설명, 실제 업무 적용 사례, 궁금한 점 등',
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
