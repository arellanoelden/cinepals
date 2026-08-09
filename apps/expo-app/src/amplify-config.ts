import 'react-native-get-random-values';

import { Amplify } from 'aws-amplify';

import { awsConfig } from '@/aws-config';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.userPoolId,
      userPoolClientId: awsConfig.userPoolClientId,
    },
  },
  API: {
    GraphQL: {
      endpoint: awsConfig.graphqlApiUrl,
      region: awsConfig.region,
      defaultAuthMode: 'userPool',
    },
  },
});
