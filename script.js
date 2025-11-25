// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');

    // Animate hamburger icon
    const spans = hamburger.querySelectorAll('span');
    if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Close mobile menu when clicking a link
const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
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
            // Save to localStorage
            const emails = JSON.parse(localStorage.getItem('dreamstalk_emails') || '[]');

            // Check if email already exists
            if (emails.includes(email)) {
                showMessage('Этот email уже зарегистрирован!', 'error');
                return;
            }

            // Add new email
            emails.push(email);
            localStorage.setItem('dreamstalk_emails', JSON.stringify(emails));

            // Show success message
            showMessage('✓ Спасибо! Ваш email успешно добавлен в список рассылки', 'success');

            // Clear input
            emailInput.value = '';

            // Optional: Send to backend (uncomment when ready)
            // await fetch('/api/subscribe', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email })
            // });

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


// Intersection Observer for fade-in animations - DISABLED to prevent flickering
// const observerOptions = {
//     threshold: 0.1,
//     rootMargin: '0px 0px -100px 0px'
// };

// const observer = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//         if (entry.isIntersecting) {
//             entry.target.style.opacity = '1';
//             entry.target.style.transform = 'translateY(0)';
//         }
//     });
// }, observerOptions);

// Observe sections for animation
// document.querySelectorAll('.feature-card, .step-card').forEach(element => {
//     element.style.opacity = '0';
//     element.style.transform = 'translateY(30px)';
//     element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
//     observer.observe(element);
// });

// Log page visit
console.log('Dreams Talk - AI Dream Analysis');
console.log('Website loaded successfully');
