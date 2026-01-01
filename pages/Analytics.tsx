import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StorageService } from '../services/storageService';
import { Quiz, Submission, QuestionType } from '../types';
import { Button } from '../components/Button';

export const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
        if (id) {
          const q = await StorageService.getQuiz(id);
          const s = await StorageService.getSubmissions(id);
          setQuiz(q || null);
          setSubmissions(s);
        }
        setLoading(false);
    };
    loadData();
  }, [id]);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  const handleDeleteClick = async (subId: string) => {
    if (deleteConfirmId === subId) {
        // Confirmed: Perform delete
        await StorageService.deleteSubmission(subId);
        setSubmissions(prev => prev.filter(s => s.id !== subId));
        setDeleteConfirmId(null);
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    } else {
        // First click: Request confirmation
        setDeleteConfirmId(subId);
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        // Auto-cancel after 3 seconds
        deleteTimeoutRef.current = setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!quiz) return <div className="p-8">Quiz not found.</div>;

  const calculateMaxScore = (quizData: Quiz) => {
      let maxTotal = 0;
      quizData.questions.forEach(q => {
          if (q.type === QuestionType.SINGLE || q.type === QuestionType.TEXT) {
              const maxQ = q.options.length > 0 ? Math.max(...q.options.map(o => o.score)) : 0;
              maxTotal += (maxQ > 0 ? maxQ : 0);
          } else if (q.type === QuestionType.MULTI) {
              const maxQ = q.options.reduce((sum, o) => sum + (o.score > 0 ? o.score : 0), 0);
              maxTotal += maxQ;
          }
      });
      return maxTotal;
  };

  const maxPossibleScore = calculateMaxScore(quiz);

  const stats = {
    total: submissions.length,
    avg: submissions.length > 0 ? (submissions.reduce((acc, s) => acc + s.totalScore, 0) / submissions.length).toFixed(1) : 0,
    maxPossible: maxPossibleScore
  };

  const getChartData = (question: any) => {
    if (question.type === QuestionType.TEXT) return null;

    const data = question.options.map((opt: any) => ({
      name: opt.text.substring(0, 15) + (opt.text.length > 15 ? '...' : ''),
      fullText: opt.text,
      count: 0
    }));

    submissions.forEach(sub => {
      const answer = sub.answers.find(a => a.questionId === question.id);
      if (answer) {
        answer.selectedOptionIds.forEach(optId => {
          const idx = question.options.findIndex((o: any) => o.id === optId);
          if (idx !== -1) data[idx].count++;
        });
      }
    });

    return data;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center text-gray-600 cursor-pointer hover:text-gray-900 mr-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </div>
          <h1 className="text-xl font-bold text-gray-900 truncate">Analytics: {quiz.title}</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Submissions</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500 uppercase">Average Score</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.avg}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Possible Score</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.maxPossible}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Response Distribution</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quiz.questions.map((q, idx) => {
              const data = getChartData(q);
              if (!data) return null;
              
              return (
                <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-4 truncate"><span className="text-gray-400 mr-2">Q{idx + 1}</span> {q.text}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px' }} cursor={{fill: '#f3f4f6'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Submission Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sub.totalScore} / {sub.maxPossibleScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => setViewSubmission(sub)} className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(sub.id)} 
                            className={`p-2 rounded transition-all duration-200 flex items-center ${deleteConfirmId === sub.id ? 'bg-red-600 text-white hover:bg-red-700 w-auto px-3' : 'text-red-600 hover:text-red-900 hover:bg-red-50'}`}
                            title="Delete Submission"
                        >
                            {deleteConfirmId === sub.id ? (
                                <span className="text-xs font-bold whitespace-nowrap">Confirm?</span>
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                    <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No submissions yet.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {viewSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Submission Details</h3>
                    <button onClick={() => setViewSubmission(null)} className="text-gray-400 hover:text-gray-600">Close</button>
                </div>
                <div className="space-y-4">
                    {quiz.questions.map((q, idx) => {
                        const answer = viewSubmission.answers.find(a => a.questionId === q.id);
                        return (
                            <div key={q.id} className="border-b pb-4 last:border-0">
                                <p className="font-medium text-gray-900 mb-1">Q{idx+1}: {q.text}</p>
                                <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                                    {q.type === QuestionType.TEXT ? (
                                        <span>Answer: {answer?.textAnswer || 'N/A'}</span>
                                    ) : (
                                        <ul className="list-disc pl-4">
                                            {q.options.filter(o => answer?.selectedOptionIds.includes(o.id)).map(o => (
                                                <li key={o.id}>
                                                    {o.text} <span className="text-xs text-gray-400">({o.score} pts)</span>
                                                </li>
                                            ))}
                                            {(!answer || answer.selectedOptionIds.length === 0) && <li>No option selected</li>}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
