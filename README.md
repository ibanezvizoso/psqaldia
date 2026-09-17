# 🧠 PSQ al día (`psqaldia.com`)

> Plataforma clínica serverless y compendio interactivo de herramientas de decisión médica, psicofarmacología, guías y protocolos para profesionales de la salud mental.

---

## 🚀 Arquitectura Técnica

El proyecto opera bajo un modelo desacoplado y optimizado para acceso móvil inmediato en entornos hospitalarios, minimizando consumo de cuota de API y latencia mediante caché perimetral en Cloudflare.

```text
               ┌──────────────────────────────────┐
               │          Google Sheets           │
               │ (CMS: Hoja 1, Config_IA, Tablas) │
               └────────────────┬─────────────────┘
                                │ (API v4)
                                ▼
 ┌─────────────────┐     ┌──────────────┐     ┌──────────────────────┐
 │ Frontend        │────▶│  Cloudflare  │────▶│   Cloudflare Pages   │
 │ Webapp / Modales│◀────│ Worker v6.1  │◀────│   (Estáticos/HTML)   │
 └─────────────────┘     └──────┬───────┘     └──────────────────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Cloudflare Workers AI│
                     │ (Llama 3.1 8B Inst.) │
                     └──────────────────────┘
