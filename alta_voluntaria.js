/**
 * Herramienta: Evolutivo Alta Voluntaria para PSQALDÍA
 * Inyecta la interfaz y la lógica dentro del modal principal.
 */

window.openAltaVoluntariaUI = function() {
    const modalData = document.getElementById('modalData');
    
    // 1. Definición de constantes de texto
    const EPP_H = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
    const EPP_M = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

    // 2. Inyección del HTML y CSS (Idéntico a tu diseño)
    modalData.innerHTML = `
    <style>
        #tool-container { padding: 1.5rem; font-family: system-ui, sans-serif; color: #0f172a; }
        .tool-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .tool-label { font-weight: 700; color: #334155; display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .tool-input, .tool-select, .tool-textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; margin-bottom: 1rem; box-sizing: border-box; }
        .btn-redactar { background: #2563eb; color: white; border: none; padding: 1rem; border-radius: 0.75rem; width: 100%; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-redactar:disabled { background: #94a3b8; }
        .resultado-ia { background: #fff9e6; border-left: 5px solid #f1c40f; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; min-height: 200px; font-size: 0.95rem; margin-top: 1rem; border: 1px solid #fef3c7; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .flex-check { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; }
        .badge-tool { background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; border: 1px solid #dbeafe; }
    </style>

    <div id="tool-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin:0; font-size: 1.3rem;">Alta Voluntaria</h2>
            <span class="badge-tool">Asistente IA</span>
        </div>

        <div class="tool-card">
            <label class="tool-label">Nombre del Paciente</label>
            <input type="text" id="nombrePaciente" class="tool-input" placeholder="Opcional...">

            <div class="grid-3">
                <div>
                    <label class="tool-label">Fecha</label>
                    <input type="date" id="fecha" class="tool-input">
                </div>
                <div>
                    <label class="tool-label">Hora</label>
                    <input type="time" id="hora" class="tool-input">
                </div>
                <div>
                    <label class="tool-label">Género</label>
                    <select id="genero" class="tool-select" onchange="window.actualizarEPP()">
                        <option value="H">Hombre</option>
                        <option value="M">Mujer</option>
                    </select>
                </div>
            </div>

            <label class="tool-label">Motivos aducidos:</label>
            <div class="flex-check"><input type="checkbox" class="motivo" value="mejoría de los síntomas"> Mejoría síntomas</div>
            <div class="flex-check"><input type="checkbox" class="motivo" value="remisión de ideas de suicidio"> Remisión ideas suicidio</div>
            <div class="flex-check"><input type="checkbox" class="motivo" value="preferencia por tto ambulatorio"> Tto ambulatorio</div>
            <input type="text" id="otrosMotivos" class="tool-input" style="margin-top:10px" placeholder="Otros motivos...">

            <hr style="border:0; border-top:1px solid #eee; margin: 1.5rem 0;">

            <div class="flex-check">
                <input type="checkbox" id="checkRiesgos" onchange="window.toggleRiesgos()"> 
                <strong>Se explican riesgos</strong>
            </div>
            <div id="contenedorRiesgos" style="display:none">
                <textarea id="textoRiesgos" class="tool-textarea" placeholder="Recaída, abandono tto..."></textarea>
            </div>

            <label class="tool-label">Exploración psicopatológica:</label>
            <select id="tipoExp" class="tool-select" onchange="window.setExploracion(this.value)">
                <option value="default">Por defecto (Normal)</option>
                <option value="libre">Texto libre</option>
            </select>
            <textarea id="textoExploracion" class="tool-textarea" rows="4"></textarea>

            <div class="flex-check">
                <input type="checkbox" id="checkFamilia"> <strong>Acuerdo familiar</strong>
            </div>

            <label class="tool-label">Plan al alta:</label>
            <div class="flex-check"><input type="checkbox" class="check-plan" value="Cita programada en USM"> Cita USM</div>
            <div class="flex-check"><input type="checkbox" class="check-plan" value="Continuará tto habitual"> Continuar tto</div>
            <textarea id="planAltaLibre" class="tool-textarea" placeholder="Detalles adicionales..."></textarea>

            <button type="button" id="btnGenerar" onclick="window.redactarEvolutivo()" class="btn-redactar">
                <i class="fas fa-magic"></i> REDACTAR CON IA
            </button>
        </div>

        <div class="tool-card" style="background: #f8fafc;">
            <label class="tool-label" style="color: #2563eb;">Propuesta de redacción:</label>
            <div id="resultadoIA" class="resultado-ia">Los resultados aparecerán aquí...</div>
            <button class="btn-redactar" style="background:#64748b; margin-top:1rem; padding: 0.6rem;" onclick="window.copyResult()">
                <i class="fas fa-copy"></i> Copiar texto
            </button>
        </div>
    </div>
    `;

    // 3. Lógica de la herramienta vinculada a window para que funcione el HTML inyectado
    const ahora = new Date();
    document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
    document.getElementById('hora').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    window.toggleRiesgos = function() {
        document.getElementById('contenedorRiesgos').style.display = document.getElementById('checkRiesgos').checked ? 'block' : 'none';
    };

    window.actualizarEPP = function() {
        const gen = document.getElementById('genero').value;
        if (document.getElementById('tipoExp').value === 'default') {
            document.getElementById('textoExploracion').value = (gen === 'H') ? EPP_H : EPP_M;
        }
    };

    window.setExploracion = function(tipo) {
        if (tipo === 'default') window.actualizarEPP();
        else document.getElementById('textoExploracion').focus();
    };

    window.redactarEvolutivo = async function() {
        const btn = document.getElementById('btnGenerar');
        const resDiv = document.getElementById('resultadoIA');
        btn.disabled = true;
        btn.innerHTML = 'Procesando...';

        const datos = {
            nombre: document.getElementById('nombrePaciente').value || "el paciente",
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            genero: document.getElementById('genero').value,
            motivos: Array.from(document.querySelectorAll('.motivo:checked')).map(el => el.value),
            otrosMotivos: document.getElementById('otrosMotivos').value,
            epp: document.getElementById('textoExploracion').value,
            riesgosCheck: document.getElementById('checkRiesgos').checked,
            riesgosTexto: document.getElementById('textoRiesgos').value,
            familia: document.getElementById('checkFamilia').checked,
            planChecks: Array.from(document.querySelectorAll('.check-plan:checked')).map(el => el.value),
            planLibre: document.getElementById('planAltaLibre').value
        };

        try {
            const response = await fetch('/api/ia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
            });
            const data = await response.json();
            resDiv.innerText = data.response ? data.response.replace(/\*\*|###|##/g, '').trim() : "Error en IA.";
        } catch (e) {
            resDiv.innerText = "Error de conexión con el Worker.";
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> REDACTAR CON IA';
        }
    };

    window.copyResult = function() {
        navigator.clipboard.writeText(document.getElementById('resultadoIA').innerText);
        alert('Copiado al portapapeles');
    };

    window.actualizarEPP(); // Inicializar texto por defecto
};
