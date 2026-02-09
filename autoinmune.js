const CRITERIOS_PA = {
    clinicos: [
        { id: 'tumor', label: 'Tumor' },
        { id: 'movimiento', label: 'Movimientos ext.' },
        { id: 'adverso_ap', label: 'Sospecha SNM' },
        { id: 'cognitivo', label: 'Deterioro cog.' },
        { id: 'conciencia', label: 'Baja conciencia' },
        { id: 'convulsiones', label: 'Convulsiones' },
        { id: 'autonomica', label: 'Disf. autonómica' }
    ],
    paraclinicos: [
        { id: 'lcr_pleocitosis', label: 'LCR: Pleocitosis' },
        { id: 'mri_temporal', label: 'RM: Temp. Medial' },
        { id: 'eeg_encef', label: 'EEG: Encefalopatía' },
        { id: 'lcr_bandas', label: 'LCR: Bandas IgG' },
        { id: 'suero_ab', label: 'Suero: Anticuerpos' }
    ],
    definitivo: [
        { id: 'lcr_igg', label: 'LCR: IgG (+) neur.' }
    ]
};

function openAutoimmuneUI() {
    const modal = document.getElementById('modal');
    const modalData = document.getElementById('modalData');
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    modalData.innerHTML = `
        <div class="calc-ui" style="padding: 1.2rem; display: flex; flex-direction: column; font-family: 'Inter', sans-serif;">
            <div style="position: sticky; top: 0; background: var(--card); z-index: 10; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border);">
                <h2 style="font-weight:800; font-size: 1.1rem; margin:0 0 0.8rem 0; color: var(--text-main); text-align:center;">Psicosis Autoinmune</h2>

                <div style="display: flex; gap: 4px; height: 10px; margin-bottom: 0.5rem;">
                    <div id="seg-posible" style="flex:1; background: var(--border); border-radius: 4px 0 0 4px; transition: 0.3s;"></div>
                    <div id="seg-probable" style="flex:1; background: var(--border); transition: 0.3s;"></div>
                    <div id="seg-definitiva" style="flex:1; background: var(--border); border-radius: 0 4px 4px 0; transition: 0.3s;"></div>
                </div>
                
                <div id="status-label" style="text-align:center; font-size:0.7rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom: 0.8rem;">Pendiente criterio base</div>
                
                <div style="display: flex; justify-content: center;">
                    <button onclick="openRedFlags()" style="background: var(--primary); color: white; border: none; padding: 6px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-flag"></i> VER RED FLAGS
                    </button>
                </div>
            </div>

            <div style="margin-top: 1rem;">
                <label style="display: flex; align-items: center; gap: 10px; background: #eff6ff; padding: 0.8rem; border-radius: 12px; cursor: pointer; border: 2px solid #3b82f6; font-size: 0.85rem; font-weight:700; margin-bottom:1rem; color: #1e40af;">
                    <input type="checkbox" id="base_abrupto" onchange="updatePA()" style="width:18px; height:18px;">
                    Psicosis abrupta (< 3 meses)
                </label>

                <div id="estudio-box" style="display:none; padding:0.8rem; border-radius:10px; font-size:0.75rem; margin-bottom:1rem; line-height:1.3; transition: 0.3s;">
                </div>

                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted); margin: 0.5rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Clínicos (min. 1)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 1rem;">
                    ${CRITERIOS_PA.clinicos.map(s => renderCheck(s)).join('')}
                </div>
                
                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted); margin: 0.5rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Paraclínicos (Probable)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 1rem;">
                    ${CRITERIOS_PA.paraclinicos.map(s => renderCheck(s)).join('')}
                </div>

                <p style="font-size:0.65rem; font-weight:800; color:var(--text-muted); margin: 0.5rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Definitivo</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    ${CRITERIOS_PA.definitivo.map(s => renderCheck(s)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderCheck(s) {
    return `
        <label style="display: flex; align-items: center; gap: 6px; background: var(--bg); padding: 0.5rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); font-size: 0.7rem; color: var(--text-main); height: 100%; box-sizing: border-box;">
            <input type="checkbox" class="pa-check" value="${s.id}" onchange="updatePA()" style="width:14px; height:14px; min-width:14px;">
            <span style="line-height:1.1;">${s.label}</span>
        </label>
    `;
}

function updatePA() {
    const isAbrupto = document.getElementById('base_abrupto').checked;
    const checks = Array.from(document.querySelectorAll('.pa-check:checked')).map(c => c.value);
    
    const numClinicos = CRITERIOS_PA.clinicos.filter(c => checks.includes(c.id)).length;
    const paraclinicosActivos = CRITERIOS_PA.paraclinicos.filter(c => checks.includes(c.id)).map(c => c.id);
    const hasIgGLCR = checks.includes('lcr_igg');

    let posible = isAbrupto && numClinicos >= 1;
    const labFuerte = paraclinicosActivos.some(id => ['lcr_pleocitosis', 'mri_temporal'].includes(id));
    const labDebilCount = paraclinicosActivos.filter(id => ['eeg_encef', 'lcr_bandas', 'suero_ab'].includes(id)).length;
    let probable = posible && (labFuerte || labDebilCount >= 2);
    let definitiva = probable && hasIgGLCR;

    // Actualización de barras
    document.getElementById('seg-posible').style.background = posible ? '#fef08a' : 'var(--border)';
    document.getElementById('seg-probable').style.background = probable ? '#fed7aa' : 'var(--border)';
    document.getElementById('seg-definitiva').style.background = definitiva ? '#fda4af' : 'var(--border)';
    
    // LÓGICA DEL RECUADRO DE ESTUDIO
    const estudioBox = document.getElementById('estudio-box');
    if (definitiva) {
        estudioBox.style.display = 'none';
    } else if (probable) {
        estudioBox.style.display = 'block';
        estudioBox.style.background = '#ffedd5'; // Naranja claro
        estudioBox.style.border = '1px solid #fed7aa';
        estudioBox.style.color = '#9a3412';
        estudioBox.innerHTML = `<strong>Siguiente paso:</strong> Estudio de LCR`;
    } else if (posible) {
        estudioBox.style.display = 'block';
        estudioBox.style.background = '#fef9c3'; // Amarillo claro
        estudioBox.style.border = '1px solid #fef08a';
        estudioBox.style.color = '#854d0e';
        estudioBox.innerHTML = `<strong>Siguiente paso:</strong> Solicitar EEG, RM cerebral, anticuerpos en suero, LCR`;
    } else {
        estudioBox.style.display = 'none';
    }
    
    const label = document.getElementById('status-label');
    if (definitiva) { 
        label.innerText = "Definitiva"; 
        label.style.color = "#e11d48"; 
    } else if (probable) { 
        label.innerText = "Probable"; 
        label.style.color = "#ea580c"; 
    } else if (posible) { 
        label.innerText = "Posible"; 
        label.style.color = "#ca8a04"; 
    } else { 
        label.innerText = isAbrupto ? "Faltan criterios clínicos" : "Pendiente criterio base"; 
        label.style.color = "var(--text-muted)"; 
    }
}

function openRedFlags() {
    const flags = [
        "Pródromo infeccioso (fiebre, malestar)", "Cefalea severa de nuevo inicio", "Progresión rápida (< 3 meses)",
        "Respuesta adversa/SNM a antipsicóticos", "Catatonia o discinesias orofaciales", "Focalidad neurológica", 
        "Fluctuación de la conciencia", "Inestabilidad autonómica", "Afasia, mutismo o disartria", 
        "Convulsiones", "Historia personal de tumor", "Hiponatremia", 
        "Otros trastornos autoinmunes", "Parestesias de nuevo inicio"
    ];

    const rfModal = document.createElement('div');
    rfModal.id = "rf-modal";
    rfModal.style = "position:fixed; inset:0; background:rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:1.2rem;";
    rfModal.onclick = () => rfModal.remove();
    
    rfModal.innerHTML = `
        <div style="background:var(--card); padding:1.5rem; border-radius:1.5rem; max-width:400px; width:100%; box-shadow: 0 20px 25px rgba(0,0,0,0.5); border: 1px solid var(--border);" onclick="event.stopPropagation()">
            <h3 style="margin-top:0; color:var(--text-main); font-weight:800; font-size:1.1rem;">Red Flags (Pollak et al.)</h3>
            <ul style="font-size:0.8rem; line-height:1.5; padding-left:1.1rem; color:var(--text-main); margin-bottom:0;">
                ${flags.map(f => `<li style="margin-bottom:4px;">${f}</li>`).join('')}
            </ul>
            <button onclick="document.getElementById('rf-modal').remove()" style="background:var(--primary); color:white; border:none; width:100%; padding:0.8rem; border-radius:12px; font-weight:700; cursor:pointer; margin-top:1.2rem;">CERRAR</button>
        </div>
    `;
    document.body.appendChild(rfModal);
}
