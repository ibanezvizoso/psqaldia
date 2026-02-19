/**
 * Herramienta de Diagnóstico Diferencial SS vs SNM
 * PSQALDÍA © 2026
 */

let dbDiag = []; // Se llenará con los datos del Sheets

// --- 1. FUNCIÓN DE APERTURA Y CARGA ---
async function openDiagUI() {
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-sync fa-spin fa-2x" style="color:var(--primary);"></i><p style="margin-top:1rem; font-weight:700;">Cargando criterios desde la nube...</p></div>`;
    document.getElementById('modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (dbDiag.length === 0) {
        try {
            const pestaña = 'SSSNM';
            const res = await fetch(`${window.WORKER_URL}?sheet=${pestaña}`);
            const data = await res.json();

            if (data.error) throw new Error(data.details || data.error);

            if (data.values) {
                // Mapeamos las columnas según tu Excel
                dbDiag = data.values.map(row => ({
                    id: row[0],                 // ID (exp_serot, fiebre...)
                    label: row[1],              // Etiqueta
                    cat: row[2],                // Categoría
                    esMayor: row[3] === 'TRUE', // Columna Es_Mayor_SNM
                    esMenor: row[4] === 'TRUE', // Columna Es_Menor_SNM
                    rutaHunter: row[5]          // Columna Ruta_Hunter
                }));
            }
        } catch (e) {
            console.error("Error en Diagnóstico:", e);
            modalData.innerHTML = `<div style="padding:2rem; text-align:center;"><i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444;"></i><p>Error: ${e.message}</p></div>`;
            return;
        }
    }
    renderizarUI_Diag();
}

// --- 2. FUNCIÓN DE RENDERIZADO (Mantiene tu diseño original) ---
function renderizarUI_Diag() {
    const modalData = document.getElementById('modalData');
    
    let html = `
        <div class="calc-ui" style="padding: 1rem; display: flex; flex-direction: column; height: 100%;">
            <div style="position: sticky; top: 0; background: var(--card); z-index: 10; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <h2 style="margin-bottom:0.5rem; font-weight:800; font-size: 1.2rem;">Diferenciar SS y SNM</h2>
                
                <div style="display: flex; gap: 10px; margin-bottom: 0.5rem;">
                    <div style="flex:1;">
                        <label style="font-size:0.6rem; margin-bottom: 2px;">S. Serotoninérgico</label>
                        <div style="background: var(--border); height: 8px; border-radius: 10px; overflow: hidden;">
                            <div id="bar-ss" style="width: 0%; height: 100%; background: #bae6fd; transition: 0.4s;"></div>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:0.6rem; margin-bottom: 2px;">S. Neuroléptico Maligno</label>
                        <div style="background: var(--border); height: 8px; border-radius: 10px; overflow: hidden;">
                            <div id="bar-snm" style="width: 0%; height: 100%; background: #fef08a; transition: 0.4s;"></div>
                        </div>
                    </div>
                </div>

                <div id="diag-alert" style="display:none; padding:0.5rem; border-radius:8px; margin-top:0.5rem; font-weight:700; font-size:0.75rem; text-align:center;"></div>
            </div>

            <div id="check-list-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 1rem;">
                ${dbDiag.map(s => `
                    <label style="display: flex; align-items: center; gap: 6px; background: var(--bg); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); font-size: 0.75rem; line-height: 1.1;">
                        <input type="checkbox" value="${s.id}" onchange="actualizarDiagnostico()" style="width:14px; height:14px; flex-shrink: 0;">
                        ${s.label}
                    </label>
                `).join('')}
            </div>
            
            <button onclick="resetDiag()" style="margin-top: 1rem; background:none; border:none; color:var(--text-muted); font-size:0.65rem; font-weight:700; cursor:pointer; text-transform: uppercase; padding: 10px;">
                <i class="fas fa-undo"></i> Reiniciar selección
            </button>
        </div>
    `;
    
    modalData.innerHTML = html;
}

// --- 3. LÓGICA DE CÁLCULO (Mantiene escrupulosamente tus reglas) ---
function actualizarDiagnostico() {
    const checks = Array.from(document.querySelectorAll('#check-list-container input:checked')).map(c => c.value);
    const alertBox = document.getElementById('diag-alert');
    
    // Obtenemos los objetos completos de los síntomas seleccionados
    const activos = dbDiag.filter(s => checks.includes(s.id));

    // --- LÓGICA HUNTER (SS) ---
    const hasExp = activos.some(s => s.rutaHunter === 'EXPOSICION');
    const r1 = activos.some(s => s.rutaHunter === 'RUTA_1'); // Clonus espontáneo
    const r2 = activos.some(s => s.rutaHunter === 'RUTA_2') && checks.includes('agitacion') && checks.includes('diaforesis');
    const r3 = activos.some(s => s.rutaHunter === 'RUTA_3') && checks.includes('agitacion') && checks.includes('diaforesis');
    const r4 = activos.some(s => s.rutaHunter === 'RUTA_4'); // Temblor + Hiperreflexia (debe estar marcado en Excel)
    const r5 = activos.some(s => s.rutaHunter === 'RUTA_5') && (checks.includes('clonus_ocu') || checks.includes('clonus_ind'));

    const cumpleHunter = hasExp && (r1 || r2 || r3 || r4 || r5);
    
    // Progreso SS
    let progresoSS = (hasExp ? 25 : 0) + (checks.length * 4); 
    if (r1 || r2 || r3 || r4 || r5) progresoSS += 35;
    if (cumpleHunter) progresoSS = 100;

    // --- LÓGICA LEVENSON (SNM) ---
    const mayores = activos.filter(s => s.esMayor);
    const menores = activos.filter(s => s.esMenor);
    
    const cumpleLevenson = (mayores.length === 3) || (mayores.length >= 2 && menores.length >= 4);
    
    // Progreso SNM
    let progresoSNM = (mayores.length * 25) + (menores.length * 5);
    if (cumpleLevenson) progresoSNM = 100;

    // --- ACTUALIZAR UI ---
    const barSS = document.getElementById('bar-ss');
    const barSNM = document.getElementById('bar-snm');

    barSS.style.width = Math.min(progresoSS, 100) + '%';
    barSS.style.background = progresoSS >= 100 ? '#fda4af' : '#bae6fd'; 
    
    barSNM.style.width = Math.min(progresoSNM, 100) + '%';
    barSNM.style.background = progresoSNM >= 100 ? '#fda4af' : '#fef08a';

    if (cumpleHunter || cumpleLevenson) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = cumpleHunter && cumpleLevenson ? "Criterios compatibles con AMBOS cuadros" : 
                            (cumpleHunter ? "CRITERIOS DE HUNTER CUMPLIDOS (SS)" : "CRITERIOS DE LEVENSON CUMPLIDOS (SNM)");
    } else {
        alertBox.style.display = 'none';
    }
}

// --- 4. FUNCIÓN DE RESET ---
function resetDiag() {
    const checkBoxes = document.querySelectorAll('#check-list-container input[type="checkbox"]');
    checkBoxes.forEach(cb => cb.checked = false);
    actualizarDiagnostico();
}
