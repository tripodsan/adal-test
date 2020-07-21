/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const { AuthenticationContext } = require('adal-node');
const rp = require('request-promise-native');
const readline = require('readline');

const AZ_AUTHORITY_HOST_URL = 'https://login.windows.net';
const AZ_RESOURCE = 'https://graph.microsoft.com';
const AZ_DEFAULT_TENANT = 'common';
const AZ_APP_CLIENT_ID = '04b07795-8ddb-461a-bbee-02f9e1bf7b46';

async function prompt(msg, hide = false) {
  return new Promise((res) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(msg, (value) => {
      rl.close();
      res(value);
    });
    // eslint-disable-next-line no-underscore-dangle
    rl._writeToOutput = function _writeToOutput(c) {
      if (!hide || c.trim() === '\n' || c === '\r' || c === '\r\n') {
        rl.output.write(c);
      } else {
        rl.output.write('*');
      }
    };
  });
}

async function getAccessToken(context, username, password) {
  let deviceCode = null;
  if (!username) {
    deviceCode = await new Promise((resolve, reject) => {
      context.acquireUserCode(AZ_RESOURCE, AZ_APP_CLIENT_ID, 'en', (err, response) => {
        if (err) {
          console.error('Error while requesting user code', err);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    console.log(deviceCode.message);
  }

  return new Promise((resolve, reject) => {
    const callback = (err, response) => {
      if (err) {
        console.error('Error while refreshing access token', err);
        reject(err);
      } else {
        console.log('Token acquired.');
        resolve(response.accessToken);
      }
    };
    if (username && password) {
      console.log('acquire token with ROPC.');
      context.acquireTokenWithUsernamePassword(AZ_RESOURCE, username, password, AZ_APP_CLIENT_ID, callback);
    } else if (deviceCode) {
      console.log('acquire token via device code.');
      context.acquireTokenWithDeviceCode(AZ_RESOURCE, AZ_APP_CLIENT_ID, deviceCode, callback);
    } else {
      reject(new Error('no more authentication methods'));
    }
  });
}

async function loginWithROPC(context, username, password) {
  if (!username) {
    // eslint-disable-next-line no-param-reassign
    username = await prompt('username: ');
  } else {
    console.log(`username: ${username}`);
  }
  if (!password) {
    // eslint-disable-next-line no-param-reassign
    password = await prompt('password: ', true);
  } else {
    console.log('password: ***');
  }
  return getAccessToken(context, username, password);
}

async function loginWithDeviceCode(context) {
  return getAccessToken(context);
}

function getClient(token) {
  const opts = {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    json: true,
    auth: {
      bearer: token,
    },
  };
  return rp.defaults(opts);
}

async function run() {
  const context = new AuthenticationContext(`${AZ_AUTHORITY_HOST_URL}/${AZ_DEFAULT_TENANT}`);

  const username = process.argv[2];
  const token = username
    ? await loginWithROPC(context, username)
    : await loginWithDeviceCode(context);

  const result = await getClient(token).get('/me');

  console.log(result);

}

run().catch(console.error);
