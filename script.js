/* Menú dinámico Banco RamónRD.
   Las opciones iniciales se leen desde menu.json.
   Los cambios se guardan en localStorage. */

"use strict";

// Clave utilizada para guardar los datos en el navegador.
const CLAVE_ALMACENAMIENTO = "bancoRamonRD.menu.v1";
const URL_JSON_INICIAL = "menu.json";

// Elementos del HTML.
const formulario = document.getElementById("formularioMenu");
const campoIdEdicion = document.getElementById("idEdicion");
const campoNombre = document.getElementById("nombre");
const campoEnlace = document.getElementById("enlace");
const campoIcono = document.getElementById("icono");

const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const botonMovil = document.getElementById("botonMovil");

const menuPrincipal = document.getElementById("menuPrincipal");
const listaOpciones = document.getElementById("listaOpciones");
const mensaje = document.getElementById("mensaje");

const tituloFormulario = document.getElementById("tituloFormulario");
const tituloSeleccionado = document.getElementById("tituloSeleccionado");
const detalleSeleccionado = document.getElementById("detalleSeleccionado");

const botonExportar = document.getElementById("botonExportar");
const botonImportar = document.getElementById("botonImportar");
const botonRestaurar = document.getElementById("botonRestaurar");
const archivoJSON = document.getElementById("archivoJSON");

// Lista que contiene las opciones actuales.
let opcionesMenu = [];

// Datos de respaldo por si no se puede cargar menu.json.
const opcionesInicialesRespaldo = [
    {
        id: "inicio",
        nombre: "Inicio",
        enlace: "#inicio",
        icono: "⌂"
    },
    {
        id: "servicios",
        nombre: "Servicios",
        enlace: "#servicios",
        icono: "▣"
    },
    {
        id: "cuentas",
        nombre: "Cuentas",
        enlace: "#cuentas",
        icono: "▤"
    },
    {
        id: "prestamos",
        nombre: "Préstamos",
        enlace: "#prestamos",
        icono: "↗"
    },
    {
        id: "contacto",
        nombre: "Contacto",
        enlace: "#contacto",
        icono: "✉"
    }
];

/* Muestra mensajes de éxito o error. */
function mostrarMensaje(texto, tipo = "correcto") {
    mensaje.textContent = texto;

    mensaje.style.color =
        tipo === "error" ? "#b42318" : "#176b3a";
}

/* Genera un identificador único para cada opción nueva. */
function generarId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return `opcion-${window.crypto.randomUUID()}`;
    }

    return `opcion-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
}

/* Valida los enlaces permitidos. */
function validarEnlace(valor) {
    const enlace = valor.trim();

    // Permite anclas internas, por ejemplo: #servicios.
    if (/^#[A-Za-z][\w-]*$/.test(enlace)) {
        return true;
    }

    // Permite rutas relativas sencillas.
    if (
        /^(\/|\.\/|\.\.\/)[A-Za-z0-9_\-./?=&%#]*$/.test(enlace)
    ) {
        return true;
    }

    // Permite únicamente URLs HTTP y HTTPS.
    try {
        const url = new URL(enlace);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch {
        return false;
    }
}

/* Comprueba que la lista JSON tenga datos válidos. */
function validarLista(lista) {
    if (!Array.isArray(lista)) {
        throw new Error(
            "El JSON debe contener una lista de opciones."
        );
    }

    const ids = new Set();
    const nombres = new Set();

    const listaValidada = lista.map((opcion, indice) => {
        if (
            !opcion ||
            typeof opcion !== "object" ||
            Array.isArray(opcion)
        ) {
            throw new Error(
                `La opción ${indice + 1} no tiene un formato válido.`
            );
        }

        const id =
            typeof opcion.id === "string"
                ? opcion.id.trim()
                : "";

        const nombre =
            typeof opcion.nombre === "string"
                ? opcion.nombre.trim()
                : "";

        const enlace =
            typeof opcion.enlace === "string"
                ? opcion.enlace.trim()
                : "";

        const icono =
            typeof opcion.icono === "string"
                ? opcion.icono.trim()
                : "";

        // Validar identificador.
        if (!id || id.length > 100) {
            throw new Error(
                `La opción ${indice + 1} necesita un ID válido.`
            );
        }

        // Validar nombre.
        if (!nombre || nombre.length > 40) {
            throw new Error(
                `El nombre de la opción ${indice + 1} debe tener entre 1 y 40 caracteres.`
            );
        }

        // Validar enlace.
        if (
            !enlace ||
            enlace.length > 200 ||
            !validarEnlace(enlace)
        ) {
            throw new Error(
                `El enlace de "${nombre}" no es válido. Usa #ancla, una ruta relativa o una URL HTTP/HTTPS.`
            );
        }

        // Validar icono.
        if (icono.length > 5) {
            throw new Error(
                `El icono de "${nombre}" no puede superar 5 caracteres.`
            );
        }

        // Evitar identificadores duplicados.
        const idNormalizado = id.toLocaleLowerCase();

        if (ids.has(idNormalizado)) {
            throw new Error(
                `El ID "${id}" está repetido.`
            );
        }

        // Evitar nombres duplicados.
        const nombreNormalizado = nombre.toLocaleLowerCase();

        if (nombres.has(nombreNormalizado)) {
            throw new Error(
                `El nombre "${nombre}" está repetido.`
            );
        }

        ids.add(idNormalizado);
        nombres.add(nombreNormalizado);

        // Solo se conservan los campos permitidos.
        return {
            id,
            nombre,
            enlace,
            icono
        };
    });

    return listaValidada;
}

/* Guarda las opciones en el almacenamiento del navegador. */
function guardarEnNavegador() {
    try {
        localStorage.setItem(
            CLAVE_ALMACENAMIENTO,
            JSON.stringify(opcionesMenu)
        );

        return true;
    } catch {
        mostrarMensaje(
            "No se pudo guardar en el navegador. Exporta el JSON para conservar los cambios.",
            "error"
        );

        return false;
    }
}

/* Carga las opciones guardadas o lee menu.json. */
async function cargarOpciones() {
    try {
        const guardado = localStorage.getItem(
            CLAVE_ALMACENAMIENTO
        );

        if (guardado !== null) {
            opcionesMenu = validarLista(
                JSON.parse(guardado)
            );

            return;
        }
    } catch {
        localStorage.removeItem(CLAVE_ALMACENAMIENTO);

        mostrarMensaje(
            "Los datos guardados estaban dañados. Se cargarán los datos iniciales.",
            "error"
        );
    }

    try {
        const respuesta = await fetch(
            URL_JSON_INICIAL,
            { cache: "no-store" }
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo leer menu.json");
        }

        const datos = await respuesta.json();

        opcionesMenu = validarLista(datos);
    } catch {
        // Se utiliza una lista de respaldo si falla la carga.
        opcionesMenu = validarLista(
            opcionesInicialesRespaldo
        );

        mostrarMensaje(
            "No se pudo leer menu.json. Se cargó el menú de respaldo.",
            "error"
        );
    }

    renderizarTodo();
}

/* Crea elementos HTML usando texto seguro. */
function crearElemento(etiqueta, texto, clase = "") {
    const elemento = document.createElement(etiqueta);

    elemento.textContent = texto;

    if (clase) {
        elemento.className = clase;
    }

    return elemento;
}

/* Dibuja las opciones del menú de navegación. */
function renderizarMenu() {
    menuPrincipal.replaceChildren();

    opcionesMenu.forEach(opcion => {
        const item = document.createElement("li");
        const enlace = document.createElement("a");

        enlace.href = opcion.enlace;
        enlace.dataset.opcionId = opcion.id;

        if (opcion.icono) {
            enlace.append(
                document.createTextNode(
                    `${opcion.icono} `
                )
            );
        }

        enlace.append(
            document.createTextNode(opcion.nombre)
        );

        item.appendChild(enlace);
        menuPrincipal.appendChild(item);
    });
}

/* Dibuja la tabla de administración. */
function renderizarTabla() {
    listaOpciones.replaceChildren();

    // Mostrar un mensaje si no existen opciones.
    if (opcionesMenu.length === 0) {
        const fila = document.createElement("tr");

        const celda = crearElemento(
            "td",
            "No hay opciones registradas."
        );

        celda.colSpan = 4;

        fila.appendChild(celda);
        listaOpciones.appendChild(fila);

        return;
    }

    opcionesMenu.forEach(opcion => {
        const fila = document.createElement("tr");

        // Columna del identificador.
        fila.appendChild(
            crearElemento("td", opcion.id)
        );

        // Columna del nombre y el icono.
        const nombreVisible = opcion.icono
            ? `${opcion.icono} ${opcion.nombre}`
            : opcion.nombre;

        fila.appendChild(
            crearElemento("td", nombreVisible)
        );

        // Columna del enlace.
        fila.appendChild(
            crearElemento("td", opcion.enlace)
        );

        // Columna de acciones.
        const celdaAcciones = document.createElement("td");

        const botonEditar = crearElemento(
            "button",
            "Editar",
            "boton-editar"
        );

        botonEditar.type = "button";

        botonEditar.addEventListener("click", () => {
            iniciarEdicion(opcion.id);
        });

        const botonEliminar = crearElemento(
            "button",
            "Eliminar",
            "boton-eliminar"
        );

        botonEliminar.type = "button";

        botonEliminar.addEventListener("click", () => {
            eliminarOpcion(opcion.id);
        });

        celdaAcciones.append(
            botonEditar,
            botonEliminar
        );

        fila.appendChild(celdaAcciones);
        listaOpciones.appendChild(fila);
    });
}

/* Actualiza el menú y la tabla. */
function renderizarTodo() {
    renderizarMenu();
    renderizarTabla();
}

/* Limpia el formulario y cancela el modo de edición. */
function limpiarFormulario() {
    formulario.reset();

    campoIdEdicion.value = "";

    tituloFormulario.textContent = "Administrar menú";

    botonGuardar.textContent = "Agregar opción";

    botonCancelar.hidden = true;
}

/* Carga una opción en el formulario para editarla. */
function iniciarEdicion(id) {
    const opcion = opcionesMenu.find(
        item => item.id === id
    );

    if (!opcion) {
        mostrarMensaje(
            "No se encontró la opción que deseas editar.",
            "error"
        );

        return;
    }

    campoIdEdicion.value = opcion.id;
    campoNombre.value = opcion.nombre;
    campoEnlace.value = opcion.enlace;
    campoIcono.value = opcion.icono;

    tituloFormulario.textContent = "Editar opción";

    botonGuardar.textContent = "Guardar cambios";

    botonCancelar.hidden = false;

    campoNombre.focus();
}

/* Elimina una opción después de pedir confirmación. */
function eliminarOpcion(id) {
    const opcion = opcionesMenu.find(
        item => item.id === id
    );

    if (!opcion) {
        return;
    }

    const confirmar = window.confirm(
        `¿Seguro que deseas eliminar la opción "${opcion.nombre}"?`
    );

    if (!confirmar) {
        return;
    }

    opcionesMenu = opcionesMenu.filter(
        item => item.id !== id
    );

    guardarEnNavegador();

    renderizarTodo();
    limpiarFormulario();

    mostrarMensaje(
        `Se eliminó "${opcion.nombre}".`
    );
}

/* Evento para agregar o editar opciones. */
formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const enlace = campoEnlace.value.trim();
    const icono = campoIcono.value.trim();
    const idEnEdicion = campoIdEdicion.value;

    // Validar nombre.
    if (!nombre || nombre.length > 40) {
        mostrarMensaje(
            "El nombre es obligatorio y debe tener como máximo 40 caracteres.",
            "error"
        );

        campoNombre.focus();

        return;
    }

    // Validar enlace.
    if (
        !enlace ||
        enlace.length > 200 ||
        !validarEnlace(enlace)
    ) {
        mostrarMensaje(
            "Introduce un enlace válido: #ancla, ruta relativa o URL HTTP/HTTPS.",
            "error"
        );

        campoEnlace.focus();

        return;
    }

    // Validar icono.
    if (icono.length > 5) {
        mostrarMensaje(
            "El icono debe tener como máximo 5 caracteres.",
            "error"
        );

        campoIcono.focus();

        return;
    }

    // Evitar nombres duplicados.
    const nombreRepetido = opcionesMenu.some(item => {
        return (
            item.nombre.toLocaleLowerCase() ===
                nombre.toLocaleLowerCase() &&
            item.id !== idEnEdicion
        );
    });

    if (nombreRepetido) {
        mostrarMensaje(
            "Ya existe una opción con ese nombre.",
            "error"
        );

        campoNombre.focus();

        return;
    }

    // Si existe un ID, se modifica la opción.
    if (idEnEdicion) {
        const indice = opcionesMenu.findIndex(
            item => item.id === idEnEdicion
        );

        if (indice < 0) {
            mostrarMensaje(
                "No se encontró la opción que intentas editar.",
                "error"
            );

            return;
        }

        opcionesMenu[indice] = {
            id: idEnEdicion,
            nombre,
            enlace,
            icono
        };

        mostrarMensaje(
            `Se actualizó "${nombre}".`
        );
    } else {
        // Si no existe un ID, se agrega una opción nueva.
        opcionesMenu.push({
            id: generarId(),
            nombre,
            enlace,
            icono
        });

        mostrarMensaje(
            `Se agregó "${nombre}".`
        );
    }

    guardarEnNavegador();

    renderizarTodo();
    limpiarFormulario();
});

/* Evento para cancelar la edición. */
botonCancelar.addEventListener("click", () => {
    limpiarFormulario();

    mostrarMensaje("Edición cancelada.");
});

/* Evento para abrir o cerrar el menú móvil. */
botonMovil.addEventListener("click", () => {
    const navegacion = document.querySelector(
        ".navegacion"
    );

    const abierta = navegacion.classList.toggle(
        "abierta"
    );

    botonMovil.setAttribute(
        "aria-expanded",
        String(abierta)
    );
});

/* Evento para seleccionar una opción del menú. */
menuPrincipal.addEventListener("click", evento => {
    const enlace = evento.target.closest(
        "a[data-opcion-id]"
    );

    if (!enlace) {
        return;
    }

    const opcion = opcionesMenu.find(
        item => item.id === enlace.dataset.opcionId
    );

    if (!opcion) {
        return;
    }

    // Las anclas internas muestran la opción seleccionada.
    if (opcion.enlace.startsWith("#")) {
        evento.preventDefault();

        tituloSeleccionado.textContent = opcion.nombre;

        detalleSeleccionado.textContent =
            `Has seleccionado la opción "${opcion.nombre}". ` +
            `Destino configurado: ${opcion.enlace}.`;

        document
            .getElementById("contenidoSeleccionado")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }

    // Cerrar el menú después de seleccionar en un móvil.
    if (
        window.matchMedia("(max-width: 700px)").matches
    ) {
        document
            .querySelector(".navegacion")
            .classList.remove("abierta");

        botonMovil.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});

/* Exporta las opciones actuales a un archivo JSON. */
botonExportar.addEventListener("click", () => {
    const contenido = JSON.stringify(
        opcionesMenu,
        null,
        2
    );

    const archivo = new Blob(
        [contenido],
        {
            type: "application/json;charset=utf-8"
        }
    );

    const urlTemporal = URL.createObjectURL(archivo);

    const enlaceDescarga = document.createElement("a");

    enlaceDescarga.href = urlTemporal;
    enlaceDescarga.download = "menu.json";

    document.body.appendChild(enlaceDescarga);

    enlaceDescarga.click();
    enlaceDescarga.remove();

    URL.revokeObjectURL(urlTemporal);

    mostrarMensaje(
        "Se exportó el menú en formato JSON."
    );
});

/* Abre el selector para importar un archivo JSON. */
botonImportar.addEventListener("click", () => {
    archivoJSON.click();
});

/* Lee y valida el archivo JSON seleccionado. */
archivoJSON.addEventListener("change", async () => {
    const archivo =
        archivoJSON.files && archivoJSON.files[0];

    if (!archivo) {
        return;
    }

    try {
        // Limitar el archivo importado a 1 MB.
        if (archivo.size > 1024 * 1024) {
            throw new Error(
                "El archivo supera el límite permitido de 1 MB."
            );
        }

        const contenido = await archivo.text();

        // JSON.parse genera un error si el archivo no es JSON válido.
        const datos = JSON.parse(contenido);

        // Validar antes de reemplazar las opciones actuales.
        const opcionesImportadas = validarLista(datos);

        const confirmar = window.confirm(
            `Se importarán ${opcionesImportadas.length} opciones ` +
            "y se reemplazará el menú actual. ¿Continuar?"
        );

        if (!confirmar) {
            return;
        }

        opcionesMenu = opcionesImportadas;

        guardarEnNavegador();

        renderizarTodo();
        limpiarFormulario();

        mostrarMensaje(
            "El archivo JSON se importó correctamente."
        );
    } catch (error) {
        mostrarMensaje(
            `No se pudo importar el archivo: ${error.message}`,
            "error"
        );
    } finally {
        // Permite volver a seleccionar el mismo archivo.
        archivoJSON.value = "";
    }
});

/* Restaura las opciones iniciales. */
botonRestaurar.addEventListener("click", () => {
    const confirmar = window.confirm(
        "¿Restaurar el menú inicial? Se reemplazarán las opciones actuales."
    );

    if (!confirmar) {
        return;
    }

    opcionesMenu = validarLista(
        opcionesInicialesRespaldo
    );

    guardarEnNavegador();

    renderizarTodo();
    limpiarFormulario();

    mostrarMensaje(
        "Se restauró el menú inicial."
    );
});

/* Iniciar la aplicación. */
cargarOpciones().then(() => {
    renderizarTodo();
});