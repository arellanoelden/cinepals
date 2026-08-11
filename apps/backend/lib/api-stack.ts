import * as cdk from 'aws-cdk-lib/core';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  profilesTable: dynamodb.ITable;
  friendshipsTable: dynamodb.ITable;
}

function resolverCode(fileName: string) {
  return appsync.Code.fromAsset(path.join(__dirname, `graphql/resolvers-dist/${fileName}.js`));
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, 'CinepalsApi', {
      name: 'CinepalsApi',
      definition: appsync.Definition.fromFile(path.join(__dirname, 'graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool: props.userPool },
        },
      },
    });

    const profilesDataSource = api.addDynamoDbDataSource('ProfilesDataSource', props.profilesTable);
    const friendshipsDataSource = api.addDynamoDbDataSource('FriendshipsDataSource', props.friendshipsTable);

    // addDynamoDbDataSource only grants the single-item/batch DynamoDB
    // actions - TransactWriteItems (used by send/accept/remove friend) needs
    // an explicit grant.
    props.friendshipsTable.grant(friendshipsDataSource, 'dynamodb:TransactWriteItems');

    profilesDataSource.createResolver('CreateProfileResolver', {
      typeName: 'Mutation',
      fieldName: 'createProfile',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('create-profile'),
    });

    profilesDataSource.createResolver('GetProfileResolver', {
      typeName: 'Query',
      fieldName: 'getProfile',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('get-profile'),
    });

    profilesDataSource.createResolver('GetProfileByIdResolver', {
      typeName: 'Query',
      fieldName: 'getProfileById',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('get-profile-by-id'),
    });

    profilesDataSource.createResolver('SearchProfilesResolver', {
      typeName: 'Query',
      fieldName: 'searchProfiles',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('search-profiles'),
    });

    friendshipsDataSource.createResolver('ListFriendEdgesResolver', {
      typeName: 'Query',
      fieldName: 'listFriendEdges',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('list-friend-edges'),
    });

    friendshipsDataSource.createResolver('SendFriendRequestResolver', {
      typeName: 'Mutation',
      fieldName: 'sendFriendRequest',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('send-friend-request'),
    });

    friendshipsDataSource.createResolver('AcceptFriendRequestResolver', {
      typeName: 'Mutation',
      fieldName: 'acceptFriendRequest',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('accept-friend-request'),
    });

    friendshipsDataSource.createResolver('RemoveFriendResolver', {
      typeName: 'Mutation',
      fieldName: 'removeFriend',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('remove-friend'),
    });

    friendshipsDataSource.createResolver('ProfileFriendStatusResolver', {
      typeName: 'Profile',
      fieldName: 'friendStatus',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('profile-friend-status'),
    });

    profilesDataSource.createResolver('FriendEdgeProfileResolver', {
      typeName: 'FriendEdge',
      fieldName: 'profile',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: resolverCode('friend-edge-profile'),
    });

    new cdk.CfnOutput(this, 'GraphqlApiUrl', { value: api.graphqlUrl });
  }
}
