import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        quizzes: [
            {
                id: 'demo-1',
                title: 'Company Safety Policy 2024',
                subtitle: 'A mandatory check on new fire safety protocols.',
                createdAt: new Date().toISOString(),
                questions: [
                    {
                        id: 'q1',
                        text: 'What should you do when the fire alarm rings?',
                        type: 'SINGLE',
                        options: [
                            { id: 'o1', text: 'Ignore it', score: -10 },
                            { id: 'o2', text: 'Evacuate immediately via stairs', score: 10 },
                            { id: 'o3', text: 'Take the elevator', score: -50 }
                        ]
                    }
                ]
            }
        ],
        submissions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read/write DB
const getDb = () => JSON.parse(fs.readFileSync(DB_FILE));
const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- API ROUTES ---

app.get('/api/quizzes', (req, res) => {
    const db = getDb();
    res.json(db.quizzes);
});

app.get('/api/quizzes/:id', (req, res) => {
    const db = getDb();
    const quiz = db.quizzes.find(q => q.id === req.params.id);
    if (quiz) res.json(quiz);
    else res.status(404).send('Not found');
});

app.post('/api/quizzes', (req, res) => {
    const db = getDb();
    const newQuiz = req.body;
    const index = db.quizzes.findIndex(q => q.id === newQuiz.id);
    
    if (index >= 0) {
        db.quizzes[index] = newQuiz;
    } else {
        db.quizzes.push(newQuiz);
    }
    
    saveDb(db);
    res.json({ success: true });
});

app.delete('/api/quizzes/:id', (req, res) => {
    const db = getDb();
    db.quizzes = db.quizzes.filter(q => q.id !== req.params.id);
    db.submissions = db.submissions.filter(s => s.quizId !== req.params.id);
    saveDb(db);
    res.json({ success: true });
});

app.post('/api/submissions', (req, res) => {
    const db = getDb();
    db.submissions.push(req.body);
    saveDb(db);
    res.json({ success: true });
});

app.get('/api/submissions/:quizId', (req, res) => {
    const db = getDb();
    const subs = db.submissions.filter(s => s.quizId === req.params.quizId);
    res.json(subs);
});

app.delete('/api/submissions/:id', (req, res) => {
    const db = getDb();
    db.submissions = db.submissions.filter(s => s.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
});

// Handle SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});