/**
 * Motor Farmacocinético SSS (Start, Stop & Switch)
 * PSQALDÍA © 2026
 */

const PK_ENGINE = {
    // Constantes matemáticas
    RESOLUTION: 100, // Puntos de la gráfica

    // 1. CÁLCULOS MATEMÁTICOS BASE
    
    // Hallar Ka (absorción) a partir de Tmax y Ke (eliminación)
    // Se usa aproximación numérica ya que Ka no es despejable directamente
    calculateKa(tmax, ke) {
        if (tmax <= 0) return 10; // Absorción instantánea (teórica)
        let ka = ke * 1.1;
        for (let i = 0; i < 50; i++) {
            let func = (Math.log(ka / ke) / (ka - ke)) - tmax;
            let deriv = (1 / (ka * (ka - ke))) - (Math.log(ka / ke) / Math.pow(ka - ke, 2));
            ka = ka - func / deriv;
            if (Math.abs(func) < 0.0001) break;
        }
        return ka;
    },

    // Ecuación de Bateman (Concentración de una dosis única a tiempo t)
    bateman(t, dose, ke, ka, vd) {
        if (t < 0) return 0;
        // Simplificación: al ser relativo (%), Vd y biodisponibilidad se normalizan
        // C(t) = D * (ka / (ka - ke)) * (exp(-ke*t) - exp(-ka*t))
        return dose * (ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
    },

    // 2. SIMULADORES DE ESCENARIOS

    /**
     * Genera los puntos de la gráfica
     * @param {Object} params - Datos del fármaco (t12, tmax) y pauta (dosis, frecuencia, cambios)
     */
    generateCurve(params, durationHours) {
        const ke = Math.log(2) / params.t12;
        const ka = this.calculateKa(params.tmax, ke);
        const step = durationHours / this.RESOLUTION;
        let points = [];

        // Para cada punto de tiempo en la gráfica...
        for (let t = 0; t <= durationHours; t += step) {
            let totalC = 0;
            
            // Sumamos el efecto de todas las dosis administradas hasta ese momento t
            params.pauta.forEach(dosis => {
                if (t >= dosis.tiempo) {
                    totalC += this.bateman(t - dosis.tiempo, dosis.cantidad, ke, ka, params.vd || 1);
                }
            });
            
            points.push({ x: t, y: totalC });
        }
        
        // Normalización relativa: El pico del Steady State de la dosis inicial = 100%
        const refSS = this.calculateSteadyStatePeak(params.pauta[0].cantidad, ke, ka, params.frecuencia);
        return points.map(p => ({ x: p.x, y: (p.y / refSS) * 100 }));
    },

    calculateSteadyStatePeak(dose, ke, ka, tau) {
        // Fórmula del pico en estado estacionario para dosis repetidas
        const rMax = (1 / (1 - Math.exp(-ke * tau)));
        // Retornamos una aproximación del pico máximo
        return dose * (ka / (ka - ke)) * rMax;
    },

    // 3. GESTIÓN DE INTERFAZ (UI)

    // Filtra y prepara los fármacos por familia
    getFamilies(db) {
        return [...new Set(db.map(f => f.familia))].filter(Boolean);
    },

    getFarmacosByFamilia(db, familia) {
        return db.filter(f => f.familia === familia);
    },

    // Crea la pauta de dosis basada en los inputs del usuario
    createPauta(mode, initialDose, freq, changeDose, changeDay, durationDays) {
        let pauta = [];
        const durationHours = durationDays * 24;
        const interval = freq;

        // Caso START: Empezamos desde cero
        if (mode === 'START') {
            for (let t = 0; t < durationHours; t += interval) {
                let actualDose = initialDose;
                if (changeDose && t >= changeDay * 24) {
                    actualDose = changeDose;
                }
                pauta.push({ tiempo: t, cantidad: actualDose });
            }
        }
        
        // Caso STOP / SWITCH: Asumimos Steady State previo
        // Para simular SS, "inyectamos" dosis virtuales antes del tiempo 0
        if (mode === 'STOP' || mode === 'SWITCH') {
            const lookback = 5 * 100; // Suficiente para estabilizar cualquier fármaco
            for (let t = -lookback; t < durationHours; t += interval) {
                let actualDose = initialDose;
                
                // Si es antes de t=0, es la dosis de mantenimiento
                if (t < 0) {
                    actualDose = initialDose;
                } else {
                    // Si el usuario decide parar o cambiar dosis en el t=0 o después
                    if (changeDay !== undefined && t >= changeDay * 24) {
                        actualDose = changeDose; // Puede ser 0 para STOP
                    }
                }
                
                if (actualDose > 0 || t < 0) {
                    pauta.push({ tiempo: t, cantidad: actualDose });
                }
            }
        }

        return pauta;
    }
};

// Exportar para que index.js lo use
window.PK_ENGINE = PK_ENGINE;
