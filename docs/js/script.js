(() => {
    'use strict';

    /* ── State ── */
    let currentTheme = 'mixed';
    let isNight = false;
    let isMuted = true;
    let lang = 'en';
    let data = null;
    let bioTyped = false;

    /* ── Loading ── */
    const loadingFill = document.getElementById('loadingFill');
    let loadProgress = 0;
    const loadInterval = setInterval(() => {
        loadProgress = Math.min(loadProgress + 3 + Math.random() * 8, 90);
        loadingFill.style.width = loadProgress + '%';
    }, 100);

    function finishLoading(d) {
        data = d;
        clearInterval(loadInterval);
        loadingFill.style.width = '100%';
        const elapsed = Date.now() - loadStart;
        const remaining = Math.max(800 - elapsed, 300);
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('fade-out');
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                init();
            }, 500);
        }, remaining);
    }

    const loadStart = Date.now();
    if (window.__SITE_DATA__) {
        finishLoading(window.__SITE_DATA__);
    } else {
        fetch('data.json')
            .then(r => r.json())
            .then(finishLoading)
            .catch(() => {
                const script = document.createElement('script');
                script.src = 'data.js';
                script.onload = () => finishLoading(window.__SITE_DATA__);
                script.onerror = () => finishLoading(null);
                document.head.appendChild(script);
            });
    }

    function init() {
        renderAbout();
        renderLife();
        renderGallery();
        renderCalendar();
        renderGuestbook();
        renderFooter();
        setupNav();
        setupThemeSwitcher();
        setupNightToggle();
        setupAudioToggle();
        setupLangSwitcher();
        setupLightbox();
        setupScrollProgress();
        setupScrollReveal();
        setupParticles();
        setupKeyboard();
        initVisitorCounter();
        applyLang();
    }

    /* ── Render: About ── */
    function renderAbout() {
        const p = data.personal;
        const tagsEl = document.getElementById('aboutTags');
        tagsEl.innerHTML = p.tags.map(t =>
            `<span class="about-tag"><i class="${t.icon}"></i> <span data-en="${t.en}" data-zh="${t.zh}">${t[lang]}</span></span>`
        ).join('');

        const bioEl = document.getElementById('aboutBio');
        bioEl.textContent = p.bio[lang];

        const contactEl = document.getElementById('aboutContact');
        contactEl.innerHTML = p.contact.map(c =>
            `<a href="${c.url}" target="_blank"><i class="${c.icon}"></i> ${c.label}</a>`
        ).join('');
    }

    /* ── Render: Life ── */
    function renderLife() {
        const grid = document.getElementById('lifeGrid');
        grid.innerHTML = data.life.items.map(item =>
            `<div class="life-card scroll-reveal">
                <div class="life-card-icon"><i class="${item.icon}"></i></div>
                <h3 data-en="${item.title.en}" data-zh="${item.title.zh}">${item.title[lang]}</h3>
                <p data-en="${item.text.en}" data-zh="${item.text.zh}">${item.text[lang]}</p>
            </div>`
        ).join('');
    }

    /* ── Render: Gallery ── */
    function renderGallery() {
        const inner = document.getElementById('galleryInner');
        const tilts = [-2, 1.5, -1];
        inner.innerHTML = data.gallery.items.map((item, i) =>
            `<div class="picture-frame scroll-reveal" style="--tilt: ${tilts[i]}deg" data-gallery="${i}">
                <div class="frame-nail"></div>
                <div class="frame-string"></div>
                <div class="frame-border">
                    <img src="${item.image}" class="frame-image" alt="${item.label[lang]}" loading="lazy">
                </div>
                <span class="frame-label" data-en="${item.label.en}" data-zh="${item.label.zh}">${item.label[lang]}</span>
            </div>`
        ).join('');
    }

    /* ── Render: Calendar ── */
    function renderCalendar(year, month) {
        const now = new Date();
        if (year === undefined) year = now.getFullYear();
        if (month === undefined) month = now.getMonth();

        const container = document.getElementById('miniCalendar');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = now.getDate();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

        const monthNames = {
            en: ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'],
            zh: ['一月', '二月', '三月', '四月', '五月', '六月',
                 '七月', '八月', '九月', '十月', '十一月', '十二月']
        };
        const weekdays = {
            en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            zh: ['日', '一', '二', '三', '四', '五', '六']
        };

        let html = `<div class="cal-header">
            <button class="cal-nav" data-dir="-1">◀</button>
            <h3>${monthNames[lang][month]} ${year}</h3>
            <button class="cal-nav" data-dir="1">▶</button>
        </div>`;

        html += '<div class="cal-weekdays">';
        weekdays[lang].forEach(w => { html += `<span class="cal-weekday">${w}</span>`; });
        html += '</div><div class="cal-days">';

        for (let i = 0; i < firstDay; i++) {
            html += '<span class="cal-day empty"></span>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const cls = isCurrentMonth && d === today ? 'cal-day today' : 'cal-day';
            html += `<span class="${cls}">${d}</span>`;
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.cal-nav').forEach(btn => {
            btn.addEventListener('click', () => {
                let newMonth = month + parseInt(btn.dataset.dir);
                let newYear = year;
                if (newMonth < 0) { newMonth = 11; newYear--; }
                if (newMonth > 11) { newMonth = 0; newYear++; }
                renderCalendar(newYear, newMonth);
            });
        });
    }

    /* ── Render: Guestbook ── */
    function renderGuestbook() {
        const msgEl = document.getElementById('guestbookMessage');
        const msg = data.guestbook.message;
        msgEl.innerHTML = `<span data-en="${msg.en}" data-zh="${msg.zh}">${msg[lang]}</span>`;

        const entriesEl = document.getElementById('guestbookEntries');
        entriesEl.innerHTML = data.guestbook.presetMessages.map(e =>
            `<div class="guest-entry scroll-reveal">
                <div class="guest-avatar"><i class="${e.avatar}"></i></div>
                <div class="guest-body">
                    <div class="guest-name">${e.name}</div>
                    <div class="guest-text" data-en="${e.text.en}" data-zh="${e.text.zh}">${e.text[lang]}</div>
                    <div class="guest-date">${e.date}</div>
                </div>
            </div>`
        ).join('');
    }

    /* ── Render: Footer ── */
    function renderFooter() {
        const el = document.getElementById('footerLinks');
        el.innerHTML = data.personal.contact.map(c =>
            `<a href="${c.url}" target="_blank"><i class="${c.icon}"></i> ${c.label}</a>`
        ).join('');
    }

    /* ── Navigation ── */
    function setupNav() {
        const links = document.querySelectorAll('.nav-link');
        const sections = ['about', 'life', 'gallery', 'guestbook'];

        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = document.getElementById(link.dataset.section);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(l => l.classList.remove('active'));
                    const match = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
                    if (match) match.classList.add('active');
                }
            });
        }, { rootMargin: '-40% 0px -40% 0px' });

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
    }

    /* ── Theme Switcher ── */
    function setupThemeSwitcher() {
        const btns = document.querySelectorAll('.theme-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme === currentTheme) return;
                applyTheme(theme, true);
            });
        });
    }

    function applyTheme(theme, animate) {
        const overlay = document.getElementById('themeOverlay');
        const doSwitch = () => {
            document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-mixed');
            document.body.classList.add(`theme-${theme}`);
            if (isNight) document.body.classList.add('night');
            currentTheme = theme;

            document.querySelectorAll('.theme-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.theme === theme);
            });

            const bgOcean = document.querySelector('.page-bg-ocean');
            const bgForest = document.querySelector('.page-bg-forest');
            if (bgOcean) bgOcean.classList.toggle('active', theme !== 'forest');
            if (bgForest) bgForest.classList.toggle('active', theme !== 'ocean');

            updateAudioTrack();
        };

        if (animate) {
            overlay.classList.add('active');
            setTimeout(() => {
                doSwitch();
                setTimeout(() => overlay.classList.remove('active'), 350);
            }, 400);
        } else {
            doSwitch();
        }
    }

    /* ── Night Toggle ── */
    function setupNightToggle() {
        document.getElementById('nightToggle').addEventListener('click', () => {
            isNight = !isNight;
            document.body.classList.toggle('night', isNight);
            document.getElementById('nightToggle').textContent = isNight ? '☀️' : '🌙';
            if (!isMuted) updateAudioVolume();
        });
    }

    /* ── Audio ── */
    const audioTracks = {};
    let currentTrack = null;
    let audioStarted = false;

    function setupAudioToggle() {
        const btn = document.getElementById('audioToggle');

        const startOnce = () => {
            if (audioStarted) return;
            audioStarted = true;
            isMuted = false;
            playCurrentThemeAudio();
            btn.textContent = '🔊';
            document.removeEventListener('click', startOnce);
        };

        document.addEventListener('click', startOnce);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!audioStarted) {
                startOnce();
                return;
            }
            isMuted = !isMuted;
            if (isMuted) {
                if (currentTrack) fadeAudio(currentTrack, 0, 400);
                btn.textContent = '🔇';
            } else {
                playCurrentThemeAudio();
                btn.textContent = '🔊';
            }
        });
    }

    function getAudioForTheme() {
        if (currentTheme === 'forest') return 'forest';
        return 'ocean';
    }

    function playCurrentThemeAudio() {
        const trackName = getAudioForTheme();
        if (!audioTracks[trackName]) {
            const audio = new Audio(`audio/${trackName}.mp3`);
            audio.loop = true;
            audio.volume = 0;
            audioTracks[trackName] = audio;
        }

        const next = audioTracks[trackName];
        if (currentTrack && currentTrack !== next) {
            fadeAudio(currentTrack, 0, 600, true);
        }
        const targetVol = isNight ? 0.18 : 0.35;
        next.play().then(() => {
            fadeAudio(next, targetVol, 800);
        }).catch(() => {});
        currentTrack = next;
    }

    function updateAudioTrack() {
        if (audioStarted && !isMuted) playCurrentThemeAudio();
    }

    function updateAudioVolume() {
        if (currentTrack && !isMuted) {
            const targetVol = isNight ? 0.18 : 0.35;
            fadeAudio(currentTrack, targetVol, 600);
        }
    }

    function fadeAudio(audio, target, duration, pauseAfter) {
        const start = audio.volume;
        const diff = target - start;
        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            audio.volume = Math.max(0, Math.min(1, start + diff * (step / steps)));
            if (step >= steps) {
                clearInterval(interval);
                if (pauseAfter) audio.pause();
            }
        }, stepTime);
    }

    /* ── Language ── */
    function setupLangSwitcher() {
        document.getElementById('langSwitcher').addEventListener('click', () => {
            lang = lang === 'en' ? 'zh' : 'en';
            document.getElementById('currentLang').textContent = lang === 'en' ? 'EN' : '中文';
            applyLang();
            renderAbout();
            renderLife();
            renderGallery();
            renderCalendar();
            renderGuestbook();
            setupScrollReveal();
        });
    }

    function applyLang() {
        document.querySelectorAll('[data-en][data-zh]').forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });
    }

    /* ── Lightbox ── */
    function setupLightbox() {
        const lightbox = document.getElementById('galleryLightbox');
        const img = document.getElementById('lightboxImg');
        const text = document.getElementById('lightboxText');

        document.addEventListener('click', e => {
            const frame = e.target.closest('.picture-frame');
            if (frame) {
                const idx = parseInt(frame.dataset.gallery);
                const item = data.gallery.items[idx];
                img.src = item.image;
                text.textContent = '';
                lightbox.classList.add('active');
                typewrite(text, item.caption[lang], 40);
            }
        });

        const close = () => lightbox.classList.remove('active');
        document.getElementById('lightboxClose').addEventListener('click', close);
        document.querySelector('.lightbox-backdrop').addEventListener('click', close);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') close();
        });
    }

    function typewrite(el, text, speed) {
        el.textContent = '';
        let i = 0;
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        el.appendChild(cursor);
        const interval = setInterval(() => {
            if (i < text.length) {
                el.insertBefore(document.createTextNode(text[i]), cursor);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => cursor.remove(), 2000);
            }
        }, speed);
    }

    /* ── Scroll Progress ── */
    function setupScrollProgress() {
        const fill = document.getElementById('scrollFill');
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            fill.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
        });
    }

    /* ── Scroll Reveal ── */
    function setupScrollReveal() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    if (entry.target.closest('#about') && !bioTyped) {
                        bioTyped = true;
                        const bioEl = document.getElementById('aboutBio');
                        const bioText = data.personal.bio[lang];
                        typewrite(bioEl, bioText, 20);
                    }
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
        document.querySelectorAll('.game-panel, .gallery-wall').forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        });
    }

    /* ── Particles ── */
    function setupParticles() {
        const canvas = document.getElementById('particles');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const count = 35;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function createParticle() {
            const isTop = Math.random() < 0.5;
            const theme = currentTheme === 'mixed'
                ? (isTop ? 'ocean' : 'forest')
                : currentTheme;

            const colors = {
                ocean: ['#4DB6AC', '#80DEEA', '#B2EBF2', '#FFFFFF', '#26C6DA'],
                forest: ['#81C784', '#A5D6A7', '#C8E6C9', '#FFD54F', '#AED581']
            };
            const pool = colors[theme] || colors.ocean;

            return {
                x: Math.random() * canvas.width,
                y: isTop ? Math.random() * canvas.height * 0.6 : canvas.height * 0.5 + Math.random() * canvas.height * 0.5,
                size: 2 + Math.random() * 3,
                color: pool[Math.floor(Math.random() * pool.length)],
                alpha: 0.15 + Math.random() * 0.4,
                vx: (Math.random() - 0.5) * 0.3,
                vy: theme === 'ocean' ? -0.2 - Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
                theme,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.02
            };
        }

        for (let i = 0; i < count; i++) particles.push(createParticle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += p.pulseSpeed;

                const glow = isNight && p.theme === 'forest';
                const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;

                if (glow) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = p.color;
                }

                ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);

                if (glow) {
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }

                if (p.y < -10 || p.y > canvas.height + 10 ||
                    p.x < -10 || p.x > canvas.width + 10) {
                    particles[i] = createParticle();
                }
            });

            ctx.globalAlpha = 1;
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ── Visitor Counter ── */
    async function initVisitorCounter() {
        const el = document.getElementById('visitorCount');
        if (!el) return;
        try {
            const resp = await fetch('https://api.counterapi.dev/v1/y1duo-github-io/visits/up');
            const d = await resp.json();
            el.textContent = String(d.count).padStart(6, '0');
        } catch {
            el.textContent = '------';
        }
    }

    /* ── Keyboard Shortcuts ── */
    function setupKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key.toLowerCase()) {
                case 'o': applyTheme('ocean', true); break;
                case 'f': applyTheme('forest', true); break;
                case 'm': applyTheme('mixed', true); break;
                case 'n': document.getElementById('nightToggle').click(); break;
                case 's': document.getElementById('audioToggle').click(); break;
            }
        });
    }
})();
