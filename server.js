const express = require('express');
const app = express();

// Логирование
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Статика
app.use(express.static('public'));
app.use(express.json());

// Хранилище
const messages = [
    { user: 'SYSTEM', text: 'Terminal chat initialized', time: new Date().toLocaleTimeString() }
];

// API
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.post('/api/send', (req, res) => {
    const { user = 'USER', text } = req.body;
    
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Empty message' });
    }
    
    const newMsg = {
        user: user.toUpperCase(),
        text: text.trim(),
        time: new Date().toLocaleTimeString()
    };
    
    messages.push(newMsg);
    console.log('💬 New message:', newMsg);
    
    // Лимит
    if (messages.length > 50) messages.shift();
    
    res.json({ success: true, message: newMsg });
});

// Запуск
const PORT = 3000;
const HOST = '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 TERMINAL CHAT SERVER');
    console.log('📡 http://127.0.0.1:3000');
    console.log('='.repeat(50) + '\n');
});
