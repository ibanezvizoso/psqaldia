/**
 * ope_cardio.js - Gestión de exámenes OPE Cardiología
 * Basado en el motor de PSQ al día
 */
let preguntasCar = [];
let respuestasCar = {};
let preguntasVisiblesCar = 20;
let añoCarActual = "";

function openCarSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-heartbeat fa-3x" style="color: #b91c1c; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Cardiología</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenCar('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: #b91c1c;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

async function iniciarExamenCar(año) {
    añoCarActual = año;
    preguntasVisiblesCar = 20;
    respuestasCar = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#b91c1c;"></i><br><br><b>Cargando Cardiología...</b></div>`;

    try {
        const response = await fetch(`/?sheet=Ope_Car${año}`);
        const data = await response.json();
        const rows = data.values || [];

        preguntasCar = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        renderizarExamenCar();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error: ${error.message}</div>`;
    }
}

function renderizarExamenCar() {
    const container = document.getElementById('modalData');
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#b91c1c; font-size:1.6rem;">OPE CARDIO 20${añoCarActual}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Preguntas: <span id="cont-preg-car">${Math.min(preguntasVisiblesCar, preguntasCar.length)}</span> de ${preguntasCar.length}
                    </p>
                </div>
                <button onclick="openCarSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>
            <div id="contenedor-preguntas-car">${generarBloqueCar(0, preguntasVisiblesCar)}</div>
            <div id="footer-car" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenCar()" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:#b91c1c; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(185, 28, 28, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    container.innerHTML = html;
}

function generarBloqueCar(inicio, fin) {
    let bloqueHtml = '';
    preguntasCar.slice(inicio, fin).forEach((p, i) => {
        const realIndex = inicio + i;
        bloqueHtml += `
            <div id="bloque-car-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-car-${realIndex}" value="${letra}" onclick="respuestasCar[${realIndex}] = '${letra}';">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <div id="feedback-car-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #b91c1c; border-radius:12px;">
                    <strong style="color:#b91c1c; display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function corregirExamenCar() {
    let aciertos = 0;
    preguntasCar.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-car-${idx}`);
        const feedback = document.getElementById(`feedback-car-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasCar[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
            } else {
                bloque.style.borderColor = '#ef4444';
            }
        }
    });
    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasCar.length}`);
}
