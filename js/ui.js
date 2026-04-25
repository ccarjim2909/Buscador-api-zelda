import {
  CATEGORIAS_SUGERENCIAS,
  CONFIGURACION_CATEGORIAS,
  alternarFavorito,
  coincideTextoBusqueda,
  construirUrlCategoria,
  esFavorito,
  normalizarElemento,
  obtenerFavoritos,
  obtenerVariantesConsulta,
  quitarFavorito,
  vaciarFavoritos
} from "./api.js";
import { convertirJsonACsv, convertirXmlAJson } from "./transform.js";

function crearMarcadoTarjeta(elemento) {
  const marcadoMetadatos = elemento.meta?.length
    ? `
      <ul class="tarjeta-zelda__metadatos">${elemento.meta.map((metadato) => `
        <li class="tarjeta-zelda__metadato">
          <span class="tarjeta-zelda__clave">${metadato[0]}</span>
          <span>${metadato[1]}</span>
        </li>
      `).join("")}</ul>
    `
    : "";

  const simboloFavorito = esFavorito(elemento.uid) ? "&#9733;" : "&#9734;";
  const tituloFavorito = esFavorito(elemento.uid) ? "Quitar de favoritos" : "Guardar en favoritos";

  return `
    <li class="galeria__item">
      <article class="tarjeta-zelda" data-uid="${elemento.uid}" data-categoria="${elemento.category}">
        <header class="tarjeta-zelda__cabecera">
          <p class="tarjeta-zelda__tipo">${elemento.categoryLabel}</p>
          <button
            class="tarjeta-zelda__favorito ${esFavorito(elemento.uid) ? "tarjeta-zelda__favorito--activo" : ""}"
            type="button"
            data-favorito="${elemento.uid}"
            aria-label="${tituloFavorito}"
            title="${tituloFavorito}"
          >${simboloFavorito}</button>
        </header>

        <section class="tarjeta-zelda__cuerpo">
          <h3 class="tarjeta-zelda__titulo">${elemento.name}</h3>
          <p class="tarjeta-zelda__descripcion">${elemento.description}</p>
        </section>
        ${marcadoMetadatos}
      </article>
    </li>
  `;
}

function construirElementoFavorito(tarjeta, botonFavorito) {
  const titulo = tarjeta.querySelector(".tarjeta-zelda__titulo")?.textContent || "";
  const descripcion = tarjeta.querySelector(".tarjeta-zelda__descripcion")?.textContent || "";
  const categoria = tarjeta.dataset.categoria;
  const meta = Array.from(tarjeta.querySelectorAll(".tarjeta-zelda__metadato"))
    .map((metadato) => {
      const clave = metadato.querySelector(".tarjeta-zelda__clave")?.textContent || "";
      const valor = Array.from(metadato.childNodes)
        .filter((nodo) => nodo.nodeType === Node.TEXT_NODE)
        .map((nodo) => nodo.textContent.trim())
        .join(" ")
        .trim();

      return [clave, valor];
    })
    .filter((entrada) => entrada[0] && entrada[1]);

  return {
    uid: botonFavorito.dataset.favorito,
    id: botonFavorito.dataset.favorito.split("-").slice(1).join("-"),
    category: categoria,
    categoryLabel: tarjeta.querySelector(".tarjeta-zelda__tipo")?.textContent || "",
    name: titulo,
    description: descripcion,
    detailUrl: "#",
    meta
  };
}

async function inicializarBuscador() {
  const formularioBusqueda = document.querySelector(".formulario-busqueda");
  if (!formularioBusqueda) return;

  const entradaBusqueda = document.querySelector(".js-busqueda-entrada");
  const listaResultados = document.querySelector(".js-resultados-lista");
  const mensajeResultados = document.querySelector(".js-resultados-mensaje");
  const botonesFiltro = document.querySelectorAll(".filtros__boton");
  const listaSugerencias = document.querySelector(".js-busqueda-sugerencias");

  let categoriaActual = "games";
  let temporizadorSugerencias;

  function actualizarBotonesActivos(categoria) {
    botonesFiltro.forEach((boton) => {
      boton.classList.toggle("filtros__boton--activo", boton.dataset.categoria === categoria);
    });
  }

  function actualizarMensajeResultados(mensaje) {
    mensajeResultados.textContent = mensaje;
    mensajeResultados.hidden = !mensaje.trim();
  }

  function ocultarSugerencias() {
    listaSugerencias.innerHTML = "";
    listaSugerencias.classList.remove("sugerencias--visible");
  }

  function pintarSugerencias(sugerencias) {
    if (!sugerencias.length) {
      ocultarSugerencias();
      return;
    }

    listaSugerencias.innerHTML = sugerencias.map((sugerencia) => `
      <li class="sugerencias__item">
        <button class="sugerencias__boton" data-nombre="${sugerencia.nombre}" data-categoria="${sugerencia.categoria}">
          <span class="sugerencias__titulo">${sugerencia.nombre}</span>
          <span class="sugerencias__meta">${sugerencia.etiquetaCategoria}</span>
        </button>
      </li>
    `).join("");

    listaSugerencias.classList.add("sugerencias--visible");
  }

  async function buscarSugerencias(consulta) {
    const texto = consulta.trim();

    if (texto.length < 2) {
      ocultarSugerencias();
      return;
    }

    try {
      const variantes = obtenerVariantesConsulta(texto);
      const peticiones = CATEGORIAS_SUGERENCIAS.flatMap((categoria) =>
        variantes.map((variante) =>
          fetch(construirUrlCategoria(categoria, variante, 3, 0))
            .then((respuesta) => (respuesta.ok ? respuesta.json() : { data: [] }))
            .catch(() => ({ data: [] }))
            .then((resultado) => ({ resultado, categoria }))
        )
      );

      const respuestas = await Promise.all(peticiones);
      const sugerencias = [];
      const usados = new Set();

      respuestas.forEach(({ resultado, categoria }) => {
        (resultado.data || []).forEach((elemento) => {
          const nombre = elemento.name || "";
          const clave = `${categoria}-${nombre}`;

          if (!nombre || usados.has(clave) || !coincideTextoBusqueda(nombre, texto)) {
            return;
          }

          sugerencias.push({
            nombre,
            categoria,
            etiquetaCategoria: CONFIGURACION_CATEGORIAS[categoria].etiqueta
          });

          usados.add(clave);
        });
      });

      pintarSugerencias(sugerencias.slice(0, 8));
    } catch {
      ocultarSugerencias();
    }
  }

  async function buscarCategoria(categoria, consulta, pagina = 0) {
    categoriaActual = categoria;
    actualizarBotonesActivos(categoria);
    actualizarMensajeResultados("Buscando...");
    listaResultados.innerHTML = "";

    try {
      const respuesta = await fetch(construirUrlCategoria(categoria, consulta, 12, pagina));
      const data = await respuesta.json();
      const elementos = data.data
        .map((elemento) => normalizarElemento(elemento, categoria))
        .filter((elemento) => !consulta.trim() || coincideTextoBusqueda(elemento.name, consulta));

      listaResultados.innerHTML = elementos.map((elemento) => crearMarcadoTarjeta(elemento)).join("");
      actualizarMensajeResultados("");
    } catch {
      listaResultados.innerHTML = `
        <li class="galeria__item">
          <p class="estado-vacio">Error al cargar datos de la API.</p>
        </li>
      `;
      actualizarMensajeResultados("Error de conexion");
    }
  }

  listaResultados.addEventListener("click", async (evento) => {
    const botonFavorito = evento.target.closest("[data-favorito]");
    if (!botonFavorito) return;

    const tarjeta = botonFavorito.closest(".tarjeta-zelda");
    const elemento = construirElementoFavorito(tarjeta, botonFavorito);
    const guardado = await alternarFavorito(elemento);

    botonFavorito.classList.toggle("tarjeta-zelda__favorito--activo", guardado);
    botonFavorito.innerHTML = guardado ? "&#9733;" : "&#9734;";
    botonFavorito.setAttribute("aria-label", guardado ? "Quitar de favoritos" : "Guardar en favoritos");
  });

  formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    buscarCategoria(categoriaActual, entradaBusqueda.value, 0);
  });

  botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
      buscarCategoria(boton.dataset.categoria, entradaBusqueda.value, 0);
    });
  });

  entradaBusqueda.addEventListener("input", () => {
    clearTimeout(temporizadorSugerencias);
    temporizadorSugerencias = setTimeout(() => {
      buscarSugerencias(entradaBusqueda.value);
    }, 250);
  });

  entradaBusqueda.addEventListener("focus", () => {
    if (entradaBusqueda.value.length >= 2) {
      buscarSugerencias(entradaBusqueda.value);
    }
  });

  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".formulario-busqueda__campo")) {
      ocultarSugerencias();
    }
  });

  listaSugerencias.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".sugerencias__boton");
    if (!boton) return;

    entradaBusqueda.value = boton.dataset.nombre;
    categoriaActual = boton.dataset.categoria;
    buscarCategoria(categoriaActual, entradaBusqueda.value, 0);
  });

  await obtenerFavoritos().catch(() => []);
  await buscarCategoria("games", "", 0);
}

async function inicializarFavoritos() {
  const listaFavoritos = document.querySelector(".js-favoritos-lista");
  if (!listaFavoritos) return;

  const mensajeFavoritos = document.querySelector(".js-favoritos-mensaje");
  const totalFavoritos = document.querySelector(".js-favoritos-total");
  const botonVaciarFavoritos = document.querySelector(".js-favoritos-vaciar");

  function actualizarCabeceraFavoritos(total) {
    totalFavoritos.textContent = String(total);
  }

  async function pintarFavoritos() {
    const favoritos = await obtenerFavoritos();
    actualizarCabeceraFavoritos(favoritos.length);

    if (!favoritos.length) {
      mensajeFavoritos.textContent = "Aun no tienes favoritos guardados.";
      listaFavoritos.innerHTML = `
        <li class="galeria__item">
          <p class="estado-vacio">Tu galeria esta vacia. Guarda elementos desde el buscador.</p>
        </li>
      `;
      return;
    }

    mensajeFavoritos.textContent = `Tienes ${favoritos.length} elementos guardados.`;
    listaFavoritos.innerHTML = favoritos.map((elemento) => crearMarcadoTarjeta(elemento)).join("");
  }

  listaFavoritos.addEventListener("click", async (evento) => {
    const botonFavorito = evento.target.closest("[data-favorito]");
    if (!botonFavorito) return;

    await quitarFavorito(botonFavorito.dataset.favorito);
    await pintarFavoritos();
  });

  botonVaciarFavoritos.addEventListener("click", async () => {
    await vaciarFavoritos();
    await pintarFavoritos();
  });

  await pintarFavoritos();
}

async function inicializarCatalogoXml() {
  const salidaXml = document.querySelector(".js-xml-fuente");
  if (!salidaXml) return;

  const salidaJson = document.querySelector(".js-json-resultado");
  const listaCatalogo = document.querySelector(".js-catalogo-lista");
  const mensajeCatalogo = document.querySelector(".js-catalogo-mensaje");
  const botonExportar = document.querySelector(".js-catalogo-exportar");

  let catalogoActual = { saga: "", juegos: [] };

  function actualizarMensajeCatalogo(mensaje) {
    mensajeCatalogo.textContent = mensaje;
    mensajeCatalogo.hidden = !mensaje.trim();
  }

  function renderizarCatalogo(catalogo) {
    salidaJson.textContent = JSON.stringify(catalogo, null, 2);
    listaCatalogo.innerHTML = catalogo.juegos.map((juego) => `
      <li class="catalogo-juegos__item">
        <article class="catalogo-juego">
          <header class="catalogo-juego__cabecera">
            <span class="catalogo-juego__id">ID ${juego.id}</span>
            <span class="catalogo-juego__score">${juego.puntuacion}/100</span>
          </header>

          <section class="catalogo-juego__cuerpo">
            <h3 class="catalogo-juego__titulo">${juego.titulo}</h3>
            <p class="catalogo-juego__plataforma">${juego.plataforma}</p>
          </section>

          <dl class="catalogo-juego__datos">
            <div class="catalogo-juego__dato">
              <dt>Desarrolladora</dt>
              <dd>${juego.desarrolladora}</dd>
            </div>
            <div class="catalogo-juego__dato">
              <dt>Publicadora</dt>
              <dd>${juego.publicadora}</dd>
            </div>
            <div class="catalogo-juego__dato">
              <dt>Anio</dt>
              <dd>${juego.anio}</dd>
            </div>
          </dl>
        </article>
      </li>
    `).join("");
  }

  async function cargarCatalogoXml() {
    actualizarMensajeCatalogo("Cargando XML...");

    try {
      const respuesta = await fetch("./data/juegos.xml");
      if (!respuesta.ok) {
        throw new Error("No se pudo cargar el archivo XML.");
      }

      const xmlTexto = await respuesta.text();
      catalogoActual = convertirXmlAJson(xmlTexto);
      salidaXml.textContent = xmlTexto;
      renderizarCatalogo(catalogoActual);
      actualizarMensajeCatalogo("XML cargado y convertido a JSON.");
    } catch {
      salidaXml.textContent = "";
      salidaJson.textContent = "";
      listaCatalogo.innerHTML = `
        <li class="galeria__item">
          <p class="estado-vacio">No se pudo cargar el catalogo XML.</p>
        </li>
      `;
      actualizarMensajeCatalogo("Error al cargar el XML.");
    }
  }

  botonExportar.addEventListener("click", () => {
    if (!catalogoActual.juegos.length) {
      actualizarMensajeCatalogo("No hay datos cargados para exportar.");
      return;
    }

    const csv = convertirJsonACsv(catalogoActual);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "catalogo-zelda.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);

    actualizarMensajeCatalogo("CSV descargado correctamente.");
  });

  await cargarCatalogoXml();
}

await Promise.all([
  inicializarBuscador(),
  inicializarFavoritos(),
  inicializarCatalogoXml()
]);
