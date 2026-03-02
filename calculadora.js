 /**

 * CALCULADORA APS (Antipsychotic Switch)

 * Versión: Definitiva - Coordenadas G=6

 */



window.iniciarInterfazCalculadora = async function() {

    const container = document.getElementById('modalData');



    // 1. INYECCIÓN DE ESTILOS (Estética Timeline + Colores Pastel)

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



            /* Estética de la Pauta (Timeline) */

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



    // Función para colores pastel aleatorios (Memoria: [2026-02-02])

    const getPastelColor = (cat) => {

        let hash = 0;

        const str = cat || "G";

        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);

        return `hsl(${Math.abs(hash) % 360}, 75%, 92%)`;

    };



    // 2. CARGA DE DATOS

    if (!window.dbCalc) {

        try {

            const pestaña = "Data_APS";

            const response = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);

            const data = await response.json();

            if (data.values) {

                window.dbRaw = data.values;

                

                // --- AJUSTE DE ÍNDICES ---

                // Fila 1 (A2) es Haloperidol

                // Columna 6 (G) es el inicio de la matriz

                window.idxRowStart = 1; 

                window.idxColStart = 6; 



                // Extraer lista de fármacos y sus parámetros

                window.dbCalc = [];

                window.listaFarmacos = [];

                

                // Recorremos desde la fila 2 (índice 1) para capturar desde Haloperidol

                for (let i = window.idxRowStart; i < data.values.length; i++) {

                    const row = data.values[i];

                    if (row && row[0] && row[0].toString().trim() !== "" && row[0] !== "Farmaco") {

                        const nombre = row[0].toString().trim();

                        window.listaFarmacos.push(nombre);

                        window.dbCalc.push({

                            farmaco: nombre,

                            factor: parseFloat(row[1]) || 1,

                            ed95: parseFloat(row[2]) || 0,

                            max: parseFloat(row[3]) || 0,

                            categoria: row[11] || "Antipsicótico" // Columna L si existe

                        });

                    }

                }

            }

        } catch (e) {

            container.innerHTML = `<div style="padding:2rem;">Error: ${e.message}</div>`;

            return;

        }

    }



    // 3. RENDERIZADO INTERFAZ

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

}



// --- 4. FUNCIÓN TRADUCTORA DE PASOS ---

window.traducirPasos = function(rawStr, dOrig, targetMg) {

    if (!rawStr || rawStr.trim() === "" || rawStr === "NaN") {

        return `<div style="color:var(--text-muted); font-style:italic;">No se han definido pasos específicos para este cruce. Se recomienda switch cruzado conservador.</div>`;

    }



    const bloques = rawStr.split('|').map(b => b.trim()).filter(Boolean);

    let html = '';



    bloques.forEach(bloque => {

        let texto = bloque;

        

        // Manejo de lógica condicional (IF_ACTUAL)

        if (texto.startsWith("IF_ACTUAL_")) {

            const m = texto.match(/IF_ACTUAL_([<>]=?)([\d.]+)(?:mg)?:(.*)/);

            if (m) {

                const op = m[1], corte = parseFloat(m[2]), resto = m[3];

                const cumple = (op === '<' && dOrig < corte) || (op === '>' && dOrig > corte) || 

                               (op === '<=' && dOrig <= corte) || (op === '>=' && dOrig >= corte);

                if (!cumple) return; // Si no cumple la dosis actual, saltamos este paso

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

            else if (accion === 'REDUCIR') desc = `Reducir fármaco de origen al ${valor} (<b>${(dOrig * parseFloat(valor) / 100).toFixed(1)} mg</b>).`;

            else desc = `${accion} ${valor}`;

        } else {

            // Lógica para el fármaco NUEVO

            if (accion === 'TITULAR_PROGRESIVO' || valor === 'TARGET' || (valor.includes('TARGET') && !valor.includes('%'))) {

                desc = `Alcanzar dosis objetivo de <b>${targetMg.toFixed(1)} mg</b>.`;

            } else if (valor.includes('%_TARGET')) {

                const pct = parseFloat(valor);

                desc = `Iniciar fármaco nuevo al ${pct}% de la dosis objetivo (<b>${(targetMg * pct / 100).toFixed(1)} mg</b>).`;

            } else {

                desc = `Iniciar/Ajustar fármaco nuevo a <b>${valor}</b>.`;

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

}



// --- 5. LÓGICA DE CÁLCULO Y MATRIZ ---

window.ejecutarCalculo = function() {

    const fOrig = document.getElementById('f_orig').value;

    const fDest = document.getElementById('f_dest').value;

    const dosis = parseFloat(document.getElementById('d_orig').value);

    

    const o = window.dbCalc.find(f => f.farmaco === fOrig);

    const d = window.dbCalc.find(f => f.farmaco === fDest);

    

    if (!dosis || isNaN(dosis) || !o || !d) {

        alert("Por favor, introduce una dosis válida.");

        return;

    }



    // Cálculo Maudsley

    const Maudsley = (dosis / o.factor) * d.factor;

    

    const resBox = document.getElementById('res-box');

    const header = document.getElementById('res-header');

    resBox.style.display = 'block';



    // Aplicar color pastel según categoría

    const pastel = (cat) => {

        let hash = 0;

        for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);

        return `hsl(${Math.abs(hash) % 360}, 80%, 94%)`;

    };

    header.style.background = pastel(d.categoria);



    header.innerHTML = `

        <div style="font-size:0.7rem; font-weight:800; color:rgba(0,0,0,0.4); text-transform:uppercase; margin-bottom:4px;">Dosis Objetivo Estimada</div>

        <div style="font-size:2.8rem; font-weight:900; color:var(--text-main); line-height:1;">${Maudsley.toFixed(1)} <span style="font-size:1.2rem;">mg/día</span></div>

        <div style="margin-top:12px; display:inline-block; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; background:white; border:1px solid ${Maudsley > d.max ? '#b91c1c' : '#15803d'}; color:${Maudsley > d.max ? '#b91c1c' : '#15803d'}">

            ${Maudsley > d.max ? '⚠️ EXCEDE MÁXIMA' : '✅ RANGO TERAPÉUTICO'}

        </div>

    `;



    // --- CRUCE DE MATRIZ (G=6) ---

    const indexO = window.listaFarmacos.indexOf(fOrig);

    const indexD = window.listaFarmacos.indexOf(fDest);



    // Fila: Haloperidol está en Fila 2 (índice 1). indexO=0 -> Fila 1. Correcto.

    const fila = window.idxRowStart + indexO;

    // Columna: G es índice 6. indexD=0 -> Col 6. Correcto.

    const col = window.idxColStart + indexD;



    const rawInstr = (window.dbRaw[fila] && window.dbRaw[fila][col]) ? window.dbRaw[fila][col] : "";



    document.getElementById('res-pauta').innerHTML = `

        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">Estrategia Sugerida</h4>

        ${window.traducirPasos(rawInstr, dosis, Maudsley)}

    `;

} 
