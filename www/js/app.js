// app.js
let obraSeleccionada = null;
let usuarioActivoGlobal = null;
const userMessageDiv = document.getElementById('userMessage'); 

document.addEventListener("deviceready", function() {
    // Inicializa la base de datos (definida en db.js)
    initDB();
    // Muestra la vista de inicio al cargar
    mostrarVista("inicio");
});


// *************************************************************************
// ** NUEVAS FUNCIONES PARA EL MENÚ DESPLEGABLE VISUAL **
// *************************************************************************

/**
 * Muestra u oculta la lista desplegable de obras.
 */
function toggleListaObras() {
    const lista = document.getElementById('listaObrasDesplegable');
    const flecha = document.querySelector('#obraSeleccionadaDisplay .icono-flecha');
    
    // Oculta/Muestra el menú (asumiendo que .oculto-menu usa display: none o max-height: 0 en CSS)
    lista.classList.toggle('oculto-menu'); 
    flecha.classList.toggle('rotar'); // Anima la flecha para indicar estado
}

/**
 * Selecciona una obra visualmente, actualiza el <select> oculto y cierra el menú.
 * @param {string} obra - El valor de la obra a seleccionar (e.g., 'Vitacura').
 * @param {HTMLElement} elementoVisual - El div que fue clickeado (para resaltarlo).
 */
function seleccionarObraVisual(obra, elementoVisual) {
    // 1. Actualizar el <select> oculto para que 'confirmarObra()' funcione.
    const select = document.getElementById('selectObra');
    select.value = obra;
    
    // 2. Actualizar el texto visible
    document.getElementById('obraSeleccionadaTexto').textContent = `Obra ${obra}`;

    // 3. Resaltar la selección visual
    document.querySelectorAll('.opcion-obra').forEach(div => {
        div.classList.remove('seleccionado');
    });
    elementoVisual.classList.add('seleccionado');

    // 4. Cerrar el desplegable
    toggleListaObras();
}

// *************************************************************************
// ** FUNCIÓN DE CONFIRMACIÓN (Ahora usa el valor del <select> actualizado) **
// *************************************************************************

function confirmarObra() {
    const select = document.getElementById("selectObra");
    obraSeleccionada = select.value;
    
    if (!obraSeleccionada) {
        // [CORRECCIÓN] Inyecta el mensaje de error profesional y lo elimina después de 3s
        document.getElementById("vistaInicio").querySelector('.acciones').insertAdjacentHTML(
            'afterend',
            '<div class="mensaje-error" id="inicioError">❌ Debe seleccionar una obra.</div>'
        );
        setTimeout(() => document.getElementById("inicioError")?.remove(), 3000);
        return;
    }

    document.getElementById("obraSeleccionada").innerText = obraSeleccionada;
    mostrarVista("biometria");
}

// *************************************************************************
// ** RESTO DE LA LÓGICA DE LA APLICACIÓN **
// *************************************************************************

function iniciarAutenticacion() {
    const inputNombre = document.getElementById("inputNombre");
    const nombreUsuario = inputNombre.value.trim();
    const bioResultado = document.getElementById("bioResultado");
    bioResultado.innerHTML = ''; // Limpiar mensajes anteriores

    if (!nombreUsuario) {
        bioResultado.innerHTML = '<span class="mensaje-error">❌ Por favor, ingrese su nombre/ID.</span>';
        setTimeout(() => bioResultado.innerHTML = '', 3000); // Limpiar después de 3s
        return;
    }

    // Llama a la función de biometría, enviando el nombre y dos callbacks (éxito y error)
    autenticarBiometria(
        nombreUsuario, 
        function(usuarioAutenticado) { 
            // ÉXITO: Guardar el usuario globalmente y actualizar la UI
            usuarioActivoGlobal = usuarioAutenticado;
            bioResultado.innerHTML = '<span class="mensaje-info">✅ Autenticación exitosa.</span>';
            
            // Espera un segundo y cambia a la vista de cámara
            setTimeout(() => {
                document.getElementById("usuarioActivo").innerText = usuarioActivoGlobal; // Mostrar el usuario
                document.getElementById("obraActiva").innerText = obraSeleccionada;
                mostrarVista("camara");
            }, 1000);
        },
        function(mensajeError) { 
            // ERROR: Mostrar el mensaje de error en la UI
            bioResultado.innerHTML = `<span class="mensaje-error">🚫 Falló: ${mensajeError}</span>`;
            usuarioActivoGlobal = null; // Asegurar que no hay usuario activo
            setTimeout(() => bioResultado.innerHTML = '', 4000); // Limpiar después de 4s
        }
    );
}

function registrarFoto() {
    // Validación de seguridad
    if (!usuarioActivoGlobal) {
        document.getElementById("fotoResultado").innerHTML = "<p class='mensaje-error'>&#9888; Error: Debe autenticarse antes de tomar fotos.</p>";
        setTimeout(() => mostrarVista('biometria'), 1500); 
        return;
    }
    
    // Llama a la función de cámara con geolocalización (definida en camera.js)
    tomarFotoConUbicacion(obraSeleccionada, usuarioActivoGlobal);
}

/**
 * Función CLAVE: Es llamada por el nuevo botón "Ver Fotos Registradas" en vistaInicio.
 * Primero carga la lista de fotos y luego muestra la vista.
 */
function mostrarVistaListado() {
    // Carga los datos más recientes de la base de datos
    verListado();
    // Navega a la vista de listado
    mostrarVista("listado");
}


function verListado() {
    listarFotos(function(rows) {
        let html = "";
        const contenidoListado = document.getElementById("contenidoListado");

        if (rows.length === 0) {
            html = "<p>No hay fotos registradas.</p>";
        } else {
            for (let i = 0; i < rows.length; i++) {
                const f = rows.item(i);
                
                // 1. Decodificar la URI
                let fotoSrc = decodeURIComponent(f.uri); 
                
                // 2. 🚨 APLICAR LA CONVERSIÓN DE Ionic/WebView
                if (window.Ionic && window.Ionic.WebView) {
                    fotoSrc = window.Ionic.WebView.convertFileSrc(fotoSrc);
                }

                // Genera el HTML para cada registro
                html += `<div class="fotoItem" onclick="verRegistro(${f.id})">
                            <p><strong>Registro #${f.id}</strong></p>
                            <img src="${fotoSrc}" onerror="this.style.display='none'" alt="Foto de obra" />
                            <p><strong>Obra:</strong> ${f.obra}</p>
                            <p><strong>Fecha:</strong> ${formatearFechaISO(f.fecha)}</p>
                            <p><strong>Lat/Lon:</strong> ${f.lat.toFixed(4)}, ${f.lon.toFixed(4)}</p>
                            <p><strong>Usuario:</strong> ${f.usuario}</p>
                         </div>`;
            }
        }
        contenidoListado.innerHTML = html;
    });
}

function limpiarListado() {
    limpiarFotos();
    
    const contenidoListado = document.getElementById("contenidoListado");
    contenidoListado.innerHTML = "<p class='mensaje-error'>🗑️ Historial de fotos eliminado.</p>";
    
    setTimeout(verListado, 1500); 
}

function formatearFechaISO(iso) {
    try {
        const d = new Date(iso);
        // Formato local más legible
        return d.toLocaleString(); 
    } catch (e) {
        return iso;
    }
}


function verRegistro(id) {
    db.transaction(function(tx) {
        tx.executeSql("SELECT * FROM fotos WHERE id = ?", [id], function(tx, rs) {
            if (rs.rows.length > 0) {
                const f = rs.rows.item(0);

                let fotoSrc = decodeURIComponent(f.uri);
                
                // 🚨 APLICAR LA CONVERSIÓN DE Ionic/WebView
                if (window.Ionic && window.Ionic.WebView) {
                    fotoSrc = window.Ionic.WebView.convertFileSrc(fotoSrc);
                }

                // Estructura detallada para la vista individual
                const html = `
                    <div class="fotoItem">
                        <img src="${fotoSrc}" alt="Foto Detalle #${f.id}" />
                        <p><strong>Obra:</strong> ${f.obra}</p>
                        <p><strong>Fecha y Hora:</strong> ${formatearFechaISO(f.fecha)}</p>
                        <p><strong>Latitud:</strong> ${f.lat}</p>
                        <p><strong>Longitud:</strong> ${f.lon}</p>
                        <p><strong>Usuario:</strong> ${f.usuario}</p>
                    </div>
                `;
                document.getElementById("detalleRegistro").innerHTML = html;
                mostrarVista("registro");
            } else {
                document.getElementById("detalleRegistro").innerHTML = "<p class='mensaje-error'>Registro no encontrado.</p>";
                mostrarVista("registro");
            }
        }, function(tx, err) {
            console.error("Error al buscar registro:", err.message);
            document.getElementById("detalleRegistro").innerHTML = "<p class='mensaje-error'>Error de base de datos al buscar el registro.</p>";
            mostrarVista("registro");
        });
    });
}


/**
 * Exporta todos los datos registrados (fotos y metadata) y abre el cliente
 * de correo nativo para enviarlos.
 */
function exportarYEnviarCorreo() {
    if (typeof cordova.plugins.email === 'undefined') {
        alert("El plugin de Correo Electrónico no está disponible. Asegúrese de estar en un dispositivo Cordova.");
        return;
    }
    
    // 1. Obtener todos los registros del listado
    listarFotos(function(rows) {
        if (rows.length === 0) {
            alert("No hay registros de fotos para exportar.");
            return;
        }

        let bodyHTML = '<h2>Reporte de Registros GeoFotoWork</h2>';
        bodyHTML += '<p>Adjunto encontrará todas las fotos y los detalles del registro:</p>';
        bodyHTML += '<table border="1" style="width:100%; border-collapse: collapse;">';
        bodyHTML += '<thead><tr><th>#ID</th><th>Obra</th><th>Usuario</th><th>Lat/Lon</th><th>Fecha/Hora</th></tr></thead><tbody>';

        let attachments = [];
        
        for (let i = 0; i < rows.length; i++) {
            const f = rows.item(i);
            
            // ⚠️ La URI DEBE ser la ruta absoluta persistente, NO la convertida por Ionic/WebView.
            // La base de datos guarda la URI persistente (file://... o content://...), que es lo que el plugin de correo necesita.
            const uriAbsoluta = decodeURIComponent(f.uri);
            
            // 2. Agregar la URI absoluta como adjunto
            attachments.push(uriAbsoluta);
            
            // 3. Construir la fila del informe
            bodyHTML += `
                <tr>
                    <td>${f.id}</td>
                    <td>${f.obra}</td>
                    <td>${f.usuario}</td>
                    <td>${f.lat.toFixed(4)}, ${f.lon.toFixed(4)}</td>
                    <td>${formatearFechaISO(f.fecha)}</td>
                </tr>`;
        }
        
        bodyHTML += '</tbody></table>';

        // 4. Configuración y llamada al plugin EmailComposer
        cordova.plugins.email.open({
            to:      ['cliente@ejemplo.com', 'supervisor@ejemplo.com'], // Dirección(es) de destino predeterminadas
            cc:      ['tu_correo_de_seguimiento@ejemplo.com'], // Correo de copia de seguimiento
            subject: 'Informe de Avance de Obra - ' + new Date().toLocaleDateString(),
            body:    bodyHTML,
            isHtml:  true, // Indicar que el cuerpo es HTML
            attachments: attachments // Array de URIs de archivos adjuntos
        });

    });
}