(() => {
    // ===== PERF =====
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const DPR_CAP = isMobile ? 1.0 : 1.25;                       // ограничиваем ретину
    const dpr = Math.min(DPR_CAP, Math.max(1, devicePixelRatio || 1));
    let targetFPS = 30;                                          // кап FPS
    let frameInterval = 1000 / targetFPS;
    let acc = 0;

    // ===== helpers =====
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
    const wrap01 = v => v - Math.floor(v);

    // ===== canvas =====
    const canvas = document.getElementById('space');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    let W = 0, H = 0, running = true, tPrev = performance.now();
    let scrollP = 0, scrollYpx = 0;

    // ===== твои визуальные настройки (как прислал) =====
    const STAR_LAYERS = [
        { name: 'far', depth: 0.20, countScale: 0.8, size: [0.7, 1.2], color: [210, 225, 255], speed: [0.00002, 0.00006], scrollY: 60, shearX: 0.02 },
        { name: 'mid', depth: 0.55, countScale: 1.0, size: [0.9, 1.6], color: [180, 210, 255], speed: [0.0002, 0.0004], scrollY: 140, shearX: 0.05 },
        { name: 'near', depth: 0.95, countScale: 0.9, size: [1.1, 2.0], color: [255, 240, 220], speed: [0.0003, 0.0006], scrollY: 260, shearX: 0.09 },
    ];
    const STAR_DENSITY = 0.16;
    const DOTS_DENSITY = 0.010;

    const CLOUDS_COUNT = 5;
    const CLOUDS = [
        [142, 88, 255, 0.24], [200, 80, 255, 0.18], [120, 60, 200, 0.20], [255, 120, 200, 0.12]
    ];
    const CLOUD_SCROLL_Y = 320;
    const CLOUD_SHEAR_X = 0.08;
    const CLOUD_DRIFT = [0.00002, 0.00003];

    const TOP_GLOW_SCROLL = 180;

    const SHOOTING_RATE_PER_MIN = 1;
    const SHOOTING_SPEED = [100, 200];
    const SHOOTING_LENGTH = [140, 220];
    const SHOOTING_FADE_S = [0.8, 1.4];
    const SHOOTING_WIDTH = [1.2, 2.0];
    const SHOOTING_COLOR = [255, 235, 210];

    // ===== state =====
    let layers = [];   // слои звёзд
    let dots = [];     // фоновые точки (норм. координаты)
    let clouds = [];   // туманности
    let meteors = [];

    // offscreen холсты для "тяжёлого" (туманности + точки)
    let offClouds, ocx;
    let offDots, odx;

    function vp() {
        let w = innerWidth || document.documentElement.clientWidth || 0;
        let h = innerHeight || document.documentElement.clientHeight || 0;
        if (!w || !h) { const r = document.documentElement.getBoundingClientRect(); w = r.width; h = r.height; }
        return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    }
    function makeOffscreen(w, h) {
        const cvs = document.createElement('canvas');
        cvs.width = Math.max(1, Math.round(w * dpr));
        cvs.height = Math.max(1, Math.round(h * dpr));
        return cvs;
    }

    function resize() {
        const { w, h } = vp(); W = w; H = h;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        // canvas.style.width=W+'px'; canvas.style.height=H+'px'; // Let CSS handle this

        // звёзды по слоям
        layers = STAR_LAYERS.map(L => {
            const base = Math.round((W * H) / (1e6) * (STAR_DENSITY * 1000) * L.countScale);
            const count = Math.max(18, base);
            const rgb = `rgb(${L.color[0]},${L.color[1]},${L.color[2]})`; // без альфы — потом глобальной альфой
            const arr = [];
            for (let i = 0; i < count; i++) {
                const ang = rand(0, Math.PI * 2);
                const spd = rand(L.speed[0], L.speed[1]) * (0.6 + 0.8 * (L.depth));
                arr.push({
                    ux: Math.random(), uy: Math.random(),
                    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                    r: rand(L.size[0], L.size[1]),
                    depth: L.depth,
                    tw: rand(0.7, 1.3), ph: rand(0, Math.PI * 2)
                });
            }
            return { meta: L, rgb, stars: arr };
        });

        // фоновые точки (norm, чтобы не пересчитывать каждый кадр)
        const dotsBase = Math.round((W * H) / (1e6) * (DOTS_DENSITY * 1000));
        const palDots = [[170, 205, 255], [200, 140, 255], [255, 140, 220]];
        dots = Array.from({ length: dotsBase }, () => ({
            ux: Math.random(), uy: Math.random(), r: rand(0.6, 1.6),
            col: palDots[Math.floor(Math.random() * palDots.length)],
            ph: rand(0, Math.PI * 2)
        }));

        // туманности
        clouds = Array.from({ length: CLOUDS_COUNT }, () => {
            const c = CLOUDS[Math.floor(Math.random() * CLOUDS.length)];
            const baseR = rand(0.38, 0.62) * Math.max(W, H);
            const a = rand(CLOUD_DRIFT[0], CLOUD_DRIFT[1]);
            const ang = rand(0, Math.PI * 2);
            return {
                ux: Math.random(), uy: Math.random(),
                vx: Math.cos(ang) * a * 0.25, vy: Math.sin(ang) * a * 0.25,
                r: baseR, col: c.slice(0, 3), a0: c[3],
                drift: rand(0.02, 0.05), ph: rand(0, Math.PI * 2),
                depth: rand(0.15, 0.85)
            };
        });

        // offscreen: туманности один раз, а потом только сдвигаем
        offClouds = makeOffscreen(W, H);
        ocx = offClouds.getContext('2d');
        ocx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ocx.clearRect(0, 0, W, H);
        ocx.globalCompositeOperation = 'lighter';
        clouds.forEach(c => {
            // рисуем статичный «снимок» без дыхания — дыхание добавим на основном рендере альфой
            const cx = c.ux * W, cy = c.uy * H;

            // Функция рисования одного облака
            const drawCloud = (x, y) => {
                const g = ocx.createRadialGradient(x, y, 0, x, y, c.r);
                g.addColorStop(0.00, `rgba(${c.col[0]},${c.col[1]},${c.col[2]},${c.a0})`);
                g.addColorStop(0.50, `rgba(${c.col[0]},${c.col[1]},${c.col[2]},${c.a0 * 0.25})`);
                g.addColorStop(1.00, `rgba(${c.col[0]},${c.col[1]},${c.col[2]},0)`);
                ocx.beginPath(); ocx.fillStyle = g; ocx.arc(x, y, c.r, 0, Math.PI * 2); ocx.fill();
            };

            // Рисуем облако и его "соседей" для бесшовности
            // Проверяем 3x3 сетку вокруг, если облако задевает край
            for (let dx of [-1, 0, 1]) {
                for (let dy of [-1, 0, 1]) {
                    drawCloud(cx + dx * W, cy + dy * H);
                }
            }
        });

        // offscreen: точки (сразу с прозрачностью)
        offDots = makeOffscreen(W, H);
        odx = offDots.getContext('2d');
        odx.setTransform(dpr, 0, 0, dpr, 0, 0);
        odx.clearRect(0, 0, W, H);
        odx.globalCompositeOperation = 'source-over';
        dots.forEach(d => {
            odx.beginPath();
            odx.fillStyle = `rgba(${d.col[0]},${d.col[1]},${d.col[2]},0.10)`;
            odx.arc(d.ux * W, d.uy * H, d.r, 0, Math.PI * 2); odx.fill();
        });

        meteors = [];
    }

    function updateScroll() {
        const doc = document.scrollingElement || document.documentElement;
        const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
        scrollYpx = doc.scrollTop;
        scrollP = Math.min(1, scrollYpx / max);
    }

    function paintBackground() {
        // глубокий космос
        const g = ctx.createRadialGradient(W * 0.5, -H * 0.08, 0, W * 0.5, -H * 0.08, Math.max(W, H) * 1.2);
        g.addColorStop(0.00, '#0f1322'); g.addColorStop(0.45, '#0a0e1a'); g.addColorStop(1.00, '#05070b');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        // верхний фиолетовый «ореол» — ФИКСИРОВАННЫЙ, НЕ СКРОЛЛИТСЯ
        const cx = W * 0.5;
        const cy = -H * 0.2; // Всегда сверху, не зависит от скролла
        const r = Math.max(W, H) * 1.2;
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g2.addColorStop(0.00, 'rgba(120,70,220,0.42)');
        g2.addColorStop(0.35, 'rgba(90,55,160,0.26)');
        g2.addColorStop(1.00, 'rgba(10,12,22,0)');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    }

    // тайловый отрисовщик offscreen-слоя с произвольным смещением
    function drawTiled(img, ox, oy, alpha = 1, composite = 'source-over') {
        if (!img) return;
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = composite;
        const sx = ((ox % W) + W) % W;
        const sy = ((oy % H) + H) % H;
        ctx.drawImage(img, -sx, -sy, W, H);
        ctx.drawImage(img, -sx + W, -sy, W, H);
        ctx.drawImage(img, -sx, -sy + H, W, H);
        ctx.drawImage(img, -sx + W, -sy + H, W, H);
        ctx.globalAlpha = 1;
    }

    // спавн метеоров (редко)
    let spawnAccumulator = 0;
    function maybeSpawnMeteor(dt) {
        spawnAccumulator += dt;
        const lambdaPerSec = SHOOTING_RATE_PER_MIN / 60;
        const p = 1 - Math.exp(-lambdaPerSec * spawnAccumulator);
        if (Math.random() < p) {
            spawnAccumulator = 0;
            const fromTop = Math.random() < 0.6;
            const startX = fromTop ? rand(W * 0.2, W * 0.95) : W + 40;
            const startY = fromTop ? -40 : rand(H * 0.05, H * 0.8);
            const spd = rand(SHOOTING_SPEED[0], SHOOTING_SPEED[1]);
            const ang = rand(Math.PI * 0.65, Math.PI * 0.90);
            meteors.push({
                x: startX, y: startY,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: rand(SHOOTING_FADE_S[0], SHOOTING_FADE_S[1]),
                age: 0, len: rand(SHOOTING_LENGTH[0], SHOOTING_LENGTH[1]),
                w: rand(SHOOTING_WIDTH[0], SHOOTING_WIDTH[1])
            });
        }
    }

    function step(dt, now) {
        // обновляем норм. координаты (звёзды, туманности)
        for (const L of layers) {
            for (const s of L.stars) {
                s.ux = wrap01(s.ux + s.vx * dt);
                s.uy = wrap01(s.uy + s.vy * dt);
            }
        }
        for (const c of clouds) {
            c.ux = wrap01(c.ux + c.vx * dt);
            c.uy = wrap01(c.uy + c.vy * dt);
        }
        // метеоры
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.age += dt; m.x += m.vx * dt; m.y += m.vy * dt;
            if (m.age > m.life || m.x < -m.len - 100 || m.y > H + m.len + 100) meteors.splice(i, 1);
        }
        maybeSpawnMeteor(dt);
    }

    function draw(ts) {
        let dtMs = ts - tPrev; if (dtMs < 0) dtMs = 0; if (dtMs > 100) dtMs = 100; // кап
        tPrev = ts;
        acc += dtMs;

        // пропускаем кадры под целевой FPS
        if (acc < frameInterval) { requestAnimationFrame(draw); return; }
        const steps = Math.floor(acc / frameInterval);
        acc -= steps * frameInterval;
        const dt = (steps * frameInterval) / 1000;

        step(dt, ts);

        // рендер
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);

        paintBackground();

        // туманности (offscreen) с параллаксом
        // альфу «дыхания» добавим поверх: так дешевле, чем перерисовывать градиенты
        // убираем сдвиг по X, оставляем только вертикальный скролл
        drawTiled(offClouds,
            0,
            (scrollP * CLOUD_SCROLL_Y),
            1, 'lighter');

        // точки (offscreen)
        drawTiled(offDots, 0, 0, 1, 'source-over');

        // ЗВЁЗДЫ (живые, но дешёвые): без создания rgba-на-лету — меняем globalAlpha
        for (const L of layers) {
            const meta = L.meta, rgb = L.rgb;
            ctx.fillStyle = rgb;
            for (const s of L.stars) {
                // Убираем shearX (сдвиг по горизонтали), оставляем только базовую позицию ux*W
                const x = s.ux * W;
                const y = s.uy * H + (1 - meta.depth) * (scrollP * meta.scrollY);
                const a = clamp(0.26 + 0.06 * Math.sin(ts / 1000 * (0.8 + s.tw) + s.ph), 0.14, 0.55);
                ctx.globalAlpha = a;
                ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // метеоры (немного градиента, их мало → ок)
        for (const m of meteors) {
            const lifeK = 1 - (m.age / m.life);
            const alpha = clamp(lifeK, 0, 1);
            const len = m.len * (0.6 + 0.4 * lifeK);
            const hyp = Math.hypot(m.vx, m.vy) || 1;
            const nx = -m.vx / hyp, ny = -m.vy / hyp;
            const x2 = m.x + nx * len, y2 = m.y + ny * len;

            const grad = ctx.createLinearGradient(m.x, m.y, x2, y2);
            grad.addColorStop(0, `rgba(${SHOOTING_COLOR[0]},${SHOOTING_COLOR[1]},${SHOOTING_COLOR[2]},${0.9 * alpha})`);
            grad.addColorStop(1, `rgba(${SHOOTING_COLOR[0]},${SHOOTING_COLOR[1]},${SHOOTING_COLOR[2]},0)`);
            ctx.strokeStyle = grad; ctx.lineWidth = m.w * dpr; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(x2, y2); ctx.stroke();

            ctx.fillStyle = `rgba(${SHOOTING_COLOR[0]},${SHOOTING_COLOR[1]},${SHOOTING_COLOR[2]},${alpha})`;
            ctx.beginPath(); ctx.arc(m.x, m.y, m.w * 1.2, 0, Math.PI * 2); ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    // события
    addEventListener('scroll', () => {
        if (!draw._st) {
            draw._st = true;
            requestAnimationFrame(() => { updateScroll(); draw._st = false; });
        }
    }, { passive: true });

    addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) { tPrev = performance.now(); requestAnimationFrame(draw); }
    });

    addEventListener('resize', resize);

    // init
    function boot() { resize(); updateScroll(); tPrev = performance.now(); requestAnimationFrame(draw); }
    (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
