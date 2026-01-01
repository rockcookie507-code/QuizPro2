import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, BarChart2, Share2, LogOut, Check, PlayCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Quiz } from '../types';
import { Button } from '../components/Button';

export const AdminDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  // Simple PIN for demo purposes
  const ADMIN_PIN = "1234";

  useEffect(() => {
    // Check if previously logged in this session
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadQuizzes();
    }
  }, []);

  const loadQuizzes = async () => {
    const data = await StorageService.getQuizzes();
    setQuizzes(data);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      loadQuizzes();
    } else {
      alert("Invalid PIN");
    }
  };

  const handleDelete = async (id: string) => {
    await StorageService.deleteQuiz(id);
    setQuizzes(prev => prev.filter(q => q.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/#/quiz/${id}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enter PIN</label>
              <input 
                type="password" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                placeholder="1234"
              />
            </div>
            <Button type="submit" className="w-full">Access Dashboard</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">QuizPro2 Admin</h1>
          <div className="flex gap-4">
             <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                sessionStorage.removeItem('admin_auth');
                setIsAuthenticated(false);
              }}
              className="!bg-indigo-700 !text-white !border-indigo-500 hover:!bg-indigo-800"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">All Questionnaires</h2>
          <Button onClick={() => navigate('/admin/quiz/new')}>
            <Plus className="w-4 h-4 mr-2" /> Create New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <p className="text-gray-500 mb-4">No quizzes found.</p>
            <Button onClick={() => navigate('/admin/quiz/new')}>Create your first quiz</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 truncate">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{quiz.subtitle || 'No description provided.'}</p>
                <p className="text-xs text-gray-400 mb-6">
                  {quiz.questions.length} Questions • Created {new Date(quiz.createdAt).toLocaleDateString()}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/quiz/${quiz.id}`)} title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/quiz/${quiz.id}/results`)} title="Analytics">
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => handleShare(quiz.id)}
                    className={copyFeedback === quiz.id ? "!text-green-600 !border-green-600" : ""}
                    title="Copy Link"
                  >
                    {copyFeedback === quiz.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    title="Test Quiz"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(quiz.id)} title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Delete Quiz?</h3>
            <p className="text-gray-600 mb-6">This will permanently delete the quiz and all associated submissions. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>Confirm Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
