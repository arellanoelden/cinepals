import type { AppSyncResolverEvent } from 'aws-lambda';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  runtime?: number | null;
  genres?: TmdbGenre[];
  tagline?: string | null;
}

interface TmdbSearchResponse {
  results: TmdbMovie[];
}

function imageUrl(path: string | null | undefined, size: string): string | null {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

function mapMovie(movie: TmdbMovie) {
  return {
    id: String(movie.id),
    title: movie.title,
    overview: movie.overview ?? null,
    posterPath: imageUrl(movie.poster_path, 'w500'),
    backdropPath: imageUrl(movie.backdrop_path, 'w1280'),
    releaseDate: movie.release_date || null,
    voteAverage: movie.vote_average ?? null,
    voteCount: movie.vote_count ?? null,
    runtime: movie.runtime ?? null,
    genres: movie.genres ?? null,
    tagline: movie.tagline || null,
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured');
  }
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB request to ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

interface ResolverArgs {
  query?: string;
  id?: string;
}

interface ReviewSource {
  mediaId: string;
}

async function fetchMovie(id: string) {
  const movie = await tmdbFetch<TmdbMovie>(`/movie/${id}`);
  return mapMovie(movie);
}

export async function handler(event: AppSyncResolverEvent<ResolverArgs, ReviewSource>) {
  switch (event.info.fieldName) {
    case 'searchMovies': {
      const query = event.arguments.query?.trim();
      if (!query) {
        return [];
      }
      const data = await tmdbFetch<TmdbSearchResponse>('/search/movie', {
        query,
        include_adult: 'false',
      });
      return data.results.map(mapMovie);
    }
    case 'getMovie': {
      const id = event.arguments.id;
      if (!id) {
        return null;
      }
      return fetchMovie(id);
    }
    case 'movie': {
      // Review.movie field resolver - resolves the reviewed TMDB movie from
      // the parent Review's mediaId.
      return fetchMovie(event.source!.mediaId);
    }
    default:
      throw new Error(`Unsupported field: ${event.info.fieldName}`);
  }
}
