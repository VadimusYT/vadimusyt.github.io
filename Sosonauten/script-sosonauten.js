// Enhanced UI interactions adapted for Sosonauten site
class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupSmoothScrolling();
        // Removed card interactions, parallax, sound, theme toggle
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
                    // Stop observing once animated to avoid re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        // Targeting section title, info cards, youtube link
        document.querySelectorAll('.section-title, .info-card, .youtube-link').forEach(el => {
            // Apply initial state
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
             // Handle delay classes
            const delay = el.classList.contains('delay-0') ? 0 :
                          el.classList.contains('delay-1') ? 0.2 :
                          el.classList.contains('delay-2') ? 0.4 :
                          el.classList.contains('delay-3') ? 0.6 :
                          el.classList.contains('delay-4') ? 0.8 : 0;
            el.style.transitionDelay = `${delay}s`;

            observer.observe(el);
        });

         // Also observe the hero content elements with text-reveal class
        document.querySelectorAll('.hero-image, .hero-title span, .hero-subtitle, .hero-cta').forEach(el => {
            // These are already handled by CSS animation, no need to re-observe
            // but ensure the base styles are correct if JS were to control them
            // Keeping the CSS animation approach for hero for now.
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                // Check if href is a valid ID selector (starts with # and is more than just #)
                if (href && href.startsWith('#') && href.length > 1) {
                     const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault(); // Prevent default only if a target is found
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } else if (href === '#') {
                    // If href is just '#', prevent default scroll to top
                    e.preventDefault();
                }
                // If href is null or empty, do nothing (let browser handle it or assume it's a placeholder)
            });
        });
    }
    // Removed playHoverSound as sound toggle was removed
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uiEnhancements = new UIEnhancements();
});

// Removed Service Worker registration as it's managed by sw.js
