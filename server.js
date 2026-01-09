const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Хранилище (пустое, без системных сообщений)
let messages = [];

function cleanupOldMessages() {
    const now = Date.now();
    const fourMinutes = 4 * 60 * 1000;
    const initialLength = messages.length;
    messages = messages.filter(msg => (now - msg.timestamp) < fourMinutes);
    if (messages.length !== initialLength) {
        console.log(`Очистка: удалено ${initialLength - messages.length} старых сообщений`);
    }
}

// API
app.get('/api/messages', (req, res) => {
    cleanupOldMessages();
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
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
    };
    messages.push(newMsg);
    console.log('💬 Новое сообщение:', newMsg.user, newMsg.text);
    cleanupOldMessages();
    res.json({ success: true, message: newMsg });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 TERMINAL CHAT (silent 4min delete)');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
    setInterval(cleanupOldMessages, 60000);
});

module.exports = app;
