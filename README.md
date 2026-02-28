# Media Tracker - Gestor de Películas, Series y Juegos

Aplicación full stack para registrar contenido multimedia visto y por ver, con autenticación local y OAuth (Google y GitHub), roles de usuario/admin y paneles dedicados.

## 🧰 Tecnologías utilizadas

### Backend
- Node.js + Express ([`server.js`](application/backend/server.js))
- MySQL (`mysql2`) para persistencia de usuarios y contenido ([`database.js`](application/backend/src/config/database.js))
- JWT para autenticación stateless ([`authController.js`](application/backend/src/controllers/authController.js))
- Cookies seguras con [`cookie-parser`](application/backend/package.json)
- OAuth 2.0 con Passport:
  - Google: `passport-google-oauth20`
  - GitHub: `passport-github2`
  ([`passport.js`](application/backend/src/config/passport.js))
- Pruebas unitarias con Jest ([`authController.test.js`](application/backend/tests/authController.test.js))

### Frontend
- React 19 + Vite ([`package.json`](application/frontend/package.json))
- Enrutamiento con React Router DOM ([`App.jsx`](application/frontend/src/App.jsx))
- Manejo de estado con hooks (`useState`, `useEffect`, `useMemo`) en páginas y componentes ([`DashboardView.jsx`](application/frontend/src/pages/DashboardView.jsx))
- Estilos con CSS personalizado ([`App.css`](application/frontend/src/styles/App.css))

---

## 🏗️ Backend y API (explicación completa)

### 1) Arquitectura general del backend
El servidor se inicializa en [`server.js`](application/backend/server.js), donde se configura:
- CORS con lista blanca de orígenes desde [`oauth.js`](application/backend/src/config/oauth.js).
- Parseo de JSON/formularios y cookies.
- Inicialización de Passport.
- Registro de rutas:
  - `/api/auth` → [`authRoutes.js`](application/backend/src/routes/authRoutes.js)
  - `/api/media` → [`mediaRoutes.js`](application/backend/src/routes/mediaRoutes.js)
  - `/api/admin` → [`adminRoutes.js`](application/backend/src/routes/adminRoutes.js)

Además expone:
- `GET /api/health` (estado del servicio)
- `GET /api` (resumen de endpoints)

### 2) Autenticación local (registro/login)
En [`authController.register()`](application/backend/src/controllers/authController.js:112) se valida la entrada, se verifica duplicidad de usuario/email, se hashea contraseña con bcrypt y se genera token JWT.

En [`authController.login()`](application/backend/src/controllers/authController.js:173) se valida credenciales, se compara hash de contraseña y se retorna token + perfil.

Ambos flujos llaman internamente a:
- [`issueTokenAndSetCookie()`](application/backend/src/controllers/authController.js:104)
- [`setAuthCookie()`](application/backend/src/controllers/authController.js:20)

Esto permite autenticación por:
- Header `Authorization: Bearer <token>`
- Cookie `auth_token`

El middleware [`authMiddleware`](application/backend/src/middleware/auth.js) soporta ambos mecanismos.

### 3) API de medios
Todas las rutas de medios están protegidas con middleware JWT en [`mediaRoutes.js`](application/backend/src/routes/mediaRoutes.js:6):

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/media` | Lista ítems del usuario autenticado |
| GET | `/api/media/:id` | Obtiene un ítem por ID |
| POST | `/api/media` | Crea nuevo ítem |
| PUT | `/api/media/:id` | Actualiza estado/rating u otros campos |
| DELETE | `/api/media/:id` | Elimina ítem |

### 4) API de administración
Las rutas de admin requieren 2 capas:
1. JWT válido (`authMiddleware`)
2. Rol admin (`requireAdmin`)

Implementado en [`adminRoutes.js`](application/backend/src/routes/adminRoutes.js:7).

Endpoints:
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

---

## 🔐 Login con Google y GitHub (OAuth 2.0)

### Flujo OAuth implementado
1. Frontend redirige al backend:
   - Google: `GET /api/auth/google`
   - GitHub: `GET /api/auth/github`
   (disparado desde [`handleOAuthLogin()`](application/frontend/src/pages/Login.jsx:25)).

2. Backend inicia estrategia Passport:
   - Google/GitHub en [`authRoutes.js`](application/backend/src/routes/authRoutes.js)
   - Estrategias definidas en [`passport.js`](application/backend/src/config/passport.js)

3. Proveedor OAuth autentica y redirige al callback:
   - `/api/auth/google/callback`
   - `/api/auth/github/callback`

4. En callback:
   - Se ejecuta [`findOrCreateOAuthUser()`](application/backend/src/controllers/authController.js:55)
   - Se emite JWT por [`issueTokenAndSetCookie()`](application/backend/src/controllers/authController.js:104)
   - Se redirige al frontend según rol (`/dashboard` o `/admin`) con token en query.

5. Frontend consume query token y lo guarda en `localStorage` en [`useEffect()`](application/frontend/src/pages/DashboardView.jsx:136).

### Variables de entorno clave para OAuth
Definidas/consumidas en [`oauth.js`](application/backend/src/config/oauth.js) y [`passport.js`](application/backend/src/config/passport.js):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `BACKEND_URL`
- `FRONTEND_URL` / `FRONTEND_URL_LOCAL`

Si faltan credenciales OAuth, las rutas responden error controlado (Google/GitHub no configurado).

---

## 🖥️ Frontend (explicación detallada)

### 1) Estructura y navegación
La app monta React en [`main.jsx`](application/frontend/src/main.jsx) y define rutas en [`App.jsx`](application/frontend/src/App.jsx):
- `/login`
- `/register`
- `/dashboard`
- `/admin`

Se usa [`BrowserRouter`](application/frontend/src/App.jsx:10), [`Routes`](application/frontend/src/App.jsx:11) y [`Route`](application/frontend/src/App.jsx:12).

### 2) Pantallas principales
- Login: [`Login.jsx`](application/frontend/src/pages/Login.jsx)
  - Login por usuario/email + password
  - Botones OAuth para Google y GitHub
- Registro: [`Register.jsx`](application/frontend/src/pages/Register.jsx)
- Dashboard de usuario: [`DashboardView.jsx`](application/frontend/src/pages/DashboardView.jsx)
- Dashboard admin: [`AdminDashboard.jsx`](application/frontend/src/pages/AdminDashboard.jsx)

### 3) Estado de aplicación y React Context
En esta versión **no hay un contexto global con React Context API** (no existe [`createContext()`](application/frontend/src/App.jsx:8) ni `useContext` en el código actual).

El estado se maneja de forma local por pantalla/componente usando hooks:
- Formularios y errores en login/registro con `useState`.
- Datos de medios, modales, filtros y estado de carga en [`DashboardView.jsx`](application/frontend/src/pages/DashboardView.jsx).

Patrón usado:
- Estado local por dominio de UI (form, loading, error, modal).
- Persistencia de sesión en `localStorage` (`token`).
- Peticiones HTTP centralizadas por URL base con [`buildApiUrl()`](application/frontend/src/lib/api.js:10).

### 4) Componentes reutilizables
- Botón con comportamiento API configurable: [`ButtonComponent`](application/frontend/src/components/ButtonComponent.jsx)
- Barra superior y logout: [`Navbar`](application/frontend/src/components/Navbar.jsx)
- Tabs y tablas del dashboard en componentes desacoplados (`DashboardTabs`, `MediaSection`, `MediaTable`).

### 5) Navegación con router
Se utiliza:
- [`useNavigate()`](application/frontend/src/pages/Login.jsx:8) y [`useNavigate()`](application/frontend/src/pages/Register.jsx:7) para transiciones programáticas.
- Redirección automática raíz → login con [`Navigate`](application/frontend/src/App.jsx:12).

---

## 🧪 Pruebas realizadas (POST, GET y PUT)

### 1) POST - Registro
Endpoint: `POST /api/auth/register`

Body ejemplo:
```json
{
  "username": "nuevo_usuario",
  "email": "nuevo@email.com",
  "password": "12345678"
}
```

Resultado esperado:
- `201 Created`
- Retorna `token` y objeto `user`.

Cobertura relacionada en pruebas: [`authController.test.js`](application/backend/tests/authController.test.js).

### 2) GET - Perfil autenticado
Endpoint: `GET /api/auth/me`

Headers:
```http
Authorization: Bearer <token>
```

Resultado esperado:
- `200 OK`
- Retorna `{ user: {...} }`.

Lógica del endpoint: [`authController.getMe()`](application/backend/src/controllers/authController.js:231).

### 3) PUT - Actualización de medio (marcar como visto)
Endpoint: `PUT /api/media/:id`

Body ejemplo:
```json
{
  "status": "seen",
  "rating": "liked"
}
```

Resultado esperado:
- `200 OK`
- El ítem pasa de watchlist a vistos con calificación.

Consumo desde frontend en [`handleMarkSeen()`](application/frontend/src/pages/DashboardView.jsx:247).

---

## 📸 Capturas de pantalla de la aplicación

Actualmente el repositorio no contiene archivos de captura (`.png` / `.jpg`).

Se deja esta sección para documentar la evidencia visual final:

1. Pantalla de Login
2. Pantalla de Registro
3. Dashboard usuario (películas/series/juegos)
4. Flujo OAuth (redirección y sesión iniciada)
5. Dashboard de administrador

> Recomendación: guardar capturas en `docs/screenshots/` y enlazarlas aquí.

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [`LICENSE`](LICENSE).
