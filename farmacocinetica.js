/**
 * farmacocinetica.js · Simulador farmacocinético · PSQ AL DÍA © 2026
 *
 * Datos: pestaña Data_Farmacocinetica del Google Sheets (el Worker devuelve A2:Z500, sin cabecera).
 * Columnas usadas: A fármaco · B t½ (h) · C Tmax (h) · D Vd (L/kg, no interviene en la curva relativa)
 *                  · E comentario · F familia
 *
 * Modelo: un compartimento, absorción y eliminación de primer orden (función de Bateman) y
 * superposición de dosis. ka se obtiene a partir de Tmax y t½. El fármaco que se retira parte del
 * estado estacionario exacto con su dosis actual (suma infinita de tomas previas, en forma cerrada).
 * 100 % = pico en estado estacionario con la dosis de referencia de cada fármaco.
 */
(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Textos
    // ------------------------------------------------------------------
    const TXT = {
        es: {
            page: {
                hero_t: 'Simulador farmacocinético',
                hero_p: 'Niveles plasmáticos relativos al iniciar, retirar o cambiar un psicofármaco, según su semivida, su Tmax y la pauta.',
                c1_t: 'Acumulación hasta el estado estacionario',
                c1_p: 'Ve cómo se acumula el fármaco toma a toma según su semivida y el intervalo de dosis, y cuándo se estabiliza.',
                c2_t: 'Retiradas y cambios cruzados',
                c2_p: 'Simula una retirada escalonada o un cambio entre dos fármacos y comprueba qué día baja uno y sube el otro.',
                c3_t: 'Resumen en cifras',
                c3_p: 'Día en que se alcanza el 90 % del estado estacionario, días hasta bajar del 50, 10 y 3 % tras la última toma y fluctuación entre tomas.',
                loading: 'Cargando simulador…',
                info_h: 'Fundamentos del modelo',
                info_p1: 'Cada toma se modela con un <b>compartimento único</b> y absorción y eliminación de primer orden (<b>función de Bateman</b>). La constante de eliminación sale de la semivida y la de absorción se calcula para que el pico de una dosis única coincida con el Tmax del fármaco. El nivel en cada momento es la suma de todas las tomas (<b>superposición</b>).',
                info_p2: 'En la retirada, y en el fármaco que se retira durante un cambio, se parte del <b>estado estacionario con la dosis actual</b>, calculado de forma exacta, como si el paciente la tomara desde hace tiempo indefinido.',
                info_legend: '<b>C(t)</b>: nivel tras una toma, en el tiempo <i>t</i> · <b>D</b>: dosis · <b>k<sub>a</sub></b>: constante de absorción · <b>k<sub>e</sub></b>: constante de eliminación · <b>t<sub>i</sub></b>: momento de cada toma',
                info_note: '<b>Valores relativos.</b> 100 % = pico en estado estacionario con la dosis de referencia de cada fármaco: la <b>dosis actual</b> en el que se retira y la <b>dosis final de la pauta</b> en el que se inicia. Si la pauta sube por encima de esa dosis, la curva pasa del 100 %. La biodisponibilidad y el volumen de distribución no cambian la forma de la curva relativa, por eso no intervienen. Cada fármaco se normaliza por separado: en un cambio, que las curvas se crucen no indica dosis equivalentes ni la misma ocupación de receptores.',
                lim_h: 'Qué no tiene en cuenta',
                lim: [
                    '<b>Metabolitos activos.</b> Se usa una única semivida por fármaco (la del principio activo o la del metabolito activo más relevante); el compuesto original y sus metabolitos no se representan por separado.',
                    '<b>Cinética no lineal.</b> El modelo es lineal: no recoge la acumulación desproporcionada con la dosis (por ejemplo, paroxetina o fluoxetina).',
                    '<b>Variabilidad individual.</b> Se usan valores medios de adultos. No incluye interacciones, inducción o inhibición enzimática (por ejemplo, el tabaco con clozapina u olanzapina), farmacogenética (CYP2D6, CYP2C19), edad ni insuficiencia hepática o renal.',
                    '<b>Formulaciones.</b> No es válido para inyectables de liberación prolongada.',
                    '<b>Efecto clínico.</b> No representa el efecto ni la ocupación de receptores. Sirve para orientar la planificación; no sustituye a la monitorización de niveles ni al juicio clínico.'
                ],
                src_h: 'Fuentes',
                src_intro: 'Parámetros de cada fármaco (t½ y Tmax): valores medios en adultos procedentes de las fichas técnicas y de fuentes especializadas. Se utilizan los parámetros del principio activo o, cuando es más relevante, los de su metabolito activo.',
                back: 'VOLVER A HERRAMIENTAS'
            },
            title: 'Simulador de niveles',
            modes: { START: 'Iniciar', STOP: 'Retirar', SWITCH: 'Cambiar' },
            modeHelp: {
                START: 'Inicio desde cero: el día 0 es la primera toma. Añade cambios de dosis para simular una titulación.',
                STOP: 'Parte del estado estacionario con la dosis actual. Indica desde qué día se suspende o añade cambios de dosis para una retirada gradual.',
                SWITCH: 'A parte del estado estacionario y se retira; B empieza el día que indiques. Todos los días se cuentan en el mismo calendario (día 0 = primera toma simulada de A).'
            },
            card: { START: 'Fármaco', STOP: 'Fármaco que se retira', A: 'A · Fármaco que se retira', B: 'B · Fármaco que se inicia' },
            fam: 'Familia', drug: 'Fármaco', choose: 'Elegir…',
            doseStart: 'Dosis inicial (mg)', doseNow: 'Dosis actual (mg)', freq: 'Cada (h)',
            startDay: 'Día de inicio de B', stopDay: 'Suspender desde el día', stopPh: 'Opcional',
            steps: 'Cambios de dosis', stepDay: 'Desde el día', stepDose: 'Dosis (mg)',
            addStep: 'Añadir cambio de dosis', del: 'Quitar',
            stepHelpOut: 'Dosis 0 = suspensión.', stepHelpIn: 'Los días son del calendario común, no desde el inicio de B.',
            view: 'Vista', days: 'días', axisX: 'Días', axisY: 'Nivel relativo (%)', ref100: '100 % (referencia)',
            dayWord: 'Día', mkStart: 'Inicio B', mkStop: 'Stop',
            empty: 'Elige familia, fármaco y dosis para ver la curva.',
            emptyB: 'Elige el fármaco B y su dosis para añadirlo a la gráfica.',
            errFreq: 'El intervalo entre tomas debe estar entre 1 y 336 h.',
            errDose: 'La dosis debe ser mayor que 0.',
            hintStop: 'Para ver la retirada, indica desde qué día se suspende o añade un cambio a dosis 0.',
            warnBefore: 'Hay un cambio de dosis de B anterior a su inicio: se aplica desde el día de inicio.',
            warnTmax: (n, x) => `En ${n}, el Tmax no es compatible con su semivida en un modelo de un compartimento (exige Tmax menor que 1,44 × t½). Se usa la absorción más lenta posible (Tmax ≈ ${x} h).`,
            sumH: 'Resumen',
            params: (t, m) => `t½ ${t} h · Tmax ${m} h`,
            refOut: (d, f) => `100 % = pico en estado estacionario con ${d} mg cada ${f} h (dosis actual).`,
            refIn: (d, f) => `100 % = pico en estado estacionario con ${d} mg cada ${f} h (dosis final de la pauta).`,
            fluct: v => `En estado estacionario, el valle es ≈ ${v} % del pico.`,
            ssStart: (a, b) => `≈ 90 % del estado estacionario el día ${a} (3,3 t½ desde el inicio) y ≈ 97 % el día ${b} (5 t½).`,
            ssChange: (a, b) => `≈ 90 % del nuevo estado estacionario el día ${a} (3,3 t½ tras el último cambio de dosis) y ≈ 97 % el día ${b}.`,
            lastDose: d => d === null ? 'Última toma antes del día 0.' : `Última toma el día ${d}.`,
            below: (p, d) => `Por debajo del ${p} %: día ${d}`,
            beyond: d => `después del día ${d}`,
            readH: 'Cómo leer la gráfica',
            read: [
                'El día 0 es la primera toma del periodo simulado. Las líneas verticales marcan el inicio de B, los cambios de dosis y la suspensión.',
                '100 % = pico en estado estacionario con la dosis de referencia de cada fármaco (la actual en el que se retira, la final en el que se inicia). Las curvas son relativas: no comparan concentraciones absolutas entre fármacos.',
                'El estado estacionario se alcanza en 4–5 semividas desde el inicio o desde cada cambio de dosis. Tras la última toma, en 4–5 semividas el nivel queda por debajo del 3–6 %.'
            ],
            loadingData: 'Conectando con la base de datos…',
            loadError: 'No se han podido cargar los datos del simulador.',
            locale: 'es-ES'
        },
        en: {
            page: {
                hero_t: 'Pharmacokinetic simulator',
                hero_p: 'Relative plasma levels when starting, stopping or switching a psychotropic drug, based on its half-life, Tmax and dosing schedule.',
                c1_t: 'Accumulation to steady state',
                c1_p: 'See how the drug accumulates dose by dose according to its half-life and dosing interval, and when it levels off.',
                c2_t: 'Tapering and cross-switching',
                c2_p: 'Simulate a gradual withdrawal or a switch between two drugs and check on which days one falls and the other rises.',
                c3_t: 'Key figures',
                c3_p: 'Day on which 90% of steady state is reached, days until levels fall below 50, 10 and 3% after the last dose, and peak–trough fluctuation.',
                loading: 'Loading simulator…',
                info_h: 'Model basis',
                info_p1: 'Each dose is modelled with a <b>one-compartment</b> model with first-order absorption and elimination (<b>Bateman function</b>). The elimination constant is derived from the half-life, and the absorption constant is set so that the peak of a single dose falls at the drug\'s Tmax. The level at any time is the sum of all doses (<b>superposition</b>).',
                info_p2: 'When stopping a drug, and for the outgoing drug in a switch, the simulation starts from the <b>steady state at the current dose</b>, calculated exactly, as if the patient had been taking it indefinitely.',
                info_legend: '<b>C(t)</b>: level after one dose, at time <i>t</i> · <b>D</b>: dose · <b>k<sub>a</sub></b>: absorption rate constant · <b>k<sub>e</sub></b>: elimination rate constant · <b>t<sub>i</sub></b>: time of each dose',
                info_note: '<b>Relative values.</b> 100% = steady-state peak at each drug\'s reference dose: the <b>current dose</b> for the drug being stopped and the <b>final dose of the schedule</b> for the drug being started. If the schedule goes above that dose, the curve exceeds 100%. Bioavailability and volume of distribution do not change the shape of the relative curve, so they are not used. Each drug is normalised separately: in a switch, crossing curves do not mean equivalent doses or equal receptor occupancy.',
                lim_h: 'What it does not account for',
                lim: [
                    '<b>Active metabolites.</b> A single half-life is used per drug (that of the parent drug or of its most relevant active metabolite); the parent drug and its metabolites are not shown separately.',
                    '<b>Non-linear kinetics.</b> The model is linear: it does not capture disproportionate accumulation with dose (e.g. paroxetine or fluoxetine).',
                    '<b>Individual variability.</b> Mean adult values are used. It does not include interactions, enzyme induction or inhibition (e.g. smoking with clozapine or olanzapine), pharmacogenetics (CYP2D6, CYP2C19), age, or hepatic or renal impairment.',
                    '<b>Formulations.</b> Not valid for long-acting injectables.',
                    '<b>Clinical effect.</b> It does not represent effect or receptor occupancy. It is a planning aid; it does not replace therapeutic drug monitoring or clinical judgement.'
                ],
                src_h: 'Sources',
                src_intro: 'Drug parameters (t½ and Tmax): mean adult values from the Summaries of Product Characteristics and specialised sources. The parameters of the parent drug are used or, where more relevant, those of its active metabolite.',
                back: 'BACK TO TOOLS'
            },
            title: 'Level simulator',
            modes: { START: 'Start', STOP: 'Stop', SWITCH: 'Switch' },
            modeHelp: {
                START: 'Starting from zero: day 0 is the first dose. Add dose changes to simulate a titration.',
                STOP: 'Starts from steady state at the current dose. Enter the day the drug is stopped from or add dose changes for a gradual taper.',
                SWITCH: 'A starts from steady state and is withdrawn; B starts on the day you enter. All days use the same calendar (day 0 = first simulated dose of A).'
            },
            card: { START: 'Drug', STOP: 'Drug being stopped', A: 'A · Drug being stopped', B: 'B · Drug being started' },
            fam: 'Class', drug: 'Drug', choose: 'Choose…',
            doseStart: 'Starting dose (mg)', doseNow: 'Current dose (mg)', freq: 'Every (h)',
            startDay: 'B start day', stopDay: 'Stop from day', stopPh: 'Optional',
            steps: 'Dose changes', stepDay: 'From day', stepDose: 'Dose (mg)',
            addStep: 'Add dose change', del: 'Remove',
            stepHelpOut: 'Dose 0 = stop.', stepHelpIn: 'Days refer to the common calendar, not to the start of B.',
            view: 'View', days: 'days', axisX: 'Days', axisY: 'Relative level (%)', ref100: '100% (reference)',
            dayWord: 'Day', mkStart: 'B start', mkStop: 'Stop',
            empty: 'Choose a class, drug and dose to see the curve.',
            emptyB: 'Choose drug B and its dose to add it to the chart.',
            errFreq: 'The dosing interval must be between 1 and 336 h.',
            errDose: 'The dose must be greater than 0.',
            hintStop: 'To see the withdrawal, enter the day the drug is stopped from or add a change to dose 0.',
            warnBefore: 'One of B\'s dose changes is before its start: it applies from the start day.',
            warnTmax: (n, x) => `For ${n}, Tmax is not compatible with its half-life in a one-compartment model (Tmax must be below 1.44 × t½). The slowest possible absorption is used (Tmax ≈ ${x} h).`,
            sumH: 'Summary',
            params: (t, m) => `t½ ${t} h · Tmax ${m} h`,
            refOut: (d, f) => `100% = steady-state peak at ${d} mg every ${f} h (current dose).`,
            refIn: (d, f) => `100% = steady-state peak at ${d} mg every ${f} h (final dose of the schedule).`,
            fluct: v => `At steady state, the trough is ≈ ${v}% of the peak.`,
            ssStart: (a, b) => `≈ 90% of steady state on day ${a} (3.3 t½ from the start) and ≈ 97% on day ${b} (5 t½).`,
            ssChange: (a, b) => `≈ 90% of the new steady state on day ${a} (3.3 t½ after the last dose change) and ≈ 97% on day ${b}.`,
            lastDose: d => d === null ? 'Last dose before day 0.' : `Last dose on day ${d}.`,
            below: (p, d) => `Below ${p}%: day ${d}`,
            beyond: d => `after day ${d}`,
            readH: 'How to read the chart',
            read: [
                'Day 0 is the first dose of the simulated period. Vertical lines mark the start of B, dose changes and the stop.',
                '100% = steady-state peak at each drug\'s reference dose (current dose for the drug being stopped, final dose for the drug being started). Curves are relative: they do not compare absolute concentrations between drugs.',
                'Steady state is reached in 4–5 half-lives from the start or from each dose change. After the last dose, the level falls below 3–6% within 4–5 half-lives.'
            ],
            loadingData: 'Connecting to the database…',
            loadError: 'The simulator data could not be loaded.',
            locale: 'en-GB'
        }
    };

    // Nombres en inglés (si un fármaco no está aquí, se muestra el nombre de la hoja)
    const EN_DRUG = {
        'Aripiprazol': 'Aripiprazole', 'Cariprazina': 'Cariprazine', 'Brexpiprazol': 'Brexpiprazole',
        'Quetiapina IR': 'Quetiapine IR', 'Quetiapina XR': 'Quetiapine XR', 'Olanzapina': 'Olanzapine',
        'Clozapina': 'Clozapine', 'Amisulprida': 'Amisulpride', 'Risperidona': 'Risperidone',
        'Paliperidona': 'Paliperidone', 'Lurasidona': 'Lurasidone', 'Ziprasidona': 'Ziprasidone',
        'Asenapina': 'Asenapine', 'Sertralina': 'Sertraline', 'Fluoxetina': 'Fluoxetine', 'Paroxetina': 'Paroxetine',
        'Fluvoxamina': 'Fluvoxamine', 'Duloxetina': 'Duloxetine', 'Venlafaxina IR': 'Venlafaxine IR',
        'Venlafaxina': 'Venlafaxine', 'Desvenlafaxina': 'Desvenlafaxine', 'Vortioxetina': 'Vortioxetine',
        'Clomipramina': 'Clomipramine', 'Mirtazapina': 'Mirtazapine', 'Trazodona': 'Trazodone',
        'Bupropión': 'Bupropion', 'Agomelatina': 'Agomelatine', 'Clorazepato': 'Clorazepate',
        'Litio': 'Lithium', 'Lamotrigina': 'Lamotrigine', 'Pregabalina': 'Pregabalin', 'Valproato': 'Valproate'
    };
    const EN_FAM = {
        'Antipsicóticos': 'Antipsychotics', 'Antidepresivos': 'Antidepressants', 'Benzodiazepinas': 'Benzodiazepines',
        'Benzodiacepinas': 'Benzodiazepines', 'Hipnóticos': 'Hypnotics', 'Eutimizantes': 'Mood stabilisers',
        'Antiepilépticos': 'Antiepileptics', 'Sin familia': 'Unclassified'
    };
    const EN_COMMENT = { 'metabolito activo': 'Active metabolite', 'metabolitos activos': 'Active metabolites' };

    const COLORS = {
        single: { line: '#256095', fill: 'rgba(37,96,149,0.10)' },
        a: { line: '#dc2626', fill: 'rgba(220,38,38,0.08)' },
        b: { line: '#2563eb', fill: 'rgba(37,99,235,0.10)' }
    };

    // ------------------------------------------------------------------
    // Motor farmacocinético
    // ------------------------------------------------------------------
    const LN2 = Math.LN2;
    const PK = {
        /**
         * ka a partir de Tmax y ke. Con r = ka/ke > 1: Tmax·ke = ln(r)/(r−1), que decrece de 1 (r→1) a 0.
         * Si Tmax·ke ≥ 1 no hay solución (Tmax ≥ t½/ln2 ≈ 1,44·t½): se usa r cercano a 1 y se avisa.
         */
        params(t12, tmax) {
            const ke = LN2 / t12;
            const g = r => Math.log(r) / (r - 1);
            const x = tmax * ke;
            const R_MIN = 1.001, R_MAX = 1e6;
            let r, adjusted = false;
            if (!(tmax > 0)) r = R_MAX;
            else if (x >= g(R_MIN)) { r = R_MIN; adjusted = true; }
            else if (x <= g(R_MAX)) r = R_MAX;
            else {
                let lo = Math.log(R_MIN), hi = Math.log(R_MAX);
                for (let i = 0; i < 100; i++) {
                    const mid = (lo + hi) / 2;
                    if (g(Math.exp(mid)) > x) lo = mid; else hi = mid;
                }
                r = Math.exp((lo + hi) / 2);
            }
            const ka = r * ke;
            return { ke, ka, A: ka / (ka - ke), tmaxModel: g(r) / ke, adjusted };
        },
        // Nivel de una toma unitaria (proporcional a la concentración; F/Vd se omite porque la curva es relativa)
        single(p, t) { return t <= 0 ? 0 : p.A * (Math.exp(-p.ke * t) - Math.exp(-p.ka * t)); },
        // Estado estacionario con dosis 1 cada tau: momento del pico dentro del intervalo, pico y valle
        steady(p, tau) {
            const fe = 1 - Math.exp(-p.ke * tau), fa = 1 - Math.exp(-p.ka * tau);
            const css = t => p.A * (Math.exp(-p.ke * t) / fe - Math.exp(-p.ka * t) / fa);
            let tp = Math.log((p.ka * fe) / (p.ke * fa)) / (p.ka - p.ke);
            if (!(tp >= 0)) tp = 0; if (tp > tau) tp = tau;
            return { tPeak: tp, peak: css(tp), trough: css(tau) };
        },
        // Contribución en t ≥ 0 de infinitas tomas previas (dosis d cada tau, la última en −tau)
        prior(p, d, tau, t) {
            const qe = Math.exp(-p.ke * tau) / (1 - Math.exp(-p.ke * tau));
            const qa = Math.exp(-p.ka * tau) / (1 - Math.exp(-p.ka * tau));
            return d * p.A * (Math.exp(-p.ke * t) * qe - Math.exp(-p.ka * t) * qa);
        },
        level(sim, t) {
            let c = sim.pre ? this.prior(sim.p, sim.pre.d, sim.pre.tau, t) : 0;
            const doses = sim.doses;
            for (let i = 0; i < doses.length && doses[i].t < t; i++) c += doses[i].d * this.single(sim.p, t - doses[i].t);
            return c;
        }
    };

    // ------------------------------------------------------------------
    // Estado
    // ------------------------------------------------------------------
    const LS_KEY = 'psq_idioma';
    const nuevoFarmaco = () => ({ fam: '', name: '', dose: '', freq: '24', start: '', stop: '', steps: [] });
    const st = {
        lang: (() => { try { return localStorage.getItem(LS_KEY) === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; } })(),
        mode: 'START',
        view: 12,
        a: nuevoFarmaco(),
        b: nuevoFarmaco()
    };
    let db = [];
    let chart = null;
    let root = null;

    const T = () => TXT[st.lang];
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : null; };
    const fmt = (x, dec = 1) => new Intl.NumberFormat(T().locale, { maximumFractionDigits: dec }).format(x);
    const dayFmt = h => fmt(Math.max(0, h) / 24, 1);
    const drugName = n => st.lang === 'en' ? (EN_DRUG[n] || n) : n;
    const famName = f => st.lang === 'en' ? (EN_FAM[f] || f) : f;
    const commentTxt = c => st.lang === 'en' ? (EN_COMMENT[String(c).trim().toLowerCase()] || c) : c;

    // ------------------------------------------------------------------
    // Construcción de la simulación de un fármaco
    // ------------------------------------------------------------------
    // role: 'in' (se inicia desde cero) | 'out' (parte del estado estacionario y se retira)
    function construir(d, role, horizonH) {
        const f = db.find(x => x.farmaco === d.name);
        if (!f) return { estado: 'vacio' };
        const dose = num(d.dose), tau = num(d.freq === '' ? '24' : d.freq);
        if (dose === null) return { estado: 'vacio' };
        if (!(dose > 0)) return { estado: 'error', msg: T().errDose };
        if (!(tau >= 1 && tau <= 336)) return { estado: 'error', msg: T().errFreq };

        const t0 = role === 'in' ? Math.max(0, num(d.start) || 0) * 24 : 0;
        const steps = d.steps
            .map(s => ({ h: num(s.day), d: num(s.dose) }))
            .filter(s => s.h !== null && s.h >= 0 && s.d !== null && s.d >= 0)
            .map(s => ({ h: s.h * 24, d: s.d }))
            .sort((x, y) => x.h - y.h);
        const stopDay = role === 'out' ? num(d.stop) : null;
        const stopH = stopDay !== null && stopDay >= 0 ? stopDay * 24 : null;
        const doseAt = t => { let v = dose; for (const s of steps) if (s.h <= t + 1e-6) v = s.d; return v; };

        const limit = Math.max(horizonH, stopH ?? 0);
        const doses = [];
        for (let t = t0; t < limit - 1e-9; t += tau) {
            if (stopH !== null && t >= stopH - 1e-6) break;
            const v = doseAt(t);
            if (v > 0) doses.push({ t, d: v });
        }

        const p = PK.params(f.t12, f.tmax);
        const ss = PK.steady(p, tau);
        // Dosis de referencia: la actual si se retira; la última dosis no nula de la pauta si se inicia
        let ref = dose;
        if (role === 'in') for (const s of steps) if (s.d > 0) ref = s.d;
        const sim = {
            estado: 'ok', f, p, role, tau, t0, dose, ref, steps, stopH, doses, ss,
            pre: role === 'out' ? { d: dose, tau } : null,
            cRef: ref * ss.peak,
            stepBeforeStart: role === 'in' && steps.some(s => s.h < t0 - 1e-6)
        };
        sim.stopped = role === 'out' && (stopH !== null || (steps.length > 0 && steps[steps.length - 1].d === 0));
        return sim;
    }

    // Puntos de la curva: rejilla fina + momento de cada toma + picos, para no perder máximos al alejar la vista
    function curva(sim, horizonH) {
        const ts = new Set();
        const base = horizonH / 1500;
        for (let t = 0; t <= horizonH + 1e-9; t += base) ts.add(+t.toFixed(4));
        ts.add(horizonH);
        const pico = [sim.ss.tPeak, sim.p.tmaxModel];
        if (sim.pre) pico.forEach(x => ts.add(+x.toFixed(4)));
        for (const d of sim.doses) {
            if (d.t > horizonH) break;
            ts.add(+d.t.toFixed(4));
            pico.forEach(x => { if (d.t + x <= horizonH) ts.add(+(d.t + x).toFixed(4)); });
        }
        return [...ts].sort((x, y) => x - y).map(t => ({ x: t / 24, y: PK.level(sim, t) / sim.cRef * 100 }));
    }

    // Días hasta bajar de cada umbral tras la última toma (en % del pico de referencia)
    function lavado(sim) {
        const last = sim.doses.length ? sim.doses[sim.doses.length - 1].t : -sim.tau;
        const t12 = sim.f.t12;
        const dt = Math.max(0.05, Math.min(1, t12 / 20));
        const tEnd = last + 20 * t12;
        const umbrales = [50, 10, 3];
        const res = {};
        let prev = null, bajando = false;
        for (let t = Math.max(0, last); t <= tEnd && Object.keys(res).length < umbrales.length; t += dt) {
            const y = PK.level(sim, t) / sim.cRef * 100;
            if (prev !== null && y < prev - 1e-9) bajando = true;
            prev = y;
            if (!bajando) continue;
            for (const u of umbrales) if (res[u] === undefined && y < u) res[u] = t;
        }
        return { last, res, tEnd, umbrales };
    }

    // ------------------------------------------------------------------
    // Interfaz
    // ------------------------------------------------------------------
    function aplicarIdiomaPagina() {
        const t = T().page;
        document.documentElement.lang = st.lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const v = t[el.getAttribute('data-i18n')];
            if (typeof v === 'string') el.innerHTML = v;
        });
        const lim = $('pk-lim');
        if (lim) lim.innerHTML = t.lim.map(x => `<li>${x}</li>`).join('');
    }

    function opcionesFamilia(sel) {
        const fams = [...new Set(db.map(f => f.familia))].sort((x, y) => famName(x).localeCompare(famName(y), st.lang));
        return `<option value="" disabled ${sel ? '' : 'selected'}>${T().choose}</option>` +
            fams.map(f => `<option value="${esc(f)}" ${f === sel ? 'selected' : ''}>${esc(famName(f))}</option>`).join('');
    }
    function opcionesFarmaco(fam, sel) {
        const list = db.filter(f => f.familia === fam).sort((x, y) => drugName(x.farmaco).localeCompare(drugName(y.farmaco), st.lang));
        return `<option value="" disabled ${sel ? '' : 'selected'}>${fam ? T().choose : '—'}</option>` +
            list.map(f => `<option value="${esc(f.farmaco)}" ${f.farmaco === sel ? 'selected' : ''}>${esc(drugName(f.farmaco))}</option>`).join('');
    }

    function tarjeta(k, role, titulo, color) {
        const t = T(), d = st[k];
        const pasos = d.steps.map((s, i) => `
            <div class="pk-step">
                <div><label for="pk-${k}-sd${i}">${t.stepDay}</label><input id="pk-${k}-sd${i}" type="number" inputmode="decimal" min="0" max="365" step="any" data-path="${k}.steps.${i}.day" value="${esc(s.day)}"></div>
                <div><label for="pk-${k}-sm${i}">${t.stepDose}</label><input id="pk-${k}-sm${i}" type="number" inputmode="decimal" min="0" step="any" data-path="${k}.steps.${i}.dose" value="${esc(s.dose)}"></div>
                <button type="button" class="pk-del" data-act="del" data-k="${k}" data-i="${i}" aria-label="${t.del}" title="${t.del}"><i class="fas fa-times"></i></button>
            </div>`).join('');
        return `
        <div class="pk-card" style="--c:${color}">
            <div class="pk-card-h">${titulo}</div>
            <div class="pk-grid">
                <div><label for="pk-${k}-fam">${t.fam}</label><select id="pk-${k}-fam" data-path="${k}.fam">${opcionesFamilia(d.fam)}</select></div>
                <div><label for="pk-${k}-name">${t.drug}</label><select id="pk-${k}-name" data-path="${k}.name">${opcionesFarmaco(d.fam, d.name)}</select></div>
            </div>
            <div class="pk-chip" id="pk-${k}-chip"></div>
            ${role === 'in' && k === 'b' ? `<div class="pk-grid1"><label for="pk-b-start">${t.startDay}</label><input id="pk-b-start" type="number" inputmode="decimal" min="0" max="365" step="any" placeholder="0" data-path="b.start" value="${esc(d.start)}"></div>` : ''}
            <div class="pk-grid">
                <div><label for="pk-${k}-dose">${role === 'out' ? t.doseNow : t.doseStart}</label><input id="pk-${k}-dose" type="number" inputmode="decimal" min="0" step="any" data-path="${k}.dose" value="${esc(d.dose)}"></div>
                <div><label for="pk-${k}-freq">${t.freq}</label><input id="pk-${k}-freq" type="number" inputmode="decimal" min="1" max="336" step="any" placeholder="24" data-path="${k}.freq" value="${esc(d.freq)}"></div>
            </div>
            ${role === 'out' ? `<div class="pk-grid1"><label for="pk-${k}-stop">${t.stopDay}</label><input id="pk-${k}-stop" type="number" inputmode="decimal" min="0" max="365" step="any" placeholder="${t.stopPh}" data-path="${k}.stop" value="${esc(d.stop)}"></div>` : ''}
            <div class="pk-steps">
                ${d.steps.length ? `<div class="pk-steps-h">${t.steps} <span>${role === 'out' ? t.stepHelpOut : (k === 'b' ? t.stepHelpIn : '')}</span></div>` : ''}
                ${pasos}
                <button type="button" class="pk-add" data-act="add" data-k="${k}"><i class="fas fa-plus"></i> ${t.addStep}</button>
            </div>
        </div>`;
    }

    function render() {
        const t = T();
        aplicarIdiomaPagina();
        const cards = st.mode === 'SWITCH'
            ? tarjeta('a', 'out', t.card.A, COLORS.a.line) + tarjeta('b', 'in', t.card.B, COLORS.b.line)
            : tarjeta('a', st.mode === 'START' ? 'in' : 'out', t.card[st.mode], COLORS.single.line);
        root.innerHTML = `
        <div class="pk-ui">
            <div class="pk-head">
                <h2><i class="fas fa-wave-square"></i> ${t.title}</h2>
                <div class="pk-lang" role="group" aria-label="Idioma / Language">
                    <button type="button" data-act="lang" data-v="es" class="${st.lang === 'es' ? 'on' : ''}">ES</button>
                    <button type="button" data-act="lang" data-v="en" class="${st.lang === 'en' ? 'on' : ''}">EN</button>
                </div>
            </div>
            <div class="pk-modes" role="tablist">
                ${['START', 'STOP', 'SWITCH'].map(m => `<button type="button" role="tab" aria-selected="${st.mode === m}" data-act="mode" data-v="${m}" class="${st.mode === m ? 'on' : ''}">${t.modes[m]}</button>`).join('')}
            </div>
            <p class="pk-help">${t.modeHelp[st.mode]}</p>
            <div class="pk-cards ${st.mode === 'SWITCH' ? 'two' : ''}">${cards}</div>
            <div class="pk-chartbox">
                <div class="pk-chartbar">
                    <label for="pk-view">${t.view}</label>
                    <select id="pk-view" data-path="view">
                        ${[5, 12, 30, 60].map(v => `<option value="${v}" ${st.view === v ? 'selected' : ''}>${v} ${t.days}</option>`).join('')}
                    </select>
                </div>
                <div class="pk-canvas"><canvas id="pk-canvas" role="img" aria-label="${t.axisY}"></canvas><div class="pk-empty" id="pk-empty"></div></div>
            </div>
            <div class="pk-msgs" id="pk-msgs" aria-live="polite"></div>
            <div class="pk-summary" id="pk-summary" aria-live="polite"></div>
            <details class="pk-read"><summary>${t.readH}</summary><ul>${t.read.map(x => `<li>${x}</li>`).join('')}</ul></details>
        </div>`;
        calcular();
    }

    function chip(k, sim) {
        const el = $(`pk-${k}-chip`);
        if (!el) return;
        const f = db.find(x => x.farmaco === st[k].name);
        if (!f) { el.innerHTML = ''; el.style.display = 'none'; return; }
        const c = f.comentario ? ` · ${esc(commentTxt(f.comentario))}` : '';
        el.innerHTML = `<i class="fas fa-flask"></i> ${T().params(fmt(f.t12), fmt(f.tmax, 2))}${c}`;
        el.style.display = '';
    }

    function calcular() {
        const t = T();
        const H = st.view * 24;
        const sims = [];
        const msgs = [];
        const roles = st.mode === 'SWITCH' ? [['a', 'out'], ['b', 'in']] : [['a', st.mode === 'START' ? 'in' : 'out']];
        for (const [k, role] of roles) {
            const s = construir(st[k], role, H);
            chip(k, s);
            if (s.estado === 'error') msgs.push({ tipo: 'err', txt: `${roles.length > 1 ? k.toUpperCase() + ': ' : ''}${s.msg}` });
            if (s.estado === 'ok') { s.k = k; sims.push(s); }
        }

        const empty = $('pk-empty');
        const aOk = sims.some(s => s.k === 'a');
        if (!aOk) {
            if (chart) { chart.destroy(); chart = null; }
            empty.textContent = msgs.length ? '' : t.empty;
            empty.style.display = msgs.length ? 'none' : 'flex';
            pintarMensajes(msgs);
            $('pk-summary').innerHTML = '';
            return;
        }
        empty.style.display = 'none';

        for (const s of sims) {
            if (s.p.adjusted) msgs.push({ tipo: 'warn', txt: t.warnTmax(esc(drugName(s.f.farmaco)), fmt(s.p.tmaxModel, 1)) });
            if (s.stepBeforeStart) msgs.push({ tipo: 'warn', txt: t.warnBefore });
            if (s.role === 'out' && st.mode === 'STOP' && !s.stopped) msgs.push({ tipo: 'hint', txt: t.hintStop });
        }
        if (st.mode === 'SWITCH' && !sims.some(s => s.k === 'b') && !msgs.some(m => m.tipo === 'err')) msgs.push({ tipo: 'hint', txt: t.emptyB });
        pintarMensajes(msgs);
        pintarGrafica(sims, H);
        pintarResumen(sims);
    }

    function pintarMensajes(msgs) {
        const ic = { err: 'fa-exclamation-circle', warn: 'fa-exclamation-triangle', hint: 'fa-info-circle' };
        $('pk-msgs').innerHTML = msgs.map(m => `<div class="pk-msg ${m.tipo}"><i class="fas ${ic[m.tipo]}"></i> <span>${m.txt}</span></div>`).join('');
    }

    function pintarResumen(sims) {
        const t = T();
        const bloques = sims.map(s => {
            const col = st.mode === 'SWITCH' ? COLORS[s.k].line : COLORS.single.line;
            const lineas = [];
            lineas.push((s.role === 'out' ? t.refOut : t.refIn)(fmt(s.ref, 2), fmt(s.tau, 1)));
            lineas.push(t.fluct(fmt(s.ss.trough / s.ss.peak * 100, 0)));
            if (s.stopped) {
                const w = lavado(s);
                const partes = w.umbrales.map(u => t.below(u, w.res[u] !== undefined ? dayFmt(w.res[u]) : t.beyond(dayFmt(w.tEnd))));
                lineas.push(`${t.lastDose(w.last < 0 ? null : dayFmt(w.last))} ${partes.join(' · ')}.`);
            } else {
                const cambios = s.steps.filter(x => x.h >= s.t0);
                const tc = cambios.length ? cambios[cambios.length - 1].h : null;
                const t12 = s.f.t12;
                if (s.role === 'in' && tc === null) lineas.push(t.ssStart(dayFmt(s.t0 + 3.32 * t12), dayFmt(s.t0 + 5 * t12)));
                else if (tc !== null) lineas.push(t.ssChange(dayFmt(tc + 3.32 * t12), dayFmt(tc + 5 * t12)));
            }
            return `<div class="pk-sum" style="--c:${col}"><b>${esc(drugName(s.f.farmaco))}</b><ul>${lineas.map(l => `<li>${l}</li>`).join('')}</ul></div>`;
        });
        $('pk-summary').innerHTML = bloques.length ? `<div class="pk-sum-h">${t.sumH}</div>${bloques.join('')}` : '';
    }

    // Líneas verticales de eventos (inicio de B, cambios de dosis, suspensión)
    const pluginEventos = {
        id: 'pkEventos',
        afterDatasetsDraw(c) {
            const ev = c.options.plugins.pkEventos?.items || [];
            const { ctx, chartArea: a, scales: { x } } = c;
            ctx.save();
            ctx.font = '600 10px system-ui, sans-serif';
            ctx.textBaseline = 'top';
            const ocupado = [];
            for (const e of ev) {
                if (e.day < x.min || e.day > x.max) continue;
                const px = x.getPixelForValue(e.day);
                ctx.strokeStyle = e.color; ctx.globalAlpha = 0.7; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
                ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.fillStyle = e.color;
                const w = ctx.measureText(e.label).width;
                let lx = Math.min(px + 3, a.right - w - 2), fila = 0;
                while (ocupado.some(o => o.fila === fila && lx < o.x2 + 4 && lx + w > o.x1 - 4) && fila < 4) fila++;
                ocupado.push({ x1: lx, x2: lx + w, fila });
                ctx.fillText(e.label, lx, a.top + 2 + fila * 12);
            }
            ctx.restore();
        }
    };

    function pintarGrafica(sims, H) {
        const t = T();
        const datasets = [];
        const eventos = [];
        let yMax = 100;
        for (const s of sims) {
            const col = st.mode === 'SWITCH' ? COLORS[s.k] : COLORS.single;
            const pts = curva(s, H);
            pts.forEach(p => { if (p.y > yMax) yMax = p.y; });
            datasets.push({
                label: (st.mode === 'SWITCH' ? s.k.toUpperCase() + ' · ' : '') + drugName(s.f.farmaco),
                data: pts, borderColor: col.line, backgroundColor: col.fill, fill: 'origin',
                borderWidth: 2, pointRadius: 0, tension: 0
            });
            if (s.role === 'in' && s.t0 > 0) eventos.push({ day: s.t0 / 24, color: col.line, label: t.mkStart });
            for (const st_ of s.steps) {
                if (s.stopH !== null && st_.h >= s.stopH) continue;
                const h = Math.max(st_.h, s.t0);
                eventos.push({ day: h / 24, color: col.line, label: st_.d === 0 ? t.mkStop : `${fmt(st_.d, 2)} mg` });
            }
            if (s.stopH !== null) eventos.push({ day: s.stopH / 24, color: col.line, label: t.mkStop });
        }
        datasets.push({
            label: t.ref100, data: [{ x: 0, y: 100 }, { x: H / 24, y: 100 }],
            borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1, pointRadius: 0, fill: false, pkRef: true
        });

        if (chart) chart.destroy();
        const ctx = $('pk-canvas').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            plugins: [pluginEventos],
            options: {
                responsive: true, maintainAspectRatio: false, animation: false, parsing: false, normalized: true,
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: {
                    x: { type: 'linear', min: 0, max: H / 24, title: { display: true, text: t.axisX },
                        ticks: { stepSize: st.view <= 12 ? 1 : undefined, maxRotation: 0, autoSkip: true, autoSkipPadding: 8, callback: v => fmt(v, 1) } },
                    y: { min: 0, suggestedMax: Math.ceil(Math.max(110, yMax * 1.08) / 10) * 10, title: { display: true, text: t.axisY },
                        ticks: { callback: v => fmt(v, 0) } }
                },
                plugins: {
                    legend: { labels: { boxWidth: 10, font: { size: 11 }, filter: i => !datasets[i.datasetIndex]?.pkRef } },
                    tooltip: {
                        filter: i => !i.dataset.pkRef,
                        callbacks: {
                            title: items => items.length ? `${t.dayWord} ${fmt(items[0].parsed.x, 1)}` : '',
                            label: i => `${i.dataset.label}: ${fmt(i.parsed.y, 0)} %`
                        }
                    },
                    pkEventos: { items: eventos }
                }
            }
        });
    }

    // ------------------------------------------------------------------
    // Eventos
    // ------------------------------------------------------------------
    function enlazar() {
        root.addEventListener('click', e => {
            const b = e.target.closest('[data-act]');
            if (!b) return;
            const act = b.getAttribute('data-act');
            if (act === 'lang') {
                st.lang = b.getAttribute('data-v');
                try { localStorage.setItem(LS_KEY, st.lang); } catch (err) { /* sin almacenamiento */ }
                render();
            } else if (act === 'mode') {
                const m = b.getAttribute('data-v');
                if (m !== st.mode) {
                    // La pauta (cambios de dosis, suspensión, inicio de B) depende del modo: se reinicia
                    for (const k of ['a', 'b']) { st[k].steps = []; st[k].stop = ''; st[k].start = ''; }
                    st.mode = m;
                }
                render();
            } else if (act === 'add') {
                const k = b.getAttribute('data-k');
                const d = st[k];
                const prev = d.steps.length ? num(d.steps[d.steps.length - 1].day) : null;
                const base = k === 'b' ? (num(d.start) || 0) : 0;
                d.steps.push({ day: String((prev ?? base) + 7), dose: '' });
                render();
                const inp = $(`pk-${k}-sm${d.steps.length - 1}`);
                if (inp) inp.focus();
            } else if (act === 'del') {
                st[b.getAttribute('data-k')].steps.splice(+b.getAttribute('data-i'), 1);
                render();
            }
        });
        const alCambiar = e => {
            const el = e.target;
            const path = el.getAttribute && el.getAttribute('data-path');
            if (!path) return;
            const parts = path.split('.');
            if (parts[0] === 'view') { st.view = +el.value; calcular(); return; }
            const d = st[parts[0]];
            if (parts[1] === 'steps') d.steps[+parts[2]][parts[3]] = el.value;
            else d[parts[1]] = el.value;
            if (parts[1] === 'fam') {
                d.name = '';
                $(`pk-${parts[0]}-name`).innerHTML = opcionesFarmaco(d.fam, '');
            }
            calcular();
        };
        // Selectores con «change»; campos numéricos con «input» (recalcula mientras se escribe)
        root.addEventListener('change', e => { if (e.target.tagName === 'SELECT') alCambiar(e); });
        root.addEventListener('input', e => { if (e.target.tagName !== 'SELECT') alCambiar(e); });
    }

    // ------------------------------------------------------------------
    // Arranque
    // ------------------------------------------------------------------
    window.iniciarInterfazSSS = async function () {
        root = document.getElementById('modalData');
        aplicarIdiomaPagina();
        root.innerHTML = `<div class="pk-loader"><i class="fas fa-circle-notch fa-spin fa-2x"></i><p>${T().loadingData}</p></div>`;
        try {
            if (typeof Chart === 'undefined') throw new Error('Chart.js');
            const res = await fetch('/?sheet=Data_Farmacocinetica');
            const data = await res.json();
            if (data.error) throw new Error(data.details || data.error);
            db = (data.values || [])
                .map(r => ({
                    farmaco: String(r[0] || '').trim(),
                    t12: num(r[1]),
                    tmax: num(r[2]),
                    comentario: String(r[4] || '').trim(),
                    familia: String(r[5] || '').trim() || 'Sin familia'
                }))
                .filter(f => f.farmaco && f.t12 > 0 && f.tmax !== null && f.tmax >= 0);
            if (!db.length) throw new Error('Data_Farmacocinetica');
        } catch (e) {
            console.error('Simulador farmacocinético:', e);
            root.innerHTML = `<div class="pk-loader"><i class="fas fa-exclamation-triangle fa-2x" style="color:#dc2626"></i><p>${T().loadError}</p><small>${esc(e.message)}</small></div>`;
            return;
        }
        enlazar();
        render();
    };

    // Para pruebas
    window.PK_ENGINE = PK;
})();
