const express = require('express');
const path = require('path');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Хранилище зашифрованных сообщений
let encryptedMessages = [];

function cleanupOldMessages() {
    const now = Date.now();
    const fourMinutes = 4 * 60 * 1000;
    const initialLength = encryptedMessages.length;
    encryptedMessages = encryptedMessages.filter(msg => (now - msg.timestamp) < fourMinutes);
    if (encryptedMessages.length !== initialLength) {
        console.log(`Очистка: удалено ${initialLength - encryptedMessages.length} старых сообщений`);
    }
}

// API - принимаем уже зашифрованные данные
app.get('/api/messages', (req, res) => {
    cleanupOldMessages();
    // Возвращаем зашифрованные данные как есть
    res.json(encryptedMessages.map(msg => ({
        encryptedData: msg.encryptedData,
        timestamp: msg.timestamp,
        time: msg.time
    })));
});

app.post('/api/send', (req, res) => {
    const { encryptedData } = req.body; // Клиент присылает уже зашифрованное
    
    if (!encryptedData) {
        return res.status(400).json({ error: 'No encrypted data' });
    }
    
    const newMsg = {
        encryptedData: encryptedData,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString()
    };
    
    encryptedMessages.push(newMsg);
    console.log('💬 Новое зашифрованное сообщение');
    cleanupOldMessages();
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 ENCRYPTED CHAT (4min delete)');
    console.log(`📍 http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
    setInterval(cleanupOldMessages, 60000);
});

module.exports = app;
