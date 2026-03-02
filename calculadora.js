/**
 * CALCULADORA APS - VERSIÓN INTEGRAL 2026
 * - Búsqueda de Destino en Fila 13 (Índice 12)
 * - Búsqueda de Origen en Columna A
 * - Doble Cálculo: Maudsley + Equivalencia por Rango
 * - Motor de Traducción con Regla del Techo
 */

// 1. INICIALIZACIÓN Y CARGA (ESTILOS + HTML + DATA)
window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Inyección de Estilos (Diseño profesional y limpio)
    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-ui h2 { margin: 0 0 1rem 0; font-weight: 800; color: var(--text-main); }
            .calc-ui label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.8rem; display: block; }
            .calc-ui select, .calc-ui input { 
                width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); 
                background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; transition: all 0.2s;
            }
            .calc-ui select:focus, .calc-ui input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1); }
            .res-container { padding: 1.5rem; border-radius: 1.5rem; margin-top: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.3s ease; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(styleTag);
    }
    
    // Carga de Datos desde el Worker
    if (!window.dbCalc) {
        try {
            container.innerHTML = `<div style="padding:2rem; opacity:0.6;">Cargando base de datos...</div>`;
            const pestaña = "Data_APS"; 
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();

            if (data.error) throw new Error(data.details || data.error);

            window.dbRaw = data.values; // Guardamos TODO el Excel bruto
            // Filtramos la lista de fármacos para los Selects (Column A, Filas 2 a 12)
            window.dbCalc = data.values.slice(1, 12).map(row => ({
                farmaco: row[0] ? row[0].toString().trim() : "",
                factor: parseFloat(row[1]) || 1,
                ed95: parseFloat(row[2]) || 0,
                max: parseFloat(row[3]) || 0,
                min: parseFloat(row[4]) || 0,
                umbral: parseFloat(row[5]) || 0
            })).filter(f => f.farmaco !== "");

        } catch (e) {
            container.innerHTML = `<div style="padding:2.5rem; color:red;">Error de conexión: ${e.message}</div>`;
            return;
        }
    }

    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-exchange-alt"></i> Cambio de APS</h2>
            <label>Fármaco Actual (Origen)</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="Ej: 15">
            <label>Fármaco Nuevo (Destino)</label>
            <select id="f_dest">${options}</select>
            <button class="btn btn-primary" style="width:100%; margin-top:1.5rem; font-weight:800;" onclick="ejecutarCalculo()">GENERAR PLAN DE CAMBIO</button>
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
        </div>`;
}

// 2. MOTOR DE TRADUCCIÓN DE INSTRUCCIONES
window.traducirInstrucciones = function(rawString, dActualOrig, nombreDestino, targetMg) {
    if (!rawString || rawString.trim() === "" || rawString === "undefined") 
        return `<div style="opacity:0.5; padding:10px;">No se ha definido una pauta automática para este cruce en el Excel.</div>`;

    let instruccion = rawString.trim();

    // Lógica IF_ACTUAL (Maneja los umbrales de seguridad)
    if (instruccion.includes("IF_ACTUAL_")) {
        const regex = /IF_ACTUAL_([<>]=?)(\d+):/;
        const match = instruccion.match(regex);
        if (match) {
            const op = match[1];
            const corte = parseFloat(match[2]);
            const cumple = (op === '<' && dActualOrig < corte) || 
                           (op === '>' && dActualOrig > corte) || 
                           (op === '<=' && dActualOrig <= corte) || 
                           (op === '>=' && dActualOrig >= corte);
            
            if (cumple) {
                instruccion = instruccion.substring(instruccion.indexOf(':') + 1);
            } else {
                return `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:12px; font-size:0.85rem; border-left:4px solid var(--text-muted);">
                    <b>Nota:</b> La dosis actual no coincide con la pauta de switch automática definida. Se requiere ajuste manual.
                </div>`;
            }
        }
    }

    const pasos = instruccion.split('|').map(p => p.trim()).filter(Boolean);
    const timeline = {};
    let techoAlcanzado = false;

    pasos.forEach(p => {
        const partes = p.split(':');
        if (partes.length < 3) return;

        const dia = partes[0].replace('D', '').trim();
        const sujeto = partes[1].trim(); 
        const accion = partes[2].trim(); 
        const valRaw = partes[3] ? partes[3].trim() : "";

        if (!timeline[dia]) timeline[dia] = { ACTUAL: [], NUEVO: [] };

        if (sujeto === "ACTUAL") {
            if (accion === "STOP") timeline[dia].ACTUAL.push("Suspender completamente");
            else if (accion === "REDUCIR") timeline[dia].ACTUAL.push(`Reducir al ${valRaw}`);
            else if (accion === "MANTENER") timeline[dia].ACTUAL.push("Mantener dosis");
        } 
        else if (sujeto === "NUEVO" && !techoAlcanzado) {
            if (accion === "INICIAR" || accion === "SUBIR") {
                const mgPaso = parseFloat(valRaw.replace(/[^0-9.]/g, ''));
                if (valRaw === "TARGET" || (!isNaN(mgPaso) && mgPaso >= targetMg)) {
                    timeline[dia].NUEVO.push(`Alcanzar dosis objetivo: <b>${targetMg.toFixed(1)} mg</b>`);
                    techoAlcanzado = true; 
                } else {
                    timeline[dia].NUEVO.push(`${accion === "INICIAR" ? "Iniciar" : "Subir"} a ${valRaw}`);
                }
            }
            else if (accion === "TITULAR_PROGRESIVO") {
                timeline[dia].NUEVO.push(`Desde este día, titular hasta <b>${targetMg.toFixed(1)} mg</b>`);
                techoAlcanzado = true;
            }
        }
    });

    // Render de Pasos en Tarjetas
    let html = `<div style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">`;
    Object.keys(timeline).sort((a,b) => parseInt(a)-parseInt(b)).forEach(d => {
        html += `
            <div style="background:white; border-radius:16px; padding:15px; border:1px solid rgba(0,0,0,0.08); box-shadow:0 2px 5px rgba(0,0,0,0.02);">
                <div style="font-size:0.7rem; font-weight:900; color:var(--primary); text-transform:uppercase; margin-bottom:10px;">Día ${d}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div style="background:#fff1f2; padding:12px; border-radius:12px; border:1px solid #fecdd3;">
                        <div style="font-size:0.55rem; font-weight:800; opacity:0.5; text-transform:uppercase; margin-bottom:5px;">Origen</div>
                        ${timeline[d].ACTUAL.length ? timeline[d].ACTUAL.map(t=>`<div style="font-weight:700; font-size:0.85rem;">${t}</div>`).join('') : '—'}
                    </div>
                    <div style="background:#f0fdf4; padding:12px; border-radius:12px; border:1px solid #bbf7d0;">
                        <div style="font-size:0.55rem; font-weight:800; opacity:0.5; text-transform:uppercase; margin-bottom:5px;">${nombreDestino}</div>
                        ${timeline[d].NUEVO.length ? timeline[d].NUEVO.map(t=>`<div style="font-weight:700; font-size:0.85rem;">${t}</div>`).join('') : '—'}
                    </div>
                </div>
            </div>`;
    });
    return html + `</div>`;
}

// 3. FUNCIÓN DE CÁLCULO Y LOCALIZACIÓN DE CELDAS
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO) || !o || !d) return alert("Introduce una dosis válida");

    // A. Cálculo Maudsley
    const Maudsley = (dosisO / o.factor) * d.factor;
    // B. Cálculo por Rango
    const porcentajeRango = (dosisO / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;
    
    // Alertas de seguridad visual
    let color = Maudsley > d.max ? "#b91c1c" : (Maudsley > d.ed95 ? "#b45309" : "#15803d");
    let bg = Maudsley > d.max ? "#fee2e2" : (Maudsley > d.ed95 ? "#fef3c7" : "#dcfce7");
    let status = Maudsley > d.max ? "EXCEDE MÁXIMA" : (Maudsley > d.ed95 ? "SUPERIOR ED95" : "RANGO ESTÁNDAR");

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bg;
    
    document.getElementById('res-val').innerHTML = `
        <div style="background:rgba(255,255,255,0.7); padding:1.2rem; border-radius:1.2rem; text-align:center; border:1px solid rgba(0,0,0,0.05);">
            <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Dosis Recomendada (Maudsley)</div>
            <div style="font-size:2.5rem; font-weight:900; line-height:1; margin:8px 0;">${Maudsley.toFixed(1)} <span style="font-size:1.1rem; font-weight:600;">mg/d</span></div>
            <div style="font-size:0.7rem; font-weight:900; color:white; background:${color}; display:inline-block; padding:3px 12px; border-radius:50px;">${status}</div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:12px; padding:0 8px; opacity:0.8; font-size:0.85rem; font-weight:600;">
            <span>Equivalencia por Rango (${porcentajeRango.toFixed(0)}%)</span>
            <span>${dosisRango.toFixed(1)} mg/d</span>
        </div>
    `;

    // LOCALIZACIÓN DE INSTRUCCIONES EN EL EXCEL
    // Buscamos fila de origen en Columna A
    const rowIndex = window.dbRaw.findIndex(row => row[0] && row[0].toString().trim().toLowerCase() === fOrigName.toLowerCase());
    // Buscamos columna de destino en Fila 13 (Índice 12)
    const filaCabecera = window.dbRaw[12] || [];
    const colIndex = filaCabecera.findIndex(cell => cell && cell.toString().trim().toLowerCase() === fDestName.toLowerCase());

    const rawStr = (rowIndex > -1 && colIndex > -1) ? window.dbRaw[rowIndex][colIndex] : "";
    
    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top:20px; border-top:1px solid rgba(0,0,0,0.1); padding-top:15px;">
            <span style="font-size:0.7rem; font-weight:900; text-transform:uppercase; opacity:0.4; display:block; margin-bottom:10px; letter-spacing:1px;">Plan de transición</span>
            ${window.traducirInstrucciones(rawStr, dosisO, fDestName, Maudsley)}
        </div>
    `;
}
