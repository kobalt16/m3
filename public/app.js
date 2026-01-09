console.log('=== TERMINAL CHAT v2 ===');

class TerminalChat {
    constructor() {
        // ВАЖНО: используем текущий origin, а не localhost
        this.server = window.location.origin;
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        console.log('Server URL:', this.server);
        console.log('Username:', this.username);
        this.init();
    }
    
    async init() {
        console.log('Initializing...');
        this.setupEvents();
        this.updateStatus('Connecting...', '#ff0');
        
        // Тест подключения
        const connected = await this.testConnection();
        if (connected) {
            await this.loadMessages();
            this.startPolling();
            document.getElementById('messageInput').focus();
        }
    }
    
    setupEvents() {
        const input = document.getElementById('messageInput');
        const btn = document.getElementById('sendBtn');
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        btn.addEventListener('click', () => this.sendMessage());
    }
    
    async testConnection() {
        try {
            console.log('Testing API at:', this.server + '/api/messages');
            const response = await fetch(this.server + '/api/messages');
            
            if (response.ok) {
                console.log('✅ API connection successful');
                this.updateStatus('CONNECTED', '#0f0');
                return true;
            } else {
                console.error('❌ API error:', response.status);
                this.updateStatus(`ERROR ${response.status}`, '#f00');
                return false;
            }
        } catch (error) {
            console.error('❌ Network error:', error.message);
            this.updateStatus('NETWORK ERROR', '#f00');
            return false;
        }
    }
    
    updateStatus(text, color = '#0f0') {
        document.getElementById('status').textContent = `● ${text}`;
        document.getElementById('status').style.color = color;
    }
    
    async loadMessages() {
        try {
            const response = await fetch(this.server + '/api/messages');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const messages = await response.json();
            const output = document.getElementById('output');
            output.innerHTML = '';
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.user === 'SYSTEM' ? 'system' : 'user'}`;
                div.innerHTML = `
                    <strong>[${msg.user}]</strong> ${msg.text} 
                    <span style="float:right;color:#666">${msg.time}</span>
                `;
                output.appendChild(div);
            });
            
            output.scrollTop = output.scrollHeight;
            console.log(`Loaded ${messages.length} messages`);
            
        } catch (error) {
            console.error('Load error:', error);
            this.updateStatus('LOAD ERROR', '#f00');
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        console.log('Sending:', text);
        
        try {
            const response = await fetch(this.server + '/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user: this.username, 
                    text: text 
                })
            });
            
            if (response.ok) {
                input.value = '';
                await this.loadMessages();
                console.log('✅ Message sent');
            } else {
                console.error('❌ Send failed:', response.status);
                this.updateStatus('SEND FAILED', '#f00');
            }
        } catch (error) {
            console.error('❌ Send error:', error);
            this.updateStatus('SEND ERROR', '#f00');
        }
    }
    
    startPolling() {
        // Обновляем каждые 3 секунды
        setInterval(() => {
            this.loadMessages();
        }, 3000);
        console.log('🔄 Polling started (3s interval)');
    }
}

// Запуск
let chat;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting chat...');
    chat = new TerminalChat();
});

// Глобальная функция для кнопки
window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
