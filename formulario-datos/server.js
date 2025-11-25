const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.csv');

// Servir archivos estáticos (HTML) desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Leer datos enviados por formularios
app.use(express.urlencoded({ extended: true }));

// Crear archivo CSV con encabezados si no existe
if (!fs.existsSync(DATA_FILE)) {
  const encabezados =
    'timestamp,nombre,primer_apellido,segundo_apellido,orcid,posicion,doctorado,titulo_articulo,anio,doi,url,revista,cuartil,indexacion,factor_impacto,linea_investigacion,liderazgo\n';
  fs.writeFileSync(DATA_FILE, encabezados, 'utf8');
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

  // --- Validación del formato ORCID en el servidor ---
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;

  if (!orcidRegex.test(orcid)) {
    return res
      .status(400)
      .send(
        'El ORCID no tiene el formato válido (0000-0000-0000-0000). Por favor, vuelva atrás y corrija el valor introducido.'
      );
  }
  // ---------------------------------------------------

  const timestamp = new Date().toISOString();

  // Escapar comillas para no romper el CSV
  const escapeCSV = (value) =>
    `"${String(value || '').replace(/"/g, '""')}"`;

  // Si selecciona "Ambos", generamos dos valores de doctorado
  const doctoradoValues =
    doctorado === 'Ambos'
      ? ['Ciencias Aplicadas', 'Ciencias Biomédicas']
      : [doctorado];

  // Construimos una o dos líneas según corresponda
  let lineas = '';

  doctoradoValues.forEach((docVal) => {
    const linea = [
      escapeCSV(timestamp),
      escapeCSV(nombre),
      escapeCSV(primer_apellido),
      escapeCSV(segundo_apellido),
      escapeCSV(orcid),
      escapeCSV(posicion),
      escapeCSV(docVal), // aquí usamos el doctorado específico
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

    lineas += linea;
  });

  fs.appendFile(DATA_FILE, lineas, (err) => {
    if (err) {
      console.error('Error al guardar los datos:', err);
      return res.status(500).send('Ocurrió un error al guardar los datos.');
    }
    // Después de guardar, redirige a la página de gracias
    res.redirect('/gracias.html');
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
