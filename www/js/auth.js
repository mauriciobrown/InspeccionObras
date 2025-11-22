let usuarioAutenticado = false;

function autenticarBiometria(nombreUsuario, onSuccess, onError) {
    Fingerprint.isAvailable(function() {

        Fingerprint.show({
            title: `Autenticación requerida para ${nombreUsuario}`,
            description: "Confirma tu identidad",
            fallbackButtonTitle: "Usar PIN",
            disableBackup: false
        }, function() {

            usuarioAutenticado = true;
            onSuccess(nombreUsuario);

        }, function(err) {

            usuarioAutenticado = false;

            let msg = (err === "Cancelado")
                ? "Autenticación cancelada por el usuario."
                : "Error en la autenticación biométrica.";

            onError(msg);
        });

    }, function(err) {

        usuarioAutenticado = false;
        onError("La biometría no está disponible o no está configurada en el dispositivo.");

    });
}
