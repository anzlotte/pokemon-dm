import { LitElement } from 'lit-element';

export class PokevolutionDm extends LitElement {

  async obtenerPokemones() {
    const url = 'https://pokeapi.co/api/v2/evolution-chain?limit=72';
    const pokemones = []; // Array para almacenar los detalles de los Pokémon

    try {
      const response = await fetch(url);
      const data = await response.json();

      const evolutionUrls = data.results.map((evolution) => evolution.url);

      // Obtiene detalles de cada Pokémon en las cadenas de evolución
      for (const evolutionUrl of evolutionUrls) {
        const evolutionResponse = await fetch(evolutionUrl);
        const evolutionData = await evolutionResponse.json();

        // Llama a la función para obtener detalles del Pokémon
        const nombre = evolutionData.chain.species.name;
        const id = evolutionData.id;
        const pokemonDetail = await this.obtenerDetallePokemon(nombre, id);
        if (pokemonDetail) {
          pokemones.push(pokemonDetail); // Agrega el detalle al array
        }
      }
    } catch (error) {
      // Manejo de errores al obtener datos
      return []; // Devuelve un array vacío en caso de error
    }

    return pokemones; // Devuelve el array con los detalles de los Pokémon
  }

  async obtenerDetallePokemon(pokemonName, id) {
    try {
      // Llama a la API para obtener los datos del Pokémon
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const data = await response.json();

      // Llama a la API para obtener los datos de especie (incluye la descripción)
      const responseSpecies = await fetch(data.species.url);
      const dataSpecies = await responseSpecies.json();

      const pokemonDetail = {
        name: data.name,
        image: data.sprites.front_default,
        types: data.types.map((typeInfo) => typeInfo.type.name).join(', '),
        descripcion: dataSpecies.flavor_text_entries.find(entry => entry.language.name === 'es').flavor_text,
        id: id,
      };

      return pokemonDetail;
    } catch (error) {
      // Manejo de errores al obtener detalles del Pokémon
      return null; // Devuelve null si hay un error
    }
  }

  async obtenerEvoluciones(id) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain/${id}`);
      const data = await response.json();
      const chain = data.chain;

      // Añadir el Pokémon base
      const basePokemonDetail = await this.obtenerDetallePokemon(chain.species.name, id);
      const evoluciones = [basePokemonDetail]; // Array para almacenar las evoluciones

      // Verificar si el Pokémon tiene evoluciones
      if (chain.evolves_to.length === 0) {
        return evoluciones; // Devuelve solo el Pokémon base
      }

      // Procesar las evoluciones si existen
      for (const evolution of chain.evolves_to) {
        const evolutionDetail = await this.obtenerDetallePokemon(evolution.species.name, id);
        if (evolutionDetail) {
          evoluciones.push(evolutionDetail);
        }

        // Verificar si la evolución tiene sus propias evoluciones
        for (const subEvolution of evolution.evolves_to) {
          const subEvolutionDetail = await this.obtenerDetallePokemon(subEvolution.species.name, id);
          if (subEvolutionDetail) {
            evoluciones.push(subEvolutionDetail);
          }
        }
      }

      return evoluciones; // Devuelve el array con todas las evoluciones
    } catch (error) {
      // Manejo de errores al obtener datos de evoluciones
      return []; // Devuelve un array vacío en caso de error
    }
  }
}
