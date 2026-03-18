/**
 * ope_portal.js - Selector Maestro de Especialidades
 */

function abrirPortalExamenes() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2rem;">
                <i class="fas fa-clipboard-list fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">Portal OPE</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem;">Selecciona tu especialidad para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 15px;">
                <button onclick="portal_irAPsiq()" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left;">
                    <div style="background: rgba(67, 56, 202, 0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-brain" style="color: var(--primary);"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <b style="color: var(--text-main); font-size: 1.1rem; display: block;">Psiquiatría</b>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--border);"></i>
                </button>

                <button onclick="portal_irAAnest()" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left;">
                    <div style="background: rgba(16, 185, 129, 0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-syringe" style="color: #10b981;"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <b style="color: var(--text-main); font-size: 1.1rem; display: block;">Anestesia</b>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--border);"></i>
                </button>

                <button onclick="portal_irAPed()" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left;">
                    <div style="background: rgba(239, 68, 68, 0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-baby" style="color: #ef4444;"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <b style="color: var(--text-main); font-size: 1.1rem; display: block;">Pediatría</b>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--border);"></i>
                </button>

                <button onclick="portal_irAComun()" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 15px; text-align: left;">
                    <div style="background: rgba(245, 158, 11, 0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-gavel" style="color: #f59e0b;"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <b style="color: var(--text-main); font-size: 1.1rem; display: block;">Parte Común</b>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--border);"></i>
                </button>
            </div>
            
            <button onclick="closeModal()" style="margin-top: 2rem; background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                CERRAR PORTAL
            </button>
        </div>
    `;
}

// Funciones puente para cargar los scripts individuales
async function portal_irAPsiq() {
    await cargarScript('opesPSQ.js'); 
    openExamenSelector(); 
}

async function portal_irAAnest() {
    await cargarScript('opes_anest.js'); 
    openAnestSelector();
}

async function portal_irAPed() {
    await cargarScript('ope_ped.js'); 
    openPedSelector();
}

async function portal_irAComun() {
    await cargarScript('opes_comun.js'); 
    openExamenComunSelector();
}
