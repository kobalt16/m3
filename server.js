const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// JSON парсер
app.use(express.json());

// Хранилище
const messages = [
    { 
        user: 'SYSTEM', 
        text: 'Terminal chat initialized in cloud', 
        time: new Date().toLocaleTimeString() 
    }
];

// API endpoints
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
    
    // Ограничение истории
    if (messages.length > 50) {
        messages.shift();
    }
    
    res.json({ success: true, message: newMsg });
});

// Все остальные запросы → index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Экспорт для Vercel
module.exports = app;

// Локальный запуск
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 TERMINAL CHAT SERVER');
        console.log(`📍 http://localhost:${PORT}`);
        console.log('='.repeat(50) + '\n');
    });
}
