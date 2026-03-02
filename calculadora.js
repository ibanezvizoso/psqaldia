/**
 * CALCULADORA APS (Antipsychotic Switch)
 * Versión: Fix Índices Matriz G=6 y Limpieza de Nombres
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // 1. INYECCIÓN DE ESTILOS (Timeline + Colores)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; display: flex; align-items: center; gap: 12px; color: var(--text-main); }
            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box;
                transition: border-color 0.2s;
            }
            .calc-ui select:focus { border-color: var(--primary); }
            .btn-ejecutar { 
                margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; 
                border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1rem;
                letter-spacing: 0.5px; transition: opacity 0.2s;
            }
            .btn-ejecutar:hover { opacity: 0.9; }
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; }
            .res-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
            .res-pauta { padding: 1.5rem; background: var(--bg); }
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { 
                content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; 
                width: 2px; background: var(--border); opacity: 0.5; 
            }
            .step-idx { 
                min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); 
                border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                font-weight: 900; font-size: 0.8rem; z-index: 1; box-shadow: var(--shadow-sm);
            }
            .step-body { flex: 1; padding-top: 4px; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    // 2. CARGA DE DATOS DESDE EL WORKER
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            
            if (data.values) {
                window.dbRaw = data.values;
                window.dbCalc = [];
                window.listaFarmacos = [];
                
                // Empezamos en i=1 para saltar la cabecera (Fila 1)
                // Columna A (0) = Nombre, B (1) = Factor, C (2) = ED95, D (3) = Max
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    const nombre = row[0] ? row[0].toString().trim() : "";
                    
                    if (nombre !== "" && nombre !== "Farmaco") {
                        window.listaFarmacos.push(nombre);
                        window.dbCalc.push({
                            farmaco: nombre,
                            factor: parseFloat(row[1]) || 1,
                            ed95: parseFloat(row[2]) || 0,
                            max: parseFloat(row[3]) || 0,
                            categoria: "Antipsicótico" 
                        });
                    }
                }
                window.idxRowStart = 1; // Fila donde empieza Haloperidol (Fila 2)
                window.idxColStart = 6; // Columna G (Índice 6)
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error de conexión: ${e.message}</div>`;
            return;
        }
    }

    // 3. RENDERIZADO DE LA INTERFAZ
    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-random"></i> APS Switch Manager</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00" step="any">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

// 4. TRADUCTOR DE INSTRUCCIONES (D1:ACTUAL:STOP...)
window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") {
        return `<div style="color:var(--text-muted); font-style:italic; padding: 10px; border: 1px dashed var(--border); border-radius: 10px;">
            No hay una pauta específica en la matriz para este cambio. Se sugiere descenso gradual del origen e inicio lento del destino.
        </div>`;
    }

    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';

    bloques.forEach(bloque => {
        let texto = bloque;
        
        // Lógica condicional (IF_ACTUAL_<300mg:...)
        if (texto.startsWith("IF_ACTUAL_")) {
            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const op = m[1], corte = parseFloat(m[2]), resto = m[3];
                const cumple = (op === '<' && dOrig < corte) || (op === '>' && dOrig > corte) || 
                               (op === '<=' && dOrig <= corte) || (op === '>=' && dOrig >= corte);
                if (!cumple) return; 
                texto = resto.trim();
            }
        }

        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;

        const dia = p[0].replace('D', 'Día ');
        const sujeto = p[1]; // ACTUAL o NUEVO
        const accion = p[2]; // STOP, REDUCIR, INICIAR...
        const valor = p[3] || "";

        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender completamente el fármaco de origen.';
            else if (accion === 'REDUCIR') desc = `Reducir origen al ${valor} (<b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b>).`;
            else desc = `${accion} ${valor}`;
        } else {
            if (accion === 'TITULAR_PROGRESIVO' || valor === 'TARGET' || (valor.includes('TARGET') && !valor.includes('%'))) {
                desc = `Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>.`;
            } else if (valor.includes('%_TARGET')) {
                const pct = parseFloat(valor);
                desc = `Iniciar nuevo al ${pct}% de la dosis objetivo (<b>${(targetMg * pct / 100).toFixed(1)} mg</b>).`;
            } else {
                desc = `Iniciar/Ajustar nuevo a <b>${valor}</b>.`;
            }
        }

        html += `
            <div class="pauta-step">
                <div class="step-idx">${dia.replace('Día ', '')}</div>
                <div class="step-body">
                    <span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto === 'ACTUAL' ? 'Origen' : 'Nuevo'}</span>
                    <div class="step-txt">${desc}</div>
                </div>
            </div>`;
    });
    return html;
};

// 5. CÁLCULO Y LOCALIZACIÓN EN MATRIZ
window.ejecutarCalculo = function() {
    const fOrigNom = document.getElementById('f_orig').value;
    const fDestNom = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigNom);
    const d = window.dbCalc.find(f => f.farmaco === fDestNom);
    
    if (isNaN(dosis) || dosis <= 0) {
        alert("Por favor, introduce una dosis válida.");
        return;
    }

    // Cálculo Maudsley
    const Maudsley = (dosis / o.factor) * d.factor;
    
    const resBox = document.getElementById('res-box');
    const header = document.getElementById('res-header');
    resBox.style.display = 'block';

    // Color pastel basado en el nombre del fármaco destino
    const getPastel = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 80%, 94%)`;
    };
    header.style.background = getPastel(fDestNom);

    header.innerHTML = `
        <div style="font-size:0.7rem; font-weight:800; color:rgba(0,0,0,0.4); text-transform:uppercase; margin-bottom:4px;">Dosis Objetivo Estimada</div>
        <div style="font-size:2.8rem; font-weight:900; color:var(--text-main); line-height:1;">${Maudsley.toFixed(1)} <span style="font-size:1.2rem;">mg/día</span></div>
        <div style="margin-top:12px; display:inline-block; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; background:white; border:1px solid ${Maudsley > d.max ? '#b91c1c' : '#15803d'}; color:${Maudsley > d.max ? '#b91c1c' : '#15803d'}">
            ${Maudsley > d.max ? '⚠️ EXCEDE MÁXIMA' : '✅ RANGO TERAPÉUTICO'}
        </div>
    `;

    // Localizar en la matriz dbRaw
    const indexO = window.listaFarmacos.indexOf(fOrigNom);
    const indexD = window.listaFarmacos.indexOf(fDestNom);

    // Fila: idxRowStart(1) + posición. Columna: idxColStart(6) + posición
    const fila = window.idxRowStart + indexO;
    const col = window.idxColStart + indexD;

    const rawInstr = (window.dbRaw[fila] && window.dbRaw[fila][col]) ? window.dbRaw[fila][col].toString() : "";

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">Estrategia Sugerida</h4>
        ${fOrigNom === fDestNom ? '<div class="step-txt">No es necesario realizar un switch entre el mismo fármaco.</div>' : window.traducirPasos(rawInstr, dosis, Maudsley)}
    `;
};
