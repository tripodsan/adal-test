# ADAL Login Test

Script to test login to azure.

## Test device login. 
With no arguments, the script create a device token and prompts the user to open a browser to log in.

```console
$ node src/index.js 
To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code Y2GXW2XP4 to authenticate.

acquire token via device code.
Token acquired.
{ '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#users/$entity',
  businessPhones: [],
  displayName: 'Test User',
.
.
.
```

## Login with username password (ROPC)
When given an argument it is considered a username. The script will prompt for a password:

```console
$ node src/index.js test@test.com
username: test@test.com
password: ***********

acquire token with ROPC.
Token acquired.
{ '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#users/$entity',
  businessPhones: [],
  displayName: 'Test User',
.
.

```
