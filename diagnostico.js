const SINTOMAS_SSSNM = [
    { id: 'exp_serot', label: 'Exposición a serotoninérgicos', cat: 'Antecedente' },
    { id: 'fiebre', label: 'Fiebre / Temp > 38°C', cat: 'Autonómico' },
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
        <div class="calc-ui" style="padding: 1.5rem;">
            <h2 style="margin-bottom:0.5rem; font-weight:800;">Diferencial SS / SNM</h2>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1.5rem;">Marque los hallazgos clínicos observados:</p>
            
            <div style="display: flex; gap: 15px; margin-bottom: 2rem;">
                <div style="flex:1;">
                    <label style="font-size:0.65rem;">S. Serotoninérgico</label>
                    <div style="background: var(--border); height: 12px; border-radius: 10px; overflow: hidden;">
                        <div id="bar-ss" style="width: 0%; height: 100%; background: #bae6fd; transition: 0.4s;"></div>
                    </div>
                </div>
                <div style="flex:1;">
                    <label style="font-size:0.65rem;">S. Neuroléptico Maligno</label>
                    <div style="background: var(--border); height: 12px; border-radius: 10px; overflow: hidden;">
                        <div id="bar-snm" style="width: 0%; height: 100%; background: #fef08a; transition: 0.4s;"></div>
                    </div>
                </div>
            </div>

            <div id="diag-alert" style="display:none; padding:1rem; border-radius:12px; margin-bottom:1.5rem; font-weight:700; font-size:0.85rem; text-align:center;"></div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                ${SINTOMAS_SSSNM.map(s => `
                    <label style="display: flex; align-items: center; gap: 10px; background: var(--bg); padding: 0.8rem; border-radius: 12px; cursor: pointer; border: 1px solid var(--border); font-size: 0.9rem;">
                        <input type="checkbox" value="${s.id}" onchange="actualizarDiagnostico()" style="width:18px; height:18px;">
                        ${s.label}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    modalData.innerHTML = html;
    document.getElementById('modal').style.display = 'flex';
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
