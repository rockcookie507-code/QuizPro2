import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Quiz, QuestionType, Submission, Answer } from '../types';
import { Button } from '../components/Button';

export const QuizPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const q = StorageService.getQuiz(id);
      setQuiz(q || null);
    }
    setLoading(false);
  }, [id]);

  const handleOptionChange = (questionId: string, optionId: string, type: QuestionType) => {
    setAnswers(prev => {
      const current = prev[questionId] || { questionId, selectedOptionIds: [] };
      let newSelectedIds = [...current.selectedOptionIds];

      if (type === QuestionType.SINGLE) {
        newSelectedIds = [optionId];
      } else {
        // Toggle for Multi
        if (newSelectedIds.includes(optionId)) {
          newSelectedIds = newSelectedIds.filter(id => id !== optionId);
        } else {
          newSelectedIds.push(optionId);
        }
      }

      return {
        ...prev,
        [questionId]: { ...current, selectedOptionIds: newSelectedIds }
      };
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, selectedOptionIds: [], textAnswer: text }
    }));
  };

  const calculateScore = (): { total: number, max: number } => {
    if (!quiz) return { total: 0, max: 0 };
    
    let total = 0;
    let maxPossible = 0;

    quiz.questions.forEach(q => {
      // Calculate Max Possible Score for this question
      let qMax = 0;
      const options = q.options || []; // Safe navigation
      
      if (q.type === QuestionType.SINGLE || q.type === QuestionType.TEXT) {
        // For text/single, max is the highest individual option score
        if (options.length > 0) {
            qMax = Math.max(...options.map(o => o.score), 0);
        }
      } else if (q.type === QuestionType.MULTI) {
        // Sum of all positive scores
        qMax = options.reduce((sum, o) => sum + (o.score > 0 ? o.score : 0), 0);
      }
      maxPossible += qMax;

      // Calculate User Score
      const answer = answers[q.id];
      if (answer) {
        if (q.type === QuestionType.TEXT && answer.textAnswer) {
            // Simple keyword matching (case insensitive)
            const userAnswer = answer.textAnswer.trim().toLowerCase();
            const matchedOption = options.find(o => o.text.trim().toLowerCase() === userAnswer);
            if (matchedOption) {
                total += matchedOption.score;
            }
        } else {
            answer.selectedOptionIds.forEach(optId => {
                const option = options.find(o => o.id === optId);
                if (option) total += option.score;
            });
        }
      }
    });

    return { total, max: maxPossible };
  };

  const handleSubmit = () => {
    if (!quiz) return;
    // Removed window.confirm to ensure smoother UX. The button says "Submit Answers" which is clear intent.

    const { total, max } = calculateScore();
    const submission: Submission = {
      id: `sub_${Date.now()}`,
      quizId: quiz.id,
      timestamp: new Date().toISOString(),
      answers: Object.values(answers),
      totalScore: total,
      maxPossibleScore: max
    };

    StorageService.submitQuiz(submission);
    setSubmitted(submission);
    window.scrollTo(0,0);
  };

  if (loading) return <div className="p-8 text-center">Loading quiz...</div>;
  if (!quiz) return <div className="p-8 text-center text-red-600">Quiz not found or link is invalid.</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl overflow-hidden transform transition-all">
          <div className="bg-green-600 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Submission Successful!</h1>
            <p className="text-green-100">Your answers have been recorded.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center">
                <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Your Performance</p>
                <div className="flex justify-center items-baseline gap-2">
                     <span className="text-6xl font-extrabold text-gray-900">{submitted.totalScore}</span>
                     <span className="text-2xl text-gray-400 font-medium">/ {submitted.maxPossibleScore}</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">Total Score</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Quiz:</span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{quiz.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Submitted on:</span>
                    <span className="font-medium text-gray-900">{new Date(submitted.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
            {/* Removed the Take Another Quiz Button */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border-t-4 border-indigo-600">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.subtitle}</p>
        </div>

        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-4 mb-4">
               <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                   {idx + 1}
               </span>
               <div className="flex-grow">
                   <h3 className="text-lg font-medium text-gray-900">{q.text}</h3>
                   {q.type === QuestionType.MULTI && <p className="text-xs text-gray-500 mt-1">(Select all that apply)</p>}
               </div>
            </div>

            <div className="space-y-3 pl-12">
              {q.type === QuestionType.TEXT ? (
                <input 
                  type="text" 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Type your answer here..."
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                />
              ) : (
                q.options.map(opt => (
                  <label key={opt.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border-gray-200">
                    <input 
                      type={q.type === QuestionType.SINGLE ? 'radio' : 'checkbox'}
                      name={q.id}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      onChange={() => handleOptionChange(q.id, opt.id, q.type)}
                      checked={answers[q.id]?.selectedOptionIds.includes(opt.id) || false}
                    />
                    <span className="ml-3 text-gray-700">{opt.text}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-6">
            <Button size="lg" onClick={handleSubmit} className="px-8">Submit Answers</Button>
        </div>
      </div>
    </div>
  );
};