// Filled in from the `cdk deploy` CfnOutputs (AuthStack: UserPoolId, UserPoolClientId; ApiStack: GraphqlApiUrl).
// These are public client identifiers, not secrets - safe to commit.
export const awsConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_sI73hsOn9',
  userPoolClientId: '1lg6cn39b7l1pcvkeq77kb4hg0',
  graphqlApiUrl: 'https://zxqbozgqjrbklb7iuuuw6k6dl4.appsync-api.us-east-1.amazonaws.com/graphql',
};
