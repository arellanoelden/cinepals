import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import type { Movie } from '@cinepals/types';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchMovies } from '@/lib/graphql-client';

const SEARCH_DEBOUNCE_MS = 300;

function releaseYear(movie: Movie): string | null {
  return movie.releaseDate ? movie.releaseDate.slice(0, 4) : null;
}

function MovieRow({ movie, mode }: { movie: Movie; mode?: string }) {
  const theme = useTheme();
  const year = releaseYear(movie);
  const handlePress = () => {
    if (mode === 'post') {
      router.push({ pathname: '/create-post/[movieId]', params: { movieId: movie.id } });
    } else {
      router.push({ pathname: '/movie/[movieId]', params: { movieId: movie.id } });
    }
  };
  return (
    <Pressable onPress={handlePress} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      {movie.posterPath ? (
        <Image source={{ uri: movie.posterPath }} style={styles.poster} contentFit="cover" />
      ) : (
        <View style={[styles.poster, styles.posterFallback, { backgroundColor: theme.backgroundSelected }]} />
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={{ color: theme.textSecondary }}>
          {[year, movie.voteAverage ? `★ ${movie.voteAverage.toFixed(1)}` : null]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    debounceTimer.current = setTimeout(async () => {
      try {
        setResults(await searchMovies(trimmed));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search movies');
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Button mode="text" style={styles.backButton} onPress={() => router.back()}>
            Back
          </Button>

          <Text variant="headlineMedium" style={styles.title}>
            {mode === 'post' ? 'Select a Movie' : 'Search Movies'}
          </Text>

          <TextInput
            label="Search by title"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={styles.searchInput}
          />

          {loading ? <ActivityIndicator style={styles.loading} /> : null}
          {error ? <HelperText type="error">{error}</HelperText> : null}

          {!loading && query.trim() && results.length === 0 && !error ? (
            <Text style={{ color: theme.textSecondary }}>No movies found.</Text>
          ) : null}

          <View style={styles.results}>
            {results.map((movie) => (
              <MovieRow key={movie.id} movie={movie} mode={mode} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexDirection: 'row', justifyContent: 'center' },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  backButton: { alignSelf: 'flex-start' },
  title: { marginBottom: Spacing.three },
  searchInput: {},
  loading: { marginVertical: Spacing.two },
  results: { marginTop: Spacing.three, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  poster: { width: 56, height: 84, borderRadius: Spacing.one },
  posterFallback: {},
  rowText: { flex: 1, gap: Spacing.half },
  rowTitle: { fontSize: 16, fontWeight: '500' },
});
