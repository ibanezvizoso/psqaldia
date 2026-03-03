// --- CONFIGURACIÓN VALIDADA ---
const CONFIG = {
    FILA_INICIO_FARMACOS: 0,      
    COL_INICIO_DESTINOS: 6        
};

// Estado global de idioma
window.currentLang = 'es';

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    if (!document.getElementById('calc-internal-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-internal-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
            .calc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .calc-ui h2 { margin: 0; font-weight: 800; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; }
            
            /* Selector de Idioma */
            .lang-toggle { display: flex; background: var(--border); border-radius: 0.8rem; padding: 2px; gap: 2px; }
            .lang-btn { padding: 4px 10px; border-radius: 0.6rem; border: none; cursor: pointer; font-size: 0.7rem; font-weight: 800; background: transparent; color: var(--text-muted); transition: all 0.2s; }
            .lang-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

            .calc-ui label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 0.6rem; display: block; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 0.9rem; border-radius: 1rem; border: 2px solid var(--border); background: var(--bg); color: var(--text-main); font-size: 1rem; outline: none; box-sizing: border-box; }
            .btn-ejecutar { margin-top: 1rem; padding: 1.1rem; background: var(--primary); color: white; border: none; border-radius: 1.2rem; cursor: pointer; font-weight: 900; font-size: 1.1rem; }
            
            .res-container { margin-top: 1.5rem; border-radius: 1.5rem; display: none; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; }
            .res-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.05); }
            .res-pauta { padding: 1.5rem; background: var(--bg); }
            
            .pauta-step { display: flex; gap: 1rem; margin-bottom: 1.2rem; position: relative; }
            .pauta-step:not(:last-child)::after { content: ''; position: absolute; left: 17px; top: 35px; bottom: -15px; width: 2px; background: var(--border); opacity: 0.5; }
            
            /* Formato D. 1 */
            .step-idx { min-width: 36px; height: 36px; background: white; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; z-index: 1; }
            
            .tag-farm { font-weight: 800; font-size: 0.65rem; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
            .tag-orig { background: #fee2e2; color: #b91c1c; }
            .tag-dest { background: #dcfce7; color: #15803d; }
            .step-txt { font-size: 0.95rem; line-height: 1.4; color: var(--text-main); }
            .btn-copiar { margin-top: 1rem; width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.5); border: 1px solid var(--border); border-radius: 1rem; cursor: pointer; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-main); transition: all 0.2s; }
            .btn-copiar:hover { background: white; border-color: var(--primary); }
        `;
        document.head.appendChild(styleTag);
    }

    if (!window.dbCalc) {
        try {
            const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
            const data = await response.json();
            window.dbRaw = data.values;
            window.listaFarmacos = [];
            for (let i = CONFIG.FILA_INICIO_FARMACOS; i < window.dbRaw.length; i++) {
                const nombre = window.dbRaw[i]?.[0];
                if (nombre && nombre.toString().trim() !== '') {
                    window.listaFarmacos.push(nombre.toString().trim());
                }
            }
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
        } catch (e) { console.error(e); }
    }

    renderInterfaz();
};

window.setLanguage = function(lang) {
    window.currentLang = lang;
    renderInterfaz();
    if (document.getElementById('res-box').style.display === 'block') {
        ejecutarCalculo(); // Refrescar cálculo con el nuevo idioma
    }
};

function renderInterfaz() {
    const isEs = window.currentLang === 'es';
    const container = document.getElementById('modalData');
    const options = window.listaFarmacos.map(f => `<option value="${f}">${f}</option>`).join('');
    
    container.innerHTML = `
        <div class="calc-ui">
            <div class="calc-header">
                <h2><i class="fas fa-random"></i> APS Switch</h2>
                <div class="lang-toggle">
                    <button class="lang-btn ${isEs ? 'active' : ''}" onclick="setLanguage('es')">ES</button>
                    <button class="lang-btn ${!isEs ? 'active' : ''}" onclick="setLanguage('en')">EN</button>
                </div>
            </div>
            <label>${isEs ? 'Fármaco Origen' : 'Origin Drug'}</label>
            <select id="f_orig">${options}</select>
            
            <label>${isEs ? 'Dosis Actual (mg/día)' : 'Current Dose (mg/day)'}</label>
            <input type="number" id="d_orig" step="any" value="10">
            
            <label>${isEs ? 'Fármaco Destino' : 'Target Drug'}</label>
            <select id="f_dest">${options}</select>
            
            <button class="btn-ejecutar" onclick="ejecutarCalculo()">
                ${isEs ? 'CALCULAR ESTRATEGIA' : 'CALCULATE STRATEGY'}
            </button>
            
            <div id="res-box" class="res-container">
                <div id="res-header" class="res-header"></div>
                <div id="res-pauta" class="res-pauta"></div>
            </div>
        </div>`;
}

// --- TRADUCTOR MULTI-IDIOMA ---
window.traducirPasos = function(raw, dosisActual, dosisObjetivo, nombreOrig, nombreDest, umbralDest) {
    const isEn = window.currentLang === 'en';
    
    const i18n = {
        es: {
            noData: "Sin pauta específica.",
            suspend: "Suspender",
            reduce: "Reducir a",
            startTarget: "Iniciar dosis objetivo de",
            startDirect: "Iniciar directamente con la dosis objetivo de",
            titrate: "Desde este día, titular progresivamente hasta alcanzar",
            reachTarget: "Alcanzar dosis objetivo de",
            start: "Iniciar",
            increase: "Subir",
            copy: "COPIAR PAUTA",
            copied: "¡COPIADO!",
            strategy: "Estrategia Sugerida"
        },
        en: {
            noData: "No specific instructions.",
            suspend: "Discontinue",
            reduce: "Reduce",
            startTarget: "Start target dose of",
            startDirect: "Start directly with the target dose of",
            titrate: "From this day, titrate progressively until reaching",
            reachTarget: "Reach target dose of",
            start: "Start",
            increase: "Increase",
            copy: "COPY STRATEGY",
            copied: "COPIED!",
            strategy: "Suggested Strategy"
        }
    };

    const t = isEn ? i18n.en : i18n.es;
    if (!raw || raw.trim() === '') return `<span style="color:var(--text-muted);">${t.noData}</span>`;
    
    const bloques = raw.split('|').map(b => b.trim()).filter(Boolean);
    let html = '';
    let objetivoAlcanzado = false;
    let nuevoIniciado = false; 

    bloques.forEach(bloque => {
        if (objetivoAlcanzado) return;

        let texto = bloque;
        if (texto.startsWith('IF_ACTUAL_')) {
            const match = texto.match(/IF_ACTUAL_([<>]=?)(\d+)mg?:(.*)/);
            if (match) {
                const cumple = eval(`${dosisActual} ${match[1] === '=' ? '==' : match[1]} ${match[2]}`);
                if (!cumple) return;
                texto = match[3];
            }
        }

        const p = texto.split(':').map(s => s.trim());
        if (p.length < 3) return;
        
        const diaNum = p[0].replace('D', '');
        const sujeto = p[1], accion = p[2], valor = p.slice(3).join(':');
        let desc = '';

        if (sujeto === 'ACTUAL') {
            if (accion === 'STOP') desc = `${t.suspend} ${nombreOrig}.`;
            else if (accion === 'REDUCIR') {
                const dosisCalc = (dosisActual * parseFloat(valor) / 100).toFixed(1);
                desc = isEn ? `${t.reduce} ${nombreOrig} to <b>${dosisCalc} mg</b>.` : `${t.reduce} ${nombreOrig} a <b>${dosisCalc} mg</b>.`;
            } else desc = `${accion} ${nombreOrig} ${valor}`;
        } else {
            const esDosisBaja = dosisObjetivo <= umbralDest;

            if (valor === 'TARGET' && accion !== 'TITULAR_PROGRESIVO') {
                desc = `${t.startTarget} <b>${dosisObjetivo.toFixed(1)} mg</b>.`;
                objetivoAlcanzado = true;
            } 
            else if (accion === 'TITULAR_PROGRESIVO') {
                desc = esDosisBaja ? `${t.startDirect} <b>${dosisObjetivo.toFixed(1)} mg</b>.` : `${t.titrate} <b>${dosisObjetivo.toFixed(1)} mg</b>.`;
                objetivoAlcanzado = true;
            } 
            else {
                const numExtraido = parseFloat(valor.replace(/[^0-9.]/g, ''));
                let dosisPaso = valor.includes('%') ? (dosisObjetivo * numExtraido / 100) : numExtraido;

                if (dosisPaso >= dosisObjetivo) {
                    desc = `${t.reachTarget} <b>${dosisObjetivo.toFixed(1)} mg</b>.`;
                    objetivoAlcanzado = true;
                } else {
                    const verbo = nuevoIniciado ? t.increase : t.start;
                    desc = isEn ? `${verbo} ${nombreDest} to <b>${dosisPaso.toFixed(1)} mg</b>.` : `${verbo} ${nombreDest} a <b>${dosisPaso.toFixed(1)} mg</b>.`;
                    nuevoIniciado = true;
                }
            }
        }

        const tagNombre = (sujeto === 'NUEVO' ? nombreDest : nombreOrig);
        const tagClase = (sujeto === 'NUEVO' ? 'tag-dest' : 'tag-orig');

        html += `
            <div class="pauta-step">
                <div class="step-idx">D. ${diaNum}</div>
                <div class="step-body">
                    <span class="tag-farm ${tagClase}">${tagNombre}</span>
                    <div class="step-txt">${desc}</div>
                </div>
            </div>`;
    });

    html += `<button class="btn-copiar" onclick="copiarEstrategia()"><i class="far fa-copy"></i> ${t.copy}</button>`;
    return html;
};

window.ejecutarCalculo = function() {
    const isEn = window.currentLang === 'en';
    const orig = document.getElementById('f_orig').value;
    const dest = document.getElementById('f_dest').value;
    const dosis = parseFloat(document.getElementById('d_orig').value);
    
    const o = window.dbCalc.find(f => f.farmaco === orig);
    const d = window.dbCalc.find(f => f.farmaco === dest);
    
    if (!o || !d || isNaN(dosis)) return;

    const equivalente = (dosis / o.factor) * d.factor;
    const porcentajeRango = (dosis / o.max) * 100;
    const dosisRango = (porcentajeRango / 100) * d.max;

    let bg, color, alerta;
    if (equivalente > d.max) { 
        bg = '#fee2e2'; color = '#b91c1c'; 
        alerta = isEn ? '⚠️ EXCEEDS MAXIMUM Dose' : '⚠️ EXCEDE MÁXIMA en ficha técnica'; 
    }
    else if (equivalente > d.ed95) { 
        bg = '#fef3c7'; color = '#b45309'; 
        alerta = isEn ? '⚠️ ABOVE ED95' : '⚠️ SOBRE ED95'; 
    }
    else if (equivalente < d.min) { 
        bg = '#f1f5f9'; color = '#475569'; 
        alerta = isEn ? '🔍 BELOW MINIMUM effective dose' : '🔍 POR DEBAJO DE MÍNIMO EFECTIVO'; 
    }
    else { 
        bg = '#dcfce7'; color = '#15803d'; 
        alerta = isEn ? '✅ STANDARD RANGE' : '✅ RANGO ESTÁNDAR'; 
    }

    const resBox = document.getElementById('res-box'); 
    resBox.style.display = 'block'; 
    resBox.style.background = bg;
    
    document.getElementById('res-header').innerHTML = `
        <div style="background: rgba(255,255,255,0.7); padding: 1.5rem; border-radius: 1.2rem; margin-bottom: 10px;">
            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;">
                ${isEn ? 'Target Dose (Maudsley)' : 'Dosis Objetivo (Maudsley)'}
            </div>
            <div style="font-size: 2.8rem; font-weight: 900; color: var(--text-main);">${equivalente.toFixed(1)} <span style="font-size: 1.2rem;">mg/día</span></div>
            <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; background: white; color: ${color}; border: 1px solid ${color};">${alerta}</div>
        </div>`;

    const idxOrig = window.listaFarmacos.indexOf(orig);
    const idxDest = window.listaFarmacos.indexOf(dest);
    const rawInstr = (window.dbRaw[CONFIG.FILA_INICIO_FARMACOS + idxOrig] && window.dbRaw[CONFIG.FILA_INICIO_FARMACOS + idxOrig][CONFIG.COL_INICIO_DESTINOS + idxDest]) || "";
    
    document.getElementById('res-pauta').innerHTML = `
        <h4 style="margin:0 0 1.2rem 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">
            ${isEn ? 'Suggested Strategy' : 'Estrategia Sugerida'}
        </h4>
        ${orig === dest ? (isEn ? 'Same drug.' : 'Mismo fármaco.') : window.traducirPasos(rawInstr.toString(), dosis, equivalente, orig, dest, d.umbral)}`;
};

window.copiarEstrategia = function() {
    const isEn = window.currentLang === 'en';
    const steps = document.querySelectorAll('.pauta-step');
    if (steps.length === 0) return;

    let texto = isEn ? "SUGGESTED SWITCH STRATEGY:\n\n" : "ESTRATEGIA DE CAMBIO SUGERIDA:\n\n";
    steps.forEach(step => {
        const dia = step.querySelector('.step-idx').innerText;
        const farm = step.querySelector('.tag-farm').innerText;
        const desc = step.querySelector('.step-txt').innerText;
        texto += `${dia}: [${farm}] ${desc}\n`;
    });

    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.querySelector('.btn-copiar');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = isEn ? '<i class="fas fa-check"></i> COPIED!' : '<i class="fas fa-check"></i> ¡COPIADO!';
        btn.style.color = '#15803d';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.style.color = '';
        }, 2000);
    });
};
