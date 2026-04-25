import { addDoc, collection, db, deleteDoc, doc, getDocs } from "./firebase.js";

const API_ZELDA_BASE = "https://zelda.fanapis.com/api";

export const CONFIGURACION_CATEGORIAS = {
  games: { etiqueta: "Juegos", endpoint: "games" },
  characters: { etiqueta: "Personajes", endpoint: "characters" },
  monsters: { etiqueta: "Monstruos", endpoint: "monsters" },
  bosses: { etiqueta: "Jefes", endpoint: "bosses" },
  dungeons: { etiqueta: "Mazmorras", endpoint: "dungeons" },
  places: { etiqueta: "Lugares", endpoint: "places" },
  items: { etiqueta: "Objetos", endpoint: "items" },
  staff: { etiqueta: "Staff", endpoint: "staff" }
};

export const CATEGORIAS_SUGERENCIAS = ["characters", "bosses", "monsters", "games", "items", "places"];

let favoritosCache = [];

export async function obtenerFavoritos() {
  const snapshot = await getDocs(collection(db, "favoritos"));
  favoritosCache = [];

  snapshot.forEach((docu) => {
    favoritosCache.push({ idDoc: docu.id, ...docu.data() });
  });

  return favoritosCache;
}

export function esFavorito(uid) {
  return favoritosCache.some((favorito) => favorito.uid === uid);
}

export async function alternarFavorito(elemento) {
  const favoritos = favoritosCache.length ? favoritosCache : await obtenerFavoritos();
  const existente = favoritos.find((favorito) => favorito.uid === elemento.uid);

  if (existente) {
    await deleteDoc(doc(db, "favoritos", existente.idDoc));
    favoritosCache = favoritos.filter((favorito) => favorito.uid !== elemento.uid);
    return false;
  }

  const resultado = await addDoc(collection(db, "favoritos"), elemento);
  favoritosCache = [{ ...elemento, idDoc: resultado.id }, ...favoritos];
  return true;
}

export async function quitarFavorito(uid) {
  const favoritos = favoritosCache.length ? favoritosCache : await obtenerFavoritos();
  const existente = favoritos.find((favorito) => favorito.uid === uid);

  if (!existente) {
    return;
  }

  await deleteDoc(doc(db, "favoritos", existente.idDoc));
  favoritosCache = favoritos.filter((favorito) => favorito.uid !== uid);
}

export async function vaciarFavoritos() {
  const favoritos = favoritosCache.length ? favoritosCache : await obtenerFavoritos();

  for (const favorito of favoritos) {
    await deleteDoc(doc(db, "favoritos", favorito.idDoc));
  }

  favoritosCache = [];
}

export function construirUrlCategoria(categoria, consulta, limite, pagina = 0) {
  const parametros = new URLSearchParams({
    limit: String(limite),
    page: String(pagina)
  });

  if (consulta.trim()) {
    parametros.set("name", consulta.trim());
  }

  return `${API_ZELDA_BASE}/${CONFIGURACION_CATEGORIAS[categoria].endpoint}?${parametros.toString()}`;
}

function formatearCantidadRelacionada(valor) {
  if (!Array.isArray(valor) || valor.length === 0) {
    return "";
  }

  return `${valor.length} relacionados`;
}

export function obtenerVariantesConsulta(consulta) {
  const texto = consulta.trim();

  if (!texto) {
    return [""];
  }

  return [texto];
}

function limpiarTextoBusqueda(texto) {
  return texto.trim();
}

export function coincideTextoBusqueda(textoBase, consulta) {
  const baseNormalizada = limpiarTextoBusqueda(textoBase);
  const terminos = limpiarTextoBusqueda(consulta)
    .split(/\s+/)
    .filter(Boolean);

  return terminos.every((termino) => baseNormalizada.includes(termino));
}

export function normalizarElemento(elementoApi, categoria) {
  const entradasExtra = [
    ["Fecha", elementoApi.released_date],
    ["Genero", elementoApi.gender],
    ["Raza", elementoApi.race],
    ["Apariciones", formatearCantidadRelacionada(elementoApi.appearances)],
    ["Mazmorras", formatearCantidadRelacionada(elementoApi.dungeons)],
    ["Habitantes", formatearCantidadRelacionada(elementoApi.inhabitants)],
    ["Juegos", formatearCantidadRelacionada(elementoApi.games)],
    ["Trabajos", formatearCantidadRelacionada(elementoApi.worked_on)]
  ].filter((entrada) => entrada[1]);

  return {
    uid: `${categoria}-${elementoApi.id}`,
    id: elementoApi.id,
    category: categoria,
    categoryLabel: CONFIGURACION_CATEGORIAS[categoria].etiqueta,
    name: elementoApi.name || "Sin nombre",
    description: elementoApi.description || "Sin descripcion disponible en la API.",
    detailUrl: `${API_ZELDA_BASE}/${CONFIGURACION_CATEGORIAS[categoria].endpoint}/${elementoApi.id}`,
    meta: entradasExtra.slice(0, 4)
  };
}
