// --- CONFIGURACIÓN: AJUSTA ESTOS VALORES HASTA QUE FUNCIONE ---
const CONFIG = {
    FILA_INICIO_FARMACOS: 1,      // ¿En qué fila del array empieza Haloperidol? (1 = fila 2 de Excel)
    COL_INICIO_DESTINOS: 6        // ¿En qué columna del array empiezan los destinos en fila 13? (6 = G)
};
// --------------------------------------------------------------

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Estilos
    if (!document.getElementById('calc-internal-styles')) {
        const style = document.createElement('style');
        style.id = 'calc-internal-styles';
        style.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; font-family: inherit; outline: none; box-sizing: border-box; }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
            .calc-ui .btn-primary { margin-top: 1.2rem; cursor: pointer; }
        `;
        document.head.appendChild(style);
    }

    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            if (data.error) throw new Error(data.details);
            window.dbRaw = data.values;

            // Construir lista de fármacos desde la fila indicada
            window.listaFarmacos = [];
            for (let i = CONFIG.FILA_INICIO_FARMACOS; i < window.dbRaw.length; i++) {
                const nombre = window.dbRaw[i]?.[0];
                if (nombre && nombre.toString().trim() !== '') {
                    window.listaFarmacos.push(nombre.toString().trim());
                }
            }
            console.log('Fármacos (desde fila', CONFIG.FILA_INICIO_FARMACOS, '):', window.listaFarmacos);

            // Mostrar destinos en fila 13 para verificar
            const headerRow = window.dbRaw[12];
            if (headerRow) {
                let destinos = [];
                for (let i = CONFIG.COL_INICIO_DESTINOS; i < headerRow.length; i++) {
                    if (headerRow[i]) destinos.push(headerRow[i].toString().trim());
                }
                console.log('Destinos (desde col', CONFIG.COL_INICIO_DESTINOS, '):', destinos);
            }

            // Datos para cálculos (factores)
            window.dbCalc = window.listaFarmacos.map((nombre, idx) => {
                const fila = CONFIG.FILA_INICIO_FARMACOS + idx;
                return {
                    farmaco: nombre,
                    factor: parseFloat(window.dbRaw[fila]?.[1]) || 1,
                    ed95: parseFloat(window.dbRaw[fila]?.[2]) || 0,
                    max: parseFloat(window.dbRaw[fila]?.[3]) || 0,
                    min: parseFloat(window.dbRaw[fila]?.[4]) || 0,
                    umbral: parseFloat(window.dbRaw[fila]?.[5]) || 0
                };
            });
        } catch (e) {
            container.innerHTML = `Error: ${e.message}`;
            return;
        }
    }

    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2>Calculadora APS</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" step="0.1" value="10">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn btn-primary" onclick="ejecutarCalculo()">CALCULAR</button>
            <div id="res-box" class="res-container"></div>
        </div>
    `;
}

// Traducción de pasos (siempre en mg)
window.traducirPasos = function(raw, dosisActual, dosisObjetivo) {
    if (!raw || raw.trim() === '') return 'No hay instrucciones.';
    const pasos = raw.split('|').map(p => p.trim()).filter(p => p);
    let html = '<ul>';
    let objetivo = false;
    let dosisAct = dosisActual;

    pasos.forEach(p => {
        if (objetivo) return;
        let inst = p;
        let incluir = true;

        while (inst.startsWith('IF_ACTUAL_')) {
            const match = inst.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (!match) { incluir = false; break; }
            const op = match[1], corte = parseFloat(match[2]), resto = match[3];
            const cumple = op === '<' ? dosisActual < corte :
                           op === '>' ? dosisActual > corte :
                           op === '<=' ? dosisActual <= corte :
                           dosisActual >= corte;
            if (!cumple) { incluir = false; break; }
            inst = resto;
        }
        if (!incluir) return;

        const partes = inst.split(':').map(s => s.trim());
        if (partes.length < 3) return;
        const dia = partes[0].replace('D', 'Día ');
        const sujeto = partes[1];
        const accion = partes[2];
        const valor = partes.slice(3).join(':');

        let texto = `<b>${dia}:</b> `;

        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') texto += 'Suspender origen.';
            else if (accion === 'REDUCIR') {
                const pct = parseFloat(valor.replace('%', ''));
                if (!isNaN(pct)) {
                    const nueva = dosisAct * pct / 100;
                    texto += `Reducir origen a ${nueva.toFixed(1)} mg.`;
                    dosisAct = nueva;
                } else texto += `Reducir origen (${valor}).`;
            } else texto += 'Mantener origen.';
        } else if (sujeto === 'NUEVO') {
            if (accion === 'INICIAR' || accion === 'SUBIR') {
                if (valor === 'TARGET') {
                    texto += `Alcanzar objetivo (${dosisObjetivo.toFixed(1)} mg).`;
                    objetivo = true;
                } else if (valor.includes('%_TARGET')) {
                    const pct = parseFloat(valor.replace('%_TARGET', ''));
                    texto += `Iniciar nuevo a ${(dosisObjetivo * pct / 100).toFixed(1)} mg.`;
                } else if (valor.includes('%')) {
                    const pct = parseFloat(valor.replace('%', ''));
                    texto += `Iniciar nuevo a ${(dosisObjetivo * pct / 100).toFixed(1)} mg.`;
                } else if (valor.includes('mg')) {
                    const mg = parseFloat(valor.replace(/[^0-9.]/g, ''));
                    if (!isNaN(mg)) {
                        if (mg >= dosisObjetivo) {
                            texto += `Alcanzar objetivo (${dosisObjetivo.toFixed(1)} mg).`;
                            objetivo = true;
                        } else texto += `Iniciar nuevo a ${mg.toFixed(1)} mg.`;
                    } else texto += `Iniciar nuevo a ${valor}.`;
                } else texto += `Iniciar nuevo a ${valor}.`;
            } else if (accion === 'TITULAR_PROGRESIVO') {
                texto += `Titular hasta ${dosisObjetivo.toFixed(1)} mg.`;
                objetivo = true;
            }
        }
        html += `<li>${texto}</li>`;
    });
    return html + '</ul>';
}

// Cálculo y obtención de la instrucción
window.ejecutarCalculo = function() {
    const orig = document.getElementById('f_orig').value.trim();
    const dest = document.getElementById('f_dest').value.trim();
    const dosis = parseFloat(document.getElementById('d_orig').value);
    if (isNaN(dosis)) { alert('Dosis inválida'); return; }

    const o = window.dbCalc.find(f => f.farmaco === orig);
    const d = window.dbCalc.find(f => f.farmaco === dest);
    if (!o || !d) { alert('Fármaco no encontrado'); return; }

    const equivalente = (dosis / o.factor) * d.factor;

    let bg, color, alerta;
    if (equivalente > d.max) { bg = '#fee2e2'; color = '#b91c1c'; alerta = '⚠️ EXCEDE MÁXIMO'; }
    else if (equivalente > d.ed95) { bg = '#fef3c7'; color = '#b45309'; alerta = '⚠️ SOBRE ED95'; }
    else if (equivalente < d.min) { bg = '#f1f5f9'; color = '#475569'; alerta = '🔍 POR DEBAJO DE MÍNIMO'; }
    else { bg = '#dcfce7'; color = '#15803d'; alerta = '✅ RANGO ESTÁNDAR'; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;
    resBox.innerHTML = `
        <div style="padding:1rem; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900;">${equivalente.toFixed(1)} mg/día</div>
            <div style="color:${color}; font-weight:800;">${alerta}</div>
        </div>
        <div id="res-tip" style="margin-top:1rem; border-top:1px solid #ccc; padding-top:1rem;"></div>
    `;

    const idxOrig = window.listaFarmacos.indexOf(orig);
    const idxDest = window.listaFarmacos.indexOf(dest);

    if (idxOrig === -1 || idxDest === -1) {
        document.getElementById('res-tip').innerText = 'Error: fármaco no encontrado.';
        return;
    }

    const fila = CONFIG.FILA_INICIO_FARMACOS + idxOrig;
    const col = CONFIG.COL_INICIO_DESTINOS + idxDest;

    console.log(`Leyendo dbRaw[${fila}][${col}]`);

    let instruccion = '';
    if (fila < window.dbRaw.length && col < window.dbRaw[fila].length) {
        instruccion = window.dbRaw[fila][col];
    }

    const traducido = instruccion && instruccion.toString().trim() !== ''
        ? window.traducirPasos(instruccion, dosis, equivalente)
        : '<span style="color:#999;">No hay instrucción (celda vacía, quizás mismo fármaco).</span>';

    document.getElementById('res-tip').innerHTML = `
        <b>Estrategia de cambio</b><br>
        ${traducido}
    `;
}
