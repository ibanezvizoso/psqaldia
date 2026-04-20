/**
 * Herramienta: Evolutivo Alta Voluntaria para PSQALDÍA
 * Inyecta la interfaz y la lógica dentro del modal principal sin dependencias de Bootstrap.
 */

window.openAltaVoluntariaUI = function() {
    const modalData = document.getElementById('modalData');
    
    // 1. Definición de constantes de texto (EPP)
    const EPP_H = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
    const EPP_M = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

    // 2. Inyección del HTML y CSS
    modalData.innerHTML = `
    <style>
        #tool-container { padding: 1.5rem; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 900px; margin: auto; }
        .tool-grid-main { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 768px) { .tool-grid-main { grid-template-columns: 1fr; } }
        
        .tool-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .tool-label { font-weight: 700; color: #334155; display: block; margin-bottom: 0.4rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.025em; }
        
        .tool-input, .tool-select, .tool-textarea { 
            width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; 
            margin-bottom: 1rem; box-sizing: border-box; font-family: inherit; font-size: 0.95rem;
        }
        .tool-input:focus, .tool-textarea:focus { outline: 2px solid #2563eb; border-color: transparent; }
        
        .btn-redactar { 
            background: #2563eb; color: white; border: none; padding: 1rem; border-radius: 0.75rem; 
            width: 100%; font-weight: 800; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-redactar:hover { background: #1d4ed8; }
        .btn-redactar:disabled { background: #94a3b8; cursor: not-allowed; }
        
        .resultado-ia { 
            background: #fff9e6; border-left: 5px solid #f1c40f; padding: 1.2rem; border-radius: 0.5rem; 
            white-space: pre-wrap; min-height: 350px; font-size: 0.95rem; margin-top: 1rem; border: 1px solid #fef3c7; line-height: 1.5;
        }
        
        .grid-3 { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 10px; }
        .flex-check { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 0.9rem; cursor: pointer; }
        .flex-check input { margin-top: 3px; }
        
        .badge-tool { background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; border: 1px solid #dbeafe; }
        hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
        .section-title { font-size: 0.8rem; font-weight: 800; color: #64748b; margin-bottom: 10px; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    </style>

    <div id="tool-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin:0; font-size: 1.3rem; color: #1e293b;">Evolutivo: Alta Voluntaria</h2>
            <span class="badge-tool">Asistente IA</span>
        </div>

        <div class="tool-grid-main">
            <div class="col-inputs">
                <div class="tool-card">
                    <label class="tool-label">Identificación</label>
                    <input type="text" id="nombrePaciente" class="tool-input" placeholder="Nombre o iniciales (opcional)">

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
                                <option value="H">H</option>
                                <option value="M">M</option>
                            </select>
                        </div>
                    </div>

                    <label class="tool-label">Motivos aducidos</label>
                    <div class="flex-check"><input type="checkbox" class="motivo" value="mejoría de los síntomas"> Mejoría de síntomas</div>
                    <div class="flex-check"><input type="checkbox" class="motivo" value="remisión de ideas de suicidio"> Remisión ideas suicidio</div>
                    <div class="flex-check"><input type="checkbox" class="motivo" value="empeoramiento en contexto de ingreso"> Empeoramiento en ingreso</div>
                    <div class="flex-check"><input type="checkbox" class="motivo" value="preferencia por tratamiento ambulatorio"> Tto. ambulatorio</div>
                    <div class="flex-check"><input type="checkbox" class="motivo" value="deseo de acompañamiento familiar"> Deseo acompañamiento fam.</div>
                    <input type="text" id="otrosMotivos" class="tool-input" style="margin-top:8px" placeholder="Otros motivos...">

                    <label class="tool-label">Capacidad y Riesgos</label>
                    <div class="flex-check">
                        <input type="checkbox" class="capacidad" value="no presenta alteraciones cognitivas"> 
                        <span>Sin alteraciones cognitivas</span>
                    </div>
                    <div class="flex-check">
                        <input type="checkbox" class="capacidad" value="no presenta alteraciones psicopatológicas significativas"> 
                        <span>Sin alteraciones psicopatológicas</span>
                    </div>
                    
                    <div class="flex-check" style="margin-top:10px; color: #b91c1c;">
                        <input type="checkbox" id="checkRiesgos" onchange="window.toggleRiesgos()"> 
                        <strong>Se explican riesgos del alta</strong>
                    </div>
                    <div id="contenedorRiesgos" style="display:none">
                        <textarea id="textoRiesgos" class="tool-textarea" placeholder="Recaída, abandono de tto, riesgo autolítico..."></textarea>
                    </div>

                    <label class="tool-label">Exploración (EPP)</label>
                    <select id="tipoExp" class="tool-select" onchange="window.setExploracion(this.value)">
                        <option value="default">Normal (Por defecto)</option>
                        <option value="libre">Texto libre / Personalizado</option>
                    </select>
                    <textarea id="textoExploracion" class="tool-textarea" rows="4"></textarea>

                    <div class="flex-check">
                        <input type="checkbox" id="checkFamilia"> <strong>Comunicación y acuerdo familiar</strong>
                    </div>

                    <label class="tool-label">Plan al alta</label>
                    <div class="flex-check"><input type="checkbox" class="check-plan" value="Acudirá a cita programada con psiquiatría en USM de referencia"> Cita en USM</div>
                    <div class="flex-check"><input type="checkbox" class="check-plan" value="Continuará con su tratamiento psicofarmacológico habitual"> Continuar tto habitual</div>
                    <div class="flex-check"><input type="checkbox" class="check-plan" value="En caso de empeoramiento clínico acudirá al servicio de urgencias"> Urgencias si empeora</div>
                    <textarea id="planAltaLibre" class="tool-textarea" style="margin-top:8px" placeholder="Otros detalles del plan..."></textarea>

                    <button type="button" id="btnGenerar" onclick="window.redactarEvolutivo()" class="btn-redactar">
                        <i class="fas fa-magic"></i> REDACTAR CON IA
                    </button>
                </div>
            </div>

            <div class="col-resultado">
                <div class="tool-card" style="background: #f8fafc; position: sticky; top: 1rem;">
                    <label class="tool-label" style="color: #2563eb;">Propuesta de redacción (HC)</label>
                    <div id="resultadoIA" class="resultado-ia">Rellena los datos y pulsa redactar...</div>
                    
                    <button class="btn-redactar" style="background:#64748b; margin-top:1rem; padding: 0.6rem; font-size: 0.85rem;" onclick="window.copyResult()">
                        <i class="fas fa-copy"></i> COPIAR AL PORTAPAPELES
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    // 3. Lógica Funcional
    
    // Inicializar fecha y hora
    const ahora = new Date();
    document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
    document.getElementById('hora').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    window.toggleRiesgos = function() {
        const check = document.getElementById('checkRiesgos').checked;
        document.getElementById('contenedorRiesgos').style.display = check ? 'block' : 'none';
        if(check) document.getElementById('textoRiesgos').focus();
    };

    window.actualizarEPP = function() {
        const gen = document.getElementById('genero').value;
        const tipo = document.getElementById('tipoExp').value;
        if (tipo === 'default') {
            document.getElementById('textoExploracion').value = (gen === 'H') ? EPP_H : EPP_M;
        }
    };

    window.setExploracion = function(tipo) {
        if (tipo === 'default') {
            window.actualizarEPP();
        } else {
            document.getElementById('textoExploracion').focus();
        }
    };

    window.redactarEvolutivo = async function() {
        const btn = document.getElementById('btnGenerar');
        const resDiv = document.getElementById('resultadoIA');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESANDO...';
        resDiv.innerText = "Generando redacción clínica...";

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
            capacidad: Array.from(document.querySelectorAll('.capacidad:checked')).map(el => el.value),
            familia: document.getElementById('checkFamilia').checked,
            planChecks: Array.from(document.querySelectorAll('.check-plan:checked')).map(el => el.value),
            planLibre: document.getElementById('planAltaLibre').value
        };

        try {
            const response = await fetch('/api/ia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    toolId: 'alta-voluntaria', 
                    context: JSON.stringify(datos) 
                })
            });
            
            const data = await response.json();
            if (data.response) {
                // Limpiamos formatos de markdown que a veces devuelve la IA
                resDiv.innerText = data.response.replace(/\*\*|###|##/g, '').trim();
            } else {
                resDiv.innerText = "Error: La IA no pudo generar el texto. Inténtalo de nuevo.";
            }
        } catch (e) {
            resDiv.innerText = "Error de conexión: No se pudo contactar con el asistente.";
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> REDACTAR CON IA';
        }
    };

    window.copyResult = function() {
        const texto = document.getElementById('resultadoIA').innerText;
        if (texto.includes('Rellena los datos')) return;
        
        navigator.clipboard.writeText(texto).then(() => {
            const btn = event.currentTarget;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> ¡COPIADO!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '#64748b';
            }, 2000);
        });
    };

    // Inicializar el texto de la exploración al cargar
    window.actualizarEPP();
};
