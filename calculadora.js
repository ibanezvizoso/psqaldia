/**
 * CALCULADORA APS (Antipsychotic Switch)
 * Versión: "Zero Errors" - Mapeo por Nombre
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

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
            }
            .btn-ejecutar { 
                margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; 
                border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1rem;
            }
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
                font-weight: 900; font-size: 0.8rem; z-index: 1;
            }
            .step-body { flex: 1; padding-top: 4px; }
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
        `;
        document.head.appendChild(styleTag);
    }

    if (!window.dbCalc) {
        try {
            const pestaña = "Data_APS";
            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await response.json();
            
            if (data.values) {
                window.dbRaw = data.values;
                window.dbCalc = [];
                window.listaFarmacos = [];
                
                // Mapeo exhaustivo desde la Fila 2 (índice 1)
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    if (!row || !row[0]) continue;
                    
                    const nombre = row[0].toString().trim();
                    // Evitamos meter la palabra "Farmaco" si por error está en A2
                    if (nombre !== "" && nombre.toLowerCase() !== "farmaco") {
                        window.listaFarmacos.push(nombre);
                        window.dbCalc.push({
                            nombre: nombre,
                            filaOriginal: i, // Guardamos su fila real en el Excel
                            factor: parseFloat(row[1]) || 1,
                            max: parseFloat(row[3]) || 0
                        });
                    }
                }
            }
        } catch (e) {
            container.innerHTML = `<div style="padding:2rem;">Error: ${e.message}</div>`;
            return;
        }
    }

    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    container.innerHTML = `
        <div class="calc-ui">
            <h2><i class="fas fa-random"></i> APS Switch Manager</h2>
            <label>Fármaco Origen (Columna A)</label>
            <select id="f_orig">${options}</select>
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00">
            <label>Fármaco Destino (Fila 1)</label>
            <select id="f_dest">${options}</select>
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">CALCULAR ESTRATEGIA</button>
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
};

window.ejecutarCalculo = function() {
    const fOrigNom = document.getElementById('f_orig').value;
    const fDestNom = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const objOrig = window.dbCalc.find(f => f.nombre === fOrigNom);
    const objDest = window.dbCalc.find(f => f.nombre === fDestNom);
    
    if (isNaN(dosis) || !objOrig || !objDest) {
        alert("Datos incompletos."); return;
    }

    // 1. CÁLCULO DE DOSIS
    const Maudsley = (dosis / objOrig.factor) * objDest.factor;
    
    document.getElementById('res-box').style.display = 'block';
    const header = document.getElementById('res-header');
    header.style.background = `hsl(${(fDestNom.length * 40) % 360}, 80%, 94%)`;
    header.innerHTML = `
        <div style="font-size:0.7rem; font-weight:800; opacity:0.6; text-transform:uppercase;">Dosis Objetivo</div>
        <div style="font-size:2.5rem; font-weight:900;">${Maudsley.toFixed(1)} <span style="font-size:1rem;">mg/día</span></div>
    `;

    // 2. BUSQUEDA DINÁMICA EN LA MATRIZ (Para evitar desplazamientos)
    // Buscamos en qué columna de la Fila 1 está el nombre del fármaco destino
    const cabecera = window.dbRaw[0]; 
    let colDestino = -1;
    for(let c=0; c < cabecera.length; c++) {
        if(cabecera[c] && cabecera[c].toString().trim() === fDestNom) {
            colDestino = c;
            break;
        }
    }

    // Si no lo encuentra por nombre en la cabecera, usamos el fallback G=6 + index
    if (colDestino === -1) {
        colDestino = 6 + window.listaFarmacos.indexOf(fDestNom);
    }

    const filaOrigen = objOrig.filaOriginal;
    const rawInstr = (window.dbRaw[filaOrigen] && window.dbRaw[filaOrigen][colDestino]) 
                     ? window.dbRaw[filaOrigen][colDestino].toString() 
                     : "";

    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin-bottom:1rem; font-size:0.7rem; color:var(--text-muted);">ESTRATEGIA</h4>
        ${fOrigNom === fDestNom ? 'Mismo fármaco.' : window.traducirPasos(rawInstr, dosis, Maudsley)}
    `;
};

window.traducirPasos = function(rawStr, dOrig, targetMg) {
    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") return "No hay pauta definida.";
    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';
    bloques.forEach(bloque => {
        let texto = bloque;
        if (texto.startsWith("IF_ACTUAL_")) {
            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);
            if (m) {
                const op = m[1], corte = parseFloat(m[2]), resto = m[3];
                const cumple = eval(`${dOrig} ${op === '=' ? '==' : op} ${corte}`);
                if (!cumple) return; 
                texto = resto.trim();
            }
        }
        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;
        const dia = p[0].replace('D', 'Día ');
        const sujeto = p[1];
        const accion = p[2];
        const valor = p[3] || "";
        let desc = '';
        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = 'Suspender origen.';
            else if (accion === 'REDUCIR') desc = `Reducir a <b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b> (${valor}).`;
            else desc = `${accion} ${valor}`;
        } else {
            if (valor.includes('TARGET')) {
                const pct = valor.includes('%') ? parseFloat(valor) : 100;
                desc = `Nuevo a <b>${(targetMg * pct / 100).toFixed(1)} mg</b>.`;
            } else { desc = `Iniciar nuevo a ${valor}.`; }
        }
        html += `<div class="pauta-step">
            <div class="step-idx">${dia.replace('Día ', '')}</div>
            <div class="step-body">
                <span class="tag-farm ${sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig'}">${sujeto}</span>
                <div class="step-txt">${desc}</div>
            </div>
        </div>`;
    });
    return html;
};
