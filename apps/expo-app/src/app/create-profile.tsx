import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createProfile, isProfileAlreadyExistsError } from '@/lib/graphql-client';
import { useAuthUser } from '@/providers/auth-provider';

export default function CreateProfileScreen() {
  const { refreshProfile } = useAuthUser();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await createProfile({ displayName, bio: bio || undefined });
    } catch (err) {
      if (!isProfileAlreadyExistsError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to create profile');
        setSubmitting(false);
        return;
      }
    }
    await refreshProfile();
    setSubmitting(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Set Up Your Profile
        </Text>

        <TextInput label="Display name" value={displayName} onChangeText={setDisplayName} style={styles.input} />
        <TextInput label="Bio (optional)" value={bio} onChangeText={setBio} multiline style={styles.input} />
        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !displayName}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: { marginBottom: Spacing.three },
  input: {},
});
