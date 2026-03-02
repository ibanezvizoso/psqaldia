// --- CARGA DE DATOS Y ESTILOS ---
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-family: inherit; }
            .calc-ui h2 { margin: 0 0 1.5rem 0; font-weight: 800; }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); }
        `;
        document.head.appendChild(styleTag);
    }
    
    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                window.dbRaw = data.values; 
                // Cargamos fármacos de la columna A (filas 2 a 12)
                window.dbCalc = data.values.slice(1, 12).map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]) || 1,
                    ed95: parseFloat(row[2]) || 0,
                    max: parseFloat(row[3]) || 0,
                    min: parseFloat(row[4]) || 0,
                    umbral: parseFloat(row[5]) || 0
                })).filter(f => f.farmaco);
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-calculator"></i> Calculadora APS</h2>
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            <button class="btn btn-primary" style="width:100%; margin-top:1.2rem;" onclick="ejecutarCalculo()">CALCULAR</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// --- MOTOR DE TRADUCCIÓN (LO QUE ME PEDISTE) ---
window.traducirInstrucciones = function(rawString, dOrig, nombreDestino, targetMg) {
    if (!rawString || rawString.trim() === "" || rawString === "undefined") 
        return `<div style="opacity:0.5; padding:10px;">Sin pauta automática definida.</div>`;

    let instruccion = rawString;

    // 1. Manejo del IF_ACTUAL (Soporta <, >, <=, >=)
    if (instruccion.includes("IF_ACTUAL_")) {
        const regex = /IF_ACTUAL_([<>]=?)(\d+)(?:mg)?:/;
        const match = instruccion.match(regex);
        if (match) {
            const operador = match[1];
            const valorCorte = parseFloat(match[2]);
            let cumple = false;
            if (operador === '<') cumple = dOrig < valorCorte;
            else if (operador === '>') cumple = dOrig > valorCorte;
            else if (operador === '<=') cumple = dOrig <= valorCorte;
            else if (operador === '>=') cumple = dOrig >= valorCorte;
            
            if (cumple) {
                // Tomamos solo la parte de la pauta después de los primeros ":"
                instruccion = instruccion.substring(instruccion.indexOf(':') + 1);
            } else {
                return `<div style="padding:10px; opacity:0.7; font-style:italic;">Dosis fuera de rango para pauta automática. Ajustar según criterio clínico.</div>`;
            }
        }
    }

    const pasos = instruccion.split('|').map(p => p.trim()).filter(Boolean);
    const timeline = {};
    let objetivoAlcanzado = false;

    pasos.forEach(p => {
        const partes = p.split(':');
        if (partes.length < 3) return;

        const diaNum = partes[0].replace('D', '').trim();
        const sujeto = partes[1]; 
        const accion = partes[2]; 
        const valorRaw = partes[3] || "";

        if (!timeline[diaNum]) timeline[diaNum] = { ACTUAL: [], NUEVO: [] };

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") timeline[diaNum].ACTUAL.push("Suspender completamente");
            else if (accion === "REDUCIR") timeline[diaNum].ACTUAL.push(`Reducir al ${valorRaw}`);
            else if (accion === "MANTENER") timeline[diaNum].ACTUAL.push("Mantener dosis");
        } 
        else if (sujeto === "NUEVO" && !objetivoAlcanzado) {
            if (accion === "INICIAR" || accion === "SUBIR") {
                const mgPaso = parseFloat(valorRaw.replace(/[^0-9.]/g, ''));
                
                // REGLA DEL TECHO: Comparar con targetMg
                if (valorRaw === "TARGET" || (!isNaN(mgPaso) && mgPaso >= targetMg)) {
                    timeline[diaNum].NUEVO.push(`Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>`);
                    objetivoAlcanzado = true; 
                } else {
                    timeline[diaNum].NUEVO.push(`${accion === "INICIAR" ? "Iniciar" : "Subir"} a ${valorRaw}`);
                }
            }
            else if (accion === "TITULAR_PROGRESIVO") {
                timeline[diaNum].NUEVO.push(`Desde este día, titular hasta <b>${targetMg.toFixed(1)} mg</b>`);
                objetivoAlcanzado = true;
            }
        }
    });

    let html = `<div style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">`;
    Object.keys(timeline).sort((a,b) => parseInt(a)-parseInt(b)).forEach(d => {
        html += `
            <div style="background:white; border-radius:16px; padding:15px; border:1px solid rgba(0,0,0,0.08); box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                <div style="font-size:0.7rem; font-weight:900; color:var(--primary); text-transform:uppercase; margin-bottom:10px;">Día ${d}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div style="background:#fff1f2; padding:10px; border-radius:10px; border:1px solid #fecdd3;">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.4; text-transform:uppercase; margin-bottom:4px;">Origen</div>
                        ${timeline[d].ACTUAL.length ? timeline[d].ACTUAL.map(t=>`<div style="font-weight:600; font-size:0.85rem;">${t}</div>`).join('') : '<div style="opacity:0.2">—</div>'}
                    </div>
                    <div style="background:#f0fdf4; padding:10px; border-radius:10px; border:1px solid #bbf7d0;">
                        <div style="font-size:0.6rem; font-weight:800; opacity:0.4; text-transform:uppercase; margin-bottom:4px;">${nombreDestino}</div>
                        ${timeline[d].NUEVO.length ? timeline[d].NUEVO.map(t=>`<div style="font-weight:600; font-size:0.85rem;">${t}</div>`).join('') : '<div style="opacity:0.2">—</div>'}
                    </div>
                </div>
            </div>`;
    });
    return html + `</div>`;
}

// --- FUNCIÓN DE CÁLCULO ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) {
        alert("Introduce una dosis válida.");
        return;
    }

    const Maudsley = (dosisO / o.factor) * d.factor;
    const porcentajeRango = (dosisO / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;
    
    let color = Maudsley > d.max ? "#b91c1c" : (Maudsley > d.ed95 ? "#b45309" : "#15803d");
    let bg = Maudsley > d.max ? "#fee2e2" : (Maudsley > d.ed95 ? "#fef3c7" : "#dcfce7");
    let txt = Maudsley > d.max ? "⚠️ EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "⚠️ SUPERIOR ED95" : "✅ RANGO ESTÁNDAR");

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;
    
    document.getElementById('res-val').innerHTML = `
        <div style="background:rgba(255,255,255,0.6); padding:1rem; border-radius:1rem; text-align:center; border:1px solid rgba(0,0,0,0.05);">
            <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--text-muted);">Dosis de prescripción</div>
            <div style="font-size:2.2rem; font-weight:900;">${Maudsley.toFixed(1)} <span style="font-size:1rem;">mg/d</span></div>
            <div style="font-size:0.7rem; font-weight:800; color:${color}; border:1px solid ${color}; display:inline-block; padding:2px 10px; border-radius:20px; margin-top:5px;">${txt}</div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px; padding:0 5px; opacity:0.8; font-size:0.8rem;">
            <span>Equivalencia en Rango (${porcentajeRango.toFixed(0)}%)</span>
            <b>${dosisRango.toFixed(1)} mg</b>
        </div>
    `;

    // LOCALIZACIÓN SEGÚN TU EXCEL:
    const rowIndex = window.dbRaw.findIndex(row => row[0] === fOrigName);
    // Buscamos el destino en la FILA 13 (Índice 12)
    const colIndex = window.dbRaw[12].findIndex(cell => cell && cell.toString().trim().toLowerCase() === fDestName.toLowerCase());

    const rawStr = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top:20px; border-top:1px solid rgba(0,0,0,0.1); padding-top:15px;">
            <span style="font-size:0.75rem; font-weight:900; text-transform:uppercase; opacity:0.5; display:block; margin-bottom:10px;">Estrategia de Cambio</span>
            ${window.traducirInstrucciones(rawStr, dosisO, fDestName, Maudsley)}
        </div>
    `;
}
