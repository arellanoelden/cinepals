import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, HelperText, Text } from 'react-native-paper';
import type { Movie } from '@cinepals/types';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getMovie } from '@/lib/graphql-client';

function releaseYear(movie: Movie): string | null {
  return movie.releaseDate ? movie.releaseDate.slice(0, 4) : null;
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export default function MovieDetailScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const theme = useTheme();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMovie(await getMovie(movieId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movie');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    load();
  }, [load]);

  const metaLine = movie
    ? [
        releaseYear(movie),
        movie.runtime ? formatRuntime(movie.runtime) : null,
        movie.voteAverage ? `★ ${movie.voteAverage.toFixed(1)} (${movie.voteCount ?? 0})` : null,
      ]
        .filter(Boolean)
        .join('  ·  ')
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Button mode="text" style={styles.backButton} onPress={() => router.back()}>
            Back
          </Button>

          {loading ? (
            <ActivityIndicator style={styles.loading} />
          ) : error ? (
            <HelperText type="error">{error}</HelperText>
          ) : !movie ? (
            <Text variant="headlineMedium">Movie not found</Text>
          ) : (
            <View style={styles.content}>
              {movie.posterPath ? (
                <Image source={{ uri: movie.posterPath }} style={styles.poster} contentFit="cover" />
              ) : (
                <View style={[styles.poster, { backgroundColor: theme.backgroundSelected }]} />
              )}

              <View style={styles.details}>
                <Text variant="headlineMedium">{movie.title}</Text>
                {metaLine ? <Text style={{ color: theme.textSecondary }}>{metaLine}</Text> : null}
                {movie.genres && movie.genres.length > 0 ? (
                  <Text style={{ color: theme.textSecondary }}>
                    {movie.genres.map((genre) => genre.name).join(', ')}
                  </Text>
                ) : null}
                {movie.tagline ? (
                  <Text variant="bodyMedium" style={styles.tagline}>
                    {movie.tagline}
                  </Text>
                ) : null}
                {movie.overview ? <Text style={styles.overview}>{movie.overview}</Text> : null}
              </View>
            </View>
          )}
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
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  backButton: { alignSelf: 'flex-start' },
  loading: { marginTop: Spacing.six },
  content: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  poster: { width: 140, height: 210, borderRadius: Spacing.two },
  details: { flex: 1, gap: Spacing.two },
  tagline: { fontStyle: 'italic' },
  overview: { lineHeight: 20 },
});
