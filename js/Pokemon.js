class Pokemon {
    constructor(datos) {
        this.id = datos.id,
            this.name = datos.name,
            this.height = datos.height / 10 + " m",
            this.weight = datos.weight / 10 + " kg",
            this.image = datos.sprites.back_default,
            this.image2 = datos.sprites.front_default,
            this.typess = datos.types.map(({ type }) => type.name),
            this.baseExp = datos.base_experience,
            this.abilities = datos.abilities.map(({ ability }) => ability.name),
            this.stats = datos.stats.map(({ base_stat, stat }) => ({
                name: stat.name,
                value: base_stat,
            }));
    }
}