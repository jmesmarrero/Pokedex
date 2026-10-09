const formulario = document.querySelector("#formulario-busqueda");
const inputBusqueda = document.querySelector("#busqueda");
const mensaje = document.querySelector("#mensaje");
const resultado = document.querySelector("#resultado");
const panel = document.querySelector("#panel-detalles");
const panelContenido = document.querySelector("#panel-contenido");
const botonCerrar = document.querySelector(".panel__cerrar");
const contenedorTipos = document.querySelector("#filtro-tipos");
const botonCargar = document.querySelector("#boton-cargar");


// Tipos que el usuario ha marcado en los botones
let tiposSeleccionados = [];
let todosLosPokemon = [];

const obtenerPokemon = async (busqueda) => {
    const url = `https://pokeapi.co/api/v2/pokemon/${busqueda}`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Pokemon not found.");
    }

    const datos = await respuesta.json(); // aquí llegan TODOS los datos del Pokémon

    return new Pokemon(datos); //coge toda la info de la clase Pokemon en pokemon.js

};


// formatearId Convierte el número en texto de 3 cifra
const formatearId = (id) => {
    return String(id).padStart(3, "0");
};


// crearTarjeta Recibe un Pokémon y DEVUELVE el HTML de su tarjeta como texto
const crearTarjeta = (pokemon) => {
    // Cada tipo se convierte en un <span>; join("") los une sin comas.
    const tiposHTML = pokemon.typess
        .map((type) => `<span class="tipo tipo--${type}">${type}</span>`)
        .join("");

    return `
    <article class="pokemon">
      <p class="pokemon__numero">N.º ${formatearId(pokemon.id)}</p>
    
        <button type="button" class="pokemon__detalle" data-id="${pokemon.id}">Show details</button>  
      <img
        class="pokemon__imagen pokemon__imagen--espalda"
        src="${pokemon.image}"
        alt="Imagen de ${pokemon.name} de espaldas"
      >
      <img
        class="pokemon__imagen pokemon__imagen--frente"
        src="${pokemon.image2}"
        alt="Imagen de ${pokemon.name} de frente"
      >

      <h2 class="pokemon__nombre">${pokemon.name}</h2>

      <div class="pokemon__datos">
        <p><strong>Height</strong><br>${pokemon.height}</p>
        <p><strong>Weight</strong><br>${pokemon.weight}</p>
      </div>

      <div class="pokemon__tipos">
        ${tiposHTML}
      </div>
    </article>
    `;
};

// Construye el HTML del panel de detalles de un Pokémon
const crearPanel = (pokemon) => {
    const tiposHTML = pokemon.typess
        .map((type) => `<span class="tipo tipo--${type}">${type}</span>`).join("");

    const habilidadesHTML = pokemon.abilities
        .map((habilidad) => `<li>${habilidad}</li>`)
        .join("");

    // 255 es el valor máximo posible de una estadística base
    const estadisticasHTML = pokemon.stats
        .map(({ name, value }) => `
        <li class="stat">
          <span class="stat__nombre">${name}</span>
          <span class="stat__valor">${value}</span>
          <span class="stat__barra"><span style="width: ${Math.min(100, (value / 255) * 100)}%"></span></span>
        </li>`)
        .join("");

    return `
    <h2 id="panel-titulo" class="panel__titulo">${pokemon.name} <small>N.º ${formatearId(pokemon.id)}</small></h2>
    <img class="panel__imagen" src="${pokemon.image2}" alt="Imagen de ${pokemon.name} de frente">

    <div class="pokemon__tipos">${tiposHTML}</div>

    <div class="pokemon__datos">
      <p><strong>Height</strong><br>${pokemon.height}</p>
      <p><strong>Weight</strong><br>${pokemon.weight}</p>
      <p><strong>Base experience</strong><br>${pokemon.baseExp}</p>
    </div>

    <h3>Abilities</h3>
    <ul class="panel__habilidades">${habilidadesHTML}</ul>

    <h3>Base stats</h3>
    <ul class="panel__stats">${estadisticasHTML}</ul>
    `;
};

// Pinta una lista de Pokémon y actualiza el mensaje de estado
const pintarTarjetas = (lista) => {
    if (lista.length === 0) {
        resultado.innerHTML = "";
        mensaje.textContent = "No Pokémon match your search.";
        return;
    }

    resultado.innerHTML = lista.map((pokemon) => crearTarjeta(pokemon)).join("");
    mensaje.textContent = `Showing ${lista.length} of ${todosLosPokemon.length} Pokémon`;
};


// Aplica a la vez el texto de búsqueda y los tipos marcados
const filtrar = () => {
    if (todosLosPokemon.length === 0) return;

    const texto = inputBusqueda.value.trim().toLowerCase();

    const filtrados = todosLosPokemon.filter((pokemon) => {
        const coincideTexto = pokemon.name.includes(texto) || String(pokemon.id) === texto;
        // every: el Pokémon debe tener TODOS los tipos marcados (si no hay ninguno, pasan todos)
        const coincideTipo = tiposSeleccionados.every((tipo) => pokemon.typess.includes(tipo));
        return coincideTexto && coincideTipo;
    });

    pintarTarjetas(filtrados);
};

// Crea un botón por cada tipo presente en los Pokémon cargados, más un botón "All"
const rellenarTipos = () => {
    const tipos = [...new Set(todosLosPokemon.flatMap((pokemon) => pokemon.typess))].sort();

    contenedorTipos.innerHTML =
        `<button type="button" class="chip chip--todos" data-tipo="all">All</button>` +
        tipos
            .map((tipo) => `<button type="button" class="chip tipo--${tipo}" data-tipo="${tipo}" aria-pressed="false">${tipo}</button>`)
            .join("");
};

// Desactiva los tipos que, sumados a los ya marcados, no darían ningún Pokémon
const actualizarChips = () => {
    contenedorTipos.querySelectorAll(".chip").forEach((chip) => {
        const tipo = chip.dataset.tipo;
        if (tipo === "all") return; // "All" siempre está disponible

        // Un chip ya marcado se puede desmarcar siempre
        if (tiposSeleccionados.includes(tipo)) {
            chip.disabled = false;
            return;
        }

        const combinacion = [...tiposSeleccionados, tipo];
        const hayAlguno = todosLosPokemon.some((pokemon) =>
            combinacion.every((t) => pokemon.typess.includes(t))
        );

        chip.disabled = !hayAlguno;
    });
};


// Carga los 151 Pokémon controlando los estados: cargando, éxito y error
const cargarPokemon = async () => {
    mensaje.textContent = "Loading Pokémon...";
    resultado.innerHTML = "";
    botonCargar.disabled = true;

    try {
        // Lista de ids del 1 al 151 (i empieza en 0, por eso i + 1)
        const pokeIds = Array.from({ length: 151 }, (_, i) => i + 1);

        // 151 llamadas a obtenerPokemon: aún son promesas, no Pokémon
        const promesas = pokeIds.map((id) => obtenerPokemon(id));

        // Promise.all espera a todas y devuelve los resultados EN ORDEN
        todosLosPokemon = await Promise.all(promesas);

        tiposSeleccionados = []; // al recargar se empieza sin filtros de tipo
        rellenarTipos();
        actualizarChips();
        inputBusqueda.disabled = false;
        botonCargar.textContent = "Reload Pokémon";

        filtrar(); // pinta las tarjetas y el mensaje "Showing X of Y"
    } catch (error) {
        todosLosPokemon = [];
        contenedorTipos.innerHTML = "";
        inputBusqueda.disabled = true;
        mensaje.textContent = "Could not connect with PokéAPI. Please try again.";
        botonCargar.textContent = "Retry";
    } finally {
        botonCargar.disabled = false; // se ejecuta siempre, haya éxito o error
    }
};

// Estado inicial: no hay datos hasta que el usuario pulse el botón
mensaje.textContent = "Press “Load Pokémon” to start.";
botonCargar.addEventListener("click", cargarPokemon);


//Show details con resto de peticiones a la API
resultado.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".pokemon__detalle");

    if (!boton) return;

    // dataset devuelve texto, por eso se pasa a número
    const id = Number(boton.dataset.id);
    const pokemon = todosLosPokemon.find((p) => p.id === id);
    if (!pokemon) return;

    panelContenido.innerHTML = crearPanel(pokemon);
    panel.showModal();

});

// Cerrar con la X
botonCerrar.addEventListener("click", () => panel.close());

// Cerrar al hacer clic en el fondo oscuro
panel.addEventListener("click", (evento) => {
    if (evento.target === panel) panel.close();
});


// Filtra mientras se escribe, al cambiar el tipo y al enviar el formulario
inputBusqueda.addEventListener("input", filtrar);


formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // evita que la página se recargue
    filtrar();
});



// Un solo listener para todos los botones de tipo
contenedorTipos.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".chip");
    if (!boton) return;

    const tipo = boton.dataset.tipo;

    if (tipo === "all") {
        // Quitar todos los filtros de tipo
        tiposSeleccionados = [];
        contenedorTipos.querySelectorAll(".chip").forEach((chip) => {
            chip.classList.remove("chip--activo");
            chip.setAttribute("aria-pressed", "false");
        });
    } else if (tiposSeleccionados.includes(tipo)) {
        // Segundo clic: desmarcar
        tiposSeleccionados = tiposSeleccionados.filter((t) => t !== tipo);
        boton.classList.remove("chip--activo");
        boton.setAttribute("aria-pressed", "false");
    } else {
        tiposSeleccionados.push(tipo);
        boton.classList.add("chip--activo");
        boton.setAttribute("aria-pressed", "true");
    }

    actualizarChips();
    filtrar();
});







