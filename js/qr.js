/**
 * qr.js · PSQ AL DÍA
 * Código QR de la página actual, para sesiones clínicas, diapositivas y pósters.
 *  - Añade un botón con el icono QR en la barra superior (.psq-topbar) si la hay.
 *  - Cualquier elemento con data-psq-qr también lo abre (p. ej. en el menú lateral).
 *    Con data-psq-qr="/ruta" se genera el QR de esa ruta en lugar de la actual.
 *  - La librería que dibuja el QR (/js/vendor/qrcode.js, licencia MIT) solo se carga al abrirlo.
 * Uso en una página:  <script src="/js/qr.js" defer></script>
 */
(function () {
    var SITE = 'https://psqaldia.com';
    var cargaLib = null;

    function cargarLib() {
        if (window.qrcode) return Promise.resolve();
        if (cargaLib) return cargaLib;
        cargaLib = new Promise(function (ok, ko) {
            var s = document.createElement('script');
            s.src = '/js/vendor/qrcode.js';
            s.onload = ok;
            s.onerror = function () { cargaLib = null; ko(new Error('No se pudo cargar el generador de QR')); };
            document.head.appendChild(s);
        });
        return cargaLib;
    }

    // Dirección pública de la página (siempre psqaldia.com, nunca la de pruebas)
    function urlPagina(ruta) {
        var p = ruta || location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
        if (p === '') p = '/';
        return { visible: 'psqaldia.com' + (p === '/' ? '' : p), qr: SITE + p + '?ref=qr' };
    }

    // SVG del QR: un único trazado con todos los módulos, nítido a cualquier tamaño
    function svgQR(texto) {
        var qr = qrcode(0, 'M');
        qr.addData(texto);
        qr.make();
        var n = qr.getModuleCount(), m = 4, t = n + m * 2, d = '';
        for (var f = 0; f < n; f++) for (var c = 0; c < n; c++) if (qr.isDark(f, c)) d += 'M' + (c + m) + ',' + (f + m) + 'h1v1h-1z';
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" shape-rendering="crispEdges">' +
            '<rect width="' + t + '" height="' + t + '" fill="#ffffff"/><path d="' + d + '" fill="#0f1b2d"/></svg>';
    }

    function nombreArchivo(url) {
        var base = url.visible.replace('psqaldia.com', '').replace(/^\//, '').replace(/\//g, '-') || 'portada';
        return 'qr-psqaldia-' + base;
    }

    function descargar(blob, nombre) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }

    function descargarPNG(svg, nombre) {
        var img = new Image(), tam = 1200;
        img.onload = function () {
            var cv = document.createElement('canvas'); cv.width = cv.height = tam;
            var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0, tam, tam);
            cv.toBlob(function (b) { descargar(b, nombre + '.png'); }, 'image/png');
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function estilos() {
        if (document.getElementById('psq-qr-css')) return;
        var st = document.createElement('style'); st.id = 'psq-qr-css';
        st.textContent =
            '.psq-qr-back{position:fixed;inset:0;z-index:3000;background:rgba(8,15,28,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem}' +
            '.psq-qr-card{background:#fff;color:#0f1b2d;width:100%;max-width:380px;border-radius:24px;padding:1.6rem 1.4rem 1.3rem;box-shadow:0 30px 60px -20px rgba(0,0,0,.5);text-align:center;position:relative;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color-scheme:light}' +
            '.psq-qr-card h2{margin:0 0 .25rem;font-size:1.2rem;letter-spacing:-.01em}' +
            '.psq-qr-card p{margin:0 0 1rem;color:#52627a;font-size:.88rem}' +
            '.psq-qr-img{width:min(260px,70vw);margin:0 auto;display:block;border-radius:12px;border:1px solid #e3e8ef}' +
            '.psq-qr-img svg{display:block;width:100%;height:auto;border-radius:12px}' +
            '.psq-qr-url{margin:.85rem 0 1.1rem;font-weight:800;font-size:1.02rem;color:#256095;word-break:break-all}' +
            '.psq-qr-acc{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}' +
            '.psq-qr-acc button{border:none;border-radius:14px;padding:.8rem .5rem;font:inherit;font-weight:700;font-size:.9rem;cursor:pointer;background:#eaf2fa;color:#256095;display:flex;align-items:center;justify-content:center;gap:.45rem}' +
            '.psq-qr-acc .psq-qr-full{grid-column:1/-1;background:linear-gradient(135deg,#256095,#2f86c4 60%,#1f9bbd);color:#fff}' +
            '.psq-qr-x{position:absolute;top:.8rem;right:.8rem;width:38px;height:38px;border-radius:50%;border:none;background:#f0f3f7;color:#0f1b2d;font-size:1rem;cursor:pointer}' +
            '.psq-qr-screen{position:fixed;inset:0;z-index:3100;background:#fff;color:#0f1b2d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vmin;cursor:pointer;color-scheme:light;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
            '.psq-qr-screen .psq-qr-big{width:min(78vmin,900px)}' +
            '.psq-qr-screen .psq-qr-big svg{width:100%;height:auto;display:block}' +
            '.psq-qr-screen strong{font-size:clamp(1.4rem,4.5vmin,3rem);letter-spacing:-.02em;color:#256095}' +
            '.psq-qr-screen span{font-size:clamp(.8rem,2vmin,1.1rem);color:#52627a}' +
            '.psq-qr-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:1px solid var(--border,#e3e8ef);background:var(--surface,#fff);color:var(--text-muted,#52627a);cursor:pointer;font-size:1.05rem;margin-left:auto;margin-right:.5rem}' +
            '.psq-qr-btn:hover{color:var(--brand,#256095);border-color:var(--brand,#256095)}';
        document.head.appendChild(st);
    }

    function pantallaCompleta(svg, url) {
        var sc = document.createElement('div');
        sc.className = 'psq-qr-screen'; sc.setAttribute('role', 'dialog'); sc.setAttribute('aria-label', 'Código QR a pantalla completa');
        sc.innerHTML = '<div class="psq-qr-big">' + svg + '</div><strong>' + url.visible + '</strong><span>Toca para cerrar</span>';
        function cerrar() {
            if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
            sc.remove(); document.removeEventListener('keydown', esc);
        }
        function esc(e) { if (e.key === 'Escape') cerrar(); }
        sc.addEventListener('click', cerrar);
        document.addEventListener('keydown', esc);
        document.body.appendChild(sc);
        if (sc.requestFullscreen) sc.requestFullscreen().catch(function () {});
    }

    function abrir(ruta) {
        estilos();
        var url = urlPagina(ruta);
        cargarLib().then(function () {
            var svg = svgQR(url.qr);
            var back = document.createElement('div');
            back.className = 'psq-qr-back';
            back.innerHTML =
                '<div class="psq-qr-card" role="dialog" aria-modal="true" aria-label="Código QR">' +
                '<button class="psq-qr-x" aria-label="Cerrar"><i class="fas fa-times"></i></button>' +
                '<h2>Código QR</h2><p>Para una sesión clínica, una diapositiva o un póster.</p>' +
                '<div class="psq-qr-img">' + svg + '</div>' +
                '<div class="psq-qr-url">' + url.visible + '</div>' +
                '<div class="psq-qr-acc">' +
                '<button class="psq-qr-png"><i class="fas fa-image"></i> PNG</button>' +
                '<button class="psq-qr-svg"><i class="fas fa-vector-square"></i> SVG</button>' +
                '<button class="psq-qr-full"><i class="fas fa-expand"></i> Mostrar en pantalla</button>' +
                '</div></div>';
            function cerrar() { back.remove(); document.removeEventListener('keydown', esc); }
            function esc(e) { if (e.key === 'Escape' && !document.querySelector('.psq-qr-screen')) cerrar(); }
            back.addEventListener('click', function (e) { if (e.target === back) cerrar(); });
            back.querySelector('.psq-qr-x').onclick = cerrar;
            back.querySelector('.psq-qr-png').onclick = function () { descargarPNG(svg, nombreArchivo(url)); };
            back.querySelector('.psq-qr-svg').onclick = function () { descargar(new Blob([svg], { type: 'image/svg+xml' }), nombreArchivo(url) + '.svg'); };
            back.querySelector('.psq-qr-full').onclick = function () { pantallaCompleta(svg, url); };
            document.addEventListener('keydown', esc);
            document.body.appendChild(back);
            back.querySelector('.psq-qr-x').focus();
        }).catch(function () { alert('No se pudo generar el código QR. Revisa la conexión e inténtalo de nuevo.'); });
    }

    window.psqQR = { abrir: abrir };

    function iniciar() {
        estilos();
        // Botón en la barra superior de las páginas con el diseño común
        var bar = document.querySelector('.psq-topbar');
        if (bar && !bar.querySelector('.psq-qr-btn')) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'psq-qr-btn'; b.title = 'Código QR de esta página';
            b.setAttribute('aria-label', 'Código QR de esta página');
            b.innerHTML = '<i class="fas fa-qrcode"></i>';
            b.onclick = function () { abrir(); };
            var link = bar.querySelector('.psq-nav-link');
            if (link) bar.insertBefore(b, link); else bar.appendChild(b);
        }
        // Cualquier elemento con data-psq-qr
        document.addEventListener('click', function (e) {
            var el = e.target.closest && e.target.closest('[data-psq-qr]');
            if (!el) return;
            e.preventDefault();
            abrir(el.getAttribute('data-psq-qr') || undefined);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
