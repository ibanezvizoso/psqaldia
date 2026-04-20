/**
 * Herramienta: Evolutivo Alta Voluntaria
 * PSQALDÍA © 2026
 */

function openAltaVoluntariaUI() {
    const modalData = document.getElementById('modalData');
    
    // Inyectamos el HTML directamente
    modalData.innerHTML = `
        <div style="padding: 1.5rem;">
            <h2 style="margin-bottom:1rem; font-weight:800; font-size: 1.2rem;">Asistente: Alta Voluntaria</h2>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                <div style="background: var(--bg); padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--border);">
                    <div style="margin-bottom: 1rem;">
                        <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:5px;">Nombre del Paciente</label>
                        <input type="text" id="nombrePaciente" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border);" placeholder="Nombre o iniciales">
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 1rem;">
                        <div style="flex:1">
                            <label style="display:block; font-weight:700; font-size:0.8rem;">Fecha</label>
                            <input type="date" id="fecha" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border);">
                        </div>
                        <div style="flex:1">
                            <label style="display:block; font-weight:700; font-size:0.8rem;">Hora</label>
                            <input type="time" id="hora" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border);">
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display:block; font-weight:700; font-size:0.8rem; margin-bottom:5px;">Motivos:</label>
                        <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:5px;">
                            <label><input type="checkbox" class="motivo" value="mejoría de los síntomas"> Mejoría síntomas</label>
                            <label><input type="checkbox" class="motivo" value="remisión de ideas de suicidio"> Remisión ideas suicidio</label>
                            <label><input type="checkbox" class="motivo" value="preferencia por tto ambulatorio"> Tto. Ambulatorio</label>
                        </div>
                        <input type="text" id="otrosMotivos" placeholder="Otros..." style="width:100%; margin-top:5px; padding:5px; border-radius:5px; border:1px solid var(--border);">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="font-weight:700; font-size:0.85rem;"><input type="checkbox" id="checkRiesgos" onchange="document.getElementById('contRiesgos').style.display = this.checked ? 'block' : 'none'"> Explicar riesgos</label>
                        <div id="contRiesgos" style="display:none; margin-top:5px;">
                            <textarea id="textoRiesgos" style="width:100%; border-radius:8px; border:1px solid var(--border);" rows="2" placeholder="Recaída..."></textarea>
                        </div>
                    </div>

                    <button onclick="redactarConIA(this)" style="width:100%; background:var(--primary); color:white; border:none; padding:15px; border-radius:12px; font-weight:800; cursor:pointer;">
                        <i class="fas fa-magic"></i> REDACTAR CON IA
                    </button>
                </div>

                <div style="background: #fff9e6; padding: 1.5rem; border-radius: 1rem; border: 1px solid #f1c40f;">
                    <label style="display:block; font-weight:800; color:#856404; margin-bottom:10px;">Propuesta de redacción:</label>
                    <div id="resultadoIA" style="white-space: pre-wrap; font-size: 0.9rem; min-height: 150px; color: #333;">Los resultados aparecerán aquí...</div>
                    <button onclick="copyToClipboard()" style="margin-top:10px; background:#64748b; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-size:0.8rem;">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Inicializar fecha y hora
    const ahora = new Date();
    document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
    document.getElementById('hora').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

async function redactarConIA(btn) {
    const resDiv = document.getElementById('resultadoIA');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Procesando...';

    const datos = {
        nombre: document.getElementById('nombrePaciente').value || "el paciente",
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        motivos: Array.from(document.querySelectorAll('.motivo:checked')).map(el => el.value),
        otrosMotivos: document.getElementById('otrosMotivos').value,
        riesgosCheck: document.getElementById('checkRiesgos').checked,
        riesgosTexto: document.getElementById('textoRiesgos').value
    };

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
        });
        const data = await response.json();
        resDiv.innerText = data.response ? data.response.replace(/\*\*|###/g, '').trim() : "Error en IA";
    } catch (e) {
        resDiv.innerText = "Error de conexión con el Worker.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

function copyToClipboard() {
    const text = document.getElementById('resultadoIA').innerText;
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
}
