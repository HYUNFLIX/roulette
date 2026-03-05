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
// AI 기반 솔루션 기획 기본 과정 (3/26) 신청서
// To update questions: edit PLACEHOLDER_CONFIG below,
// or push via surveyService.saveSurveyConfig(config).

const SURVEY_ID = 'hyundai-survey-2025';

const PLACEHOLDER_CONFIG: SurveyConfig = {
  id: SURVEY_ID,
  title: 'AI 기반 솔루션 기획 기본 과정(3/26) 신청서',
  description:
    '본 내용은 HRDer 러닝세션 연계과정인 AI 기반 솔루션 기획 과정 신청서 입니다.\n' +
    '더욱 의미있는 과정이 될 수 있도록 현업에서 본인의 고민을 담아 작성 부탁드립니다.\n\n' +
    '과정일정 : 3/26(목) 오후 1시30분~5시30분\n' +
    '방식 : 실시간 온라인',
  questions: [
    // ── 기본 정보 ──────────────────────────────────────────────────────────────
    {
      id: 'name',
      type: 'text',
      required: true,
      text: '성함을 작성해주세요',
      placeholder: '답변을 적어주세요',
    },
    {
      id: 'company',
      type: 'text',
      required: true,
      text: '소속 회사를 입력해주세요.',
      description: '예) 현대자동차, 기아, 현대모비스 등 풀네임으로 입력해주세요.',
      placeholder: '예) 현대자동차',
    },
    {
      id: 'team',
      type: 'text',
      required: true,
      text: '소속 팀명을 입력해주세요.',
      description: '예) HRD전략팀',
      placeholder: '예) HRD전략팀',
    },
    {
      id: 'position',
      type: 'text',
      required: true,
      text: '직급/직책을 입력해주세요.',
      placeholder: '예) 책임매니저, 파트장 등',
    },
    {
      id: 'email',
      type: 'text',
      required: true,
      text: '회사 이메일을 입력해주세요.',
      description: '과정 안내 발송용으로만 사용됩니다.',
      placeholder: 'example@hyundai.com',
    },

    // ── 과정 지원 동기 (PBL) ───────────────────────────────────────────────────
    {
      id: 'problem',
      type: 'textarea',
      required: true,
      text: '본인이 이번 프로젝트를 통해서 해결하고 싶거나 향상시키고 싶은 문제를 작성해주세요.',
      description:
        '본 과정은 본인의 현업 문제에 적용할 수 있는 아이디어를 기획하고 실제 구현해보는 ' +
        'PBL(Problem Based Learning) 형태의 교육입니다. ' +
        '본 과정을 더 의미있게 진행하기 위해 본인의 평소 고민을 담아 최대한 자세히 작성해주세요.',
      placeholder: '답변을 적어주세요',
    },
    {
      id: 'output',
      type: 'textarea',
      required: true,
      text: 'AI 바이브코딩 과정을 통해 만들고 싶은 서비스의 아웃풋(구체적 이미지)를 작성해주세요.',
      placeholder: '답변을 적어주세요',
    },
    {
      id: 'value',
      type: 'textarea',
      required: true,
      text: '이를 통해 해결하고 싶은 문제나 Value가 무엇인지 작성해주세요.',
      placeholder: '답변을 적어주세요',
    },
    {
      id: 'scenario',
      type: 'textarea',
      required: true,
      text: '구현하고 싶은 서비스 시나리오나 기능에 대해 작성해주세요',
      placeholder: '답변을 적어주세요',
    },

    // ── 심화 과정 참석 여부 ────────────────────────────────────────────────────
    {
      id: 'advanced_course',
      type: 'radio',
      required: true,
      text: '이후 실제 프로토타입 구현을 위한 심화 과정(4/13~14, 16h, 오프라인)까지 참석하기 원하시나요?',
      options: [
        { value: 'yes', label: '참석하기 원함' },
        { value: 'no',  label: '참석하기 원하지 않음' },
      ],
    },

    // ── 개인정보 동의 ──────────────────────────────────────────────────────────
    {
      id: 'privacy_consent',
      type: 'checkbox',
      required: true,
      text: '개인정보 동의',
      description:
        '수집 항목: 성명, 소속, 이메일\n목적: 교육 과정 운영 및 안내\n보유 기간: 교육 종료 후 1년\n' +
        '※ 동의를 거부할 수 있으나, 거부 시 신청이 불가합니다.',
      options: [
        { value: 'agree', label: '개인정보 수집 및 이용에 동의합니다.' },
      ],
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
    submitBtn.textContent = '신청 중...';
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
      submitBtn.textContent = '신청하기';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(console.error);
});
