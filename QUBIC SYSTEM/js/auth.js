// auth.js - Fixed Version
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.attachEventListeners();
    }

    checkExistingSession() {
        const userData = localStorage.getItem('currentUser');
        const token = localStorage.getItem('authToken');
        
        if (userData && token) {
            this.currentUser = JSON.parse(userData);
            this.showApp();
            
            // Redirect to dashboard if on login page
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname.endsWith('/')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            this.showLogin();
            
            // Redirect to login if not authenticated and on protected page
            const currentPage = window.location.pathname.split('/').pop();
            const protectedPages = ['dashboard.html', 'inventory.html', 'transactions.html', 'analytics.html', 'admin.html'];
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        }
    }

    attachEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Attach logout buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.id === 'logoutBtn' || e.target.closest('#logout-btn') || e.target.closest('#logoutBtn')) {
                this.handleLogout();
            }
        });

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('login-page')) {
                this.handleLogin(e);
            }
        });
    }

    async handleLogin(e) {
        if (e) e.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const errorElement = document.getElementById('error-message');

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        this.setLoginButtonState('loading');

        try {
            // Simulate API call
            await this.simulateAPICall(username, password);
            
            this.currentUser = {
                username: username,
                loginTime: new Date().toISOString(),
                role: username === 'qubic' ? 'admin' : 'employee'
            };

            this.storeSession();
            this.showNotification('Login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.showError(error.message);
            this.setLoginButtonState('error');
        }
    }

    simulateAPICall(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const validCredentials = [
                    { user: 'qubic', pass: '##$@##' },
                    { user: 'emp', pass: 'emp@@' }
                ];

                const isValid = validCredentials.some(cred => 
                    cred.user === username && cred.pass === password
                );

                if (isValid) {
                    resolve({ token: this.generateToken(), user: username });
                } else {
                    reject(new Error('Invalid username or password'));
                }
            }, 1000);
        });
    }

    generateToken() {
        return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    storeSession() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('authToken', this.generateToken());
        localStorage.setItem('lastActivity', Date.now().toString());
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    setLoginButtonState(state) {
        const button = document.querySelector('.login-btn');
        if (!button) return;

        const originalText = button.innerHTML;

        switch (state) {
            case 'loading':
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
                button.disabled = true;
                break;
            case 'error':
                button.innerHTML = 'Login Failed - Try Again';
                button.style.backgroundColor = 'var(--danger-color)';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.backgroundColor = '';
                    button.disabled = false;
                }, 2000);
                break;
            default:
                button.innerHTML = originalText;
                button.disabled = false;
        }
    }

    showLogin() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (app) app.style.display = 'none';
    }

    showApp() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) loginPage.style.display = 'none';
        if (app) {
            app.style.display = 'block';
            this.updateUIForCurrentUser();
        }
    }

    updateUIForCurrentUser() {
        // Update user display
        const userDisplays = document.querySelectorAll('#user-display');
        userDisplays.forEach(display => {
            if (display && this.currentUser) {
                display.textContent = this.currentUser.username;
            }
        });

        // Show/hide admin nav based on role
        const adminNavs = document.querySelectorAll('#admin-nav');
        adminNavs.forEach(nav => {
            if (nav) {
                nav.style.display = this.isAdmin() ? 'block' : 'none';
            }
        });
    }

    handleLogout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('lastActivity');
        
        this.currentUser = null;
        window.location.href = 'index.html';
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
});