import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { autoSignIn, confirmSignUp } from 'aws-amplify/auth';
import { useLocalSearchParams } from 'expo-router';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function ConfirmSignUpScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError('Missing email - go back and register again.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await autoSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm sign up');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Verify Your Email
        </Text>
        <Text>We sent a verification code to {email}.</Text>

        <TextInput
          label="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          style={styles.input}
        />
        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting || !code}>
          Verify
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
