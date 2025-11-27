const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 10000;

// Token de administración para resetear el CSV (opcional, lo puedes definir en Render o .env local)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Ruta del archivo CSV
const DATA_FILE = path.join(__dirname, 'data.csv');

// ------------------------------------------------------
// Utilidad para responder con enlaces a las dos páginas
// ------------------------------------------------------
const mensajeConLinks = (texto) => `
  <div style="font-family: system-ui; max-width: 700px; margin: 2rem auto; padding: 1.5rem;
              border: 1px solid #ccc; border-radius: 10px; background: #fafafa;">
      <p style="font-size: 1.1rem;">${texto}</p>
      <hr>
      <p>
        <a href="/" style="color:#BD1620; font-weight:600; text-decoration:none;">⬅️ Volver al formulario individual</a>
      </p>
      <p>
        <a href="/importar" style="color:#BD1620; font-weight:600; text-decoration:none;">📥 Ir a la importación masiva desde Excel</a>
      </p>
  </div>
`;

// ------------------------------------------------------
// Utilidades CSV
// ------------------------------------------------------
const escribirEncabezadosCSV = () => {
  const encabezados = [
    'timestamp',
    'nombre',
    'primer_apellido',
    'segundo_apellido',
    'orcid',
    'posicion',
    'doctorado',
    'titulo_articulo',
    'anio',
    'doi',
    'url',
    'revista',
    'cuartil',
    'indexacion',
    'factor_impacto',
    'linea_investigacion',
    'liderazgo'
  ].join(',') + '\n';

  fs.writeFileSync(DATA_FILE, encabezados, 'utf8');
};

const escapeCSV = (value) => {
  return `"${String(value || '').replace(/"/g, '""')}"`;
};

// Crear archivo CSV con encabezados si no existe
if (!fs.existsSync(DATA_FILE)) {
  escribirEncabezadosCSV();
}

// ------------------------------------------------------
// Configuración de carpetas y middlewares
// ------------------------------------------------------

// Carpeta para uploads (Excels subidos)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer para subir Excel
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Servir estáticos desde "public"
app.use(express.static(path.join(__dirname, 'public')));

// Leer datos de formularios
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------
// RUTA PRINCIPAL: formulario individual /submit
// ------------------------------------------------------
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

  // Validación ORCID
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
  if (!orcidRegex.test(orcid)) {
    return res
      .status(400)
      .send(
        mensajeConLinks(
          'El ORCID no tiene el formato válido (0000-0000-0000-0000). Por favor, corrija el valor introducido.'
        )
      );
  }

  const timestamp = new Date().toISOString();

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

  fs.appendFile(DATA_FILE, lineasCSV, (err) => {
    if (err) {
      console.error('Error al guardar los datos:', err);
      return res
        .status(500)
        .send(
          mensajeConLinks('Ocurrió un error al guardar los datos en el servidor.')
        );
    }

    // Redirige a una página estática de gracias (puedes también usar mensajeConLinks si prefieres)
    res.redirect('/gracias.html');
  });
});

// ------------------------------------------------------
// DESCARGA DEL CSV COMPLETO
// ------------------------------------------------------
app.get('/data.csv', (req, res) => {
  res.download(DATA_FILE, 'publicaciones_ua.csv', (err) => {
    if (err) {
      console.error('Error al descargar el archivo:', err);
      if (!res.headersSent) {
        res
          .status(500)
          .send(
            mensajeConLinks('No se pudo descargar el archivo de datos.')
          );
      }
    }
  });
});

// ------------------------------------------------------
// RESET ADMIN DEL CSV (OPCIONAL)
// ------------------------------------------------------
app.get('/admin/reset', (req, res) => {
  const token = req.query.token;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    console.warn('Intento NO autorizado de resetear el CSV.');
    return res
      .status(403)
      .send(
        mensajeConLinks('No está autorizado para resetear los datos.')
      );
  }

  try {
    escribirEncabezadosCSV();
    console.log('CSV reseteado por administrador.');
    res.send(
      mensajeConLinks('El archivo de datos ha sido reseteado correctamente.')
    );
  } catch (err) {
    console.error('Error al resetear el CSV:', err);
    res
      .status(500)
      .send(
        mensajeConLinks('Ocurrió un error al resetear el archivo de datos.')
      );
  }
});

// ------------------------------------------------------
// PÁGINA DE IMPORTACIÓN MASIVA
// ------------------------------------------------------
app.get('/importar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'importar.html'));
});

// ------------------------------------------------------
// IMPORTACIÓN MASIVA DESDE EXCEL
// ------------------------------------------------------
app.post('/import-excel', upload.single('excelFile'), (req, res) => {
  try {
    const {
      nombre,
      primer_apellido,
      segundo_apellido,
      orcid,
      posicion,
      doctorado
    } = req.body;

    // Validación mínima
    if (!nombre || !primer_apellido || !orcid || !posicion || !doctorado) {
      return res
        .status(400)
        .send(
          mensajeConLinks('Faltan datos obligatorios del investigador.')
        );
    }

    // Validación ORCID
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
    if (!orcidRegex.test(orcid)) {
      return res
        .status(400)
        .send(
          mensajeConLinks(
            'El ORCID no tiene el formato válido (0000-0000-0000-0000). Por favor, corrija el valor introducido.'
          )
        );
    }

    if (!req.file) {
      return res
        .status(400)
        .send(
          mensajeConLinks('Debe adjuntar un archivo Excel con las publicaciones.')
        );
    }

    const filePath = req.file.path;

    // Leer Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      fs.unlink(filePath, () => {});
      return res.send(
        mensajeConLinks(
          'No se encontraron filas de datos en el archivo Excel cargado.'
        )
      );
    }

    // Normalización de nombres de columnas
    const normalize = (str) =>
      String(str || '')
        .toLowerCase()
        .normalize('NFD')                  // separa tildes
        .replace(/[\u0300-\u036f]/g, '')   // elimina tildes
        .replace(/\s+/g, ' ')              // espacios múltiples -> uno
        .trim();

    const headerKeys = Object.keys(rows[0]);

    const findKey = (possibleNames) => {
      for (const name of possibleNames) {
        const target = normalize(name);
        for (const key of headerKeys) {
          if (normalize(key) === target) {
            return key; // devuelve el nombre real en el Excel
          }
        }
      }
      return null;
    };

    // Mapeo de columnas según tu plantilla
    const keyTitulo = findKey([
      'Titulo del artículo',
      'Título del artículo',
      'Titulo articulo',
      'Título articulo'
    ]);
    const keyAnio = findKey(['Año', 'Anio', 'year']);
    const keyDOI = findKey(['DOI']);
    const keyURL = findKey(['URL', 'Enlace', 'Link']);
    const keyRevista = findKey(['Revista', 'Journal']);
    const keyCuartil = findKey(['Cuartil', 'Quartile']);
    const keyIndexacion = findKey(['Indexación', 'Indexacion', 'Indexation']);
    const keyFI = findKey(['Factor de impacto', 'Factor impacto', 'Impact factor']);
    const keyLinea = findKey([
      'Línea de investigación',
      'Linea de investigación',
      'Linea de investigacion',
      'Research line'
    ]);
    const keyLiderazgo = findKey(['Liderazgo', 'Authorship role']);

    // La columna de título es obligatoria
    if (!keyTitulo) {
      console.error('No se encontró una columna de título en el Excel. Cabeceras:', headerKeys);
      fs.unlink(filePath, () => {});
      return res
        .status(400)
        .send(
          mensajeConLinks(
            'No se encontró una columna de título de artículo en el Excel. Asegúrese de que la primera fila tenga una cabecera similar a "Titulo del artículo".'
          )
        );
    }

    // Asegurar encabezados en el CSV
    if (!fs.existsSync(DATA_FILE)) {
      escribirEncabezadosCSV();
    }

    // Doctorado: manejar "Ambos"
    const doctoradoValues =
      doctorado === 'Ambos'
        ? ['Ciencias Aplicadas', 'Ciencias Biomédicas']
        : [doctorado];

    const stream = fs.createWriteStream(DATA_FILE, {
      flags: 'a',
      encoding: 'utf8'
    });

    let filasEscritas = 0;
    const timestamp = new Date().toISOString();

    rows.forEach((row) => {
      const titulo_articulo = keyTitulo ? row[keyTitulo] : '';

      if (!titulo_articulo || !String(titulo_articulo).trim()) return;

      const anio = keyAnio ? row[keyAnio] : '';
      const doi = keyDOI ? row[keyDOI] : '';
      const url = keyURL ? row[keyURL] : '';
      const revista = keyRevista ? row[keyRevista] : '';
      const cuartil = keyCuartil ? row[keyCuartil] : '';
      const indexacion = keyIndexacion ? row[keyIndexacion] : '';
      const factor_impacto = keyFI ? row[keyFI] : '';
      const linea_investigacion = keyLinea ? row[keyLinea] : '';
      const liderazgo = keyLiderazgo ? row[keyLiderazgo] : '';

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

        stream.write(linea);
        filasEscritas++;
      });
    });

    stream.end();

    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn('No se pudo borrar archivo temporal:', err);
      }
    });

    stream.on('finish', () => {
      res.send(
        mensajeConLinks(
          `Se importaron ${filasEscritas} registros de artículos para el investigador ${nombre} ${primer_apellido}.`
        )
      );
    });
  } catch (error) {
    console.error('Error al procesar el Excel:', error);
    res
      .status(500)
      .send(
        mensajeConLinks('Error procesando el archivo Excel en el servidor.')
      );
  }
});

// ------------------------------------------------------
// ARRANQUE DEL SERVIDOR
// ------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
