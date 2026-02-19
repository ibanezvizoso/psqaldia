export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  // 1. MAPEADOR DE HERRAMIENTAS
  // Aquí asocias el "type" que pide tu JS con el nombre real de la pestaña en Google Sheets
  const hojas = {
    "aps": "Data_APS",
    "farmacocinetica": "Data_Farmacocinetica",
    "sssnm": "SSSNM",
    "default": "Hoja 1"
  };

  // 2. SELECCIÓN DE LA PESTAÑA
  // Si el "type" existe en el mapa lo usa; si no, usa la principal
  const nombrePestana = hojas[type] || hojas["default"];
  
  // 3. RANGO DINÁMICO
  // Usamos el nombre seleccionado para construir la consulta
  const range = encodeURIComponent(`'${nombrePestana}'!A2:I200`);

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${range}?key=${env.GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Error en Google Sheets" }), { status: response.status });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
