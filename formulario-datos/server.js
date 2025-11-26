const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Token de administración para resetear el CSV (defínelo en Render)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Ruta del archivo CSV
const DATA_FILE = path.join(__dirname, 'data.csv');

// Función para crear/reinicializar el CSV con encabezados
const escribirEncabezadosCSV = () => {
  const encabezados =
    'timestamp,nombre,primer_apellido,segundo_apellido,orcid,posicion,doctorado,titulo_articulo,anio,doi,url,revista,cuartil,indexacion,factor_impacto,linea_investigacion,liderazgo\n';
  fs.writeFileSync(DATA_FILE, encabezados, 'utf8');
};

// Servir archivos estáticos desde carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Leer datos enviados desde formularios
app.use(express.urlencoded({ extended: true }));

// Crear archivo CSV con encabezados si no existe
if (!fs.existsSync(DATA_FILE)) {
  escribirEncabezadosCSV();
}

// Ruta que recibe los datos del formulario
app.post('/submit', (req, res) => {
  const {
    nombre,
    primer_apellido,
    segundo_apellido,
    orcid,
    posicion,
    doctorado,
    titulo_articulo,
    anio,
    doi,
    url,
    revista,
    cuartil,
    indexacion,
    factor_impacto,
    linea_investigacion,
    liderazgo
  } = req.body;

  // --- Validación ORCID ---
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
  if (!orcidRegex.test(orcid)) {
    return res
      .status(400)
      .send(
        'El ORCID no tiene el formato válido (0000-0000-0000-0000). Por favor, vuelva atrás y corrija el valor introducido.'
      );
  }
  // -------------------------

  const timestamp = new Date().toISOString();

  // Escapar valores para evitar romper el CSV
  const escapeCSV = (value) =>
    `"${String(value || '').replace(/"/g, '""')}"`;

  // Si "Ambos", se crean dos filas
  const doctoradoValues =
    doctorado === 'Ambos'
      ? ['Ciencias Aplicadas', 'Ciencias Biomédicas']
      : [doctorado];

  let lineasCSV = '';

  doctoradoValues.forEach((docVal) => {
    const linea = [
      escapeCSV(timestamp),
      escapeCSV(nombre),
      escapeCSV(primer_apellido),
      escapeCSV(segundo_apellido),
      escapeCSV(orcid),
      escapeCSV(posicion),
      escapeCSV(docVal),
      escapeCSV(titulo_articulo),
      escapeCSV(anio),
      escapeCSV(doi),
      escapeCSV(url),
      escapeCSV(revista),
      escapeCSV(cuartil),
      escapeCSV(indexacion),
      escapeCSV(factor_impacto),
      escapeCSV(linea_investigacion),
      escapeCSV(liderazgo)
    ].join(',') + '\n';

    lineasCSV += linea;
  });

  // Guardar datos en el CSV
  fs.appendFile(DATA_FILE, lineasCSV, (err) => {
    if (err) {
      console.error('Error al guardar los datos:', err);
      return res.status(500).send('Ocurrió un error al guardar los datos.');
    }

    // Redirigir a página de agradecimiento
    res.redirect('/gracias.html');
  });
});

// -------------------------------------------
// Ruta para descargar el CSV con todos los datos
// -------------------------------------------
app.get('/data.csv', (req, res) => {
  res.download(DATA_FILE, 'publicaciones_ua.csv', (err) => {
    if (err) {
      console.error('Error al descargar el archivo:', err);
      if (!res.headersSent) {
        res.status(500).send('No se pudo descargar el archivo de datos.');
      }
    }
  });
});

// -------------------------------------------
// Ruta ADMIN para resetear el CSV (solo con token)
// -------------------------------------------
app.get('/admin/reset', (req, res) => {
  const token = req.query.token;

  // Si no hay token configurado o no coincide, no permitir
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    console.warn('Intento NO autorizado de resetear el CSV.');
    return res.status(403).send('No autorizado para resetear los datos.');
  }

  try {
    escribirEncabezadosCSV();
    console.log('CSV reseteado por administrador.');
    res.send('El archivo de datos ha sido reseteado correctamente.');
  } catch (err) {
    console.error('Error al resetear el CSV:', err);
    res.status(500).send('Ocurrió un error al resetear el archivo de datos.');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
