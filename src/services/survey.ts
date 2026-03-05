/**
 * Firebase Survey Service - Pre-survey for Hyundai Motor Company employees
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
  get,
  Database,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDPzf8pkqwAygJ7oPrIOv8x-2-ZPrDL7yk",
  authDomain: "marble-roulette.firebaseapp.com",
  databaseURL: "https://marble-roulette-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "marble-roulette",
  storageBucket: "marble-roulette.firebasestorage.app",
  messagingSenderId: "333788841940",
  appId: "1:333788841940:web:fb745d65ba50b4204bf841",
  measurementId: "G-HH5LHQ4EK4"
};

// Reuse existing app or initialize new
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const database: Database = getDatabase(app);

// ── Types ────────────────────────────────────────────────────────────────────

export type QuestionType = 'radio' | 'checkbox' | 'text' | 'textarea' | 'select' | 'rating';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  required: boolean;
  text: string;
  description?: string;
  options?: QuestionOption[];   // for radio / checkbox / select
  min?: number;                  // for rating
  max?: number;                  // for rating
  placeholder?: string;          // for text / textarea
}

export interface SurveyConfig {
  id: string;                    // unique survey identifier (e.g. 'hyundai-2025-q1')
  title: string;
  description?: string;
  questions: Question[];
  closedAt?: number;             // epoch ms — responses blocked after this time
}

export interface SurveyResponse {
  surveyId: string;
  respondentId: string;          // anonymous browser-local ID
  submittedAt: number;
  answers: Record<string, string | string[]>;
}

// ── Survey Service ────────────────────────────────────────────────────────────

class SurveyService {
  private readonly DB_ROOT = 'surveys';
  private respondentId: string;

  constructor() {
    this.respondentId = this.getOrCreateRespondentId();
  }

  private getOrCreateRespondentId(): string {
    const key = 'hyundai_survey_respondent_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'resp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  }

  /** Save (or overwrite) a survey configuration in Firebase */
  async saveSurveyConfig(config: SurveyConfig): Promise<void> {
    await set(ref(database, `${this.DB_ROOT}/configs/${config.id}`), config);
  }

  /** Load a survey configuration by ID */
  async getSurveyConfig(surveyId: string): Promise<SurveyConfig | null> {
    const snapshot = await get(ref(database, `${this.DB_ROOT}/configs/${surveyId}`));
    return snapshot.exists() ? (snapshot.val() as SurveyConfig) : null;
  }

  /** Submit a survey response */
  async submitResponse(
    surveyId: string,
    answers: Record<string, string | string[]>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response: SurveyResponse = {
        surveyId,
        respondentId: this.respondentId,
        submittedAt: Date.now(),
        answers,
      };

      const responseRef = push(ref(database, `${this.DB_ROOT}/responses/${surveyId}`));
      await set(responseRef, response);

      // Mark as submitted locally so the user can't re-submit
      localStorage.setItem(`survey_submitted_${surveyId}`, '1');

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  /** Check if the current browser has already submitted this survey */
  hasSubmitted(surveyId: string): boolean {
    return localStorage.getItem(`survey_submitted_${surveyId}`) === '1';
  }

  /** Stream all responses for a survey (for admin view) */
  onResponses(
    surveyId: string,
    callback: (responses: SurveyResponse[]) => void
  ): () => void {
    const responsesRef = ref(database, `${this.DB_ROOT}/responses/${surveyId}`);
    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { callback([]); return; }
      const list: SurveyResponse[] = Object.values(data);
      list.sort((a, b) => a.submittedAt - b.submittedAt);
      callback(list);
    });
    return () => off(responsesRef);
  }

  getRespondentId(): string {
    return this.respondentId;
  }
}

export const surveyService = new SurveyService();
