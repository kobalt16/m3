console.log('ENCRYPTED CHAT LOADED');

class EncryptedChat {
    constructor() {
        this.server = window.location.origin;
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        this.chatPassword = null;
        this.isReady = false;
        
        this.init();
    }
    
    init() {
        console.log('Chat initialized');
        this.setupEvents();
        this.updateStatus('Введите пароль чата', '#ff0');
    }
    
    setupEvents() {
        const messageInput = document.getElementById('messageInput');
        const passwordInput = document.getElementById('chatPassword');
        
        // Enter в поле пароля
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setPassword();
        });
        
        // Enter в поле сообщения
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isReady) this.sendMessage();
        });
        
        // Кнопка отправки
        document.getElementById('sendBtn').addEventListener('click', () => {
            if (this.isReady) this.sendMessage();
        });
    }
    
    setPassword() {
        const passwordInput = document.getElementById('chatPassword');
        const password = passwordInput.value.trim();
        
        if (!password) {
            this.updateStatus('Введите пароль!', '#f00');
            return;
        }
        
        this.chatPassword = password;
        this.isReady = true;
        
        // Активируем поле ввода сообщений
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('messageInput').focus();
        
        this.updateStatus('�� Чат зашифрован', '#0f0');
        this.loadMessages();
        this.startPolling();
        
        console.log('Password set, chat ready');
    }
    
    updateStatus(text, color = '#0f0') {
        document.getElementById('status').textContent = `● ${text}`;
        document.getElementById('status').style.color = color;
    }
    
    // ===== БАЗОВОЕ ШИФРОВАНИЕ (XOR для начала) =====
    
    simpleEncrypt(text, key) {
        // Простейшее XOR шифрование (заменим на AES позже)
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Кодируем в base64
    }
    
    simpleDecrypt(encryptedBase64, key) {
        try {
            const encrypted = atob(encryptedBase64);
            let result = '';
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            console.error('Decryption error:', e);
            return '[DECRYPTION ERROR]';
        }
    }
    
    // ===== РАБОТА С СООБЩЕНИЯМИ =====
    
    async loadMessages() {
        if (!this.isReady) return;
        
        try {
            const response = await fetch(this.server + '/api/messages');
            const messages = await response.json();
            const output = document.getElementById('output');
            output.innerHTML = '';
            
            if (messages.length === 0) {
                output.innerHTML = '<div class="message system">Нет сообщений</div>';
                return;
            }
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'message';
                
                try {
                    // Пробуем расшифровать
                    const decrypted = this.simpleDecrypt(msg.encryptedData, this.chatPassword);
                    div.innerHTML = `
                        <strong>[${this.username}]</strong> ${decrypted} 
                        <span style="float:right;color:#666">${msg.time}</span>
                    `;
                } catch (e) {
                    // Если не расшифровывается - показываем как есть
                    div.innerHTML = `
                        <strong>[ENCRYPTED]</strong> 🔒 
                        <span style="float:right;color:#666">${msg.time}</span>
                    `;
                    div.style.color = '#666';
                }
                
                output.appendChild(div);
            });
            
            output.scrollTop = output.scrollHeight;
            this.updateStatus('🔒 Чат зашифрован', '#0f0');
            
        } catch (error) {
            console.error('Load error:', error);
            this.updateStatus('Ошибка загрузки', '#f00');
        }
    }
    
    async sendMessage() {
        if (!this.isReady) return;
        
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        try {
            // Шифруем сообщение
            const encrypted = this.simpleEncrypt(text, this.chatPassword);
            
            // Отправляем зашифрованные данные
            const response = await fetch(this.server + '/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    encryptedData: encrypted
                })
            });
            
            if (response.ok) {
                input.value = '';
                await this.loadMessages();
            } else {
                this.updateStatus('Ошибка отправки', '#f00');
            }
        } catch (error) {
            console.error('Send error:', error);
            this.updateStatus('Ошибка сети', '#f00');
        }
    }
    
    startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => {
            this.loadMessages();
        }, 2000);
    }
}

let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new EncryptedChat();
});

// Глобальные функции для кнопок
window.setPassword = function() {
    if (chat) chat.setPassword();
};

window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
