/**
 * ope_gine.js - Gestión unificada de exámenes OPE Ginecología
 * Incluye: Selector, Modo Snack, Ver explicación, Persistencia y Fallos.
 */
let preguntasGine = [];
let respuestasGine = {};
let preguntasVisiblesGine = 20;
let añoGineActual = "";

/**
 * Pantalla inicial: Selector de convocatoria y modo Snack
 */
function openGineSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-female fa-3x" style="color: #db2777; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Ginecología</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenGine('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: #db2777;"></i>
                </button>

                <button onclick="iniciarExamenGine('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid #db2777; background: rgba(219, 39, 119, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: #db2777; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: #db2777;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/**
 * Persistencia: Guardar estado
 */
function guardarEstadoGine() {
    const estado = {
        año: añoGineActual,
        preguntas: preguntasGine,
        respuestas: respuestasGine,
        visibles: preguntasVisiblesGine
    };
    localStorage.setItem('psq_save_gine', JSON.stringify(estado));
}

/**
 * Carga de datos
 */
async function iniciarExamenGine(año, esContinuacion = false) {
    if (!esContinuacion && localStorage.getItem('psq_save_gine')) {
        const data = JSON.parse(localStorage.getItem('psq_save_gine'));
        if (confirm(`Tienes un examen de Ginecología a medias. ¿Quieres continuarlo?`)) {
            añoGineActual = data.año;
            preguntasGine = data.preguntas;
            respuestasGine = data.respuestas;
            preguntasVisiblesGine = data.visibles;
            renderizarExamenGine();
            return;
        }
    }

    añoGineActual = año;
    preguntasVisiblesGine = 20;
    respuestasGine = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#db2777;"></i><br><br><b>Cargando Ginecología...</b></div>`;

    try {
        const response = await fetch(`/?sheet=Ope_Gine${año === 'snack' ? '20' : año}`);
        const data = await response.json();
        const rows = data.values || [];

        preguntasGine = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasGine = preguntasGine.sort(() => Math.random() - 0.5).slice(0, 10);
            preguntasVisiblesGine = 10;
        }

        renderizarExamenGine();
        guardarEstadoGine();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error: ${error.message}</div>`;
    }
}

function renderizarExamenGine() {
    const container = document.getElementById('modalData');
    const titulo = añoGineActual === 'snack' ? 'Snack Ginecología' : `OPE GINECOLOGÍA 20${añoGineActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#db2777; font-size:1.6rem;">${titulo}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg-gine">${Math.min(preguntasVisiblesGine, preguntasGine.length)}</span> de ${preguntasGine.length}
                    </p>
                </div>
                <button onclick="openGineSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-gine">${generarBloqueGine(0, preguntasVisiblesGine)}</div>`;

    if (preguntasVisiblesGine < preguntasGine.length) {
        html += `<button id="btn-mas-gine" onclick="cargarMasGine()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS...</button>`;
    }

    html += `
            <div id="footer-gine" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenGine()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:#db2777; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(219, 39, 119, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloqueGine(inicio, fin) {
    let bloqueHtml = '';
    preguntasGine.slice(inicio, fin).forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasGine[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-gine-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-gine-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasGine[${realIndex}] = '${letra}'; guardarEstadoGine();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualGine(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-gine-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #db2777; border-radius:12px;">
                    <strong style="color:#db2777; display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasGine() {
    const inicio = preguntasVisiblesGine;
    preguntasVisiblesGine = Math.min(preguntasVisiblesGine + 20, preguntasGine.length);
    document.getElementById('contenedor-preguntas-gine').insertAdjacentHTML('beforeend', generarBloqueGine(inicio, preguntasVisiblesGine));
    document.getElementById('cont-preg-gine').innerText = preguntasVisiblesGine;
    if (preguntasVisiblesGine >= preguntasGine.length) document.getElementById('btn-mas-gine').style.display = 'none';
    guardarEstadoGine();
}

function revelarIndividualGine(idx) {
    const fb = document.getElementById(`feedback-gine-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenGine() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasGine.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-gine-${idx}`);
        const feedback = document.getElementById(`feedback-gine-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasGine[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
            } else {
                fallosIndices.push(idx);
                bloque.style.borderColor = '#ef4444';
            }
        }
    });

    localStorage.removeItem('psq_save_gine');

    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-gine');
        footer.innerHTML = `
            <button onclick="repasarFallosGine([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                REPASAR ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openGineSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                SALIR
            </button>`;
    }

    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasGine.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosGine(indices) {
    preguntasGine = indices.map(idx => preguntasGine[idx]);
    respuestasGine = {};
    preguntasVisiblesGine = preguntasGine.length;
    renderizarExamenGine();
}
