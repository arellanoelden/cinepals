import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, HelperText, Text } from 'react-native-paper';
import type { FriendRelationship, Profile } from '@cinepals/types';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  acceptFriendRequest,
  getProfileById,
  removeFriend,
  sendFriendRequest,
} from '@/lib/graphql-client';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProfileById(userId);
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function setFriendStatus(status: FriendRelationship) {
    setProfile((current) => (current ? { ...current, friendStatus: status } : current));
  }

  async function runAction(action: () => Promise<unknown>, nextStatus: FriendRelationship) {
    setActionPending(true);
    setError(null);
    try {
      await action();
      setFriendStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionPending(false);
    }
  }

  function renderFriendAction() {
    if (!profile) {
      return null;
    }
    switch (profile.friendStatus) {
      case 'NONE':
        return (
          <Button
            mode="contained"
            loading={actionPending}
            disabled={actionPending}
            onPress={() => runAction(() => sendFriendRequest(profile.userId), 'OUTGOING_REQUEST')}>
            Add Friend
          </Button>
        );
      case 'OUTGOING_REQUEST':
        return (
          <Button
            mode="outlined"
            loading={actionPending}
            disabled={actionPending}
            onPress={() => runAction(() => removeFriend(profile.userId), 'NONE')}>
            Requested
          </Button>
        );
      case 'INCOMING_REQUEST':
        return (
          <View style={styles.actionRow}>
            <Button
              mode="contained"
              loading={actionPending}
              disabled={actionPending}
              onPress={() => runAction(() => acceptFriendRequest(profile.userId), 'ACCEPTED')}>
              Accept
            </Button>
            <Button
              mode="outlined"
              disabled={actionPending}
              onPress={() => runAction(() => removeFriend(profile.userId), 'NONE')}>
              Decline
            </Button>
          </View>
        );
      case 'ACCEPTED':
        return (
          <Button
            mode="outlined"
            loading={actionPending}
            disabled={actionPending}
            onPress={() => runAction(() => removeFriend(profile.userId), 'NONE')}>
            Friends
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Button mode="text" style={styles.backButton} onPress={() => router.back()}>
          Back
        </Button>

        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : !profile ? (
          <Text variant="headlineMedium">Profile not found</Text>
        ) : (
          <>
            <Text variant="headlineMedium" style={styles.title}>
              {profile.displayName}
            </Text>
            <Text>Bio: {profile.bio ?? '-'}</Text>

            {error ? <HelperText type="error">{error}</HelperText> : null}

            <View style={styles.actions}>{renderFriendAction()}</View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  backButton: { alignSelf: 'flex-start' },
  loading: { marginTop: Spacing.six },
  title: { marginBottom: Spacing.three },
  actions: { marginTop: Spacing.four },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
});
