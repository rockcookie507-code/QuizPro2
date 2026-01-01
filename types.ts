export enum QuestionType {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
  TEXT = 'TEXT'
}

export interface Option {
  id: string;
  text: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  // For text questions, we can use the first option's text as the "correct match" key and score as value
}

export interface Quiz {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  selectedOptionIds: string[]; // For Single/Multi
  textAnswer?: string; // For Text
}

export interface Submission {
  id: string;
  quizId: string;
  timestamp: string;
  answers: Answer[];
  totalScore: number;
  maxPossibleScore: number;
}

export interface AnalyticsSummary {
  totalSubmissions: number;
  avgScore: number;
  maxScore: number;
}