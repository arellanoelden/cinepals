import * as cdk from 'aws-cdk-lib/core';
import { AmplifyAuth } from '@aws-amplify/auth-construct';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  public readonly auth: AmplifyAuth;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.auth = new AmplifyAuth(this, 'Auth', {
      loginWith: { email: true },
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.auth.resources.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.auth.resources.userPoolClient.userPoolClientId,
    });
  }
}
