class TerminalChat {
    constructor() {
        this.server = 'http://127.0.0.1:3000';
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        this.init();
    }
    
    init() {
        this.setupEvents();
        this.updateStatus('Connecting...', '#ff0');
        this.loadMessages();
        this.startPolling();
        
        // Фокус
        document.getElementById('messageInput').focus();
    }
    
    setupEvents() {
        const input = document.getElementById('messageInput');
        const btn = document.getElementById('sendBtn');
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        btn.addEventListener('click', () => this.sendMessage());
    }
    
    updateStatus(text, color = '#0f0') {
        const status = document.getElementById('status');
        status.textContent = `● ${text}`;
        status.style.color = color;
    }
    
    async loadMessages() {
        try {
            const response = await fetch(this.server + '/api/messages');
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
            this.updateStatus(`Connected | ${messages.length} messages`, '#0f0');
            
        } catch (error) {
            console.error('Load error:', error);
            this.updateStatus('Connection error', '#f00');
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        try {
            const response = await fetch(this.server + '/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user: this.username, 
                    text: text 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                input.value = '';
                this.loadMessages();
            }
        } catch (error) {
            console.error('Send error:', error);
            this.updateStatus('Send failed', '#f00');
        }
    }
    
    startPolling() {
        // Обновляем каждые 2 секунды
        setInterval(() => {
            this.loadMessages();
        }, 2000);
    }
}

// Запуск при загрузке
let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new TerminalChat();
});

// Глобальная функция для кнопки
window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
