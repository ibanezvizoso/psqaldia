export async function onRequest(context) {
  const { env, request } = context;
  
  // 1. Detectar qué datos nos están pidiendo
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  // 2. Mapear el "type" a la pestaña real del Sheets
  let sheetName = "Hoja 1"; // Por defecto (Menú principal)
  let range = "A2:I200";

  if (type === "aps") {
    sheetName = "Data_APS"; // Pestaña de la calculadora
    range = "A2:F100";      // Rango específico para fármacos
  } else if (type === "farmacocinetica") {
    sheetName = "Data_Farmacocinetica";
    range = "A2:I100";
  }

  const fullRange = encodeURIComponent(`'${sheetName}'!${range}`);

  // 3. Hacer la petición a Google con la pestaña correcta
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${fullRange}?key=${env.GOOGLE_API_KEY}`
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
