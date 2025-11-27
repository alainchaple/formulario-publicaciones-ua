Aquí tienes un **README.md profesional**, claro y completo para tu repositorio de GitHub.
Incluye:

* Descripción del proyecto
* Requisitos
* Instalación local
* Estructura del proyecto
* Uso del formulario individual y de la importación masiva
* Variables de entorno (ADMIN_TOKEN)
* Despliegue en Render
* Créditos

Puedes copiar y pegar tal cual en tu repositorio:

---

# 📚 Sistema de Recopilación de Publicaciones Científicas — Universidad Autónoma de Chile

Este proyecto implementa un sistema web para recopilar, actualizar y centralizar publicaciones científicas de investigadores, académicos y estudiantes de la **Universidad Autónoma de Chile**.

Incluye:

* **Formulario individual** para registrar una publicación.
* **Carga masiva desde Excel** para registrar múltiples artículos a la vez.
* **Descarga del archivo de datos (.csv)** centralizado.
* **Página de administración** para resetear los datos (solo con token).
* Interfaz moderna, responsive y fácil de usar.

---

## 🚀 Tecnologías utilizadas

* **Node.js**
* **Express.js**
* **Multer** (para subir archivos Excel)
* **xlsx** (para leer datos desde Excel)
* **HTML / CSS** (interfaz completa en la carpeta `/public`)

---

## 📁 Estructura del proyecto

```
/
├── public/
│   ├── index.html                # Formulario individual
│   ├── importar.html             # Importación masiva desde Excel
│   ├── gracias.html              # Página de agradecimiento
│   ├── logo_ua.png               # Logo institucional
│   ├── plantilla_publicaciones.xlsx  # Plantilla Excel para investigadores
│
├── uploads/                      # Se crean automáticamente para archivos Excel subidos
├── data.csv                      # Archivo central donde se guardan los registros
├── server.js                     # Backend completo
├── package.json
└── README.md
```

---

## 🖥️ Instalación y ejecución en local

1. **Clonar el repositorio**

```bash
git clone https://github.com/usuario/repositorio.git
cd repositorio
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Crear archivo de datos si no existe**

El sistema lo creará automáticamente la primera vez que arranque.

Puedes resetearlo manualmente:

```bash
npm run reset
```

4. **Iniciar el servidor**

```bash
node server.js
```

5. Abrir en el navegador:

```
http://localhost:10000
```

---

## 🔧 Variables de entorno

El proyecto soporta un token de administración para resetear el archivo `data.csv`.

En **Render** o en un `.env` local puedes definir:

```
ADMIN_TOKEN=loquetuquieras123
```

Esto permite acceder a:

```
/admin/reset?token=loquetuquieras123
```

---

## 📄 Uso del sistema

### ✅ 1. **Formulario individual**

URL:

```
/
```

Permite registrar **una sola** publicación.
Los campos obligatorios están marcados con *.

Al enviar, los datos se agregan a `data.csv` y se muestra una página de agradecimiento.

---

### 📥 2. **Importación masiva desde Excel**

URL:

```
/importar
```

Funcionamiento:

1. El usuario completa sus datos personales (nombre, ORCID, doctorado, etc.).
2. Descarga la plantilla oficial desde:

```
/plantilla_publicaciones.xlsx
```

3. Llena **una fila por artículo**.
4. Sube el Excel al sistema.
5. Cada fila se registra en `data.csv` usando los datos personales proporcionados.

El sistema:

* Normaliza nombres de columnas.
* Evita errores por tildes, espacios y mayúsculas.
* Permite registrar duplicados si el investigador pertenece a **Ambos** doctorados.

---

### ⬇️ 3. **Descargar base de datos completa**

URL:

```
/data.csv
```

Descarga directamente el archivo `data.csv` listo para análisis en Excel o R.

---

### 🔒 4. **Resetear el archivo de datos (solo admin)**

```
/admin/reset?token=TU_TOKEN
```

Esto reemplaza `data.csv` con un archivo limpio con encabezados.

---

## 🌐 Despliegue en Render

1. Crear servicio **Web Service** en Render.
2. Conectar repositorio.
3. Configurar:

```
Build Command:   npm install
Start Command:   node server.js
```

4. Agregar variable de entorno:

```
ADMIN_TOKEN=loquetuquieras123
```

5. Deploy!

---

## 🙌 Créditos

Desarrollado para la **Universidad Autónoma de Chile**
Proyecto de gestión académica para recopilación de publicaciones científicas.

---

