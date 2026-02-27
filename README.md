# Media Tracker - Gestor de Películas, Series y Juegos

Una aplicación web para gestionar y rastrear el contenido multimedia que has visto, te gustó, o planeas ver.

## 📁 Estructura del Proyecto

```
Avance_de_Proyecto_Fullstack/
├── README.md
├── LICENSE
├── .gitignore
└── application/
    ├── backend/
    │   ├── server.js              # Punto de entrada del servidor Express
    │   ├── package.json           # Dependencias del backend
    │   └── src/
    │       ├── config/
    │       │   ├── constants.js   # Constantes de la aplicación
    │       │   ├── database.js    # Configuración de SQLite
    │       │   └── schema.js      # Esquema de la base de datos
    │       ├── controllers/
    │       │   └── mediaController.js  # Lógica de medios
    │       └── routes/
    │           └── mediaRoutes.js # Rutas de medios (CRUD)
    │
    └── frontend/
        ├── index.html            # Estructura HTML con modales
        ├── app.js                # Lógica JavaScript (DOM, API)
        └── style.css             # Estilos CSS
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v14 o superior)
- npm

### Instalación

1. **Instalar dependencias del backend:**
   ```bash
   cd application/backend
   npm install
   ```

2. **Iniciar el servidor:**
   ```bash
   cd application/backend
   node server.js
   ```

3. **Abrir la aplicación:**
   Navega a `http://localhost:3000` en tu navegador.

## 🔧 API Endpoints

### Medios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/media` | Obtener todos los medios |
| GET | `/api/media/:id` | Obtener un medio por ID |
| POST | `/api/media` | Crear un nuevo medio |
| PUT | `/api/media/:id` | Actualizar un medio (rating, status) |
| DELETE | `/api/media/:id` | Eliminar un medio |

### Cuerpo de solicitud (POST /api/media):

```json
{
  "title": "Nombre del contenido",
  "media_type": "movie/series/game",
  "status": "watchlist/seen",
  "rating": "loved/liked/disliked",
  "reason": "Razón para ver (opcional)"
}
```

### Cuerpo de solicitud (PUT /api/media/:id - marcar como visto):

```json
{
  "status": "seen",
  "rating": "loved/liked/disliked"
}
```

## 📱 Características

- **Navegación por categorías**: Películas, Series y Juegos
- **Gestión de Watchlist**: Agrega contenido que planeas ver con razón opcional
- **Calificaciones**: Clasifica contenido visto como:
  - ❤️ Me encantó
  - 👍 Me gustó
  - 👎 No me gustó
- **Marcador de visto**: Modal para calificar contenido del watchlist
- **Eliminación**: Elimina elementos no deseados con confirmación

## 🎨 Interfaz

### Modales

1. **Modal de añadir**: Se abre con los botones "Agregar película/serie/juego"
   - Si es para el watchlist: pide el título y razón
   - Si es para vistos: pide el título y calificación

2. **Modal de marcar como visto**: Se abre con el botón "Visto" en el watchlist
   - Permite seleccionar calificación antes de mover a vistos

### Pestañas

- **Vistas**: Muestra contenido por calificación (Me encantó, Me gustó, No me gustó)
- **Por ver**: Muestra contenido del watchlist con razón y botón para marcar como visto

## 🎯 Uso

1. **Añadir a watchlist**: Haz clic en "Agregar" en la sección "Por ver", ingresa nombre y razón
2. **Marcar como visto**: Haz clic en "Visto" en un ítem del watchlist, selecciona calificación
3. **Filtrar por tipo**: Usa los botones de navegación (Películas/Series/Juegos)
4. **Eliminar**: Haz clic en "Eliminar" en cualquier ítem

## 🗄️ Base de Datos

La aplicación usa **SQLite** con las siguientes tablas:

- **media_items**: Películas, series y juegos
  - `id`: Identificador único
  - `title`: Nombre del contenido
  - `media_type`: movie/series/game
  - `status`: watchlist/seen
  - `rating`: loved/liked/disliked (nullable)
  - `reason`: Razón para ver (opcional, solo watchlist)
  - `created_at`: Fecha de creación
  - `updated_at`: Fecha de última modificación

- **media_types**: Tipos de contenido
  - `id`: Identificador único
  - `type_name`: movie/series/game

La base de datos se crea automáticamente al iniciar el servidor en:
`application/backend/src/media_tracker.db`

## 🎨 Personalización

### Textos de botones

En `application/frontend/app.js`, función `renderItem()`:

```javascript
// Cambiar texto del botón "Visto"
seenBtn.textContent = 'Visto';

// Cambiar texto del botón eliminar
deleteBtn.textContent = 'Eliminar';
```

### Colores de secciones

En `application/frontend/style.css`:

```css
/* Películas */
#seen-movies .media-container { border-left-color: #5b7c8d; }
#watchlist-movies .media-container { border-left-color: #7a8f7a; }

/* Series */
#seen-series .media-container { border-left-color: #6b7280; }
#watchlist-series .media-container { border-left-color: #8b9474; }

/* Juegos */
#seen-games .media-container { border-left-color: #7c6f91; }
#watchlist-games .media-container { border-left-color: #8a7f6d; }
```

## 📝 Licencia

Este proyecto está bajo la licencia MIT.
