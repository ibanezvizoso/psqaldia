export async function onRequest(context) {

  const { env } = context;

  // OJO: tu hoja empieza en A2 y llega hasta I
  const range = encodeURIComponent("'Hoja 1'!A2:I200");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${range}?key=${env.GOOGLE_API_KEY}`
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
