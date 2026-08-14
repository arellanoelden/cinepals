import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';
import type { Review } from '@cinepals/types';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STAR_COUNT = 5;

function StarDisplay({ rating }: { rating: number }) {
  const theme = useTheme();
  return (
    <View style={styles.starRow}>
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Text key={index} style={[styles.star, { color: index < rating ? theme.text : theme.textSecondary }]}>
          {index < rating ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

export function PostCard({ review }: { review: Review }) {
  const theme = useTheme();
  const movie = review.movie;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        style={styles.movieRow}
        onPress={() => movie && router.push({ pathname: '/movie/[movieId]', params: { movieId: movie.id } })}>
        {movie?.posterPath ? (
          <Image source={{ uri: movie.posterPath }} style={styles.poster} contentFit="cover" />
        ) : (
          <View style={[styles.poster, { backgroundColor: theme.backgroundSelected }]} />
        )}
        <View style={styles.movieText}>
          <Text variant="titleMedium" numberOfLines={2}>
            {movie?.title ?? 'Unknown movie'}
          </Text>
          <StarDisplay rating={review.rating} />
        </View>
      </Pressable>

      {review.content ? <Text style={styles.content}>{review.content}</Text> : null}

      {review.media && review.media.length > 0 ? (
        <View style={styles.mediaRow}>
          {review.media.map((item) => (
            <Image key={item.key} source={{ uri: item.url }} style={styles.media} contentFit="cover" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  movieRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  poster: { width: 56, height: 84, borderRadius: Spacing.one },
  movieText: { flex: 1, gap: Spacing.one },
  starRow: { flexDirection: 'row' },
  star: { fontSize: 16 },
  content: { lineHeight: 20 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  media: { width: 140, height: 140, borderRadius: Spacing.two },
});
