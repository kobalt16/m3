console.log('=== TERMINAL CHAT (4min auto-delete) ===');

class TerminalChat {
    constructor() {
        this.server = window.location.origin;
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        console.log('Server:', this.server);
        this.init();
    }
    
    async init() {
        this.setupEvents();
        this.updateStatus('Connecting...', '#ff0');
        
        const connected = await this.testConnection();
        if (connected) {
            await this.loadMessages();
            this.startPolling();
            this.startMessageTimers();
            document.getElementById('messageInput').focus();
        }
    }
    
    setupEvents() {
        const input = document.getElementById('messageInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    }
    
    async testConnection() {
        try {
            const response = await fetch(this.server + '/api/messages');
            if (response.ok) {
                this.updateStatus('CONNECTED', '#0f0');
                return true;
            }
        } catch (error) {
            this.updateStatus('CONNECTION ERROR', '#f00');
        }
        return false;
    }
    
    updateStatus(text, color = '#0f0') {
        document.getElementById('status').textContent = `● ${text}`;
        document.getElementById('status').style.color = color;
    }
    
    async loadMessages() {
        try {
            const response = await fetch(this.server + '/api/messages');
            const messages = await response.json();
            const output = document.getElementById('output');
            output.innerHTML = '';
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.type === 'system' ? 'system' : 'user'}`;
                div.dataset.timestamp = msg.timestamp || Date.now();
                
                // Добавляем таймер удаления
                const timeLeft = this.getTimeLeft(msg.timestamp);
                const timerSpan = timeLeft > 0 ? 
                    `<span style="float:right;color:#666;font-size:0.8em">🗑️ ${timeLeft}m</span>` : '';
                
                div.innerHTML = `
                    <strong>[${msg.user}]</strong> ${msg.text} 
                    <span style="float:right;color:#666;margin-right:10px">${msg.time}</span>
                    ${timerSpan}
                `;
                output.appendChild(div);
            });
            
            output.scrollTop = output.scrollHeight;
        } catch (error) {
            console.error('Load error:', error);
        }
    }
    
    getTimeLeft(timestamp) {
        if (!timestamp) return 0;
        const now = Date.now();
        const age = now - timestamp;
        const fourMinutes = 4 * 60 * 1000;
        const timeLeft = Math.ceil((fourMinutes - age) / 60000); // в минутах
        return timeLeft > 0 ? timeLeft : 0;
    }
    
    startMessageTimers() {
        // Обновляем таймеры каждые 30 секунд
        setInterval(() => {
            const messages = document.querySelectorAll('#output .message');
            messages.forEach(div => {
                const timestamp = parseInt(div.dataset.timestamp);
                const timeLeft = this.getTimeLeft(timestamp);
                const timerSpan = div.querySelector('.timer') || 
                    (() => {
                        const span = document.createElement('span');
                        span.className = 'timer';
                        span.style.cssText = 'float:right;color:#666;font-size:0.8em;margin-right:10px';
                        div.appendChild(span);
                        return span;
                    })();
                
                if (timeLeft > 0) {
                    timerSpan.textContent = `🗑️ ${timeLeft}m`;
                    timerSpan.style.color = timeLeft <= 1 ? '#f00' : '#666';
                } else {
                    timerSpan.textContent = '🗑️ 0m';
                    timerSpan.style.color = '#f00';
                }
            });
        }, 30000); // 30 секунд
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;
        
        try {
            await fetch(this.server + '/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: this.username, text: text })
            });
            input.value = '';
            await this.loadMessages();
        } catch (error) {
            console.error('Send error:', error);
        }
    }
    
    startPolling() {
        setInterval(() => {
            this.loadMessages();
        }, 2000);
    }
}

let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new TerminalChat();
});

window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
