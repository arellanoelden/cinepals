#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { TablesStack } from '../lib/tables-stack';

const app = new cdk.App();

new TablesStack(app, 'TablesStack', {
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: '648778346175', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Future stacks (e.g. an ApiStack for AppSync/Lambda) get added here as well.
