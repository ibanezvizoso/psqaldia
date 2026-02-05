const SINTOMAS_SSSNM = [
    { id: 'exp_serot', label: 'Exposición a serotoninérgicos', cat: 'Antecedente' },
    { id: 'fiebre', label: 'Fiebre', cat: 'Autonómico' },
    { id: 'rigidez', label: 'Hipertonía / Rigidez', cat: 'Motor' },
    { id: 'diaforesis', label: 'Diaforesis', cat: 'Autonómico' },
    { id: 'clonus_esp', label: 'Clonus espontáneo', cat: 'Motor' },
    { id: 'clonus_ind', label: 'Clonus inducible', cat: 'Motor' },
    { id: 'clonus_ocu', label: 'Clonus ocular', cat: 'Motor' },
    { id: 'temblor', label: 'Temblor', cat: 'Motor' },
    { id: 'hiperreflexia', label: 'Hiperreflexia', cat: 'Motor' },
    { id: 'agitacion', label: 'Agitación', cat: 'Mental' },
    { id: 'cpk', label: 'Elevación de CPK', cat: 'Laboratorio' },
    { id: 'leucocitos', label: 'Leucocitosis', cat: 'Laboratorio' },
    { id: 'taquicardia', label: 'Taquicardia', cat: 'Autonómico' },
    { id: 'ta_anormal', label: 'Presión arterial anormal', cat: 'Autonómico' },
    { id: 'taquipnea', label: 'Taquipnea', cat: 'Autonómico' },
    { id: 'conciencia', label: 'Alteración de la conciencia', cat: 'Mental' }
];

function openDiagUI() {
    const modalData = document.getElementById('modalData');
    
    let html = `
        <div class="calc-ui" style="padding: 1rem; display: flex; flex-direction: column; height: 100%;">
            <div style="position: sticky; top: 0; background: var(--card); z-index: 10; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <h2 style="margin-bottom:0.5rem; font-weight:800; font-size: 1.2rem;">Diferencial SS / SNM</h2>
                
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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 1rem;">
                ${SINTOMAS_SSSNM.map(s => `
                    <label style="display: flex; align-items: center; gap: 6px; background: var(--bg); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); font-size: 0.75rem; line-height: 1.1;">
                        <input type="checkbox" value="${s.id}" onchange="actualizarDiagnostico()" style="width:14px; height:14px; flex-shrink: 0;">
                        ${s.label}
                    </label>
                `).join('')}
            </div>
            
            <button onclick="resetDiag()" style="margin-top: 1rem; background:none; border:none; color:var(--text-muted); font-size:0.65rem; font-weight:700; cursor:pointer; text-transform: uppercase;">
                <i class="fas fa-undo"></i> Reiniciar selección
            </button>
        </div>
    `;
    
    modalData.innerHTML = html;
    document.getElementById('modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function actualizarDiagnostico() {
    const checks = Array.from(document.querySelectorAll('.calc-ui input:checked')).map(c => c.value);
    const alertBox = document.getElementById('diag-alert');
    
    // --- LÓGICA HUNTER (SS) ---
    const hasExp = checks.includes('exp_serot');
    const r1 = checks.includes('clonus_esp');
    const r2 = checks.includes('clonus_ind') && (checks.includes('agitacion') || checks.includes('diaforesis'));
    const r3 = checks.includes('clonus_ocu') && (checks.includes('agitacion') || checks.includes('diaforesis'));
    const r4 = checks.includes('temblor') && checks.includes('hiperreflexia');
    const r5 = checks.includes('rigidez') && checks.includes('fiebre') && (checks.includes('clonus_ocu') || checks.includes('clonus_ind'));
    
    const cumpleHunter = hasExp && (r1 || r2 || r3 || r4 || r5);
    let progresoSS = (hasExp ? 25 : 0) + (checks.length * 5); // Base visual
    if (r1 || r2 || r3 || r4 || r5) progresoSS += 40;
    
    if (cumpleHunter) progresoSS = 100;
    else progresoSS = Math.min(progresoSS, 95);

    // --- LÓGICA LEVENSON (SNM) ---
    const mayores = ['fiebre', 'rigidez', 'cpk'].filter(id => checks.includes(id));
    const menores = ['taquicardia', 'ta_anormal', 'taquipnea', 'conciencia', 'diaforesis', 'leucocitos'].filter(id => checks.includes(id));
    
    const cumpleLevenson = (mayores.length === 3) || (mayores.length >= 2 && menores.length >= 4);
    let progresoSNM = (mayores.length * 25) + (menores.length * 5);
    
    if (cumpleLevenson) progresoSNM = 100;
    else progresoSNM = Math.min(progresoSNM, 90);

    // --- ACTUALIZAR UI ---
    document.getElementById('bar-ss').style.width = progresoSS + '%';
    document.getElementById('bar-ss').style.background = progresoSS === 100 ? '#fda4af' : '#bae6fd'; // Rosa pastel si cumple
    
    document.getElementById('bar-snm').style.width = progresoSNM + '%';
    document.getElementById('bar-snm').style.background = progresoSNM === 100 ? '#fda4af' : '#fef08a';

    if (cumpleHunter || cumpleLevenson) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = cumpleHunter && cumpleLevenson ? "Criterios compatibles con AMBOS cuadros" : 
                            (cumpleHunter ? "CRITERIOS DE HUNTER CUMPLIDOS" : "CRITERIOS DE LEVENSON CUMPLIDOS");
    } else {
        alertBox.style.display = 'none';
    }
}
