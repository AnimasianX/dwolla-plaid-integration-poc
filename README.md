# dwolla-plaid-integration-poc

## Reason why I chose this:
- One of the first options that shows up from Dwolla and has a pretty simple implementaion with Plaid.
- No transaction fee between users to users like stripe
- https://plaid.com/partner-directory/ - all partners that work with plaid for bank verification/credentials and integrates with ACH payment processing services like Dwolla. The implementation are relatively the same in terms of using Link object via Plaid. Another difference is payment for the services.


## Useful Links
- https://accounts-sandbox.dwolla.com/
- https://developers.dwolla.com/guides/transfer-money-between-users
- https://developers.dwolla.com/guides/plaid
- https://www.dwolla.com/pricing/
- https://plaid.com/docs/auth/partnerships/dwolla/
- https://plaid.com/docs/api/tokens/#itempublic_tokenexchange
- https://dashboard.plaid.com/team/sandbox


Bare Minimum implementation of POC for Per Diem app.

## To get started:
- Create Sandbox account for both Plaid and Dwolla to access their API
- Obtain and save Client ID for Plaid and Dwolla and save secret/public key in a .env file
- Go to plaid account and select team settings and add Dwolla under Integrations tab to enable the two services to communicate with each other
- npm i in directory to download all dependencies 

## To Run
- node index.js

## API paths
- **/api/dwolla/create-business-customer** : Creates business customer with extra verification fields and returns http link with newly created customer ID that will be added to your Dwolla account under Customer
- **/api/dwolla/create-unverified-funding-source** : Creates a funding source(bank account) capable of only receiving payments, not sending
- **/api/dwolla/create-customer** : Creates regular customer with firstName lastName and email only
- **/api/dwolla-plaid-verified-funding-source** : uses the current users access token and bank account_id to get a processor token to communicate with Dwolla API to be able to verify bank account via Plaid API. This enables us to be able to get a verified banking institution under Dwolla to be able to transfer funds to any verified/unverified banking institution for other users. 
- **/api/create_link_token** : Plaid api link to create a temporary public token and prompts the user to enter their Financial institutions information on Plaids link(need demo to see, essentially it opens a new window for the user to enter their banking credentials) and returns account id/public token on success. Public token can then be exchanged for a permanant access token that should be saved securely on the db for said user
- **/api/exchange_public_token** : exchanges public token for permanent access token 
- **/api/dwolla/transfer-funds** : requires two customer id's from Dwolla so we can transfer funds from one banking institution to the other
