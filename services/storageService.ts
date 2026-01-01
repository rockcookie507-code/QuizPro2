import { Quiz, Submission } from '../types';

const API_BASE = '/api';

export const StorageService = {
  getQuizzes: async (): Promise<Quiz[]> => {
    try {
      const res = await fetch(`${API_BASE}/quizzes`);
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch quizzes", e);
      return [];
    }
  },

  getQuiz: async (id: string): Promise<Quiz | undefined> => {
    try {
      const res = await fetch(`${API_BASE}/quizzes/${id}`);
      if (!res.ok) return undefined;
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch quiz", e);
      return undefined;
    }
  },

  saveQuiz: async (quiz: Quiz): Promise<void> => {
    await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    });
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'DELETE'
    });
  },

  submitQuiz: async (submission: Submission): Promise<void> => {
    await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  },

  getSubmissions: async (quizId: string): Promise<Submission[]> => {
    try {
      const res = await fetch(`${API_BASE}/submissions/${quizId}`);
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch submissions", e);
      return [];
    }
  },

  deleteSubmission: async (submissionId: string): Promise<void> => {
    await fetch(`${API_BASE}/submissions/${submissionId}`, {
      method: 'DELETE'
    });
  }
};
