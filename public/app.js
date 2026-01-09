console.log('TERMINAL CHAT');

class TerminalChat {
    constructor() {
        this.server = window.location.origin;
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        this.init();
    }
    
    init() {
        this.setupEvents();
        this.updateStatus('Connecting...', '#ff0');
        this.loadMessages();
        this.startPolling();
        document.getElementById('messageInput').focus();
    }
    
    setupEvents() {
        const input = document.getElementById('messageInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
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
                div.className = 'message';
                div.innerHTML = `
                    <strong>[${msg.user}]</strong> ${msg.text} 
                    <span style="float:right;color:#666">${msg.time}</span>
                `;
                output.appendChild(div);
            });
            
            output.scrollTop = output.scrollHeight;
            this.updateStatus('CONNECTED', '#0f0');
        } catch (error) {
            this.updateStatus('CONNECTION ERROR', '#f00');
        }
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
            this.loadMessages();
        } catch (error) {
            console.error('Send error:', error);
        }
    }
    
    startPolling() {
        setInterval(() => this.loadMessages(), 2000);
    }
}

let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new TerminalChat();
});

window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
