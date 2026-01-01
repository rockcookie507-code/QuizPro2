import { Quiz, Submission, Question, QuestionType } from '../types';

const STORAGE_KEYS = {
  QUIZZES: 'quizpro2_quizzes',
  SUBMISSIONS: 'quizpro2_submissions'
};

// Initial Seed Data
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
    const demoQuiz: Quiz = {
      id: 'demo-1',
      title: 'Company Safety Policy 2024',
      subtitle: 'A mandatory check on new fire safety protocols.',
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          text: 'What should you do when the fire alarm rings?',
          type: QuestionType.SINGLE,
          options: [
            { id: 'o1', text: 'Ignore it', score: -10 },
            { id: 'o2', text: 'Evacuate immediately via stairs', score: 10 },
            { id: 'o3', text: 'Take the elevator', score: -50 }
          ]
        },
        {
          id: 'q2',
          text: 'Select all designated assembly points.',
          type: QuestionType.MULTI,
          options: [
            { id: 'o4', text: 'Main Parking Lot', score: 5 },
            { id: 'o5', text: 'Cafeteria', score: -5 },
            { id: 'o6', text: 'North Lawn', score: 5 }
          ]
        }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([demoQuiz]));
  }
};

seedData();

export const StorageService = {
  getQuizzes: (): Quiz[] => {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    return data ? JSON.parse(data) : [];
  },

  getQuiz: (id: string): Quiz | undefined => {
    const quizzes = StorageService.getQuizzes();
    return quizzes.find(q => q.id === id);
  },

  saveQuiz: (quiz: Quiz): void => {
    const quizzes = StorageService.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: (id: string): void => {
    const quizzes = StorageService.getQuizzes().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    
    // Also cleanup submissions
    const submissions = StorageService.getSubmissions(id); // gets all, filtered below
    const allSubmissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
    const remaining = allSubmissions.filter((s: Submission) => s.quizId !== id);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(remaining));
  },

  submitQuiz: (submission: Submission): void => {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
    submissions.push(submission);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  },

  getSubmissions: (quizId: string): Submission[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
    return all.filter((s: Submission) => s.quizId === quizId);
  },

  deleteSubmission: (submissionId: string): void => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
    const filtered = all.filter((s: Submission) => s.id !== submissionId);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(filtered));
  }
};