/**
 * Herramienta: Alta Voluntaria (Versión Nativa PSQ)
 * Contenido completo - Sin dependencias externas
 */

const EPP_H_AV = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
const EPP_M_AV = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

async function openAltaVoluntariaUI() {
    // 1. LIMPIEZA RADICAL: Eliminamos cualquier rastro de Bootstrap que algún script haya metido en el HEAD
    document.querySelectorAll('link[href*="bootstrap"]').forEach(el => el.remove());

    const modalData = document.getElementById('modalData');
    
    // 2. INYECCIÓN CON ESTILOS PROPIOS (No rompen el index)
    modalData.innerHTML = `
        <div id="av-container" style="padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: #1e293b; max-width: 1000px; margin: auto;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                <h2 style="margin:0; color: var(--primary); font-size: 1.4rem; font-weight: 800;">Asistente: Alta Voluntaria</h2>
                <span style="background: #f1f5f9; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; border: 1px solid #e2e8f0;">IA POWERED</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px;">
                
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    
                    <div class="av-group">
                        <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b; margin-bottom:5px;">NOMBRE DEL PACIENTE</label>
                        <input type="text" id="av-nombre" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px;" placeholder="Opcional">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b;">FECHA</label>
                            <input type="date" id="av-fecha" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px;">
                        </div>
                        <div>
                            <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b;">GÉNERO</label>
                            <select id="av-genero" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px;">
                                <option value="H">Hombre (H)</option>
                                <option value="M">Mujer (M)</option>
                            </select>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b; margin-bottom:10px;">MOTIVOS (Check múltiple)</label>
                        <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
                            <label><input type="checkbox" class="av-motivo" value="mejoría de los síntomas"> Mejoría clínica</label>
                            <label><input type="checkbox" class="av-motivo" value="remisión de ideas de suicidio"> Remisión ideas suicidio</label>
                            <label><input type="checkbox" class="av-motivo" value="preferencia por tratamiento ambulatorio"> Tto. Ambulatorio</label>
                            <label><input type="checkbox" class="av-motivo" value="deseo de acompañamiento familiar"> Deseo acompañamiento familiar</label>
                            <input type="text" id="av-otros-motivos" style="width:100%; padding:8px; margin-top:5px; border:1px solid #cbd5e1; border-radius:6px;" placeholder="Otros motivos...">
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b; margin-bottom:10px;">RIESGOS Y CAPACIDAD</label>
                        <label style="font-weight:700;"><input type="checkbox" id="av-check-riesgos" onchange="document.getElementById('av-cont-riesgos').style.display = this.checked ? 'block' : 'none'"> Se explican riesgos</label>
                        <div id="av-cont-riesgos" style="display:none; margin-top:10px;">
                            <textarea id="av-texto-riesgos" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;" rows="2" placeholder="Recaída, abandono..."></textarea>
                        </div>
                        <div style="margin-top:10px; font-size:0.85rem; display:flex; flex-direction:column; gap:5px;">
                            <label><input type="checkbox" class="av-cap" value="no presenta alteraciones cognitivas"> Sin alteraciones cognitivas</label>
                            <label><input type="checkbox" class="av-cap" value="no presenta alteraciones psicopatológicas"> Sin alteraciones psicopatológicas</label>
                        </div>
                    </div>

                    <div>
                        <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b; margin-bottom:5px;">EXPLORACIÓN PSICOPATOLÓGICA</label>
                        <select id="av-tipo-exp" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:10px;" onchange="actualizarEPP_AV()">
                            <option value="defecto">Texto por defecto (según género)</option>
                            <option value="libre">Texto libre</option>
                        </select>
                        <textarea id="av-epp" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px;" rows="4"></textarea>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <label style="display:block; font-weight:800; font-size:0.7rem; color:#64748b; margin-bottom:10px;">PLAN AL ALTA</label>
                        <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:5px; margin-bottom:10px;">
                            <label><input type="checkbox" class="av-plan" value="cita programada en USM"> Cita programada en USM</label>
                            <label><input type="checkbox" class="av-plan" value="continuará tto habitual"> Continuar tto habitual</label>
                            <label><input type="checkbox" class="av-plan" value="urgencias si empeora"> Urgencias si empeora</label>
                        </div>
                        <textarea id="av-plan-libre" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" rows="2" placeholder="Otros detalles del plan..."></textarea>
                    </div>

                    <button id="av-btn-redactar" onclick="redactarIA_AV(this)" style="width:100%; padding:18px; background:var(--primary); color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer; font-size:1rem; transition: 0.2s;">
                        <i class="fas fa-magic"></i> REDACTAR CON IA
                    </button>
                </div>

                <div style="display: flex; flex-direction: column;">
                    <label style="display:block; font-weight:800; font-size:0.7rem; color:var(--primary); margin-bottom:10px; letter-spacing:1px;">PROPUESTA PARA HISTORIA CLÍNICA</label>
                    <div id="av-resultado" style="background: #fff9e6; border-left: 5px solid #f1c40f; padding: 20px; border-radius: 10px; min-height: 500px; font-size: 0.95rem; line-height: 1.6; color: #334155; white-space: pre-wrap; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">Rellena los datos y pulsa el botón...</div>
                    
                    <button onclick="copyAV()" style="margin-top:15px; padding:12px; background:#64748b; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; width:100%;">
                        <i class="fas fa-copy"></i> COPIAR AL PORTAPAPELES
                    </button>
                </div>

            </div>
        </div>
    `;

    // Inicializar fecha y EPP
    document.getElementById('av-fecha').value = new Date().toISOString().split('T')[0];
    actualizarEPP_AV();
}

function actualizarEPP_AV() {
    const tipo = document.getElementById('av-tipo-exp').value;
    const genero = document.getElementById('av-genero').value;
    const area = document.getElementById('av-epp');
    
    if (tipo === 'defecto') {
        area.value = (genero === 'H') ? EPP_H_AV : EPP_M_AV;
    }
}

async function redactarIA_AV(btn) {
    const resDiv = document.getElementById('av-resultado');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
    
    const datos = {
        nombre: document.getElementById('av-nombre').value || "el paciente",
        fecha: document.getElementById('av-fecha').value,
        genero: document.getElementById('av-genero').value,
        motivos: Array.from(document.querySelectorAll('.av-motivo:checked')).map(el => el.value),
        otrosMotivos: document.getElementById('av-otros-motivos').value,
        epp: document.getElementById('av-epp').value,
        riesgos: document.getElementById('av-texto-riesgos').value,
        capacidad: Array.from(document.querySelectorAll('.av-cap:checked')).map(el => el.value),
        plan: Array.from(document.querySelectorAll('.av-plan:checked')).map(el => el.value),
        planLibre: document.getElementById('av-plan-libre').value
    };

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
        });
        const data = await response.json();
        resDiv.innerText = data.response ? data.response.replace(/\*\*|###/g, '').trim() : "Error en la IA.";
    } catch (e) {
        resDiv.innerText = "Error: No se pudo conectar con el Worker.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function copyAV() {
    const text = document.getElementById('av-resultado').innerText;
    navigator.clipboard.writeText(text);
    alert('Texto copiado');
}
