// --- 1. ESTILOS ESPECÍFICOS DE LA CALCULADORA ---
// Los inyectamos dinámicamente para limpiar el index.html
const estilosCalculadora = `
    <style>
        .calc-ui { padding: 2.5rem; }
        .calc-ui label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
        .calc-ui select, .calc-ui input { 
            width: 100%; padding: 1rem; border-radius: 15px; border: 1px solid var(--border); 
            background: var(--bg); color: var(--text-main); font-size: 1rem; margin-bottom: 1.5rem; font-family: inherit; 
        }
        .res-container { border-radius: 20px; padding: 1.5rem; margin-top: 1rem; display: none; transition: 0.3s; }
        .calc-loader { text-align: center; padding: 3rem; opacity: 0.6; }
    </style>
`;

// --- 2. MATRIZ DE PROTOCOLOS (Lógica de cambio) ---
const MATRIZ_INTEGRATE = {
    "AMISULPRIDA-ARIPIPRAZOL": "Solapamiento 14d: Iniciar Aripiprazol Día 1. Mantener Amisulprida total 7 días. 50% el Día 8. Stop Día 14.",
    "RISPERIDONA-PALIPERIDONA": "Cambio Directo: Stop origen e iniciar dosis equivalente el Día 1.",
    "DESTINO-CARIPRAZINA": "Cambio Lento (4 sem): Iniciar 1.5 mg. Mantener origen total 21 días. Reducir origen al 50% día 22. Stop día 29.",
    "DESTINO-BREXPIPRAZOL": "Solapamiento 12d: Día 1: 1 mg, Día 2: 2 mg. Reducir origen al 50% y suspender el Día 12.",
    "ORIGEN-ARIPIPRAZOL": "Elección: A) Stop Día 1 o B) Reducir al 50% el Día 1 y Stop el Día 14.",
    "ORIGEN-QUETIAPINA": "Si dosis > 300 mg: IR: Reducir 25% cada 4 días (Stop día 13). MR: Reducir 50% 1 semana (Stop día 8).",
    "ORIGEN-AGONISTA_PARCIAL": "Stop & Start: Suspender origen el Día 1. Iniciar destino el Día 1 (titulando según fármaco)."
};

// --- 3. FUNCIÓN PRINCIPAL DE ENTRADA ---
async function iniciarInterfazCalculadora() {
    const container = document.getElementById('modalData');
    
    // Mostramos estado de carga
    container.innerHTML = estilosCalculadora + `<div class="calc-loader"><i class="fas fa-circle-notch fa-spin fa-2x"></i><p>Cargando datos de fármacos...</p></div>`;

    // Cargamos datos si no están ya en memoria (Usa las variables globales de index.html)
    if (!window.dbCalc) {
        try {
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Data_APS!A2:F100?key=${API_KEY}`);
            const data = await response.json();
            if (data.values) {
                window.dbCalc = data.values.map(row => ({
                    farmaco: row[0],
                    factor: parseFloat(row[1]),
                    ed95: parseFloat(row[2]),
                    max: parseFloat(row[3]),
                    min: parseFloat(row[4]),
                    umbral: parseFloat(row[5])
                }));
            }
        } catch (e) {
            container.innerHTML = `<div class="calc-ui">Error al conectar con la base de datos de fármacos.</div>`;
            return;
        }
    }

    // Una vez tenemos los datos, renderizamos la UI
    renderizarCalculadora(container);
}

// --- 4. RENDERIZADO DE LA INTERFAZ ---
function renderizarCalculadora(container) {
    const options = window.dbCalc.map(f => `<option value="${f.farmaco}">${f.farmaco}</option>`).join('');
    
    container.innerHTML = estilosCalculadora + `
        <div class="calc-ui">
            <h2 style="margin-bottom:1.5rem;"><i class="fas fa-calculator"></i> Calculadora APS</h2>
            
            <label>Fármaco Origen</label>
            <select id="f_orig">${options}</select>
            
            <label>Dosis Actual (mg/día)</label>
            <input type="number" id="d_orig" placeholder="0.00" inputmode="decimal">
            
            <label>Fármaco Destino</label>
            <select id="f_dest">${options}</select>
            
            <button class="btn btn-primary" style="width:100%;" onclick="ejecutarCalculo()">CALCULAR</button>
            
            <div id="res-box" class="res-container">
                <div id="res-val"></div>
                <div id="res-tip"></div>
            </div>
            
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2rem; line-height: 1.3; font-style: italic;">
                Basado en Taylor (Maudsley), Leucht et al. e INTEGRATE. Juicio clínico indispensable.
            </p>
        </div>`;
}

// --- 5. LÓGICA DE CÁLCULO ---
window.ejecutarCalculo = function() {
    const fOrigName = document.getElementById('f_orig').value;
    const fDestName = document.getElementById('f_dest').value;
    const dosisO = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === fOrigName);
    const d = window.dbCalc.find(f => f.farmaco === fDestName);
    
    if (!dosisO || isNaN(dosisO)) { alert("Introduce una dosis válida."); return; }

    let Maudsley = (dosisO / o.factor) * d.factor;
    let porcentajeRango = (dosisO / o.max) * 100;
    let dosisRango = (porcentajeRango / 100) * d.max;
    
    let bgColor, textColor, alertText;
    if (Maudsley > d.max) { bgColor = '#fee2e2'; textColor = "#b91c1c"; alertText = "⚠️ EXCEDE DOSIS MÁXIMA"; }
    else if (Maudsley > d.ed95) { bgColor = '#fef3c7'; textColor = "#b45309"; alertText = "⚠️ SUPERIOR A ED95"; }
    else if (Maudsley < d.min) { bgColor = '#f1f5f9'; textColor = "#475569"; alertText = "🔍 BAJO MÍNIMO EFECTIVO"; }
    else { bgColor = '#dcfce7'; textColor = "#15803d"; alertText = "✅ RANGO ESTÁNDAR"; }

    const resBox = document.getElementById('res-box');
    resBox.style.display = 'block';
    resBox.style.background = bgColor;

    document.getElementById('res-val').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">Dosis de prescripción (Maudsley)</div>
            <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; color: var(--text-main);">${Maudsley.toFixed(1)} <span style="font-size: 1.2rem;">mg</span></div>
            <div style="display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; background: white; color: ${textColor}; border: 1px solid ${textColor};">${alertText}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 10px 0;">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Equivalencia en rango (${porcentajeRango.toFixed(0)}%)</div>
            <div style="font-size: 1.1rem; font-weight: 800; opacity: 0.8;">${dosisRango.toFixed(1)} mg</div>
        </div>`;

    // Lógica INTEGRATE mejorada
    let tip = "";
    const oName = o.farmaco.toUpperCase(), dName = d.farmaco.toUpperCase(), parClave = `${oName}-${dName}`;

    if (MATRIZ_INTEGRATE[parClave]) tip = MATRIZ_INTEGRATE[parClave];
    else if (dName === "CARIPRAZINA") tip = MATRIZ_INTEGRATE["DESTINO-CARIPRAZINA"];
    else if (dName === "BREXPIPRAZOL") tip = MATRIZ_INTEGRATE["DESTINO-BREXPIPRAZOL"];
    else if (oName === "ARIPIPRAZOL") tip = MATRIZ_INTEGRATE["ORIGEN-ARIPIPRAZOL"];
    else if (oName === "QUETIAPINA") tip = MATRIZ_INTEGRATE["ORIGEN-QUETIAPINA"];
    else if (dosisO <= o.umbral) tip = "Dosis baja: Se recomienda cambio directo (Stop/Start) el Día 1.";
    else tip = `Reducción gradual: Reducir ${o.farmaco} al 50% el Día 1 y suspender tras 7 días de solapamiento.`;

    document.getElementById('res-tip').innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px; font-size: 0.9rem;">
            <b style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 5px;">Estrategia de Cambio</b>
            ${tip}
        </div>`;
};
