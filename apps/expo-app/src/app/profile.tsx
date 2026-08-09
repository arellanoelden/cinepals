import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthUser } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthUser();

  return (
    <SafeAreaView style={styles.safeArea}>
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
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  title: { marginBottom: Spacing.three },
  signOut: { marginTop: Spacing.four },
});
