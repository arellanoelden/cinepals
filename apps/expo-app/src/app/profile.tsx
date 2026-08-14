import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, HelperText, Text } from 'react-native-paper';
import type { Review } from '@cinepals/types';

import { PostCard } from '@/components/post-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { myReviews } from '@/lib/graphql-client';
import { useAuthUser } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthUser();
  const theme = useTheme();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewsError(null);
    try {
      setReviews(await myReviews());
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            Profile
          </Text>

          <Text>Display name: {profile?.displayName}</Text>
          <Text>Bio: {profile?.bio ?? '-'}</Text>
          <Text>Avatar: {profile?.avatar ?? '-'}</Text>
          <Text>Email: {profile?.email ?? '-'}</Text>
          <Text>Created at: {profile?.createdAt}</Text>

          <Button mode="outlined" onPress={signOut} style={styles.signOut}>
            Sign Out
          </Button>

          <Text variant="titleLarge" style={styles.postsTitle}>
            My Posts
          </Text>

          {loadingReviews ? <ActivityIndicator style={styles.loading} /> : null}
          {reviewsError ? <HelperText type="error">{reviewsError}</HelperText> : null}

          {!loadingReviews && !reviewsError && reviews.length === 0 ? (
            <Text style={{ color: theme.textSecondary }}>
              No posts yet. Find a movie and write your first review.
            </Text>
          ) : null}

          <View style={styles.list}>
            {reviews.map((review) => (
              <PostCard key={`${review.mediaId}#${review.createdAt}`} review={review} />
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
    paddingTop: Spacing.six,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  title: { marginBottom: Spacing.three },
  signOut: { marginTop: Spacing.four },
  postsTitle: { marginTop: Spacing.five },
  loading: { marginVertical: Spacing.two },
  list: { gap: Spacing.three, marginTop: Spacing.two },
});
