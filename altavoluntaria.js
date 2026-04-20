/**
 * Herramienta: Evolutivo Alta Voluntaria (Interfaz Completa e Idéntica)
 * PSQALDÍA © 2026
 */

// Textos por defecto para la exploración
const EPP_H_AV = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
const EPP_M_AV = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

async function openAltaVoluntariaUI() {
    const modalData = document.getElementById('modalData');
    
    modalData.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            .btn-psq { background-color: #2c3e50; color: white; border-radius: 8px; }
            .btn-psq:hover { background-color: #1a252f; color: white; }
            .form-label { font-weight: 600; color: #34495e; }
            #resultadoIA { background-color: #fff9e6; border-left: 5px solid #f1c40f; white-space: pre-wrap; min-height: 450px; font-size: 0.95rem; }
            .modal-content { max-width: 1000px !important; }
        </style>

        <div class="container-fluid p-4" style="background-color: #fcfdfe; color: #0f172a;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold text-primary"><i class="fas fa-brain"></i> Alta Voluntaria</h4>
                <span class="badge rounded-pill bg-light text-dark border">Asistente de Redacción IA</span>
            </div>

            <div class="row">
                <div class="col-lg-6">
                    <div class="card shadow-sm p-4 mb-4 border-0">
                        <form id="altaForm">
                            <div class="mb-3">
                                <label class="form-label">Nombre del Paciente (opcional)</label>
                                <input type="text" id="nombrePaciente" class="form-control" placeholder="Nombre completo o iniciales">
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">Fecha</label>
                                    <input type="date" id="fechaAV" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Hora</label>
                                    <input type="time" id="horaAV" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Género</label>
                                    <div class="btn-group w-100" role="group">
                                        <input type="radio" class="btn-check" name="generoAV" id="genHAV" value="H" onclick="actualizarEPP_AV()">
                                        <label class="btn btn-outline-primary" for="genHAV">H</label>
                                        <input type="radio" class="btn-check" name="generoAV" id="genMAV" value="M" onclick="actualizarEPP_AV()">
                                        <label class="btn btn-outline-danger" for="genMAV">M</label>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Motivos aducidos (múltiple):</label>
                                <div class="form-check"><input class="form-check-input motivoAV" type="checkbox" value="mejoría de los síntomas"><label class="form-check-label">Mejoría de los síntomas</label></div>
                                <div class="form-check"><input class="form-check-input motivoAV" type="checkbox" value="remisión de ideas de suicidio"><label class="form-check-label">Remisión de ideas de suicidio</label></div>
                                <div class="form-check"><input class="form-check-input motivoAV" type="checkbox" value="empeoramiento en contexto de ingreso"><label class="form-check-label">Empeoramiento en contexto de ingreso</label></div>
                                <div class="form-check"><input class="form-check-input motivoAV" type="checkbox" value="preferencia por tratamiento ambulatorio"><label class="form-check-label">Preferencia por tratamiento ambulatorio</label></div>
                                <div class="form-check"><input class="form-check-input motivoAV" type="checkbox" value="deseo de acompañamiento familiar"><label class="form-check-label">Deseo de acompañamiento familiar</label></div>
                                <input type="text" id="otrosMotivosAV" class="form-control form-control-sm mt-2" placeholder="Otros motivos...">
                            </div>

                            <hr>

                            <div class="row mb-3">
                                <div class="col-md-7">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="checkRiesgosAV" onclick="toggleRiesgos_AV()">
                                        <label class="form-check-label fw-bold">Se explican riesgos:</label>
                                    </div>
                                    <div id="contenedorRiesgosAV" class="d-none">
                                        <textarea id="textoRiesgosAV" class="form-control" rows="2" placeholder="Recaída, abandono tto..."></textarea>
                                    </div>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label small">Capacidad/Comprensión:</label>
                                    <div class="form-check small"><input class="form-check-input capacidadAV" type="checkbox" value="no presenta alteraciones cognitivas"><label class="form-check-label">No alt. cognitivas</label></div>
                                    <div class="form-check small"><input class="form-check-input capacidadAV" type="checkbox" value="no presenta alteraciones psicopatológicas significativas"><label class="form-check-label">No alt. psicopatológicas</label></div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label d-flex justify-content-between align-items-center">
                                    Exploración psicopatológica:
                                    <div class="btn-group btn-group-sm">
                                        <input type="radio" class="btn-check" name="tipoExpAV" id="expNormalAV" onclick="setExploracion_AV('default')">
                                        <label class="btn btn-outline-secondary" for="expNormalAV">Por defecto</label>
                                        <input type="radio" class="btn-check" name="tipoExpAV" id="expLibreAV" onclick="setExploracion_AV('libre')">
                                        <label class="btn btn-outline-secondary" for="expLibreAV">Texto libre</label>
                                    </div>
                                </label>
                                <div id="contExploracionAV" class="d-none mt-2">
                                    <textarea id="textoExploracionAV" class="form-control" rows="5"></textarea>
                                </div>
                            </div>

                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="checkFamiliaAV">
                                <label class="form-check-label fw-bold">Comunicación familiar (acuerdo).</label>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Plan al alta (múltiple):</label>
                                <div class="form-check small">
                                    <input class="form-check-input check-planAV" type="checkbox" value="Acudirá a cita programada con psiquiatría en USM de referencia">
                                    <label class="form-check-label">Cita programada en USM</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input check-planAV" type="checkbox" value="Continuará con su tratamiento psicofarmacológico habitual">
                                    <label class="form-check-label">Continuar tto. habitual</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input check-planAV" type="checkbox" value="En caso de empeoramiento clínico acudirá al servicio de urgencias de referencia">
                                    <label class="form-check-label">Urgencias si empeoramiento</label>
                                </div>
                                <textarea id="planAltaLibreAV" class="form-control mt-2" rows="2" placeholder="Otros detalles del plan..."></textarea>
                            </div>

                            <button type="button" onclick="redactarEvolutivo_AV(this)" class="btn btn-psq w-100 p-3 shadow">
                                <i class="fas fa-magic me-2"></i> REDACTAR CON IA
                            </button>
                        </form>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card shadow-sm p-4 border-0" style="background-color: #fff9e6; border-left: 5px solid #f1c40f !important; position: sticky; top: 10px;">
                        <label class="form-label text-primary fw-bold">Propuesta de redacción (HC):</label>
                        <div id="resultadoIA" class="p-3 mb-3" style="min-height: 450px;">Los resultados aparecerán aquí...</div>
                        <button class="btn btn-outline-secondary btn-sm" onclick="copyResult_AV()">
                            <i class="fas fa-copy me-1"></i> Copiar al portapapeles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inicializar fecha y hora actual
    const ahora = new Date();
    document.getElementById('fechaAV').value = ahora.toISOString().split('T')[0];
    document.getElementById('horaAV').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Por defecto, marcamos "Por defecto" en exploración
    document.getElementById('expNormalAV').checked = true;
}

// Funciones de apoyo
function toggleRiesgos_AV() {
    document.getElementById('contenedorRiesgosAV').classList.toggle('d-none', !document.getElementById('checkRiesgosAV').checked);
}

function actualizarEPP_AV() {
    const generoInput = document.querySelector('input[name="generoAV"]:checked');
    if (!generoInput) return;
    const genero = generoInput.value;
    const area = document.getElementById('textoExploracionAV');
    if (document.getElementById('expNormalAV').checked) {
        area.value = (genero === 'H') ? EPP_H_AV : EPP_M_AV;
    }
}

function setExploracion_AV(tipo) {
    const contenedor = document.getElementById('contExploracionAV');
    if (tipo === 'default') {
        contenedor.classList.add('d-none');
        actualizarEPP_AV();
    } else {
        contenedor.classList.remove('d-none');
        document.getElementById('textoExploracionAV').focus();
    }
}

async function redactarEvolutivo_AV(btn) {
    const resDiv = document.getElementById('resultadoIA');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
    
    const datos = {
        nombre: document.getElementById('nombrePaciente').value || "el paciente",
        fecha: document.getElementById('fechaAV').value,
        hora: document.getElementById('horaAV').value,
        genero: document.querySelector('input[name="generoAV"]:checked')?.value || "N/S",
        motivos: Array.from(document.querySelectorAll('.motivoAV:checked')).map(el => el.value),
        otrosMotivos: document.getElementById('otrosMotivosAV').value,
        epp: document.getElementById('textoExploracionAV').value,
        riesgosCheck: document.getElementById('checkRiesgosAV').checked,
        riesgosTexto: document.getElementById('textoRiesgosAV').value,
        capacidadItems: Array.from(document.querySelectorAll('.capacidadAV:checked')).map(el => el.value),
        familia: document.getElementById('checkFamiliaAV').checked,
        planChecks: Array.from(document.querySelectorAll('.check-planAV:checked')).map(el => el.value),
        planLibre: document.getElementById('planAltaLibreAV').value
    };

    try {
        const response = await fetch('/api/ia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
        });
        const data = await response.json();
        resDiv.innerText = data.response ? data.response.replace(/\*\*|Párrafo \d+:|###|##/g, '').trim() : "Error en el servidor de IA.";
    } catch (e) {
        resDiv.innerText = "Error: No se pudo conectar con el asistente de IA.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

function copyResult_AV() {
    const text = document.getElementById('resultadoIA').innerText;
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
}
