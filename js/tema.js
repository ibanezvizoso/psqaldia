/**
 * tema.js · PSQ AL DÍA
 * Aplica el tema elegido en Ajustes (automático, claro u oscuro) ANTES de que se pinte la
 * página, para que no haya destellos. Se carga en el <head> de cada página, justo después
 * de /css/psq.css:
 *     <script src="/js/tema.js"></script>
 * Si una página no lo carga, simplemente sigue el modo del móvil (no se rompe nada).
 */
(function () {
    var CLAVE = 'psq_tema';                 // 'auto' | 'claro' | 'oscuro'
    var raiz = document.documentElement;
    var sistemaOscuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function leer() {
        try { return localStorage.getItem(CLAVE) || 'auto'; } catch (e) { return 'auto'; }
    }

    function esOscuro(tema) {
        if (raiz.classList.contains('psq-light-only')) return false;
        if (tema === 'oscuro') return true;
        if (tema === 'claro') return false;
        return !!(sistemaOscuro && sistemaOscuro.matches);
    }

    function aplicar(tema) {
        if (tema === 'oscuro') raiz.setAttribute('data-theme', 'dark');
        else if (tema === 'claro') raiz.setAttribute('data-theme', 'light');
        else raiz.removeAttribute('data-theme');

        // Color de la barra del sistema (Android) acorde al tema
        var color = esOscuro(tema) ? '#0b1220' : '#f5f7fa';
        var metas = document.querySelectorAll('meta[name="theme-color"]');
        if (metas.length) {
            for (var i = 0; i < metas.length; i++) { metas[i].setAttribute('content', color); metas[i].removeAttribute('media'); }
        } else if (document.head) {
            var m = document.createElement('meta'); m.name = 'theme-color'; m.content = color; document.head.appendChild(m);
        }
    }

    window.psqTema = {
        actual: leer,
        esOscuro: function () { return esOscuro(leer()); },
        cambiar: function (tema) {
            try { localStorage.setItem(CLAVE, tema); } catch (e) { /* modo privado: solo para esta visita */ }
            aplicar(tema);
            document.dispatchEvent(new CustomEvent('psq:tema', { detail: { tema: tema, oscuro: esOscuro(tema) } }));
        }
    };

    aplicar(leer());

    // Las etiquetas meta del final del <head> aún no existen al cargar este script: se ajustan al terminar
    document.addEventListener('DOMContentLoaded', function () { aplicar(leer()); });

    // En modo automático, seguir los cambios del móvil sin recargar
    if (sistemaOscuro && sistemaOscuro.addEventListener) {
        sistemaOscuro.addEventListener('change', function () {
            if (leer() === 'auto') {
                aplicar('auto');
                document.dispatchEvent(new CustomEvent('psq:tema', { detail: { tema: 'auto', oscuro: esOscuro('auto') } }));
            }
        });
    }
})();
