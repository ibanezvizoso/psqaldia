/**
 * Herramienta: Semiología Pupilar en Urgencias Psiquiátricas
 * PSQALDÍA © 2026 - Módulo encapsulado para modal
 */
(function () {
    window.PupilasApp = {
        activeTab: 'midriasis',
        lang: 'es',

        i18n: {
            es: {
                title: "Pupilas en Psiquiatría",
                subtitle: "Semiología de Urgencias",
                tabs: {
                    midriasis: "Midriasis",
                    miosis: "Miosis",
                    asimetria: "Asimetría"
                },
                midriasis: {
                    antichol: {
                        title: "Anticolinérgico",
                        tag: "Piel Seca",
                        signs: "Delirium · Piel seca / roja · Retención urinaria · Midriasis poco reactiva",
                        drugs: "ATC · Biperideno · Antihistamínicos · Quetiapina / Clozapina (sobredosis)"
                    },
                    serot: {
                        title: "Serotoninérgico",
                        tag: "Clonus + Sudor",
                        signs: "Agitación · Diaforesis · Clonus (ocular / aquíleo) · Hiperreflexia · Hipertermia",
                        drugs: "ISRS / IRSN · Tramadol · MDMA · IMAO"
                    },
                    sympath: {
                        title: "Simpaticomimético",
                        tag: "Adrenérgico",
                        signs: "Agitación · Diaforesis · Taquicardia / HTA · Bruxismo",
                        drugs: "Cocaína · Anfetaminas · Metilfenidato · Speed"
                    },
                    opioidW: {
                        title: "Abstinencia de Opioides",
                        tag: "Rebote",
                        signs: "Bostezos · Rinorrea / lagrimeo · Piloerección · Diarrea · Midriasis reactiva"
                    },
                    diffNote: "⚡ <strong>Diferenciador con diaforesis:</strong> Con clonus → <strong>Serotoninérgico</strong> | Sin clonus → <strong>Simpaticomimético</strong>.",
                    polyNote: "⚠️ <strong>Policonsumo:</strong> Alcohol o benzodiacepinas pueden atenuar o enmascarar la midriasis en estimulantes.",
                    nmsWarning: "🧠 <strong>Ojo al diagnóstico diferencial (SNM vs SS):</strong> En el <strong>Síndrome Serotoninérgico</strong> la midriasis es la norma (+ clonus / hiperreflexia). Por contra, en el <strong>Síndrome Neuroléptico Maligno (SNM)</strong> las pupilas suelen ser <strong>normales o intermedias</strong> (+ rigidez en tubo de plomo / bradicinesia)."
                },
                miosis: {
                    opioids: {
                        title: "Toxíndrome Opioide",
                        tag: "Puntiformes",
                        signs: "Miosis bilateral hiporreactiva + Depresión respiratoria + Estupor / coma",
                        drugs: "Fentanilo · Heroína · Metadona · Morfina · Tramadol (sobredosis)",
                        action: "➔ Soporte ventilatorio + Naloxona iv"
                    },
                    chol: {
                        title: "Toxíndrome Colinérgico",
                        tag: "Secreciones",
                        signs: "Salivación · Lagrimeo · Broncorrea · Diarrea · Fasciculaciones",
                        drugs: "Organofosforados · Intoxicación por IACE (Donepezilo, Rivastigmina)"
                    },
                    alpha2: {
                        title: "Agonistas α₂ / Sedantes",
                        tag: "Hipotensión",
                        signs: "Sedación profunda / estupor · Bradicardia · Hipotensión arterial",
                        drugs: "Clonidina · Guanfacina"
                    }
                },
                asimetria: {
                    local: {
                        title: "1. Causa Farmacológica Local",
                        tag: "Descarte Frecuente",
                        lead: "<strong>¿Aerosol o colirios recientes?</strong> Fuga de mascarilla de nebulizador con <strong>bromuro de ipratropio</strong> o manipulación accidental de colirio midriático.",
                        signs: "Midriasis unilateral aislada con pares craneales y conciencia estrictamente normales.",
                        action: "➔ Observación clínica."
                    },
                    neuro: {
                        title: "2. Alarma Neurológica",
                        tag: "Urgencia Médica",
                        lead: "Sospechar urgencia neurológica si es de <strong>inicio agudo no farmacológico</strong> con:",
                        signs: "Ptosis palpebral · Diplopía · Focalidad motora · TCE reciente",
                        action: "➔ TC craneal urgente + valoración por Neurología / Neurocirugía."
                    }
                }
            },
            en: {
                title: "Pupils in Psychiatry",
                subtitle: "Emergency Semiology",
                tabs: {
                    midriasis: "Mydriasis",
                    miosis: "Miosis",
                    asimetria: "Asymmetry"
                },
                midriasis: {
                    antichol: {
                        title: "Anticholinergic",
                        tag: "Dry Skin",
                        signs: "Delirium · Dry/flushed skin · Urinary retention · Sluggish mydriasis",
                        drugs: "TCAs · Biperiden · Antihistamines · Quetiapine / Clozapine (overdose)"
                    },
                    serot: {
                        title: "Serotonergic",
                        tag: "Clonus + Sweat",
                        signs: "Agitation · Diaphoresis · Clonus (ocular/ankle) · Hyperreflexia · Hyperthermia",
                        drugs: "SSRIs / SNRIs · Tramadol · MDMA · MAOIs"
                    },
                    sympath: {
                        title: "Sympathomimetic",
                        tag: "Adrenergic",
                        signs: "Agitation · Diaphoresis · Tachycardia / HTN · Bruxism",
                        drugs: "Cocaine · Amphetamines · Methylphenidate · Speed"
                    },
                    opioidW: {
                        title: "Opioid Withdrawal",
                        tag: "Rebound",
                        signs: "Yawning · Lacrimation / rhinorrhea · Piloerection · Diarrhea · Reactive mydriasis"
                    },
                    diffNote: "⚡ <strong>Diaphoresis differentiator:</strong> With clonus → <strong>Serotonergic</strong> | Without clonus → <strong>Sympathomimetic</strong>.",
                    polyNote: "⚠️ <strong>Polysubstance use:</strong> Alcohol or benzodiazepines can blunt stimulant mydriasis.",
                    nmsWarning: "🧠 <strong>Differential caveat (NMS vs SS):</strong> <strong>Serotonin Syndrome</strong> typically presents with mydriasis (+ clonus / hyperreflexia). Conversely, in <strong>Neuroleptic Malignant Syndrome (NMS)</strong>, pupils are characteristically <strong>normal or intermediate</strong> (+ lead-pipe rigidity / bradykinesia)."
                },
                miosis: {
                    opioids: {
                        title: "Opioid Toxidrome",
                        tag: "Pinpoint",
                        signs: "Bilateral pinpoint pupils + Respiratory depression + Stupor / coma",
                        drugs: "Fentanyl · Heroin · Methadone · Morphine · Tramadol (overdose)",
                        action: "➔ Airway / respiratory support + Naloxone"
                    },
                    chol: {
                        title: "Cholinergic Toxidrome",
                        tag: "Secretions",
                        signs: "Salivation · Lacrimation · Bronchorrhea · Diarrhea · Fasciculations",
                        drugs: "Organophosphates · AChEIs (Donepezil, Rivastigmine toxicity)"
                    },
                    alpha2: {
                        title: "α₂ Agonists / Sedatives",
                        tag: "Hypotension",
                        signs: "Deep sedation · Bradycardia · Significant hypotension",
                        drugs: "Clonidine · Guanfacine"
                    }
                },
                asimetria: {
                    local: {
                        title: "1. Local Pharmacological Cause",
                        tag: "Local Rule-Out",
                        lead: "<strong>Recent nebulizer or eye drops?</strong> Mask leak with <strong>ipratropium bromide</strong> or accidental ocular contact.",
                        signs: "Presentation: Isolated unilateral mydriasis with completely normal cranial nerves and mental status.",
                        action: "➔ Clinical observation"
                    },
                    neuro: {
                        title: "2. Neurological Emergency",
                        tag: "Medical Urgency",
                        lead: "Suspect an acute non-pharmacological neurological cause if accompanied by:",
                        signs: "Ptosis · Diplopia · Focal motor deficit · Recent head trauma",
                        action: "➔ Urgent head CT + immediate Neurology / Neurosurgery consultation."
                    }
                }
            }
        },

        setTab: function (tab) {
            this.activeTab = tab;
            this.render();
        },

        setLang: function (l) {
            this.lang = l;
            this.render();
        },

        render: function () {
            const modalData = document.getElementById('modalData');
            if (!modalData) return;

            const t = this.i18n[this.lang];
            const currentTab = this.activeTab;

            const tabs = [
                { id: 'midriasis', label: t.tabs.midriasis, icon: 'fa-eye' },
                { id: 'miosis', label: t.tabs.miosis, icon: 'fa-compress-arrows-alt' },
                { id: 'asimetria', label: t.tabs.asimetria, icon: 'fa-exclamation-triangle' }
            ];

            let contentHtml = '';

            if (currentTab === 'midriasis') {
                const d = t.midriasis;
                contentHtml = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #f59e0b; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#d97706; text-transform:uppercase;">${d.antichol.title}</span>
                                <span style="font-size:0.65rem; background:rgba(245,158,11,0.15); color:#d97706; padding:2px 6px; border-radius:4px; font-weight:700;">${d.antichol.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.antichol.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25;">
                                ${d.antichol.drugs}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #ef4444; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#dc2626; text-transform:uppercase;">${d.serot.title}</span>
                                <span style="font-size:0.65rem; background:rgba(239,68,68,0.15); color:#dc2626; padding:2px 6px; border-radius:4px; font-weight:700;">${d.serot.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.serot.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25;">
                                ${d.serot.drugs}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #6366f1; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#4f46e5; text-transform:uppercase;">${d.sympath.title}</span>
                                <span style="font-size:0.65rem; background:rgba(99,102,241,0.15); color:#4f46e5; padding:2px 6px; border-radius:4px; font-weight:700;">${d.sympath.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.sympath.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25;">
                                ${d.sympath.drugs}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #64748b; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:var(--text); text-transform:uppercase;">${d.opioidW.title}</span>
                                <span style="font-size:0.65rem; background:rgba(100,116,139,0.15); color:var(--text-muted); padding:2px 6px; border-radius:4px; font-weight:700;">${d.opioidW.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3;">
                                ${d.opioidW.signs}
                            </div>
                        </div>

                        <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:0.65rem 0.75rem; font-size:0.68rem; line-height:1.35; color:var(--text);">
                            ${d.nmsWarning}
                        </div>

                        <div style="background:rgba(125,125,125,0.05); border:1px dashed var(--border); border-radius:8px; padding:0.6rem 0.75rem; font-size:0.68rem; line-height:1.35; color:var(--text);">
                            <div>${d.diffNote}</div>
                            <div style="margin-top:3px; color:var(--text-muted);">${d.polyNote}</div>
                        </div>
                    </div>
                `;
            } else if (currentTab === 'miosis') {
                const d = t.miosis;
                contentHtml = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #ef4444; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#dc2626; text-transform:uppercase;">${d.opioids.title}</span>
                                <span style="font-size:0.65rem; background:rgba(239,68,68,0.15); color:#dc2626; padding:2px 6px; border-radius:4px; font-weight:700;">${d.opioids.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.opioids.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25; margin-bottom:6px;">
                                ${d.opioids.drugs}
                            </div>
                            <div style="background:rgba(239,68,68,0.12); color:#dc2626; font-size:0.68rem; font-weight:700; padding:4px 8px; border-radius:4px; display:inline-block;">
                                ${d.opioids.action}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #0284c7; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#0284c7; text-transform:uppercase;">${d.chol.title}</span>
                                <span style="font-size:0.65rem; background:rgba(2,132,199,0.15); color:#0284c7; padding:2px 6px; border-radius:4px; font-weight:700;">${d.chol.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.chol.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25;">
                                ${d.chol.drugs}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #64748b; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:var(--text); text-transform:uppercase;">${d.alpha2.title}</span>
                                <span style="font-size:0.65rem; background:rgba(100,116,139,0.15); color:var(--text-muted); padding:2px 6px; border-radius:4px; font-weight:700;">${d.alpha2.tag}</span>
                            </div>
                            <div style="font-size:0.75rem; font-weight:600; color:var(--text); line-height:1.3; margin-bottom:4px;">
                                ${d.alpha2.signs}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25;">
                                ${d.alpha2.drugs}
                            </div>
                        </div>
                    </div>
                `;
            } else if (currentTab === 'asimetria') {
                const d = t.asimetria;
                contentHtml = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #10b981; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#059669; text-transform:uppercase;">${d.local.title}</span>
                                <span style="font-size:0.65rem; background:rgba(16,185,129,0.15); color:#059669; padding:2px 6px; border-radius:4px; font-weight:700;">${d.local.tag}</span>
                            </div>
                            <div style="font-size:0.72rem; line-height:1.3; margin-bottom:4px; color:var(--text);">
                                ${d.local.lead}
                            </div>
                            <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.25; margin-bottom:6px;">
                                ${d.local.signs}
                            </div>
                            <div style="background:rgba(16,185,129,0.12); color:#059669; font-size:0.66rem; font-weight:700; padding:3px 8px; border-radius:4px; display:inline-block;">
                                ${d.local.action}
                            </div>
                        </div>

                        <div style="background:var(--card); border:1px solid var(--border); border-left:4px solid #ef4444; border-radius:8px; padding:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-weight:800; font-size:0.75rem; color:#dc2626; text-transform:uppercase;">${d.neuro.title}</span>
                                <span style="font-size:0.65rem; background:rgba(239,68,68,0.15); color:#dc2626; padding:2px 6px; border-radius:4px; font-weight:700;">${d.neuro.tag}</span>
                            </div>
                            <div style="font-size:0.72rem; line-height:1.3; margin-bottom:4px; color:var(--text);">
                                ${d.neuro.lead}
                            </div>
                            <div style="font-size:0.7rem; font-weight:700; color:#dc2626; margin-bottom:6px;">
                                ${d.neuro.signs}
                            </div>
                            <div style="background:rgba(239,68,68,0.12); color:#dc2626; font-size:0.66rem; font-weight:700; padding:3px 8px; border-radius:4px; display:inline-block;">
                                ${d.neuro.action}
                            </div>
                        </div>
                    </div>
                `;
            }

            modalData.innerHTML = `
                <div class="calc-ui" style="padding:1rem; display:flex; flex-direction:column; max-width:540px; margin:0 auto; width:100%; box-sizing:border-box;">
                    <div style="position:sticky; top:0; background:var(--card); z-index:10; padding-bottom:0.75rem; border-bottom:1px solid var(--border); margin-bottom:0.75rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <div>
                                <h2 style="font-weight:800; font-size:1.1rem; margin:0; line-height:1.2; color:var(--text);">${t.title}</h2>
                                <span style="font-size:0.62rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">${t.subtitle}</span>
                            </div>
                            
                            <div style="display:inline-flex; background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:2px; gap:2px;">
                                <button onclick="PupilasApp.setLang('es')" style="
                                    border:none;
                                    background:${this.lang === 'es' ? 'var(--primary)' : 'transparent'};
                                    color:${this.lang === 'es' ? '#ffffff' : 'var(--text-muted)'};
                                    font-weight:800;
                                    font-size:0.65rem;
                                    padding:3px 7px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    transition:0.2s;
                                ">ES</button>
                                <button onclick="PupilasApp.setLang('en')" style="
                                    border:none;
                                    background:${this.lang === 'en' ? 'var(--primary)' : 'transparent'};
                                    color:${this.lang === 'en' ? '#ffffff' : 'var(--text-muted)'};
                                    font-weight:800;
                                    font-size:0.65rem;
                                    padding:3px 7px;
                                    border-radius:4px;
                                    cursor:pointer;
                                    transition:0.2s;
                                ">EN</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
                            ${tabs.map(item => {
                                const isActive = currentTab === item.id;
                                return `
                                    <button onclick="PupilasApp.setTab('${item.id}')" style="
                                        border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
                                        background:${isActive ? 'var(--primary)' : 'var(--bg)'};
                                        color:${isActive ? '#ffffff' : 'var(--text-muted)'};
                                        font-weight:${isActive ? '800' : '600'};
                                        padding:0.5rem 0.2rem;
                                        border-radius:6px;
                                        cursor:pointer;
                                        font-size:0.68rem;
                                        display:flex;
                                        flex-direction:column;
                                        align-items:center;
                                        gap:3px;
                                        transition:0.15s ease-in-out;
                                    ">
                                        <i class="fas ${item.icon}" style="font-size:0.8rem;"></i>
                                        <span>${item.label}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div style="overflow-y:auto; -webkit-overflow-scrolling:touch; flex:1;">
                        ${contentHtml}
                    </div>
                </div>
            `;
        },

        init: function () {
            const modal = document.getElementById('modal');
            if (modal) modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.render();
        }
    };
})();
