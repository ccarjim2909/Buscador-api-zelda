# Buscador API Zelda

Proyecto web estatico inspirado en The Legend of Zelda.

## Estructura

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

## Que hace cada archivo JS

- `js/api.js`: consultas a la Zelda API, normalizacion de datos y favoritos en Firestore.
- `js/firebase.js`: configuracion y exports de Firebase/Firestore.
- `js/transform.js`: conversion XML a JSON y JSON a CSV.
- `js/ui.js`: renderizado y manejo del DOM para `index.html`, `favoritos.html` y `catalogo_XML.html`.

## Datos y esquemas

- `data/juegos.xml`: catalogo base de juegos Zelda.
- `data/juegos.xsd`: esquema XSD del XML.
- `schemas/entidad_schema.json`: esquema JSON de una entidad renderizada.

## Nota

Los favoritos ahora se guardan en Firebase Firestore.
