const OMDB_API_KEY = '63ceb33a';
const OMDB_URL = 'https://www.omdbapi.com/';

document.addEventListener('DOMContentLoaded', () => {
  const message = document.querySelector('#detail-message');
  const detail = document.querySelector('#movie-detail');
  const imdbID = new URLSearchParams(window.location.search).get('id');

  if (!imdbID) {
    message.textContent = 'Não foi informado qual filme você quer ver.';
    return;
  }

  // get the full movie record using the id from the movie card link.
  loadMovieDetails(imdbID);

  async function loadMovieDetails(id) {
    try {
      const url = new URL(OMDB_URL);
      url.search = new URLSearchParams({ apikey: OMDB_API_KEY, i: id, plot: 'full' });
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const movie = await response.json();
      if (movie.Response === 'False') throw new Error(movie.Error || 'Movie not found');

      showMovieDetails(movie);
    } catch (error) {
      console.error('Could not load movie details:', error);
      message.textContent = 'Não foi possível carregar os detalhes. Verifique sua conexão e tente novamente.';
    }
  }

  // put the full movie information on this page.
  function showMovieDetails(movie) {
    const poster = document.querySelector('#detail-poster');
    const hasPoster = movie.Poster && movie.Poster !== 'N/A';

    poster.src = hasPoster ? movie.Poster : makePosterPlaceholder(movie.Title || 'Filme');
    poster.alt = hasPoster ? `Pôster de ${movie.Title}` : `Pôster indisponível para ${movie.Title}`;
    document.querySelector('#detail-title').textContent = movie.Title || 'Título indisponível';
    document.querySelector('#detail-year').textContent = `Ano: ${movie.Year || 'Não informado'}`;
    document.querySelector('#detail-rating').textContent = movie.imdbRating && movie.imdbRating !== 'N/A'
      ? `Nota IMDb: ${movie.imdbRating}/10`
      : 'Nota IMDb: indisponível';
    document.querySelector('#detail-genre').textContent = `Gênero: ${movie.Genre || 'Não informado'}`;
    document.querySelector('#detail-director').textContent = `Direção: ${movie.Director || 'Não informado'}`;
    document.querySelector('#detail-cast').textContent = `Elenco principal: ${movie.Actors || 'Não informado'}`;
    document.querySelector('#detail-plot').textContent = `Sinopse: ${movie.Plot || 'Não disponível'}`;

    message.hidden = true;
    detail.hidden = false;
    document.title = `${movie.Title || 'Detalhes do filme'} | Movie Search`;
  }

  function makePosterPlaceholder(title) {
    const initials = title.split(/\s+/).slice(0, 3).map((word) => word[0]).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="#22231f"/><text x="200" y="310" fill="#d5f36a" font-family="sans-serif" font-size="70" font-weight="700" text-anchor="middle">${escapeXml(initials)}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function escapeXml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[character]);
  }
});
