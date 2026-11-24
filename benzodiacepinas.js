/**
 * benzodiacepinas.js — Conversor de benzodiacepinas y fármacos Z.
 * Se usa en dos sitios con el mismo código: la página /benzodiacepinas y la ventana de la portada
 * (entrada de Hoja 1 con acción «iniciarConversorBZ» y script «benzodiacepinas.js»).
 * Pinta la herramienta dentro de #modalData.
 */
(function () {
    // Datos: pestaña Data_BZ del Google Sheets (el Worker omite la fila de cabecera).
    // Columnas: A Fármaco · B Tipo (BZ/Z) · C Inada, mg ≈ 5 mg de diazepam · D Ashton mín y E Ashton máx, mg ≈ 10 mg de diazepam
    //           (E vacía si no hay rango) · F DDD oral de la OMS (mg)
    const METODOS = {
        inada:  { nombre: 'la tabla de Inada' },
        ashton: { nombre: 'el Manual de Ashton' },
        ddd:    { nombre: 'las DDD de la OMS' }
    };
    const AVISOS = {
        inada: [
            'Tabla basada sobre todo en ensayos realizados en Japón; los autores la presentan como valores aproximados que deben usarse con prudencia.'
        ],
        ashton: [
            'Equivalencias basadas en la experiencia clínica de la autora (revisión de 2002). Ella misma advierte que no coinciden con las de otros autores y que pueden variar entre personas. Cuando da un rango, el resultado es un rango.',
            'En sus pautas, el paso a diazepam se hace de forma escalonada, sustituyendo una toma cada vez.'
        ],
        ddd: [
            'La DDD es la dosis de mantenimiento media supuesta en adultos para la indicación principal: una unidad para estudios de consumo, no una dosis de equivalencia terapéutica.',
            'Incluye ansiolíticos (N05BA), hipnóticos benzodiacepínicos (N05CD) y fármacos Z (N05CF); en los hipnóticos la DDD se refiere a su uso como hipnótico. El clonazepam no tiene DDD en estos grupos.'
        ],
        comun: [
            'Las tablas de equivalencia son orientativas y pueden diferir entre fuentes en dos o tres veces. Ajusta la dosis según la respuesta clínica.',
            '<b>Comprueba que la dosis resultante no supera la dosis máxima autorizada del fármaco nuevo</b> (ficha técnica), sobre todo con dosis altas o en personas mayores.'
        ]
    };

    const $ = id => document.getElementById(id);
    const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return x > 0 ? x : null; };
    const redondear = x => x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 2) / 2 : x >= 1 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100;
    const fmt = x => String(redondear(x)).replace('.', ',');
    const fmtR = ([a, b]) => redondear(a) === redondear(b) ? fmt(a) : `${fmt(a)}–${fmt(b)}`;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function cargar(filas) {
        F = {};
        filas.forEach(r => {
            const n = String(r[0] || '').trim(); if (!n) return;
            const amin = num(r[3]), amax = num(r[4]) || amin;
            F[n] = {
                z: String(r[1] || '').trim().toUpperCase() === 'Z',
                inada: num(r[2]) ? [num(r[2]), num(r[2])] : null,
                ashton: amin ? [amin, amax] : null,
                ddd: num(r[5]) ? [num(r[5]), num(r[5])] : null
            };
        });
    }

    // Equivalencia como rango [mín, máx]: dosis × destino / origen, combinando los extremos de ambos rangos
    const convertir = (dosis, o, d, m) => (F[o]?.[m] && F[d]?.[m]) ? [dosis * F[d][m][0] / F[o][m][1], dosis * F[d][m][1] / F[o][m][0]] : null;

    function rellenar(sel, elegido, otro) {
        const lista = Object.keys(F).filter(n => F[n][metodo]).sort((a, b) => a.localeCompare(b, 'es'));
        // Si el fármaco no está en esta tabla, se vuelve a diazepam (o lorazepam si diazepam ya está en el otro selector)
        const reserva = ['Diazepam', 'Lorazepam'].find(n => lista.includes(n) && n !== otro) || lista.find(n => n !== otro);
        sel.innerHTML = lista.map(n => `<option value="${esc(n)}">${esc(n)}${F[n].z ? ' (fármaco Z)' : ''}</option>`).join('');
        sel.value = lista.includes(elegido) ? elegido : reserva;
    }

    function calcular() {
        const o = $('bz-orig').value, d = $('bz-dest').value, dosis = num($('bz-dosis').value);
        const res = $('bz-res');
        $('bz-aviso').innerHTML = [...AVISOS[metodo], ...AVISOS.comun].map(t => `<li>${t}</li>`).join('');
        ultimo = null;
        if (!dosis) { res.innerHTML = '<div class="bz-vacio">Escribe la dosis diaria del fármaco actual.</div>'; return; }
        if (o === d) { res.innerHTML = '<div class="bz-vacio">Elige dos fármacos distintos.</div>'; return; }
        const equiv = convertir(dosis, o, d, metodo);
        const lineas = [];
        if (o !== 'Diazepam' && d !== 'Diazepam' && F.Diazepam?.[metodo]) lineas.push(`${fmt(dosis)} mg de ${esc(o.toLowerCase())} ≈ ${fmtR(convertir(dosis, o, 'Diazepam', metodo))} mg de diazepam.`);
        const otros = Object.keys(METODOS).filter(m => m !== metodo).map(m => [m, convertir(dosis, o, d, m)]).filter(x => x[1]);
        if (otros.length) lineas.push(otros.map(([m, r]) => `Con ${METODOS[m].nombre}: ≈ ${fmtR(r)} mg/día`).join('<br>'));
        res.innerHTML = `
            <div class="n">≈ ${fmtR(equiv)} <small>mg/día</small></div>
            <div class="t">de ${esc(d.toLowerCase())}</div>
            <div class="s">${lineas.join('<br>')}</div>`;
        ultimo = (equiv[0] + equiv[1]) / 2;
    }

    function cambiarMetodo(m) {
        metodo = m;
        document.querySelectorAll('.bz-metodo button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
        const o = $('bz-orig').value, d = $('bz-dest').value;
        rellenar($('bz-orig'), o, null);
        rellenar($('bz-dest'), d, $('bz-orig').value);
        try { localStorage.setItem('psq_bz_metodo', m); } catch (e) {}
        calcular();
    }


    const ESTILOS = `
.bz-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: var(--radius, 18px); box-shadow: var(--shadow-sm); padding: 1.4rem; }
.bz-metodo { display: flex; background: var(--border); border-radius: 14px; padding: 3px; gap: 3px; margin-bottom: 1.2rem; }
.bz-metodo button { flex: 1; min-width: 0; border: none; background: transparent; border-radius: 11px; padding: .6rem .5rem; font: inherit; font-size: .85rem; font-weight: 700; color: var(--text-muted); cursor: pointer; line-height: 1.25; }
.bz-metodo button.on { background: var(--surface, #fff); color: var(--brand); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.bz-metodo small { display: block; font-weight: 500; font-size: .72rem; opacity: .8; }
.bz-campo { margin-bottom: .9rem; }
.bz-campo label { display: block; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: .35rem; }
.bz-campo select, .bz-campo input { width: 100%; box-sizing: border-box; padding: .8rem .9rem; border-radius: 12px; border: 2px solid var(--border); background: var(--bg, #f8fafc); color: var(--text-main); font: inherit; font-size: 1rem; }
.bz-campo select:focus, .bz-campo input:focus { outline: none; border-color: var(--brand); }
.bz-fila { display: grid; grid-template-columns: 1fr auto 1fr; gap: .5rem; align-items: end; }
.bz-swap { margin-bottom: .9rem; width: 44px; height: 44px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface, #fff); color: var(--brand); cursor: pointer; }
.bz-res { margin-top: .4rem; border-radius: 16px; background: var(--brand-soft, #eef4fb); padding: 1.1rem 1.2rem; text-align: center; }
.bz-res .n { font-size: 2.3rem; font-weight: 900; color: var(--text-main); line-height: 1.1; }
.bz-res .n small { font-size: 1rem; font-weight: 700; }
.bz-res .t { font-size: .95rem; color: var(--text-main); margin-top: .2rem; }
.bz-res .s { font-size: .82rem; color: var(--text-muted); margin-top: .45rem; line-height: 1.45; }
.bz-vacio { color: var(--text-muted); font-size: .92rem; }
.bz-aviso { margin-top: 1.2rem; font-size: .84rem; color: var(--text-muted); line-height: 1.5; }
.bz-aviso li { margin-bottom: .35rem; }
.bz-ref { margin-top: 1.5rem; font-size: .85rem; color: var(--text-muted); line-height: 1.55; border-top: 1px solid var(--border); padding-top: 1.1rem; }
.bz-ref h3 { margin: 0 0 .7rem; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); }
.bz-ref ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.bz-ref li { padding-left: .85rem; border-left: 3px solid var(--border); }
.bz-ref a { color: var(--brand); }
@media (max-width: 420px) { .bz-fila { grid-template-columns: 1fr; } .bz-swap { justify-self: center; transform: rotate(90deg); } }
.bz-app { padding: 1.5rem; }
.bz-titulo { margin: 0 0 1rem; font-size: 1.35rem; color: var(--text-main); }
.bz-main .bz-app { padding: 0; }
.bz-main .bz-titulo { display: none; }`;

    const PLANTILLA = `
    <div class="bz-app">
        <h2 class="bz-titulo">Conversor de benzodiacepinas</h2>
        <div class="bz-card">
            <div class="bz-metodo" role="group" aria-label="Método">
                <button type="button" data-m="ashton" class="on">Ashton<small>2002</small></button>
                <button type="button" data-m="inada">Inada<small>2015</small></button>
                <button type="button" data-m="ddd">DDD<small>OMS</small></button>
            </div>

            <div class="bz-fila">
                <div class="bz-campo"><label for="bz-orig">Fármaco actual</label><select id="bz-orig"></select></div>
                <button type="button" class="bz-swap" id="bz-swap" aria-label="Intercambiar fármacos"><i class="fas fa-right-left"></i></button>
                <div class="bz-campo"><label for="bz-dest">Fármaco nuevo</label><select id="bz-dest"></select></div>
            </div>
            <div class="bz-campo"><label for="bz-dosis">Dosis actual (mg/día)</label><input id="bz-dosis" type="number" inputmode="decimal" min="0" step="any" placeholder="Ej.: 10"></div>

            <div class="bz-res" id="bz-res" aria-live="polite"><div class="bz-vacio">Cargando datos…</div></div>

            <ul class="bz-aviso" id="bz-aviso"></ul>
        </div>

        <div class="bz-ref">
            <h3>Fuentes</h3>
            <ul>
                <li>Inada T, Inagaki A. Psychotropic dose equivalence in Japan. <i>Psychiatry Clin Neurosci</i>. 2015;69(8):440-447. <a href="https://doi.org/10.1111/pcn.12275" target="_blank" rel="noopener noreferrer">doi:10.1111/pcn.12275</a> (tabla 6).</li>
                <li>Ashton CH. <i>Benzodiazepines: How They Work and How to Withdraw</i> (Manual de Ashton). Revisión de agosto de 2002, tabla 1 (dosis orales aproximadamente equivalentes).</li>
                <li>WHO Collaborating Centre for Drug Statistics Methodology. ATC/DDD Index, DDD por vía oral: <a href="https://atcddd.fhi.no/atc_ddd_index/?code=N05BA" target="_blank" rel="noopener noreferrer">N05BA</a> (ansiolíticos), <a href="https://atcddd.fhi.no/atc_ddd_index/?code=N05CD" target="_blank" rel="noopener noreferrer">N05CD</a> (hipnóticos benzodiacepínicos) y <a href="https://atcddd.fhi.no/atc_ddd_index/?code=N05CF" target="_blank" rel="noopener noreferrer">N05CF</a> (fármacos Z). Consultado en noviembre de 2026.</li>
            </ul>
        </div>
    </div>`;

    let F = {}, metodo = 'ashton', ultimo = null;

    window.iniciarConversorBZ = async function () {
        const destino = document.getElementById('modalData');
        if (!destino) return;
        if (!document.getElementById('bz-estilos')) {
            const st = document.createElement('style'); st.id = 'bz-estilos'; st.textContent = ESTILOS;
            document.head.appendChild(st);
        }
        destino.innerHTML = PLANTILLA;
        F = {}; ultimo = null; metodo = 'ashton';

    document.querySelectorAll('.bz-metodo button').forEach(b => b.addEventListener('click', () => cambiarMetodo(b.dataset.m)));
    ['bz-orig', 'bz-dest', 'bz-dosis'].forEach(id => $(id).addEventListener('input', calcular));
    $('bz-swap').addEventListener('click', () => {
        // Al intercambiar, la dosis pasa a ser la equivalente calculada (el punto medio si es un rango)
        const o = $('bz-orig').value; $('bz-orig').value = $('bz-dest').value; $('bz-dest').value = o;
        if (ultimo !== null) $('bz-dosis').value = redondear(ultimo);
        calcular();
    });

        await (async () => {
        try {
            const r = await fetch('/?sheet=Data_BZ');
            const j = await r.json();
            cargar(j.values || []);
            if (!F.Diazepam) throw new Error('sin datos');
        } catch (e) {
            $('bz-res').innerHTML = '<div class="bz-vacio">No se pudieron cargar los datos. Recarga la página en unos segundos.</div>';
            return;
        }
        // Arranque: diazepam → lorazepam con el método que se usó la última vez
        try { const g = localStorage.getItem('psq_bz_metodo'); if (METODOS[g]) metodo = g; } catch (e) {}
        rellenar($('bz-orig'), 'Diazepam', null);
        rellenar($('bz-dest'), 'Lorazepam', 'Diazepam');
        cambiarMetodo(metodo);
        })();

    };
})();
