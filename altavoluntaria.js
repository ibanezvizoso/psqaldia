/**
 * Herramienta: Evolutivo Alta Voluntaria (AISLAMIENTO TOTAL CON IFRAME)
 * PSQALDÍA © 2026
 */

async function openAltaVoluntariaUI() {
    const modalData = document.getElementById('modalData');
    
    // 1. Limpiamos el contenido previo
    modalData.innerHTML = '';

    // 2. Creamos un iframe para aislar Bootstrap por completo de la home
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '85vh'; // Ajusta la altura según necesites
    iframe.style.border = 'none';
    iframe.style.borderRadius = '1.5rem';
    
    modalData.appendChild(iframe);

    // 3. Escribimos TU código HTML exacto dentro del iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { background-color: #fcfdfe; font-family: system-ui, sans-serif; padding: 20px; }
                .btn-psq { background-color: #2c3e50; color: white; border-radius: 8px; }
                .btn-psq:hover { background-color: #1a252f; color: white; }
                .form-label { font-weight: 600; color: #34495e; }
                #resultadoIA { background-color: #fff9e6; border-left: 5px solid #f1c40f; white-space: pre-wrap; min-height: 400px; font-size: 0.95rem; padding: 15px; }
                .sticky-top { top: 10px; }
            </style>
        </head>
        <body>
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold text-primary"><i class="fas fa-brain"></i> Alta Voluntaria</h4>
                    <span class="badge rounded-pill bg-light text-dark border">Asistente IA</span>
                </div>

                <div class="row">
                    <div class="col-lg-6">
                        <div class="card shadow-sm p-4 mb-4 border-0">
                            <form id="altaForm">
                                <div class="mb-3">
                                    <label class="form-label">Nombre del Paciente (opcional)</label>
                                    <input type="text" id="nombrePaciente" class="form-control" placeholder="Nombre o iniciales">
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
                                            <input type="radio" class="btn-check" name="generoAV" id="genHAV" value="H">
                                            <label class="btn btn-outline-primary" for="genHAV">H</label>
                                            <input type="radio" class="btn-check" name="generoAV" id="genMAV" value="M">
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
                                            <input class="form-check-input" type="checkbox" id="checkRiesgosAV">
                                            <label class="form-check-label fw-bold">Se explican riesgos:</label>
                                        </div>
                                        <div id="contenedorRiesgosAV" style="display:none">
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
                                            <input type="radio" class="btn-check" name="tipoExpAV" id="expNormalAV" checked>
                                            <label class="btn btn-outline-secondary" for="expNormalAV">Por defecto</label>
                                            <input type="radio" class="btn-check" name="tipoExpAV" id="expLibreAV">
                                            <label class="btn btn-outline-secondary" for="expLibreAV">Texto libre</label>
                                        </div>
                                    </label>
                                    <div id="contExploracionAV" style="display:none" class="mt-2">
                                        <textarea id="textoExploracionAV" class="form-control" rows="5"></textarea>
                                    </div>
                                </div>

                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="checkFamiliaAV">
                                    <label class="form-check-label fw-bold">Comunicación familiar (acuerdo).</label>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Plan al alta (múltiple):</label>
                                    <div class="form-check small"><input class="form-check-input check-planAV" type="checkbox" value="Acudirá a cita programada"><label class="form-check-label">Cita USM</label></div>
                                    <div class="form-check small"><input class="form-check-input check-planAV" type="checkbox" value="Continuará tto habitual"><label class="form-check-label">Continuar tto</label></div>
                                    <textarea id="planAltaLibreAV" class="form-control mt-2" rows="2" placeholder="Otros detalles..."></textarea>
                                </div>

                                <button type="button" id="btnRedactarAV" class="btn btn-psq w-100 p-3 shadow">
                                    <i class="fas fa-magic me-2"></i> REDACTAR CON IA
                                </button>
                            </form>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="card shadow-sm p-4 border-0 sticky-top" style="background-color: #fff9e6; border-left: 5px solid #f1c40f !important;">
                            <label class="form-label text-primary fw-bold">Propuesta de redacción (HC):</label>
                            <div id="resultadoIA">Los resultados aparecerán aquí...</div>
                            <button id="btnCopiarAV" class="btn btn-outline-secondary btn-sm mt-3">
                                <i class="fas fa-copy me-1"></i> Copiar al portapapeles
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const EPP_H = "Consciente. Abordable y colaborador. Orientado globalmente. Atento. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímico. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";
                const EPP_M = "Consciente. Abordable y colaboradora. Orientada globalmente. Atenta. Lenguaje fluido y espontáneo. Discurso coherente. No alteraciones psicomotrices. No alteraciones en el contenido del pensamiento. No alteraciones sensoperceptivas. Eutímica. No apatía ni anhedonia. No ansiedad patológica. Sueño conservado. Normorexia. No auto ni heteroagresividad. No ideas de suicidio en este momento.";

                // Inicializar
                const ahora = new Date();
                document.getElementById('fechaAV').value = ahora.toISOString().split('T')[0];
                document.getElementById('horaAV').value = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                document.getElementById('checkRiesgosAV').onclick = () => {
                    document.getElementById('contenedorRiesgosAV').style.display = document.getElementById('checkRiesgosAV').checked ? 'block' : 'none';
                };

                const actualizarEPP = () => {
                    const gen = document.querySelector('input[name="generoAV"]:checked')?.value;
                    if (document.getElementById('expNormalAV').checked && gen) {
                        document.getElementById('textoExploracionAV').value = (gen === 'H') ? EPP_H : EPP_M;
                    }
                };

                document.querySelectorAll('input[name="generoAV"]').forEach(r => r.onchange = actualizarEPP);
                document.getElementById('expNormalAV').onchange = () => {
                    document.getElementById('contExploracionAV').style.display = 'none';
                    actualizarEPP();
                };
                document.getElementById('expLibreAV').onchange = () => {
                    document.getElementById('contExploracionAV').style.display = 'block';
                    document.getElementById('textoExploracionAV').focus();
                };

                document.getElementById('btnRedactarAV').onclick = async () => {
                    const btn = document.getElementById('btnRedactarAV');
                    btn.disabled = true;
                    btn.innerHTML = 'Procesando...';

                    const datos = {
                        nombre: document.getElementById('nombrePaciente').value || "el paciente",
                        fecha: document.getElementById('fechaAV').value,
                        motivos: Array.from(document.querySelectorAll('.motivoAV:checked')).map(el => el.value),
                        epp: document.getElementById('textoExploracionAV').value,
                        plan: document.getElementById('planAltaLibreAV').value
                    };

                    try {
                        const response = await fetch('/api/ia', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ toolId: 'alta-voluntaria', context: JSON.stringify(datos) })
                        });
                        const data = await response.json();
                        document.getElementById('resultadoIA').innerText = data.response || "Error IA";
                    } catch (e) {
                        document.getElementById('resultadoIA').innerText = "Error de conexión";
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-magic me-2"></i> REDACTAR CON IA';
                    }
                };

                document.getElementById('btnCopiarAV').onclick = () => {
                    navigator.clipboard.writeText(document.getElementById('resultadoIA').innerText);
                    alert('Copiado');
                };
            <\/script>
        </body>
        </html>
    `);
    doc.close();
}
