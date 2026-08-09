import * as cdk from 'aws-cdk-lib/core';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  profilesTable: dynamodb.ITable;
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

    profilesDataSource.createResolver('CreateProfileResolver', {
      typeName: 'Mutation',
      fieldName: 'createProfile',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(path.join(__dirname, 'graphql/resolvers-dist/create-profile.js')),
    });

    profilesDataSource.createResolver('GetProfileResolver', {
      typeName: 'Query',
      fieldName: 'getProfile',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(path.join(__dirname, 'graphql/resolvers-dist/get-profile.js')),
    });

    new cdk.CfnOutput(this, 'GraphqlApiUrl', { value: api.graphqlUrl });
  }
}
