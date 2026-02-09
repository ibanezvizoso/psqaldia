const CRITERIOS_PA = {
    clinicos: [
        { id: 'tumor', label: 'Tumor actual o reciente' },
        { id: 'movimiento', label: 'Trastorno movimiento (Catatonia/Discinesia)' },
        { id: 'adverso_ap', label: 'Respuesta adversa a antipsicóticos (sospecha SNM)' },
        { id: 'cognitivo', label: 'Disfunción cognitiva severa/desproporcionada' },
        { id: 'conciencia', label: 'Nivel de conciencia disminuido' },
        { id: 'convulsiones', label: 'Convulsiones (no explicadas por cuadro previo)' },
        { id: 'autonomica', label: 'Disfunción autonómica significativa' }
    ],
    paraclinicos: [
        { id: 'lcr_pleocitosis', label: 'LCR: Pleocitosis (>5 WBC/µL)' },
        { id: 'mri_temporal', label: 'RM: Anomalías bilaterales lóbulo temporal medial' },
        { id: 'eeg_encef', label: 'EEG: Cambios encefalopáticos (ondas lentas/puntas)' },
        { id: 'lcr_bandas', label: 'LCR: Bandas oligoclonales o índice IgG elevado' },
        { id: 'suero_ab', label: 'Suero: Anticuerpos antineuronales positivos' }
    ],
    definitivo: [
        { id: 'lcr_igg', label: 'LCR: Anticuerpos IgG antineuronales positivos' }
    ]
};

function openAutoimmuneUI() {
    const modal = document.getElementById('modal');
    const modalData = document.getElementById('modalData');
    
    // Forzamos la visibilidad del modal antes de rellenar
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.5rem; display: flex; flex-direction: column; font-family: 'Inter', sans-serif;">
            <div style="position: sticky; top: 0; background: var(--card); z-index: 10; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <h2 style="font-weight:800; font-size: 1.2rem; margin:0; color: var(--text-main);">Psicosis Autoinmune</h2>
                    <button onclick="openRedFlags()" style="background:var(--fav); color:white; border:none; padding:5px 12px; border-radius:8px; font-size:0.7rem; font-weight:800; cursor:pointer;">RED FLAGS</button>
                </div>

                <div style="display: flex; gap: 4px; height: 12px; margin-bottom: 0.5rem;">
                    <div id="seg-posible" style="flex:1; background: var(--border); border-radius: 4px 0 0 4px; transition: 0.3s;"></div>
                    <div id="seg-probable" style="flex:1; background: var(--border); transition: 0.3s;"></div>
                    <div id="seg-definitiva" style="flex:1; background: var(--border); border-radius: 0 4px 4px 0; transition: 0.3s;"></div>
                </div>
                <div id="status-label" style="text-align:center; font-size:0.75rem; font-weight:800; text-transform:uppercase; color:var(--text-muted);">Pendiente criterio base</div>
            </div>

            <div style="margin-top: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 10px; background: #eff6ff; padding: 1rem; border-radius: 12px; cursor: pointer; border: 2px solid #3b82f6; font-size: 0.9rem; font-weight:700; margin-bottom:1rem; color: #1e40af;">
                    <input type="checkbox" id="base_abrupto" onchange="updatePA()" style="width:20px; height:20px;">
                    Inicio abrupto (< 3 meses) [Criterio Base]
                </label>

                <div id="estudio-box" style="display:none; background:#f0fdf4; border:1px solid #bbf7d0; padding:1rem; border-radius:12px; font-size:0.8rem; margin-bottom:1.5rem; color:#166534; line-height:1.4;">
                    <strong>Estudio recomendado:</strong> Realizar EEG, RM cerebral, análisis de suero y LCR (incluyendo panel de anticuerpos).
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    <p style="font-size:0.7rem; font-weight:800; color:var(--text-muted); margin: 0.5rem 0 0.2rem; text-transform: uppercase;">CRITERIOS CLÍNICOS</p>
                    ${CRITERIOS_PA.clinicos.map(s => renderCheck(s)).join('')}
                    
                    <p style="font-size:0.7rem; font-weight:800; color:var(--text-muted); margin: 1rem 0 0.2rem; text-transform: uppercase;">PARA-CLÍNICOS / LABORATORIO</p>
                    ${CRITERIOS_PA.paraclinicos.map(s => renderCheck(s)).join('')}

                    <p style="font-size:0.7rem; font-weight:800; color:var(--text-muted); margin: 1rem 0 0.2rem; text-transform: uppercase;">CONFIRMACIÓN LCR</p>
                    ${CRITERIOS_PA.definitivo.map(s => renderCheck(s)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderCheck(s) {
    return `
        <label style="display: flex; align-items: center; gap: 10px; background: var(--bg); padding: 0.75rem; border-radius: 10px; cursor: pointer; border: 1px solid var(--border); font-size: 0.8rem; color: var(--text-main);">
            <input type="checkbox" class="pa-check" value="${s.id}" onchange="updatePA()" style="width:16px; height:16px;">
            ${s.label}
        </label>
    `;
}

function updatePA() {
    const isAbrupto = document.getElementById('base_abrupto').checked;
    const checks = Array.from(document.querySelectorAll('.pa-check:checked')).map(c => c.value);
    
    const numClinicos = CRITERIOS_PA.clinicos.filter(c => checks.includes(c.id)).length;
    const paraclinicosActivos = CRITERIOS_PA.paraclinicos.filter(c => checks.includes(c.id)).map(c => c.id);
    const hasIgGLCR = checks.includes('lcr_igg');

    // Lógica Diagnóstica (Pollak et al. 2020)
    let posible = isAbrupto && numClinicos >= 1;
    
    // Probable: Posible + (1 criterio fuerte o 2 débiles)
    const labFuerte = paraclinicosActivos.some(id => ['lcr_pleocitosis', 'mri_temporal'].includes(id));
    const labDebilCount = paraclinicosActivos.filter(id => ['eeg_encef', 'lcr_bandas', 'suero_ab'].includes(id)).length;
    let probable = posible && (labFuerte || labDebilCount >= 2);
    
    let definitiva = probable && hasIgGLCR;

    // Actualización Visual de la Barra
    document.getElementById('seg-posible').style.background = posible ? '#fef08a' : 'var(--border)';
    document.getElementById('seg-probable').style.background = probable ? '#fed7aa' : 'var(--border)';
    document.getElementById('seg-definitiva').style.background = definitiva ? '#fda4af' : 'var(--border)';
    
    document.getElementById('estudio-box').style.display = posible ? 'block' : 'none';
    
    const label = document.getElementById('status-label');
    if (definitiva) { 
        label.innerText = "Psicosis Autoinmune Definitiva"; 
        label.style.color = "#e11d48"; 
    } else if (probable) { 
        label.innerText = "Psicosis Autoinmune Probable"; 
        label.style.color = "#ea580c"; 
    } else if (posible) { 
        label.innerText = "Psicosis Autoinmune Posible"; 
        label.style.color = "#ca8a04"; 
    } else { 
        label.innerText = isAbrupto ? "Faltan criterios clínicos" : "Pendiente criterio base"; 
        label.style.color = "var(--text-muted)"; 
    }
}

function openRedFlags() {
    const flags = [
        "Pródromo infeccioso (fiebre, malestar)", 
        "Cefalea severa de nuevo inicio", 
        "Progresión rápida (< 3 meses)",
        "Respuesta adversa/SNM a antipsicóticos", 
        "Catatonia o discinesias orofaciales",
        "Focalidad neurológica", 
        "Fluctuación de la conciencia", 
        "Inestabilidad autonómica",
        "Afasia, mutismo o disartria", 
        "Convulsiones", 
        "Historia personal de tumor",
        "Hiponatremia", 
        "Otros trastornos autoinmunes", 
        "Parestesias de nuevo inicio"
    ];

    const rfModal = document.createElement('div');
    rfModal.id = "rf-modal";
    rfModal.style = "position:fixed; inset:0; background:rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:1.5rem;";
    rfModal.onclick = () => rfModal.remove();
    
    rfModal.innerHTML = `
        <div style="background:var(--card); padding:2rem; border-radius:2rem; max-width:450px; width:100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid var(--border);" onclick="event.stopPropagation()">
            <h3 style="margin-top:0; color:var(--text-main); font-weight:800;">Red Flags (Pollak et al.)</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">Signos de sospecha clínica de etiología orgánica/autoinmune:</p>
            <ul style="font-size:0.85rem; line-height:1.6; padding-left:1.2rem; color:var(--text-main); max-height: 350px; overflow-y: auto;">
                ${flags.map(f => `<li style="margin-bottom:6px;">${f}</li>`).join('')}
            </ul>
            <button onclick="document.getElementById('rf-modal').remove()" style="background:var(--primary); color:white; border:none; width:100%; padding:1rem; border-radius:15px; font-weight:700; cursor:pointer; margin-top:1.5rem;">CERRAR</button>
        </div>
    `;
    document.body.appendChild(rfModal);
}
