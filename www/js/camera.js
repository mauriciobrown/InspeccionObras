// camera.js
// Se asume que 'usuarioAutenticado' viene desde auth.js

/**
 * Resuelve la URI de archivo local a una ruta accesible por el WebView de Cordova.
 * Este método es fundamentalmente INSEGURO para rutas temporales (cache/).
 * Se recomienda la Opción B (mover el archivo).
 * * NOTA: Esta función se mantiene pero su uso principal será MOVER el archivo, no solo resolverlo.
 */
function resolverURI(fileURI, callback) {
    if (typeof window.resolveLocalFileSystemURL === 'undefined') {
        console.warn("Plugin 'cordova-plugin-file' no cargado. Usando URI original.");
        callback(fileURI);
        return;
    }

    // Usaremos esta función para obtener la referencia al archivo, no solo para resolver la URL.
    window.resolveLocalFileSystemURL(fileURI, function(fileEntry) {
        callback(fileEntry); // Retornamos el FileEntry, no la URL
    }, function(err) {
        console.error("Fallo al resolver la URI del sistema de archivos:", err.code);
        callback(null); // Retorna null si falla
    });
}

/**
 * Función principal para capturar la foto, obtener GPS y guardar el registro.
 * Incluye la lógica para mover el archivo a una ubicación persistente.
 */
function tomarFotoConUbicacion(obra, usuario) {
    // 1. Verificación de autenticación
    if (!usuario) {
        document.getElementById("fotoResultado").innerHTML =
            "<p class='error-msg'>❌ Debe autenticarse primero.</p>";
        return;
    }
    
    // Configuración para la cámara
    const cameraOptions = {
        quality: 60,
        destinationType: Camera.DestinationType.FILE_URI, // Importante: obtendremos la URI del caché
        correctOrientation: true,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        sourceType: Camera.PictureSourceType.CAMERA
    };


    // 2. Tomar la foto
    navigator.camera.getPicture(function(imageURI) {

        // 3. Obtener la referencia al archivo de caché (FileEntry)
        resolverURI(imageURI, function(fileEntry) {

            if (!fileEntry) {
                console.error("Error crítico: No se pudo obtener la referencia al archivo.");
                return;
            }
            
            // 4. Mover la foto a un directorio persistente
            moverArchivoPersistente(fileEntry, obra, usuario);

        }); // fin resolverURI

    }, function(err) {

        // Error cámara
        console.error("Error cámara: " + err);
        document.getElementById("fotoResultado").innerHTML =
            `<p class='error-msg'>❌ No se pudo tomar la foto. Error: ${err}</p>`;

    }, cameraOptions);
}


/**
 * Copia el archivo de la caché a un directorio persistente (Data Directory).
 * Luego obtiene la geolocalización y guarda el registro.
 */
function moverArchivoPersistente(fileEntry, obra, usuario) {
    // Directorio donde la app tiene permisos para almacenar permanentemente
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
        
        // Crear un nuevo nombre de archivo único
        const newFileName = Date.now() + '_' + fileEntry.name;

        // Copiar el archivo
        fileEntry.copyTo(dirEntry, newFileName, function(newFileEntry) {
            
            // La nueva URI persistente que sí es accesible
            const persistenteURI = newFileEntry.nativeURL; 
            
            // --- Continuar con la geolocalización y el guardado ---

            navigator.geolocation.getCurrentPosition(function(pos) {

                const foto = {
                    obra: obra,
                    usuario: usuario,
                    uri: persistenteURI, // <-- Guardamos la URI persistente
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    fecha: new Date().toISOString()
                };

                // Guardar foto en base local (Asumo que esta función existe en otro lugar)
                guardarFoto(foto);
                
                // 🚨 APLICAR CONVERSIÓN DE URI ANTES DE LA VISTA PREVIA
                let previewURI = persistenteURI;
                if (window.Ionic && window.Ionic.WebView) {
                    previewURI = window.Ionic.WebView.convertFileSrc(persistenteURI);
                }

                // 5. Mostrar previsualización (ÉXITO DE GPS)
                document.getElementById("fotoResultado").innerHTML =
                    `<p>✅ Foto registrada por <strong>${usuario}</strong> en la obra ${obra}</p>
                     <img src="${previewURI}" style="max-width: 100%; height: auto;" />`; // Usando URI CONVERTIDA

            }, function(err) {

                // Error GPS (Guarda sin GPS, pero con la foto persistente)
                console.error("Error GPS: " + err.message);

                // 🚨 APLICAR CONVERSIÓN DE URI ANTES DE LA VISTA PREVIA
                let previewURI = persistenteURI;
                if (window.Ionic && window.Ionic.WebView) {
                    previewURI = window.Ionic.WebView.convertFileSrc(persistenteURI);
                }

                document.getElementById("fotoResultado").innerHTML =
                    `<p class='error-msg'>⚠️ Foto tomada, pero falló la geolocalización: ${err.message}</p>
                     <img src="${previewURI}" style="max-width: 100%; height: auto;" />`; // Usando URI CONVERTIDA

            }); // fin geolocalización

        }, function(err) {
            console.error("Fallo al COPIAR el archivo a dataDirectory:", err.code);
            // Manejar error si no se puede mover/copiar
        });

    }, function(err) {
        console.error("Fallo al acceder al directorio persistente:", err.code);
    });
}