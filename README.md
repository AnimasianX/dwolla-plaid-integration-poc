# dwolla-plaid-integration-poc

Bare Minimum implementation of POC for Per Diem app.

## To get started:
- Create Sandbox account for both Plaid and Dwolla to access their API
- Obtain and save Client ID for Plaid and Dwolla and save secret/public key in a .env file
- Go to plaid account and select team settings and add Dwolla under Integrations tab to enable the two services to communicate with each other
- npm i in directory to download all dependencies 

## To Run
- node index.js

## API paths
- /api/dwolla/create-business-customer : Creates business customer with extra verification fields and returns http link with newly created customer ID that will be added to your Dwolla account under Customer
