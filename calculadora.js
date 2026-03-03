/**
 * CALCULADORA APS - VERSIÓN SIN FILTROS (ELIMINA EL "CACAO")
 * 1. Lee Columna A a saco (desde fila 2).
 * 2. Mapea Fila 13 para el Switch.
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Estilos (Se mantienen para que se vea bien)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
            .btn-ejecutar { margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; }
            .res-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
            .res-pauta { padding: 1.5rem; background: var(--bg); }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: var(--border); opacity: 0.5; }
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; z-index: 1; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
        `;
        document.head.appendChild(styleTag);
    }

    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            
            if (data.values) {
                window.dbRaw = data.values;
                window.dbCalc = [];
                window.mapSwitchCol = {};

                // 1. ORIGEN Y DATOS: Leer TODO lo que haya en Columna A desde la fila 2
                // Si Haloperidol está en A2, el primer elemento será dbCalc[0]
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    if (row && row[0]) {
                        window.dbCalc.push({
                            nombre: row[0].toString().trim(),
                            filaIdx: i,
                            factor: parseFloat(row[1]) || 1,
                            max: parseFloat(row[3]) || 0
                        });
                    }
                }

                // 2. DESTINO SWITCH: Mapear la Fila 13 (índice 12)
                const fila13 = data.values[12];
                if (fila13) {
                    fila13.forEach((val, idx) => {
                        if (val) window.mapSwitchCol[val.toString().trim().toUpperCase()] = idx;
                    });
                }
            }
        } catch (e) {
            container.innerHTML = "Error cargando datos.";
            return;
        }
    }

    // El selector ahora es un espejo de la columna A
    const options = window.dbCalc.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');
    
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-random"></i> APS Switch Manager</h2>
            <label>Fármaco Origen (A2...)</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            <label>Fármaco Destino (A2...)</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

window.ejecutarCalculo = function() {
    const fOrig = document.getElementById('f_orig').value;
    const fDest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.nombre === fOrig);
    const d = window.dbCalc.find(f => f.nombre === fDest);
    
    if (!o || !d || isNaN(dosis)) return;

    // Cálculo A -> A
    const Maudsley = (dosis / o.factor) * d.factor;
    
    document.getElementById('res-box').style.display = 'block';
    document.getElementById('res-header').innerHTML = `
        <div style="font-size:0.7rem; font-weight:800; opacity:0.6;">Dosis Objetivo</div>
        <div style="font-size:2.5rem; font-weight:900;">${Maudsley.toFixed(1)} mg</div>
    `;

    // Switch A -> Fila 13
    const fila = o.filaIdx;
    const col = window.mapSwitchCol[fDest.toUpperCase()];

    let rawInstr = (col !== undefined && window.dbRaw[fila]) ? window.dbRaw[fila][col] : "";

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Pauta</h4>
        ${window.traducirPasos(rawInstr ? rawInstr.toString() : "", dosis, Maudsley)}
    `;
};

window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr === "NaN") return "Pauta no definida.";
    const bloques = rawStr.split('|').filter(Boolean);
    let html = '';
    bloques.forEach(bloque => {
        let texto = bloque.trim();
        // Lógica IF_ACTUAL
        if (texto.startsWith("IF_ACTUAL_")) {
            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const cumple = eval(`${dOrig} ${m[1] === '=' ? '==' : m[1]} ${m[2]}`);
                if (!cumple) return;
                texto = m[3].trim();
            }
        }
        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;
        const dia = p[0].replace('D', 'Día '), sujeto = p[1], accion = p[2], valor = p[3] || "";
        let desc = (sujeto === 'ACTUAL') 
            ? (accion === 'REDUCIR' ? `Bajar origen al ${valor} (<b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b>)` : `${accion} ${valor}`)
            : (valor.includes('TARGET') ? `Nuevo al ${valor.includes('%') ? parseFloat(valor) : 100}% (<b>${(targetMg * (parseFloat(valor) || 100) / 100).toFixed(1)} mg</b>)` : `Iniciar a ${valor}`);
        
        html += `<div class="pauta-step"><div class="step-idx">${dia.replace('Día ', '')}</div><div class="step-body"><span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto}</span><div class="step-txt">${desc}</div></div></div>`;
    });
    return html;
};
