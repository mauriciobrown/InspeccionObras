// Variable global para la conexión a la base de datos
let db = null;

/**
 * Inicializa la base de datos SQLite y crea la tabla 'fotos' si no existe.
 */
function initDB() {
    // Abrir o crear la base de datos
    db = window.sqlitePlugin.openDatabase({ name: 'geofotowork.db', location: 'default' });
    
    // Crear la tabla de fotos si no existe
    db.transaction(function(tx) {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS fotos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            obra TEXT,
            usuario TEXT,
            uri TEXT,
            lat REAL,
            lon REAL,
            fecha TEXT
        )`, [], function(tx, rs) {
            console.log("Tabla 'fotos' verificada/creada exitosamente.");
        }, function(tx, error) {
            console.error("Error al crear la tabla: " + error.message);
        });
    });
}

/**
 * Guarda un registro de foto en la base de datos.
 * @param {object} foto - Objeto con los datos de la foto (obra, usuario, uri, lat, lon, fecha).
 */
function guardarFoto(foto) {
    if (!db) {
        console.error("Base de datos no inicializada. No se puede guardar la foto.");
        return;
    }
    db.transaction(function(tx) {
        tx.executeSql(
            "INSERT INTO fotos (obra, usuario, uri, lat, lon, fecha) VALUES (?,?,?,?,?,?)",
            [foto.obra, foto.usuario, foto.uri, foto.lat, foto.lon, foto.fecha],
            function(tx, rs) {
                console.log("Registro de foto guardado con ID: " + rs.insertId);
            },
            function(tx, error) {
                console.error("Error al guardar foto: " + error.message);
            }
        );
    });
}

/**
 * Lista todos los registros de fotos de la base de datos, ordenados por fecha.
 * @param {function} callback - Función que recibe las filas de resultados (rs.rows).
 */
function listarFotos(callback) {
    if (!db) {
        console.error("Base de datos no inicializada. No se puede listar fotos.");
        callback([]);
        return;
    }
    db.transaction(function(tx) {
        tx.executeSql("SELECT * FROM fotos ORDER BY fecha DESC", [], function(tx, rs) {
            callback(rs.rows);
        }, function(tx, error) {
            console.error("Error al listar fotos: " + error.message);
            callback([]); // Retorna array vacío en caso de error
        });
    });
}

/**
 * Elimina todos los registros de la tabla 'fotos'.
 */
function limpiarFotos() {
    if (!db) {
        console.error("Base de datos no inicializada. No se puede limpiar el historial.");
        return;
    }
    db.transaction(function(tx) {
        tx.executeSql("DELETE FROM fotos", [], function(tx, rs) {
            console.log("Historial de fotos limpiado.");
        }, function(tx, error) {
            console.error("Error al limpiar historial: " + error.message);
        });
    });
}