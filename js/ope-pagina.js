/**
 * js/ope-pagina.js — Piezas comunes de las páginas del Portal OPE (/opesergas y /opesergas/<especialidad>).
 * Necesita /ope_portal.js cargado antes.
 *  - Ventana del simulador: cerrar, cronómetro y el observador que lo arranca al empezar un examen.
 *  - Listado de preguntas con respuesta desplegable en las páginas de especialidad: se carga siempre (texto para Google)
 *    pero queda plegado tras «Leer todas las preguntas» para no mezclarlo con «Hacer examen».
 */

// Las funciones del motor que cargan scripts bajo demanda la esperan en window
function cargarScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = url; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalData').innerHTML = '';
    stopCronometro();
}
function cerrarPortal() { closeModal(); }

/* --- Cronómetro --- */
let opeIntervalo, opeSegundos = 0;
function startCronometro() {
    const c = document.getElementById('cronometro-container');
    if (!c || c.style.display === 'block') return;
    c.style.display = 'block';
    opeSegundos = 0;
    clearInterval(opeIntervalo);
    opeIntervalo = setInterval(() => {
        opeSegundos++;
        const h = String(Math.floor(opeSegundos / 3600)).padStart(2, '0');
        const m = String(Math.floor((opeSegundos % 3600) / 60)).padStart(2, '0');
        const s = String(opeSegundos % 60).padStart(2, '0');
        document.getElementById('cronometro').innerText = `${h}:${m}:${s}`;
    }, 1000);
}
function stopCronometro() {
    clearInterval(opeIntervalo);
    const c = document.getElementById('cronometro-container');
    if (c) c.style.display = 'none';
    const t = document.getElementById('cronometro');
    if (t) t.innerText = '00:00:00';
}
// El cronómetro corre mientras hay un examen abierto
(function vigilarExamen() {
    const md = document.getElementById('modalData');
    if (!md) return;
    new MutationObserver(() => {
        if (document.querySelector('[id^="contenedor-preguntas"]')) startCronometro(); else stopCronometro();
    }).observe(md, { childList: true, subtree: true });
})();

/* --- Listado de preguntas (páginas de especialidad) --- */
function opeEscapar(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
async function opePintarListado(el) {
    const hoja = el.dataset.hoja, filtro = el.dataset.filtro || '';
    try {
        const r = await fetch(`/?sheet=${encodeURIComponent(hoja)}`);
        const data = await r.json();
        if (!data || !Array.isArray(data.values)) throw new Error('sin datos');
        let filas = data.values.filter(f => f && String(f[0] || '').trim() !== '' && !/^pregunta$/i.test(String(f[0]).trim()));
        if (filtro) filas = filas.filter(f => String(f[7] || '').trim().replace(/\.0+$/, '') === filtro);
        if (!filas.length) throw new Error('vacío');
        el.innerHTML = filas.map((f, i) => {
            const p = { pregunta: OPE.limpiar(f[0]), opciones: [f[1], f[2], f[3], f[4]].map(x => OPE.limpiar(x)),
                correcta: String(f[5] || '').trim().toUpperCase(), explicacion: OPE.limpiar(f[6]) };
            const anulada = OPE.anulada(p);
            const opciones = ['A', 'B', 'C', 'D'].map((l, k) => p.opciones[k]
                ? `<li${!anulada && l === p.correcta ? ' class="ok"' : ''}><b>${l})</b> ${p.opciones[k]}</li>` : '').join('');
            const resp = anulada ? 'Pregunta anulada por el tribunal.' : `Respuesta correcta: <b>${p.correcta}</b>.`;
            return `<li class="ope-preg" id="${opeEscapar(el.dataset.ancla || 'p')}-${i + 1}">
                <p class="enunciado">${p.pregunta}</p>
                <ol class="opciones">${opciones}</ol>
                <details><summary>Ver respuesta</summary><p>${resp}</p>${p.explicacion ? `<p>${p.explicacion}</p>` : ''}</details>
            </li>`;
        }).join('');
        const sec = el.closest('section');
        sec?.querySelector('.ope-num')?.replaceChildren(document.createTextNode(`${filas.length} preguntas`));
        const b = sec?.querySelector('.ope-leer');
        if (b) { b.dataset.n = filas.length; opeEstadoLeer(b); }
        // Enlace directo a una pregunta (#convocatoria-2022-15): desplegar y llevar hasta ella
        const destino = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
        if (destino && el.contains(destino)) { opeMostrarPreguntas(b, true); destino.scrollIntoView(); }
    } catch (e) {
        el.innerHTML = '<li class="ope-error">No se han podido cargar las preguntas. Puedes hacer el examen con el botón «Hacer examen».</li>';
    }
}
/* --- «Leer todas las preguntas»: abre y cierra el listado --- */
function opeEstadoLeer(b) {
    const abierto = b.getAttribute('aria-expanded') === 'true', n = b.dataset.n;
    b.querySelector('span').textContent = abierto ? 'Ocultar las preguntas' : (n ? `Leer las ${n} preguntas` : 'Leer todas las preguntas');
}
function opeMostrarPreguntas(b, mostrar) {
    if (!b) return;
    const caja = document.getElementById(b.getAttribute('aria-controls'));
    if (mostrar) caja.removeAttribute('hidden'); else caja.setAttribute('hidden', 'until-found');
    b.setAttribute('aria-expanded', String(mostrar));
    opeEstadoLeer(b);
}
document.querySelectorAll('.ope-leer').forEach(b => {
    b.addEventListener('click', () => {
        const abrir = b.getAttribute('aria-expanded') !== 'true';
        opeMostrarPreguntas(b, abrir);
        if (!abrir) b.closest('section').scrollIntoView({ block: 'start' });
    });
    // Buscar en la página (Ctrl+F) también encuentra las preguntas plegadas y las despliega
    document.getElementById(b.getAttribute('aria-controls'))?.addEventListener('beforematch', () => opeMostrarPreguntas(b, true));
});
document.querySelectorAll('ol.ope-listado[data-hoja]').forEach(opePintarListado);

Object.assign(window, { cargarScript, closeModal, cerrarPortal, startCronometro, stopCronometro });
