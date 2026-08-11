#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { TablesStack } from '../lib/tables-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = { account: '648778346175', region: 'us-east-1' };

const tablesStack = new TablesStack(app, 'TablesStack', { env });
const authStack = new AuthStack(app, 'AuthStack', { env });

new ApiStack(app, 'ApiStack', {
  env,
  userPool: authStack.auth.resources.userPool,
  profilesTable: tablesStack.profilesTable,
  friendshipsTable: tablesStack.friendshipsTable,
});
