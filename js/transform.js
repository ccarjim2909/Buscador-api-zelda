export function convertirXmlAJson(xmlTexto) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlTexto, "application/xml");
  const errorXml = xml.querySelector("parsererror");

  if (errorXml) {
    throw new Error("No se pudo interpretar el XML.");
  }

  const saga = xml.documentElement.getAttribute("nombre") || "Sin nombre";
  const juegos = Array.from(xml.querySelectorAll("juego")).map((juego) => ({
    id: juego.getAttribute("id") || "",
    titulo: juego.querySelector("titulo")?.textContent.trim() || "",
    desarrolladora: juego.querySelector("desarrolladora")?.textContent.trim() || "",
    publicadora: juego.querySelector("publicadora")?.textContent.trim() || "",
    plataforma: juego.querySelector("plataforma")?.textContent.trim() || "",
    anio: Number(juego.querySelector("anio")?.textContent.trim() || 0),
    puntuacion: Number(juego.querySelector("puntuacion")?.textContent.trim() || 0)
  }));

  return { saga, juegos };
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");
  const textoEscapado = texto.replace(/"/g, "\"\"");
  return /[",\n]/.test(textoEscapado) ? `"${textoEscapado}"` : textoEscapado;
}

export function convertirJsonACsv(catalogo) {
  const cabecera = ["id", "titulo", "desarrolladora", "publicadora", "plataforma", "anio", "puntuacion"];
  const filas = catalogo.juegos.map((juego) => [
    juego.id,
    juego.titulo,
    juego.desarrolladora,
    juego.publicadora,
    juego.plataforma,
    juego.anio,
    juego.puntuacion
  ]);

  return [cabecera, ...filas]
    .map((fila) => fila.map(escaparCsv).join(","))
    .join("\n");
}
