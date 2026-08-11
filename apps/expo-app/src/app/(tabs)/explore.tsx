import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import type { FriendEdge, Profile } from '@cinepals/types';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  acceptFriendRequest,
  listFriendEdges,
  removeFriend,
  searchProfiles,
  sendFriendRequest,
} from '@/lib/graphql-client';

const SEARCH_DEBOUNCE_MS = 300;

function goToProfile(userId: string) {
  router.push({ pathname: '/user/[userId]', params: { userId } });
}

function ProfileRow({
  profile,
  onPress,
  right,
}: {
  profile: Profile;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Text style={styles.rowName}>{profile.displayName}</Text>
      {right}
    </Pressable>
  );
}

export default function FriendsScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [edges, setEdges] = useState<FriendEdge[]>([]);
  const [edgesLoading, setEdgesLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const refreshEdges = useCallback(async () => {
    setEdgesLoading(true);
    try {
      setEdges(await listFriendEdges());
    } finally {
      setEdgesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEdges();
  }, [refreshEdges]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        setSearchResults(await searchProfiles(trimmed));
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  async function handleAccept(userId: string) {
    setPendingUserId(userId);
    try {
      await acceptFriendRequest(userId);
      await refreshEdges();
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleRemove(userId: string) {
    setPendingUserId(userId);
    try {
      await removeFriend(userId);
      await refreshEdges();
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleAdd(userId: string) {
    setPendingUserId(userId);
    try {
      await sendFriendRequest(userId);
      setSearchResults((current) =>
        current.map((p) => (p.userId === userId ? { ...p, friendStatus: 'OUTGOING_REQUEST' } : p)),
      );
    } finally {
      setPendingUserId(null);
    }
  }

  const incomingRequests = edges.filter((e) => e.status === 'INCOMING_REQUEST');
  const friends = edges.filter((e) => e.status === 'ACCEPTED');
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Friends
        </Text>

        <TextInput
          label="Search by name"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />

        {searching ? <ActivityIndicator style={styles.smallLoading} /> : null}

        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Results
            </Text>
            {searchResults.map((profile) => (
              <ProfileRow
                key={profile.userId}
                profile={profile}
                onPress={() => goToProfile(profile.userId)}
                right={
                  profile.friendStatus === 'NONE' ? (
                    <Button
                      mode="contained-tonal"
                      compact
                      loading={pendingUserId === profile.userId}
                      disabled={pendingUserId === profile.userId}
                      onPress={() => handleAdd(profile.userId)}>
                      Add
                    </Button>
                  ) : (
                    <Text style={styles.statusLabel}>{profile.friendStatus.replace('_', ' ')}</Text>
                  )
                }
              />
            ))}
          </View>
        )}

        {edgesLoading ? (
          <ActivityIndicator style={styles.smallLoading} />
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Requests
                </Text>
                {incomingRequests.map((edge) =>
                  edge.profile ? (
                    <ProfileRow
                      key={edge.userId}
                      profile={edge.profile}
                      onPress={() => goToProfile(edge.userId)}
                      right={
                        <View style={styles.actionRow}>
                          <Button
                            mode="contained-tonal"
                            compact
                            loading={pendingUserId === edge.userId}
                            disabled={pendingUserId === edge.userId}
                            onPress={() => handleAccept(edge.userId)}>
                            Accept
                          </Button>
                          <Button
                            mode="text"
                            compact
                            disabled={pendingUserId === edge.userId}
                            onPress={() => handleRemove(edge.userId)}>
                            Decline
                          </Button>
                        </View>
                      }
                    />
                  ) : null,
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Your Friends
              </Text>
              {friends.length === 0 ? (
                <Text style={{ color: theme.textSecondary }}>No friends yet - search above to add some.</Text>
              ) : (
                friends.map((edge) =>
                  edge.profile ? (
                    <ProfileRow
                      key={edge.userId}
                      profile={edge.profile}
                      onPress={() => goToProfile(edge.userId)}
                    />
                  ) : null,
                )
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  title: { marginBottom: Spacing.three },
  searchInput: {},
  smallLoading: { marginVertical: Spacing.two },
  section: { marginTop: Spacing.four, gap: Spacing.two },
  sectionTitle: { marginBottom: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  rowName: { fontSize: 16, fontWeight: '500' },
  statusLabel: { fontSize: 12, textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: Spacing.one },
});
