/**
 * Herramienta: Evolutivo Alta Voluntaria (Versión Nativa v4.0)
 * PSQALDÍA © 2026
 * SIN BOOTSTRAP - SIN CONFLICTOS
 */

// 1. LIMPIEZA TOTAL: Borramos rastro de Bootstrap del index por si acaso
document.querySelectorAll('link[href*="bootstrap"]').forEach(el => el.remove());

const EPP_H_AV = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
const EPP_M_AV = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

async function openAltaVoluntariaUI() {
    const modalData = document.getElementById('modalData');
    
    modalData.innerHTML = `
        <div style="padding: 1.5rem; color: var(--text-main); font-family: system-ui, sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                <h2 style="margin:0; font-size: 1.2rem; font-weight: 800; color: var(--primary);"><i class="fas fa-brain"></i> Alta Voluntaria</h2>
                <span style="font-size: 0.7rem; font-weight: 800; background: var(--bg); padding: 5px 12px; border-radius: 50px; border: 1px solid var(--border); color: var(--text-muted);">ASISTENTE IA</span>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
                <div style="flex: 1; min-width: 300px;">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        
                        <div>
                            <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:5px;">NOMBRE DEL PACIENTE</label>
                            <input type="text" id="nombreAV" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);" placeholder="Nombre o iniciales">
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <div style="flex:1">
                                <label style="display:block; font-weight:700; font-size:0.8rem;">FECHA</label>
                                <input type="date" id="fechaAV" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);">
                            </div>
                            <div style="flex:1">
                                <label style="display:block; font-weight:700; font-size:0.8rem;">HORA</label>
                                <input type="time" id="horaAV" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);">
                            </div>
                        </div>

                        <div>
                            <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:8px;">MOTIVOS ADUCIDOS</label>
                            <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:6px;">
                                <label><input type="checkbox" class="m-av" value="mejoría de los síntomas"> Mejoría de los síntomas</label>
                                <label><input type="checkbox" class="m-av" value="remisión de ideas de suicidio"> Remisión de ideas de suicidio</label>
                                <label><input type="checkbox" class="m-av" value="empeoramiento en contexto de ingreso"> Empeoramiento por ingreso</label>
                                <label><input type="checkbox" class="m-av" value="preferencia por tto ambulatorio"> Preferencia tto ambulatorio</label>
                                <label><input type="checkbox" class="m-av" value="deseo de acompañamiento familiar"> Deseo acompañamiento familiar</label>
                                <input type="text" id="otrosMotivosAV" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); margin-top:5px;" placeholder="Otros motivos...">
                            </div>
                        </div>

                        <div style="padding:1rem; background:var(--bg); border-radius:12px; border:1px solid var(--border);">
                            <label style="display:block; font-weight:700; font-size:0.85rem; margin-bottom:8px;">RIESGOS Y CAPACIDAD</label>
                            <label style="display:block; margin-bottom:8px;"><input type="checkbox" id="checkRiesgosAV"> <b>Se explican riesgos</b></label>
                            <textarea id="textoRiesgosAV" style="width:100%; display:none; padding:8px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;" rows="2" placeholder="Describir riesgos..."></textarea>
                            
                            <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:5px;">
                                <label><input type="checkbox" class="c-av" value="no presenta alteraciones cognitivas"> No presenta alteraciones cognitivas</label>
                                <label><input type="checkbox" class="c-av" value="no presenta alteraciones psicopatológicas"> No presenta alteraciones psicopatológicas</label>
                            </div>
                        </div>

                        <div>
                            <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:8px;">EXPLORACIÓN PSICOPATOLÓGICA</label>
                            <div style="margin-bottom:10px; display:flex; gap:10px;">
                                <label><input type="radio" name="t-exp" id="expDef" checked> Defecto</label>
                                <label><input type="radio" name="t-exp" id="expLib"> Libre</label>
                            </div>
                            <textarea id="textoExploracionAV" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text-main);" rows="4"></textarea>
                        </div>

                        <div style="padding:1rem; border: 1px solid var(--border); border-radius:12px;">
                            <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:8px;">PLAN AL ALTA</label>
                            <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
                                <label><input type="checkbox" class="p-av" value="cita programada en USM"> Cita programada en USM</label>
                                <label><input type="checkbox" class="p-av" value="continuará tto habitual"> Continuará tto habitual</label>
                                <label><input type="checkbox" class="p-av" value="acudirá a urgencias si empeora"> Urgencias si empeoramiento</label>
                            </div>
                            <textarea id="planLibreAV" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border);" placeholder="Otros detalles del plan..."></textarea>
                        </div>

                        <button onclick="redactarEvolutivo_AV(this)" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer; font-size:1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <i class="fas fa-magic"></i> REDACTAR CON IA
                        </button>
                    </div>
                </div>

                <div style="flex: 1; min-width: 300px;">
                    <div style="position: sticky; top: 0;">
                        <label style="display:block; font-weight:800; color:var(--primary); font-size:0.75rem; margin-bottom:10px; letter-spacing:1px;">PROPUESTA PARA HISTORIA CLÍNICA</label>
                        <div id="resultadoIA" style="background: #fff9e6; border-left: 5px solid #f1c40f; padding: 1.5rem; border-radius: 8px; min-height: 450px; font-size: 0.95rem; line-height: 1.6; color: #1e293b; white-space: pre-wrap; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">Rellena los datos y pulsa redactar...</div>
                        
                        <button onclick="copyAV()" style="width:100%; margin-top:1rem; padding:10px; background:var(--text-muted); color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">
                            <i class="fas fa-copy"></i> COPIAR AL PORTAPAPELES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // INICIALIZACIÓN DE LÓGICA
    const get = (id) => document.getElementById(id);
    const ahora = new Date();
    get('fechaAV').value = ahora.toISOString().split('T')[0];
    get('horaAV').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Toggles
    get('checkRiesgosAV').onchange = (e) => get('textoRiesgosAV').style.display = e.target.checked ? 'block' : 'none';
    
    const setEPP = () => {
        if(get('expDef').checked) {
            const gen = prompt("¿Género del paciente? (H/M)").toUpperCase();
            get('textoExploracionAV').value = (gen === 'M') ? EPP_M_AV : EPP_H_AV;
        }
    };
    get('expDef').onchange = setEPP;
    get('expLib').onchange = () => get('textoExploracionAV').value = "";
    
    // Ejecutar EPP por defecto al inicio si se desea
    setEPP();
}

async function redactarEvolutivo_AV(btn) {
    const resDiv = document.getElementById('resultadoIA');
    const oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESANDO...';

    const datos = {
        nombre: document.getElementById('nombreAV').value || "el paciente",
        fecha: document.getElementById('fechaAV').value,
        hora: document.getElementById('horaAV').value,
        motivos: Array.from(document.querySelectorAll('.m-av:checked')).map(el => el.value),
        riesgos: document.getElementById('textoRiesgosAV').value,
        capacidad: Array.from(document.querySelectorAll('.c-av:checked')).map(el => el.value),
        exploracion: document.getElementById('textoExploracionAV').value,
        plan: Array.from(document.querySelectorAll('.p-av:checked')).map(el => el.value),
        planExtra: document.getElementById('planLibreAV').value
    };

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
        });
        const data = await response.json();
        resDiv.innerText = data.response ? data.response.replace(/\*\*|###/g, '').trim() : "Error en la respuesta de la IA.";
    } catch (e) {
        resDiv.innerText = "Error: Verifica la conexión con el Worker.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}

function copyAV() {
    const text = document.getElementById('resultadoIA').innerText;
    navigator.clipboard.writeText(text);
    alert('Texto copiado');
}
