import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import type { Movie } from '@cinepals/types';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createReview, generateUploadUrl, getMovie, uploadMediaAsset } from '@/lib/graphql-client';
import { pickReviewMedia, type PickedMedia } from '@/lib/media';

const STAR_COUNT = 5;

function StarRating({ rating, onChange }: { rating: number | null; onChange: (value: number) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.starRow}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const value = index + 1;
        const filled = rating !== null && value <= rating;
        return (
          <Pressable key={value} onPress={() => onChange(value)} hitSlop={Spacing.two}>
            <Text style={[styles.star, { color: filled ? theme.text : theme.textSecondary }]}>
              {filled ? '★' : '☆'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreatePostScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const theme = useTheme();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadingMovie, setLoadingMovie] = useState(true);

  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [pickingMedia, setPickingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingMovie(true);
      try {
        setMovie(await getMovie(movieId));
      } finally {
        setLoadingMovie(false);
      }
    })();
  }, [movieId]);

  const handlePickMedia = useCallback(async () => {
    setError(null);
    setPickingMedia(true);
    try {
      const picked = await pickReviewMedia();
      if (picked) {
        setMedia(picked);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick media');
    } finally {
      setPickingMedia(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === null) {
      setError('Pick a rating first');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let mediaKeys: string[] | undefined;
      if (media) {
        const uploadTarget = await generateUploadUrl(media.contentType, media.fileExtension);
        await uploadMediaAsset(media.uri, media.contentType, uploadTarget);
        mediaKeys = [uploadTarget.key];
      }
      await createReview({
        mediaId: movieId,
        rating,
        content: content.trim() || undefined,
        mediaKeys,
      });
      router.replace('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }, [content, media, movieId, rating]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Button mode="text" style={styles.backButton} onPress={() => router.back()}>
            Back
          </Button>

          <Text variant="headlineMedium" style={styles.title}>
            New Post
          </Text>

          {loadingMovie ? (
            <ActivityIndicator style={styles.loading} />
          ) : movie ? (
            <View style={[styles.movieHeader, { backgroundColor: theme.backgroundElement }]}>
              {movie.posterPath ? (
                <Image source={{ uri: movie.posterPath }} style={styles.poster} contentFit="cover" />
              ) : (
                <View style={[styles.poster, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <View style={styles.movieHeaderText}>
                <Text variant="titleMedium" numberOfLines={2}>
                  {movie.title}
                </Text>
                {movie.releaseDate ? (
                  <Text style={{ color: theme.textSecondary }}>{movie.releaseDate.slice(0, 4)}</Text>
                ) : null}
              </View>
            </View>
          ) : (
            <HelperText type="error">Movie not found</HelperText>
          )}

          <StarRating rating={rating} onChange={setRating} />

          <TextInput
            label="What did you think? (optional)"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            style={styles.contentInput}
          />

          {media ? (
            <View style={styles.mediaPreviewRow}>
              <Image source={{ uri: media.uri }} style={styles.mediaPreview} contentFit="cover" />
              <Button mode="text" onPress={() => setMedia(null)}>
                Remove
              </Button>
            </View>
          ) : (
            <Button mode="outlined" onPress={handlePickMedia} loading={pickingMedia} disabled={pickingMedia}>
              Add Photo or GIF
            </Button>
          )}

          {error ? <HelperText type="error">{error}</HelperText> : null}

          <Button
            mode="contained"
            style={styles.submitButton}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !movie}>
            Post
          </Button>
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
    gap: Spacing.three,
  },
  backButton: { alignSelf: 'flex-start' },
  title: {},
  loading: { marginTop: Spacing.four },
  movieHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  poster: { width: 56, height: 84, borderRadius: Spacing.one },
  movieHeaderText: { flex: 1, gap: Spacing.half },
  starRow: { flexDirection: 'row', gap: Spacing.two },
  star: { fontSize: 32 },
  contentInput: {},
  mediaPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  mediaPreview: { width: 100, height: 100, borderRadius: Spacing.two },
  submitButton: { marginTop: Spacing.two },
});
