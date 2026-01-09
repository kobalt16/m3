console.log('ENCRYPTED CHAT (AES) LOADED');

class EncryptedChat {
    constructor() {
        this.server = window.location.origin;
        this.username = 'USER_' + Math.floor(Math.random() * 1000);
        this.chatPassword = null;
        this.isReady = false;
        
        this.init();
    }
    
    init() {
        console.log('Chat initialized, CryptoJS available:', typeof CryptoJS !== 'undefined');
        this.setupEvents();
        this.updateStatus('Введите пароль чата (минимум 8 символов)', '#ff0');
    }
    
    setupEvents() {
        const passwordInput = document.getElementById('chatPassword');
        const messageInput = document.getElementById('messageInput');
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setPassword();
        });
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isReady) this.sendMessage();
        });
        
        document.getElementById('sendBtn').addEventListener('click', () => {
            if (this.isReady) this.sendMessage();
        });
    }
    
    setPassword() {
        const passwordInput = document.getElementById('chatPassword');
        const password = passwordInput.value.trim();
        
        if (password.length < 8) {
            this.updateStatus('Пароль должен быть минимум 8 символов!', '#f00');
            return;
        }
        
        this.chatPassword = password;
        this.isReady = true;
        
        // Активируем интерфейс
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('messageInput').focus();
        
        this.updateStatus('🔐 Чат зашифрован AES-256', '#0f0');
        this.loadMessages();
        this.startPolling();
        
        console.log('AES encryption enabled');
    }
    
    updateStatus(text, color = '#0f0') {
        document.getElementById('status').textContent = `● ${text}`;
        document.getElementById('status').style.color = color;
    }
    
    // ===== AES ШИФРОВАНИЕ =====
    
    encryptAES(text, password) {
        try {
            // Создаём ключ из пароля
            const salt = CryptoJS.lib.WordArray.random(128/8);
            const key = CryptoJS.PBKDF2(password, salt, {
                keySize: 256/32,
                iterations: 1000
            });
            
            // Случайный IV для каждого сообщения
            const iv = CryptoJS.lib.WordArray.random(128/8);
            
            // Шифруем
            const encrypted = CryptoJS.AES.encrypt(text, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            
            // Возвращаем: salt + iv + ciphertext (все в base64)
            return {
                salt: salt.toString(CryptoJS.enc.Base64),
                iv: iv.toString(CryptoJS.enc.Base64),
                ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
            };
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    }
    
    decryptAES(encryptedData, password) {
        try {
            // Парсим данные
            const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
            const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
            const ciphertext = CryptoJS.enc.Base64.parse(encryptedData.ciphertext);
            
            // Восстанавливаем ключ
            const key = CryptoJS.PBKDF2(password, salt, {
                keySize: 256/32,
                iterations: 1000
            });
            
            // Дешифруем
            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: ciphertext },
                key,
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            );
            
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
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
            
            let hasErrors = false;
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'message';
                
                try {
                    // Пробуем расшифровать AES
                    if (msg.encryptedData && typeof msg.encryptedData === 'object') {
                        const decrypted = this.decryptAES(msg.encryptedData, this.chatPassword);
                        if (decrypted) {
                            div.innerHTML = `
                                <strong>[${this.username}]</strong> ${decrypted} 
                                <span style="float:right;color:#666">${msg.time}</span>
                                <span style="float:right;color:#0a0;margin-right:10px">🔐</span>
                            `;
                        } else {
                            throw new Error('Decryption failed');
                        }
                    } else {
                        // Старые XOR сообщения (для обратной совместимости)
                        const decrypted = this.simpleDecrypt(msg.encryptedData, this.chatPassword);
                        div.innerHTML = `
                            <strong>[${this.username}]</strong> ${decrypted} 
                            <span style="float:right;color:#666">${msg.time}</span>
                            <span style="float:right;color:#f90;margin-right:10px">🔓</span>
                        `;
                    }
                } catch (e) {
                    hasErrors = true;
                    div.innerHTML = `
                        <strong>[ENCRYPTED]</strong> 🔒 
                        <span style="float:right;color:#666">${msg.time}</span>
                    `;
                    div.style.color = '#666';
                }
                
                output.appendChild(div);
            });
            
            output.scrollTop = output.scrollHeight;
            
            if (hasErrors) {
                this.updateStatus('🔐 Часть сообщений не расшифрована (неверный пароль?)', '#f90');
            } else {
                this.updateStatus(`🔐 Чат зашифрован (${messages.length} сообщ.)`, '#0f0');
            }
            
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
            // Шифруем AES
            const encrypted = this.encryptAES(text, this.chatPassword);
            
            if (!encrypted) {
                this.updateStatus('Ошибка шифрования', '#f00');
                return;
            }
            
            // Отправляем
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
    
    // Старое XOR для обратной совместимости
    simpleDecrypt(encryptedBase64, key) {
        try {
            const encrypted = atob(encryptedBase64);
            let result = '';
            for (let i = 0; i < encrypted.length; i++) {
                result += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            return '[OLD XOR MESSAGE]';
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

window.setPassword = function() {
    if (chat) chat.setPassword();
};

window.sendMessage = function() {
    if (chat) chat.sendMessage();
};
