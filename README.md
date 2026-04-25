# Buscador API Zelda

## Descripcion del proyecto

Este proyecto es una aplicacion web sobre *The Legend of Zelda*. Sirve para buscar informacion en una API publica de Zelda, ver resultados en tarjetas, guardar favoritos en la nube con Firebase y trabajar tambien con un catalogo propio en XML.

La aplicacion tiene tres partes principales:

- `index.html`: buscador principal conectado a la Zelda API.
- `favoritos.html`: pagina donde se muestran los favoritos guardados en Firestore.
- `catalogo_XML.html`: pagina donde se lee un XML, se convierte a JSON con `DOMParser` y se puede exportar a CSV.

La idea del proyecto es practicar varios formatos de datos y varias formas de almacenamiento dentro de una misma aplicacion.

## Tecnologias y herramientas

He usado:

- `HTML`: para la estructura de las paginas.
- `CSS`: para el diseño visual y para mantener el mismo estilo en todas las vistas.
- `JavaScript`: para la logica, llamadas a la API, renderizado del DOM y transformaciones de datos.
- `Firebase Firestore`: para guardar los favoritos en la nube.
- `Zelda API`: como fuente principal de datos del buscador.
- `XML`, `XSD`, `JSON Schema` y `CSV`: para trabajar distintos formatos y validaciones.

He elegido estas herramientas porque son faciles de integrar en un proyecto web sencillo y permiten demostrar varias cosas a la vez: consumo de API, persistencia de datos, transformacion de formatos y validacion.

Alternativas que considere:

- En vez de Firestore, se podria haber usado solo `localStorage`, pero lo descarte para favoritos porque queria que quedasen en la nube y no solo en un navegador.
- En vez de XML, podria haber hecho todo en JSON, pero el ejercicio pide trabajar tambien con XML y conversiones.
- En vez de una API externa, podria haber usado un JSON local, pero la idea era practicar `fetch` y consumo real de una API.

## La Zelda API

La API principal que uso es:

`https://zelda.fanapis.com/api`

Los endpoints que uso son estos:

- `/games`
- `/characters`
- `/monsters`
- `/items`
- `/places`
- `/bosses`
- `/dungeons`

En el buscador construyo la URL segun la categoria y el texto escrito por el usuario. Por ejemplo:

`https://zelda.fanapis.com/api/games?limit=12&page=0`

o si hay busqueda:

`https://zelda.fanapis.com/api/characters?limit=12&page=0&name=Link`

La API devuelve un JSON con un array `data`. Dentro de cada elemento vienen muchos campos, pero en mi proyecto no uso todos, solo los que me hacen falta para mostrar la informacion en pantalla.

Ejemplo real simplificado de respuesta:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "5f6d3fcb23d7c30004cfa4e5",
      "name": "Link",
      "description": "Link is the main protagonist...",
      "gender": "Male",
      "race": "Hylian",
      "appearances": ["Ocarina of Time", "Breath of the Wild"]
    }
  ]
}
```

Los campos que uso en el proyecto son sobre todo:

- `id`: para generar un identificador unico.
- `name`: para el titulo de la tarjeta.
- `description`: para el texto principal.
- `released_date`: para mostrar fecha en juegos cuando existe.
- `gender` y `race`: para algunos personajes.
- `appearances`, `games`, `dungeons`, `inhabitants`, `worked_on`: para sacar informacion resumida en las tarjetas.

La integracion la hago con `fetch` en `js/api.js`, despues normalizo la respuesta y finalmente la pinto en pantalla desde `js/ui.js`.

## Formatos de datos

### JSON

JSON es un formato de datos muy usado en web. Se escribe con claves y valores, y es muy comodo para JavaScript porque se convierte facilmente en objetos.

En este proyecto lo uso en dos sitios:

- en las respuestas de la Zelda API
- en el JSON que genero a partir del XML

Yo usaria JSON cuando quiero trabajar rapido con datos en una aplicacion web o intercambiar informacion entre frontend y backend.

### XML

XML es otro formato de datos, pero mas basado en etiquetas. Es mas verboso que JSON, pero va bien cuando quieres una estructura muy clara y validarla con un XSD.

En este proyecto lo uso en `data/juegos.xml`, donde guardo un catalogo de juegos de Zelda con su `id`, titulo, desarrolladora, publicadora, plataforma, anio y puntuacion.

Yo usaria XML cuando el ejercicio o el sistema me pide una estructura formal y validacion mediante esquema.

### CSV

CSV es un formato muy simple para tablas. Cada linea es una fila y los valores van separados por comas.

En este proyecto lo uso para exportar el catalogo XML ya convertido. Es util porque luego ese archivo se puede abrir facilmente en Excel o en hojas de calculo.

Yo usaria CSV cuando quiero exportar datos tabulares de forma sencilla.

### Diferencias y relacion con el proyecto

- JSON: mejor para trabajar en JavaScript y APIs.
- XML: mejor para ejercicios de marcado estructurado y validacion con XSD.
- CSV: mejor para exportar listas o tablas.

En mi proyecto he usado cada uno donde tiene mas sentido:

- JSON para la API y la aplicacion.
- XML para el catalogo base.
- CSV para la exportacion final.

## Esquemas

En el proyecto hay dos esquemas:

- `schemas/entidad_schema.json`
- `data/juegos.xsd`

### JSON Schema

El JSON Schema valida la estructura de una entidad que usa la aplicacion. Por ejemplo, comprueba que existan campos como:

- `uid`
- `id`
- `category`
- `categoryLabel`
- `name`
- `description`
- `detailUrl`
- `meta`

Tambien comprueba el tipo de esos campos, por ejemplo que `meta` sea un array.

### XSD

El XSD valida el archivo `data/juegos.xml`. Comprueba que:

- exista el nodo raiz `saga`
- cada `juego` tenga su atributo `id`
- existan etiquetas como `titulo`, `desarrolladora`, `publicadora`, `plataforma`, `anio` y `puntuacion`
- `anio` y `puntuacion` sean enteros

### Evidencia de validacion

La evidencia que aporto en el proyecto es:

- el archivo `data/juegos.xml` esta construido siguiendo la estructura marcada en `data/juegos.xsd`
- el archivo `schemas/entidad_schema.json` define los campos que tienen las entidades que renderiza la aplicacion
- en la conversion XML a JSON, `anio` y `puntuacion` se convierten a numero con `Number(...)`, no se dejan como texto

No he montado un validador automatico dentro de la web, pero si he dejado preparados los dos esquemas para poder validarlos con un validador de XML y un validador de JSON Schema.

## Almacenamiento

### Por que uso localStorage para cache y Firestore para favoritos

La cache en `localStorage` tendria sentido para guardar resultados temporales del buscador y evitar repetir peticiones iguales todo el rato. Su ventaja es que es rapido, sencillo y no necesita servidor.

Para los favoritos uso Firestore porque ahi si quiero persistencia real en la nube. La ventaja es que los datos no dependen solo del navegador donde se guardaron.

### Por que localStorage no es buena opcion para favoritos

`localStorage` tiene varias limitaciones:

- solo guarda los datos en ese navegador y en ese dispositivo
- si el usuario borra datos del navegador, se pierden
- no es una base de datos real
- no tiene control de usuarios ni reglas de seguridad
- no sirve bien si en un futuro quieres varios usuarios

Por eso me parece mejor usar Firestore para favoritos.

### Reglas de seguridad de Firestore

Las reglas de seguridad de Firestore sirven para decir quien puede leer o escribir datos en la base de datos.

En desarrollo se puede dejar algo mas abierto para probar, pero en produccion no seria correcto. En un caso real habria que:

- activar autenticacion
- permitir que cada usuario solo vea y modifique sus propios favoritos
- evitar escrituras anonimas sin control

### Otras alternativas de almacenamiento

Otras opciones que podria usar son:

- `sessionStorage`: si quisiera datos temporales solo mientras la pestana esta abierta
- una base de datos SQL: si el proyecto fuera mas grande y necesitara relaciones mas complejas
- `IndexedDB`: si necesitara guardar bastante informacion en el navegador
- un backend propio con API y base de datos: si quisiera usuarios, login y mas control general

## Decisiones tecnicas

### Decision 1: separar la logica en varios archivos JS

He separado el codigo en:

- `api.js`
- `firebase.js`
- `transform.js`
- `ui.js`

Lo hice asi porque me parece mas ordenado. Si metia todo en un solo archivo, luego era mas dificil de entender y mantener.

### Decision 2: usar una sola capa de UI para varias paginas

En vez de duplicar mucha logica, en `ui.js` detecto en que pagina estoy y solo ejecuto la parte necesaria. Me parecio una forma practica de reaprovechar codigo sin tener que repetir funciones.

### Decision 3: convertir `anio` y `puntuacion` a numero

He convertido esos campos a numero porque asi los datos quedan mejor tipados y no parecen texto cuando realmente representan valores numericos.

## Instrucciones de uso

### 1. Abrir el proyecto

Como el proyecto usa `fetch` y modulos de JavaScript, lo recomendable es abrirlo con un servidor local, no directamente con doble clic en el HTML.

Se puede usar por ejemplo la extension **Live Server** de Visual Studio Code.

### 2. Configurar Firebase

La configuracion de Firebase esta en:

`js/firebase.js`

Si se quiere usar otro proyecto de Firebase, hay que cambiar el objeto:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Tambien hay que:

1. Crear un proyecto en Firebase.
2. Activar Firestore.
3. Crear la base de datos.
4. Ajustar las reglas de seguridad para desarrollo o produccion.

### 3. Usar la aplicacion

1. Entrar en `index.html`.
2. Buscar juegos, personajes, monstruos u otros elementos.
3. Pulsar la estrella para guardar favoritos en Firestore.
4. Entrar en `favoritos.html` para ver los guardados.
5. Entrar en `catalogo_XML.html` para ver el XML, el JSON convertido y descargar el CSV.

## Estructura del proyecto

```text
/
├── index.html
├── favoritos.html
├── catalogo_XML.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── firebase.js
│   ├── transform.js
│   └── ui.js
├── data/
│   ├── juegos.xml
│   └── juegos.xsd
├── schemas/
│   └── entidad_schema.json
└── README.md
```
