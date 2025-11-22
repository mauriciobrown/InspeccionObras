function mostrarVista(vista) {
    document.querySelectorAll("div[id^='vista']").forEach(div => div.classList.add("oculto"));
    const id = "vista" + vista.charAt(0).toUpperCase() + vista.slice(1);
    document.getElementById(id).classList.remove("oculto");
    document.getElementById("btnVolver").classList.toggle("oculto", vista === "inicio");
}
