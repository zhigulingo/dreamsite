// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const header = document.querySelector('.header');
const mobileMenu = document.getElementById('mobileMenu');

function setMenuState(isOpen) {
    if (!hamburger || !header) return;

    hamburger.classList.toggle('active', isOpen);
    header.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    hamburger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');

    if (mobileMenu) {
        mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
}

if (hamburger && header) {
    setMenuState(false);

    hamburger.addEventListener('click', () => {
        const isOpen = !hamburger.classList.contains('active');
        setMenuState(isOpen);
    });

    document.addEventListener('click', (event) => {
        const clickedInsideHeader = header.contains(event.target);
        const isOpen = hamburger.classList.contains('active');

        if (isOpen && !clickedInsideHeader) {
            setMenuState(false);
        }
    });
}

// Close mobile menu when clicking a link
const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => setMenuState(false));
});

// Smooth scroll for anchor links
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');

        // Handle scroll to top for empty hash
        if (href === '#') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            return;
        }

        try {
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        } catch (error) {
            console.warn('Invalid selector:', href);
        }
    });
});

// Throttle helper for performance
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

// Email form submission handler
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const formMessage = document.getElementById('formMessage');

if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        try {
            // Save to localStorage as fallback
            const emails = JSON.parse(localStorage.getItem('dreamstalk_emails') || '[]');

            // Check if email already exists locally
            if (emails.includes(email)) {
                showMessage('Этот email уже зарегистрирован!', 'error');
                return;
            }

            // Send to backend API
            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to subscribe');
                }

                console.log('Successfully sent to backend:', data);
            } catch (apiError) {
                // If API fails, we'll still save locally
                console.warn('Backend API unavailable, saved locally only:', apiError);
            }

            // Add to localStorage
            emails.push(email);
            localStorage.setItem('dreamstalk_emails', JSON.stringify(emails));

            // Show success message
            showMessage('✓ Спасибо! Ваш email успешно добавлен в список рассылки', 'success');

            // Clear input
            emailInput.value = '';

        } catch (error) {
            showMessage('Произошла ошибка. Попробуйте позже', 'error');
            console.error('Form submission error:', error);
        }
    });
}

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type} show`;

    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.classList.remove('show');
    }, 5000);
}


// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

// Observe elements for scroll reveal
const revealSelectors = [
    'h1',
    '.section-title',
    '.phones-container',
    '.btn-wrapper',
    '.feature-item',
    '.dark-card',
    '.waitlist-column',
    '.philosophy-text',
    '.footer'
];

const revealElements = document.querySelectorAll(revealSelectors.join(', '));

revealElements.forEach((el, index) => {
    // Add reveal class to hide initially and set transition
    el.classList.add('reveal');

    // Optional: Add simple stagger based on index or DOM order if siblings
    // But for now, direct observation is fine.

    observer.observe(el);
});

// Log page visit
console.log('Dreams Talk - AI Dream Analysis');
console.log('Website loaded successfully');

// Fetch and display latest Telegram post
async function loadTelegramWidget() {
    const container = document.getElementById('telegram-post-container');
    if (!container) return;

    const channelName = 'thedreamshub';
    let postId = '22'; // Fallback post ID

    try {
        const response = await fetch('/api/get-telegram-post');
        const data = await response.json();

        if (data.success && data.postId) {
            postId = data.postId;
        } else {
            console.warn('Could not fetch latest Telegram post, using fallback:', data.error);
        }
    } catch (error) {
        console.error('Error loading Telegram widget, using fallback:', error);
    }

    // Always try to render the widget with either the fetched ID or the fallback
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-post', `${channelName}/${postId}`);
    script.setAttribute('data-width', '100%');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-dark', '1'); // Dark mode

    container.innerHTML = ''; // Clear container just in case
    container.appendChild(script);
}

// Load widget when page loads
document.addEventListener('DOMContentLoaded', loadTelegramWidget);

