import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Quiz, Question, QuestionType, Option } from '../types';
import { Button } from '../components/Button';

export const QuizEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [quiz, setQuiz] = useState<Quiz>({
    id: isNew ? `quiz_${Date.now()}` : '',
    title: '',
    subtitle: '',
    createdAt: new Date().toISOString(),
    questions: []
  });

  const [loading, setLoading] = useState(!isNew);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
        if (!isNew && id) {
          const existing = await StorageService.getQuiz(id);
          if (existing) {
            setQuiz(existing);
          } else {
            navigate('/admin');
          }
          setLoading(false);
        }
    };
    fetchQuiz();
  }, [id, isNew, navigate]);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!quiz.title.trim()) {
      alert("Please enter a quiz title");
      return;
    }
    await StorageService.saveQuiz(quiz);
    navigate('/admin');
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: QuestionType.SINGLE,
      options: [
        { id: `opt_${Date.now()}_1`, text: 'Option 1', score: 0 },
        { id: `opt_${Date.now()}_2`, text: 'Option 2', score: 0 }
      ]
    };
    setQuiz(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const updateQuestion = (qIndex: number, field: keyof Question, value: any) => {
    setQuiz(prev => {
        const updatedQs = [...prev.questions];
        if (field === 'type') {
           if (value === QuestionType.TEXT) {
               const currentOptions = updatedQs[qIndex].options;
               const newOptions = currentOptions.length > 0 
                    ? [currentOptions[0]] 
                    : [{ id: `opt_${Date.now()}`, text: '', score: 10 }];
               updatedQs[qIndex] = { ...updatedQs[qIndex], type: value, options: newOptions };
           } else {
               let newOptions = [...updatedQs[qIndex].options];
               while (newOptions.length < 2) {
                   newOptions.push({ 
                       id: `opt_${Date.now()}_${newOptions.length + Math.random()}`, 
                       text: `Option ${newOptions.length + 1}`, 
                       score: 0 
                   });
               }
               updatedQs[qIndex] = { ...updatedQs[qIndex], type: value, options: newOptions };
           }
        } else {
           updatedQs[qIndex] = { ...updatedQs[qIndex], [field]: value };
        }
        return { ...prev, questions: updatedQs };
    });
  };

  const handleDeleteClick = (index: number) => {
    if (deleteConfirmIndex === index) {
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        setDeleteConfirmIndex(null);
        setQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    } else {
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        setDeleteConfirmIndex(index);
        deleteTimeoutRef.current = setTimeout(() => {
            setDeleteConfirmIndex(null);
        }, 3000);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setQuiz(prev => {
        const newQs = [...prev.questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newQs.length) {
          [newQs[index], newQs[targetIndex]] = [newQs[targetIndex], newQs[index]];
          return { ...prev, questions: newQs };
        }
        return prev;
    });
  };

  const addOption = (qIndex: number) => {
    setQuiz(prev => {
        const updatedQs = [...prev.questions];
        updatedQs[qIndex].options.push({
          id: `opt_${Date.now()}`,
          text: '',
          score: 0
        });
        return { ...prev, questions: updatedQs };
    });
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof Option, value: any) => {
    setQuiz(prev => {
        const updatedQs = [...prev.questions];
        updatedQs[qIndex].options[oIndex] = { 
          ...updatedQs[qIndex].options[oIndex], 
          [field]: value 
        };
        return { ...prev, questions: updatedQs };
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuiz(prev => {
        const updatedQs = [...prev.questions];
        updatedQs[qIndex].options = updatedQs[qIndex].options.filter((_, idx) => idx !== oIndex);
        return { ...prev, questions: updatedQs };
    });
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Save Quiz
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
            <input 
              type="text" 
              className="w-full text-xl font-bold border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-indigo-600 px-0 py-2 placeholder-gray-300" 
              placeholder="e.g. Fire Safety Protocols"
              value={quiz.title}
              onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
              rows={2}
              placeholder="Optional subtitle or instructions..."
              value={quiz.subtitle}
              onChange={(e) => setQuiz(prev => ({ ...prev, subtitle: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((q, qIndex) => (
            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500 uppercase">Question {qIndex + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'up')} 
                        disabled={qIndex === 0} 
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"
                        title="Move Up"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'down')} 
                        disabled={qIndex === quiz.questions.length - 1} 
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"
                        title="Move Down"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <button 
                        type="button"
                        onClick={() => handleDeleteClick(qIndex)} 
                        className={`p-2 rounded transition-all duration-200 flex items-center ${deleteConfirmIndex === qIndex ? 'bg-red-600 text-white hover:bg-red-700 w-auto px-3' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                        title="Delete Question"
                    >
                        {deleteConfirmIndex === qIndex ? (
                            <span className="text-xs font-bold whitespace-nowrap">Confirm Delete?</span>
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question Text</label>
                    <input 
                        type="text" 
                        className="w-full border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        value={q.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        placeholder="Enter question here..."
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                    <select 
                        className="w-full border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        value={q.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                    >
                        <option value={QuestionType.SINGLE}>Single Choice</option>
                        <option value={QuestionType.MULTI}>Multiple Choice</option>
                        <option value={QuestionType.TEXT}>Fill-in-the-blank</option>
                    </select>
                    </div>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-indigo-100">
                    <div className="flex justify-between items-end">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {q.type === QuestionType.TEXT ? 'Acceptable Answer / Scoring' : 'Options & Scoring'}
                        </label>
                    </div>
                    
                    {q.options.map((opt, oIndex) => (
                    <div key={opt.id} className="flex items-center gap-3">
                        <input 
                        type="text"
                        className="flex-grow border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={opt.text}
                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                        placeholder={q.type === QuestionType.TEXT ? "Correct Answer Keyword" : `Option ${oIndex + 1}`}
                        />
                        <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Score:</span>
                        <input 
                            type="number"
                            min="-100"
                            max="100"
                            className="w-20 border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500 text-right"
                            value={opt.score}
                            onChange={(e) => updateOption(qIndex, oIndex, 'score', parseInt(e.target.value) || 0)}
                        />
                        </div>
                        {q.type !== QuestionType.TEXT && (
                        <button onClick={() => removeOption(qIndex, oIndex)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                    </div>
                    ))}
                    
                    {q.type !== QuestionType.TEXT && (
                    <Button size="sm" variant="ghost" onClick={() => addOption(qIndex)} className="mt-2">
                        <Plus className="w-3 h-3 mr-2" /> Add Option
                    </Button>
                    )}
                    {q.type === QuestionType.TEXT && q.options.length === 0 && (
                        <div className="text-sm text-red-500 italic mt-2">
                            Click 'Add Answer' to define the correct keyword and its score. 
                            <Button size="sm" variant="ghost" onClick={() => addOption(qIndex)} className="ml-2">Add Answer</Button>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addQuestion}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center font-medium"
          >
            <Plus className="w-6 h-6 mb-1" />
            Add Question
          </button>
        </div>
      </main>
    </div>
  );
};
