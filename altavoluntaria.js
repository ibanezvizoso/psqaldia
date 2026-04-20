/**
 * Herramienta: Alta Voluntaria (VERSIÓN PURA PSQALDÍA)
 * Sin dependencias externas - No rompe el index
 */

// 1. LIMPIEZA DE EMERGENCIA: Borramos cualquier rastro de Bootstrap que se haya colado
document.querySelectorAll('link[href*="bootstrap"]').forEach(el => el.remove());

const EPP_H_AV = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
const EPP_M_AV = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

async function openAltaVoluntariaUI() {
    const modalData = document.getElementById('modalData');
    
    // Contenedor con estilos manuales ultra-específicos
    modalData.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: #334155; max-width: 1000px; margin: auto;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="margin:0; color: #2563eb; font-size: 1.3rem; font-weight: 800;">Alta Voluntaria</h2>
                <span style="font-size: 10px; font-weight: 800; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 20px; color: #64748b;">ASISTENTE CLÍNICO</span>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 30px;">
                
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 15px;">
                    
                    <div>
                        <label style="display:block; font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 5px;">PACIENTE (OPCIONAL)</label>
                        <input type="text" id="av-nombre" style="width:100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box;" placeholder="Nombre o iniciales">
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <div style="flex:1">
                            <label style="display:block; font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 5px;">FECHA</label>
                            <input type="date" id="av-fecha" style="width:100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box;">
                        </div>
                        <div style="flex:1">
                            <label style="display:block; font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 5px;">GÉNERO</label>
                            <select id="av-genero" onchange="actualizarEPP_AV()" style="width:100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;">
                                <option value="H">H</option>
                                <option value="M">M</option>
                            </select>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <label style="display:block; font-weight: 800; font-size: 11px; color: #64748b; margin-bottom: 10px;">MOTIVOS</label>
                        <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
                            <label><input type="checkbox" class="av-motivo" value="mejoría de los síntomas"> Mejoría de síntomas</label>
                            <label><input type="checkbox" class="av-motivo" value="remisión de ideas de suicidio"> Remisión ideas suicidio</label>
                            <label><input type="checkbox" class="av-motivo" value="preferencia por tto ambulatorio"> Tto. Ambulatorio</label>
                            <label><input type="checkbox" class="av-motivo" value="deseo de acompañamiento familiar"> Deseo apoyo familiar</label>
                            <input type="text" id="av-otros-motivos" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 5px;" placeholder="Otros motivos...">
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <label style="display:block; font-weight: 800; font-size: 11px; color: #64748b; margin-bottom: 10px;">RIESGOS Y CAPACIDAD</label>
                        <label style="display:block; font-weight: 700; margin-bottom: 5px;"><input type="checkbox" id="av-check-riesgos" onchange="document.getElementById('av-cont-riesgos').style.display = this.checked ? 'block' : 'none'"> Se explican riesgos</label>
                        <div id="av-cont-riesgos" style="display:none; margin-bottom: 10px;">
                            <textarea id="av-texto-riesgos" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" rows="2" placeholder="Describir riesgos..."></textarea>
                        </div>
                        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 5px;">
                            <label><input type="checkbox" class="av-cap" value="no presenta alteraciones cognitivas"> Sin alteraciones cognitivas</label>
                            <label><input type="checkbox" class="av-cap" value="no presenta alteraciones psicopatológicas"> Sin alteraciones psicopatológicas</label>
                        </div>
                    </div>

                    <div>
                        <label style="display:block; font-weight: 800; font-size: 11px; color: #64748b; margin-bottom: 5px;">EXPLORACIÓN PSICOPATOLÓGICA</label>
                        <select id="av-tipo-exp" onchange="actualizarEPP_AV()" style="width:100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 8px;">
                            <option value="defecto">Texto por defecto</option>
                            <option value="libre">Texto libre</option>
                        </select>
                        <textarea id="av-epp" style="width:100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;" rows="4"></textarea>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9;">
                        <label style="display:block; font-weight: 800; font-size: 11px; color: #64748b; margin-bottom: 10px;">PLAN AL ALTA</label>
                        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px;">
                            <label><input type="checkbox" class="av-plan" value="cita programada en USM"> Cita programada en USM</label>
                            <label><input type="checkbox" class="av-plan" value="continuará tto habitual"> Continuar tto habitual</label>
                            <label><input type="checkbox" class="av-plan" value="urgencias si empeora"> Urgencias si empeora</label>
                        </div>
                        <textarea id="av-plan-libre" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" rows="2" placeholder="Más detalles del plan..."></textarea>
                    </div>

                    <button id="av-btn-redactar" onclick="redactarIA_AV(this)" style="background: #2563eb; color: white; padding: 15px; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 1rem;">
                        <i class="fas fa-magic"></i> REDACTAR CON IA
                    </button>
                </div>

                <div style="flex: 1; min-width: 300px;">
                    <label style="display:block; font-weight: 800; font-size: 11px; color: #2563eb; margin-bottom: 10px;">PROPUESTA (HISTORIA CLÍNICA)</label>
                    <div id="av-resultado" style="background: #fff9e6; border-left: 5px solid #f1c40f; padding: 20px; border-radius: 8px; min-height: 500px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">Los resultados aparecerán aquí...</div>
                    <button onclick="copyAV()" style="width: 100%; margin-top: 15px; padding: 12px; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                        <i class="fas fa-copy"></i> COPIAR TEXTO
                    </button>
                </div>

            </div>
        </div>
    `;

    // Inicializar fecha
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
    btn.innerHTML = 'PROCESANDO...';
    
    const datos = {
        nombre: document.getElementById('av-nombre').value || "el paciente",
        fecha: document.getElementById('av-fecha').value,
        genero: document.getElementById('av-genero').value,
        motivos: Array.from(document.querySelectorAll('.av-motivo:checked')).map(el => el.value),
        otrosMotivos: document.getElementById('av-otros-motivos').value,
        riesgos: document.getElementById('av-texto-riesgos').value,
        capacidad: Array.from(document.querySelectorAll('.av-cap:checked')).map(el => el.value),
        epp: document.getElementById('av-epp').value,
        plan: Array.from(document.querySelectorAll('.av-plan:checked')).map(el => el.value),
        planExtra: document.getElementById('av-plan-libre').value
    };

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
        });
        const data = await response.json();
        resDiv.innerText = data.response ? data.response.replace(/\*\*|###/g, '').trim() : "Error en IA.";
    } catch (e) {
        resDiv.innerText = "Error de conexión.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function copyAV() {
    navigator.clipboard.writeText(document.getElementById('av-resultado').innerText);
    alert('Copiado');
}
