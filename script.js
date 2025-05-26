// Import map for CDN libraries
const importMap = {
    imports: {
        "gun": "https://cdn.jsdelivr.net/npm/gun/gun.js"
    }
};

// Enhanced Gun.js integration with better error handling
class CommentSystem {
    constructor() {
        this.gun = null;
        this.commentsRef = null;
        this.init();
    }

    async init() {
        try {
            // Dynamically import Gun
            const Gun = await import('https://cdn.jsdelivr.net/npm/gun/gun.js');
            
            // Initialize Gun with multiple peers
            this.gun = Gun.default({
                peers: [
                    'https://gun-manhattan.herokuapp.com/gun',
                    'https://gun-us.herokuapp.com/gun',
                    'https://gun-eu.herokuapp.com/gun'
                ]
            });

            // Create namespaced reference
            const today = new Date().toISOString().slice(0, 10);
            this.commentsRef = this.gun.get(`vadimus-universe-comments-${today}`);
            
            this.setupEventListeners();
            this.loadComments();
        } catch (error) {
            console.error('Failed to initialize comment system:', error);
            this.showError('Comment system temporarily unavailable');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('commentForm');
        const soundToggle = document.getElementById('soundToggle');
        const themeToggle = document.getElementById('themeToggle');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComment();
            });
        }

        if (soundToggle) {
            soundToggle.addEventListener('click', this.toggleSound.bind(this));
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }
    }

    async submitComment() {
        const nameInput = document.getElementById('commentName');
        const textInput = document.getElementById('commentText');
        
        if (!nameInput?.value.trim() || !textInput?.value.trim()) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        const comment = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            author: nameInput.value.trim(),
            text: textInput.value.trim(),
            timestamp: Date.now()
        };

        try {
            this.commentsRef.get(comment.id).put(comment);
            nameInput.value = '';
            textInput.value = '';
            this.showNotification('Message sent to the universe! ✨', 'success');
            this.playSound('send');
        } catch (error) {
            console.error('Failed to submit comment:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        }
    }

    loadComments() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading cosmic messages...</div>';

        // Listen for new comments
        this.commentsRef.map().once((comment, id) => {
            if (!comment || !comment.author || !comment.text) return;
            
            // Remove loading message
            const loading = container.querySelector('.loading');
            if (loading) loading.remove();
            
            this.displayComment(comment, container);
        });
    }

    displayComment(comment, container) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        const date = new Date(comment.timestamp);
        const timeStr = date.toLocaleString();
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                <span class="comment-date">${timeStr}</span>
            </div>
            <div class="comment-text">${this.escapeHtml(comment.text)}</div>
        `;

        // Insert at the beginning for newest-first display
        container.insertBefore(commentElement, container.firstChild);
        
        // Animate entrance
        commentElement.style.opacity = '0';
        commentElement.style.transform = 'translateX(-20px)';
        requestAnimationFrame(() => {
            commentElement.style.transition = 'all 0.5s ease-out';
            commentElement.style.opacity = '1';
            commentElement.style.transform = 'translateX(0)';
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    toggleSound() {
        const soundEnabled = !localStorage.getItem('soundEnabled') || localStorage.getItem('soundEnabled') === 'true';
        localStorage.setItem('soundEnabled', !soundEnabled);
        
        const icon = document.querySelector('.sound-icon');
        if (icon) {
            icon.textContent = soundEnabled ? '🔇' : '🔊';
        }
        
        this.playSound('toggle');
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        }
        
        this.playSound('toggle');
    }

    playSound(type) {
        if (localStorage.getItem('soundEnabled') === 'false') return;
        
        // Create simple audio feedback using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                'send': 800,
                'toggle': 400,
                'hover': 600
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio not supported');
        }
    }
}

// Enhanced UI interactions
class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupCardInteractions();
        this.setupSmoothScrolling();
        this.loadTheme();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        document.querySelectorAll('.project-card, .section-title').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    }

    setupParallaxEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.floating-elements');
            
            parallaxElements.forEach(el => {
                const speed = 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    setupCardInteractions() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.playHoverSound();
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
                const y = ((e.clientY - rect.top) / card.clientHeight) * 100;
                
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const rotateY = (e.clientX - centerX) / 20;
                const rotateX = (centerY - e.clientY) / 20;
                
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateY(-8px) 
                    scale(1.02)
                `;
            });
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }
    }

    playHoverSound() {
        // Use the comment system's sound method if available
        if (window.commentSystem) {
            window.commentSystem.playSound('hover');
        }
    }
}

// Global functions for navigation
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
};

window.navigateToProject = function(url) {
    // Add a subtle animation before navigation
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = url;
    }, 150);
};

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        animation: slideInRight 0.3s ease-out;
    }
    
    .notification button {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.commentSystem = new CommentSystem();
    window.uiEnhancements = new UIEnhancements();
});

// Add service worker for offline functionality
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}

