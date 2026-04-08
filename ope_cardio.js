/**
 * ope_cardio.js - Gestión de exámenes OPE Cardiología
 * Motor v4.0 - PSQ al día
 */
let preguntasCar = [];
let respuestasCar = {};
let preguntasVisiblesCar = 20;
let añoCarActual = "";
let modoSnackCar = false;

function openCarSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-heartbeat fa-3x" style="color: #b91c1c; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Cardiología</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Elige cómo quieres estudiar</p>
            </div>
            
            <div style="display: grid; gap: 15px; margin-bottom: 2rem;">
                <div style="background: var(--bg); padding: 1rem; border-radius: 20px; border: 1px solid var(--border);">
                    <b style="display: block; margin-bottom: 10px; color: var(--text-main);">OPE 2022 (SERGAS)</b>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="iniciarExamenCar('22', false)" style="padding: 0.8rem; border-radius: 12px; border: none; background: #b91c1c; color: white; cursor: pointer; font-weight: 700;">
                            MODO EXAMEN
                        </button>
                        <button onclick="iniciarExamenCar('22', true)" style="padding: 0.8rem; border-radius: 12px; border: 1px solid #b91c1c; background: transparent; color: #b91c1c; cursor: pointer; font-weight: 700;">
                            MODO SNACK
                        </button>
                    </div>
                </div>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

async function iniciarExamenCar(año, snack) {
    añoCarActual = año;
    modoSnackCar = snack;
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
                explicacion: (row[6] || "No hay explicación disponible para esta pregunta.").trim()
            }));

        if (modoSnackCar) {
            preguntasCar = preguntasCar.sort(() => Math.random() - 0.5); // Mezclar para el modo snack
        }

        renderizarExamenCar();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error al cargar la hoja Ope_Car${año}. Revisa el nombre en Sheets.</div>`;
    }
}

function renderizarExamenCar() {
    const container = document.getElementById('modalData');
    const titulo = modoSnackCar ? "MODO SNACK CARDIO" : `OPE CARDIO 20${añoCarActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#b91c1c; font-size:1.6rem;">${titulo}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted); text-transform: uppercase; letter-spacing:1px;">
                        Preguntas: <span id="cont-preg-car">${Math.min(preguntasVisiblesCar, preguntasCar.length)}</span> de ${preguntasCar.length}
                    </p>
                </div>
                <button onclick="openCarSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>
            
            <div id="contenedor-preguntas-car">
                ${generarBloqueCar(0, preguntasVisiblesCar)}
            </div>

            <div id="footer-car" style="margin-top:2rem; padding-bottom:2rem;">
                ${preguntasVisiblesCar < preguntasCar.length ? 
                    `<button onclick="verMasCar()" style="width:100%; padding:1.2rem; border-radius:15px; background:var(--card); border:2px solid var(--border); color:var(--text-main); font-weight:800; cursor:pointer; margin-bottom:1rem;">CARGAR MÁS PREGUNTAS</button>` : ''}
                
                ${!modoSnackCar ? `
                    <button onclick="corregirExamenCar()" style="width:100%; height:60px; border-radius:15px; font-weight:900; background:#b91c1c; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(185, 28, 28, 0.3); font-size:1.1rem;">
                        FINALIZAR Y CORREGIR
                    </button>
                ` : ''}
            </div>
        </div>`;
    container.innerHTML = html;
}

function generarBloqueCar(inicio, fin) {
    let bloqueHtml = '';
    preguntasCar.slice(inicio, fin).forEach((p, i) => {
        const realIndex = inicio + i;
        bloqueHtml += `
            <div id="bloque-car-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border); transition: all 0.3s ease;">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${realIndex + 1}. ${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label class="opcion-car" style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main); transition:0.2s;">
                            <input type="radio" name="preg-car-${realIndex}" value="${letra}" style="accent-color:#b91c1c;" 
                                onclick="gestionarRespuestaCar(${realIndex}, '${letra}')">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <div id="feedback-car-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #b91c1c; border-radius:12px;">
                    <strong style="color:#b91c1c; display:block; margin-bottom:8px;">RESULTADO: <span id="res-car-${realIndex}"></span></strong>
                    <div style="font-size:0.9rem; opacity:0.9; line-height:1.5;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function gestionarRespuestaCar(idx, letra) {
    respuestasCar[idx] = letra;
    if (modoSnackCar) {
        const p = preguntasCar[idx];
        const feedback = document.getElementById(`feedback-car-${idx}`);
        const resText = document.getElementById(`res-car-${idx}`);
        const bloque = document.getElementById(`bloque-car-${idx}`);
        
        feedback.style.display = 'block';
        if (letra === p.correcta) {
            resText.innerText = "¡CORRECTO!";
            resText.style.color = "#22c55e";
            bloque.style.borderColor = "#22c55e";
        } else {
            resText.innerText = `INCORRECTO (La correcta era la ${p.correcta})`;
            resText.style.color = "#ef4444";
            bloque.style.borderColor = "#ef4444";
        }
        // Deshabilitar el resto de opciones en modo snack
        const inputs = document.getElementsByName(`preg-car-${idx}`);
        inputs.forEach(input => input.disabled = true);
    }
}

function verMasCar() {
    const contenedor = document.getElementById('contenedor-preguntas-car');
    const inicio = preguntasVisiblesCar;
    preguntasVisiblesCar += 20;
    const nuevoBloque = generarBloqueCar(inicio, preguntasVisiblesCar);
    contenedor.insertAdjacentHTML('beforeend', nuevoBloque);
    document.getElementById('cont-preg-car').innerText = Math.min(preguntasVisiblesCar, preguntasCar.length);
    if (preguntasVisiblesCar >= preguntasCar.length) {
        document.getElementById('footer-car').querySelector('button').style.display = 'none';
    }
}

function corregirExamenCar() {
    let aciertos = 0;
    let contestadas = Object.keys(respuestasCar).length;
    
    if (contestadas < 10) {
        if (!confirm(`Solo has respondido ${contestadas} preguntas. ¿Seguro que quieres corregir ya?`)) return;
    }

    preguntasCar.forEach((p, idx) => {
        const feedback = document.getElementById(`feedback-car-${idx}`);
        const resText = document.getElementById(`res-car-${idx}`);
        const bloque = document.getElementById(`bloque-car-${idx}`);
        
        if (feedback) {
            feedback.style.display = 'block';
            if (respuestasCar[idx] === p.correcta) {
                aciertos++;
                resText.innerText = "¡CORRECTO!";
                resText.style.color = "#22c55e";
                bloque.style.borderColor = "#22c55e";
            } else {
                resText.innerText = `INCORRECTO (Era la ${p.correcta})`;
                resText.style.color = "#ef4444";
                bloque.style.borderColor = "#ef4444";
            }
        }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`RESULTADO OPE CARDIO:\n\nAciertos: ${aciertos}\nTotal preguntas: ${preguntasCar.length}\n\nRevisa las explicaciones debajo de cada pregunta.`);
}
