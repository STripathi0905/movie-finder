const movieTitleInput = document.getElementById('movieTitle');
const searchBtn = document.getElementById('searchBtn');
const movieInfoDiv = document.getElementById('movieInfo');
const loaderDiv = document.getElementById('loader');
const errorDiv = document.getElementById('error');

const API_KEY = 'a6c0824f';
const API_URL = 'https://www.omdbapi.com/';

const movieCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60;

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;


searchBtn.addEventListener('click', searchMovie);
movieTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovie();
});

async function searchMovie() {
    const movieTitle = movieTitleInput.value.trim();

    if (!movieTitle) {
        showError('Please enter a movie title');
        return;
    }

    showLoader();
    hideError();
    hideMovieInfo();

    const cachedData = getCachedMovie(movieTitle);
    if (cachedData) {
        displayMovieInfo(cachedData);
        hideLoader();
        return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&t=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();

        if (data.Response === 'False') {
            showError(data.Error || 'Movie not found');
            return;
        }

        cacheMovie(movieTitle, data);
        displayMovieInfo(data);
    } catch (error) {
        showError('An error occurred while fetching the movie data');
        console.error('Fetch error:', error);
    } finally {
        hideLoader();
    }
}

function displayMovieInfo(movie) {
    document.getElementById('title').textContent = movie.Title;
    document.getElementById('year').textContent = movie.Year;
    document.getElementById('genre').textContent = movie.Genre;
    document.getElementById('rating').textContent = movie.imdbRating;
    document.getElementById('plot').textContent = movie.Plot;

    const posterImg = document.getElementById('poster');
    if (movie.Poster && movie.Poster !== 'N/A') {
        posterImg.src = movie.Poster;
        posterImg.alt = `${movie.Title} Poster`;
    } else {
        posterImg.src = 'https://via.placeholder.com/300x450?text=No+Poster+Available';
        posterImg.alt = 'No Poster Available';
    }

    showMovieInfo();
}

// Show/hide helpers
function showLoader() {
    loaderDiv.classList.remove('hidden');
}
function hideLoader() {
    loaderDiv.classList.add('hidden');
}
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}
function hideError() {
    errorDiv.classList.add('hidden');
}
function showMovieInfo() {
    movieInfoDiv.classList.remove('hidden');
}
function hideMovieInfo() {
    movieInfoDiv.classList.add('hidden');
}

// Caching
function getCachedMovie(title) {
    const key = title.toLowerCase();
    const entry = movieCache.get(key);
    if (!entry) return null;

    const { data, timestamp } = entry;
    if (Date.now() - timestamp > CACHE_DURATION) {
        movieCache.delete(key);
        return null;
    }

    return data;
}

function cacheMovie(title, data) {
    movieCache.set(title.toLowerCase(), { data, timestamp: Date.now() });
}
