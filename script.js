const OMDB_API_KEY = '63ceb33a'; // sends key with each api request
const OMDB_URL = 'https://www.omdbapi.com/'; //stores address

document.addEventListener('DOMContentLoaded', () => { // waits until HTML loads to run
  //elements
  const main = document.querySelector('main'); //area
  const toggle = document.querySelector('#search-toggle');
  const status = document.querySelector('#product-message');
  const heroTitle = document.querySelector('#hero-title');

  if (!main || !status) return; //stops running if page is missing something

  heroTitle.textContent = 'Find your next\nfavorite film.'; 
  heroTitle.style.whiteSpace = 'pre-line';
  status.textContent = 'Loading movies…';

  // Add the search UI and result grid since the HTML currently only contains
  // the hero and its search button.
  const form = document.createElement('form'); //creates form element
  form.id = 'product-search-form'; 
  form.setAttribute('role', 'search'); //hides form initially
  form.hidden = true;
  form.innerHTML = 
  //searchbox down below
  `
    <label class="visually-hidden" for="movie-query">Título do filme</label> 
    <input id="movie-query" name="query" type="search" placeholder="Buscar um filme…" autocomplete="off" required>
    <button type="submit">Buscar</button>
  `;

  const results = document.createElement('section');
  results.id = 'products';
  results.className = 'movie-grid';
  results.setAttribute('aria-label', 'Movie search results');
  results.setAttribute('aria-live', 'polite');


  // will open and submit search
  const catalog = document.querySelector('.catalog-status');
  catalog.insertAdjacentElement('afterend', form);
  form.insertAdjacentElement('afterend', results);

  toggle?.addEventListener('click', () => {
    const opening = form.hidden;
    form.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    if (opening) form.querySelector('input').focus(); // will stop if input is empty
  });

  // the form submit also runs when Enter is pressed.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = new FormData(form).get('query').trim();
    if (!query) return; // calls movie function and waits for it to execute
    await searchMovies(query);
  });

  // The start page is a release list, not a random title search.
  loadLatestMovies(); // fill catalog

  async function searchMovies(query) {
    status.textContent = `Buscando “${query}”…`;
    results.replaceChildren(); // removes old movie cards 

    try {
      const data = await fetchMovieSearch(query); // asks OMDb for movies matching the query.
      if (data.Response === 'False') {
        const apiError = data.Error?.toLowerCase() || '';
        if (apiError.includes('api') || apiError.includes('key') || apiError.includes('limit')) {
          throw new Error(data.Error);
        }
        status.textContent = `Nenhum filme encontrado para “${query}”. Tente outro título.`;
        return; // search in progress
      }

      const movies = data.Search || [];
      status.textContent = `${data.totalResults || movies.length} resultados para “${query}”.`;
      movies.forEach((movie) => {
        const card = createMovieCard(movie);
        results.append(card);
        // the card only needs the rating; the rest opens on the movie page.
        loadImdbRating(movie.imdbID, card.querySelector('.movie-rating'));
      });
    } catch (error) {
      console.error('Movie search failed:', error);
      status.textContent = error.message?.toLowerCase().match(/api|key|limit/)
        ? 'Falha na API de filmes. Verifique a chave ou o limite de requisições.'
        : 'Não foi possível carregar os filmes. Verifique sua conexão e tente novamente.';
    }
  }

  async function loadLatestMovies() {
    const latestTitles = [
      'Ebenezer', 'How to Rob a Bank', 'Victorian Psycho', 'God with Us',
      'Paper Tiger', 'Bitter Christmas', 'Orfeo', 'Hurricanna',
      'Dead of Night', 'The Cat in the Hat', 'Godzilla Minus Zero',
      'Wild Horse Nine', 'Ghost Soldier'
    ];
    status.textContent = 'Carregando lançamentos recentes…';
    results.replaceChildren(); 

    try {
      const responses = await Promise.allSettled(latestTitles.map((title) => fetchMovieSearch(title)));
      const failedSearches = responses.filter((result) =>
        result.status === 'rejected' || result.value.Response === 'False'
      ).length;
      const movies = responses
        .filter((result) => result.status === 'fulfilled' && result.value.Response !== 'False')
        .map((result) => result.value.Search?.[0])
        .filter(Boolean);
      const uniqueMovies = [...new Map(movies.map((movie) => [movie.imdbID, movie])).values()];

      if (!uniqueMovies.length) {
        status.textContent = 'Não foi possível carregar os lançamentos recentes. Verifique sua conexão e tente novamente.';
        return;
      }

      status.textContent = failedSearches
        ? `Lançamentos recentes. ${failedSearches} títulos não foram encontrados ou estão indisponíveis.`
        : 'Lançamentos recentes.';
      uniqueMovies.forEach((movie) => {
        const card = createMovieCard(movie);
        results.append(card);
        loadImdbRating(movie.imdbID, card.querySelector('.movie-rating'));
      });
    } catch (error) {
      console.error('Latest movie releases failed:', error);
      status.textContent = 'Não foi possível carregar os lançamentos recentes. Verifique sua conexão e tente novamente.';
    }
  }

  async function fetchMovieSearch(query) {
    const url = new URL(OMDB_URL);
    url.search = new URLSearchParams({ apikey: OMDB_API_KEY, s: query, type: 'movie' });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  // get the rating for the catalog card.
  async function loadImdbRating(imdbID, ratingElement) {
    if (!imdbID) {
      ratingElement.textContent = 'Nota IMDb: indisponível';
      return;
    }

    try {
      const url = new URL(OMDB_URL);
      url.search = new URLSearchParams({ apikey: OMDB_API_KEY, i: imdbID });
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const movie = await response.json();
      ratingElement.textContent = movie.imdbRating && movie.imdbRating !== 'N/A'
        ? `Nota IMDb: ${movie.imdbRating}/10`
        : 'Nota IMDb: indisponível';
    } catch (error) {
      console.error(`Could not load IMDb rating for ${imdbID}:`, error);
      ratingElement.textContent = 'Nota IMDb: indisponível';
    }
  }

  function createMovieCard(movie) {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `movie.html?id=${encodeURIComponent(movie.imdbID || '')}`;

    const poster = document.createElement('img');
    poster.src = movie.Poster && movie.Poster !== 'N/A'
      ? movie.Poster
      : makePosterPlaceholder(movie.Title);
    poster.alt = movie.Poster && movie.Poster !== 'N/A'
      ? `Poster for ${movie.Title}`
      : `No poster available for ${movie.Title}`;
    poster.loading = 'lazy';

    const title = document.createElement('h2');
    title.textContent = movie.Title;

    const year = document.createElement('p');
    year.textContent = `Ano: ${movie.Year || 'Não informado'}`;

    const rating = document.createElement('p');
    rating.className = 'movie-rating';
    rating.textContent = 'Nota IMDb: Carregando…';

    card.append(poster, title, year, rating);
    return card;
  }

  function makePosterPlaceholder(title) { // defines function that receives movie title
    const initials = title.split(/\s+/).slice(0, 3).map((word) => word[0]).join(''); //splits in whitespace
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="#22231f"/><text x="200" y="310" fill="#d5f36a" font-family="sans-serif" font-size="70" font-weight="700" text-anchor="middle">${escapeXml(initials)}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`; //svg packages
  }

  function escapeXml(value) { //takes text in value and returns safer version of text
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[character]);
  }
});
