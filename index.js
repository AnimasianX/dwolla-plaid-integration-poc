require("dotenv").config();
const cors= require("cors");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");


const {
    Configuration,
    PlaidEnvironments,
    PlaidApi,
    ProcessorTokenCreateRequest,
} = require("plaid");


const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
    // FOR DEMO PURPOSES ONLY
    // Use an actual secret key in production
    session({ secret: "bosco", saveUninitialized: true, resave: true })
  );


const Client = require("dwolla-v2").Client;

const dwolla = new Client({
    environment: "sandbox",
    key: process.env.DWOLLA_APP_KEY,
    secret: process.env.DWOLLA_APP_SECRET,
});


//plaid SDK
const plaidConfig = new Configuration({
    basePath: PlaidEnvironments['sandbox'],
    baseOptions:{
        headers:{
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
            "PLAID-SECRET": process.env.PLAID_SECRET,
            "Plaid-Version": "2020-09-14"
        }
    }
});

const plaidClient = new PlaidApi(plaidConfig);

//Routes

//when user signs up
app.post("/create-business-customer", async(req,res)=>{
    let requestBody = {
        firstName: "Jane",
        lastName: "Merchant",
        email: "solePropBusiness@email.com",
        ipAddress: "143.156.7.8",
        type: "business",
        dateOfBirth: "1980-01-31",
        ssn: "6789",
        address1: "99-99 33rd St",
        city: "Some City",
        state: "NY",
        postalCode: "11101",
        businessClassification: "9ed3f670-7d6f-11e3-b1ce-5404a6144203",
        businessType: "soleProprietorship",
        businessName: "Jane Corp",
        ein: "00-0000000",
    }

    await dwolla
    .post("customers", requestBody)
    .then((res) => console.log(res.headers.get("location")))
    .catch(error=> console.log(error.message));
})

//When user signs up
app.post("/create-unverified-funding-source", async (req,res)=>{// can only receive funds not send.
    let customerUrl = "https://api-sandbox.dwolla.com/customers/b3016d7d-2c5e-4141-b0ff-e0bcbadcb31d";

    let requestBody={
        routingNumber: "222222226",
        accountNumber: "123456789",
        bankAccountType: "checking",
        name: "Jane Merchant",
    };

    await dwolla.post(`${customerUrl}/funding-sources`, requestBody)
    .then((res)=> console.log(res.headers.get("location")))
}) 

//when user signs up
app.get("/create-buyer", async (req,res)=>{
    let requestBody={
        firstName: "Joe",
        lastName: "Buyer",
        email: "jbuyer@mail.net",
        ipAddress: "99.99.99.99",
    };

     await dwolla.post("customers", requestBody)
    .then((res)=>console.log(res.headers.get("location")));

});


//after user signs up and wants to add bank account info to their account
app.post("/create-verified-funding-source", (req,res)=>{
    let customerUrl = 
        "https://api-sandbox.dwolla.com/customers/37606f4a-723a-4d37-ad62-2829958b4103";
    let requestBody={
        plaidToken:"public-sandbox-f294a054-5c95-4be8-bf39-f82a09f2dc59",
        name: "Joe Buyers Checking",
    }

    dwolla.post(`${customerUrl}/funding-sources`, requestBody)
    .then((res)=> res.headers.get("location"));
})



//plaid home page/test Link Client
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//oauth support but didnt add yet
app.get("/oauth", async (req, res) => {
  res.sendFile(path.join(__dirname, "oauth.html"));
});

//Creates a Link token and return it
app.get("/api/create_link_token", async (req, res, next) => {
  const tokenResponse = await plaidClient.linkTokenCreate({
    user: { client_user_id: req.sessionID },
    client_name: "Plaid's Tiny Quickstart",
    language: "en",
    products: ["auth"],
    country_codes: ["US"],
    redirect_uri: process.env.PLAID_SANDBOX_REDIRECT_URI,
  });
  res.json(tokenResponse.data);
});


// Exchanges the public token from Plaid Link for an access token
app.post("/api/exchange_public_token", async (req, res, next) => {
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: req.body.public_token,
  });

  // FOR DEMO PURPOSES ONLY
  // Store access_token in DB instead of session storage
  req.session.access_token = exchangeResponse.data.access_token; // need to look for a way to safely store this in db
  console.log(req.session.access_token);
  res.json(true);
});


// Fetches balance data using the Node client library for Plaid
app.get("/api/data", async (req, res, next) => {
  const access_token = req.session.access_token;
  const balanceResponse = await plaidClient.accountsBalanceGet({ access_token });
  res.json({
    Balance: balanceResponse.data,
  });
});

// Checks whether the user's account is connected, called
// in index.html when redirected from oauth.html
app.get("/api/is_account_connected", async (req, res, next) => {
  return (req.session.access_token ? res.json({ status: true }) : res.json({ status: false}));
});


//Verifies bank with dwolla and adds it as a verified funding source in dwolla so that current user can
//send AND receive money.
app.post("/api/connect_dwolla_with_plaid", async(req,res)=>{
    try{
        const accessToken = req.session.access_token;

        const request = {
            access_token: accessToken,
            account_id: req.body.accountID,
            processor: 'dwolla',
        };

        const processorTokenResponse = await plaidClient.processorTokenCreate(
            request,
        );
        const processorToken = processorTokenResponse.data.processor_token;
        console.log("Processor token:");
        console.log(processorToken);

        var customerUrl = "https://api-sandbox.dwolla.com/customers/37606f4a-723a-4d37-ad62-2829958b4103";
        var requestBody = {
            plaidToken: processorToken,
            name: "Joe Buyer’s Checking",
        };

    dwolla
        .post(`${customerUrl}/funding-sources`, requestBody)
        .then((res) => res.headers.get("location"));
    }catch(error){
        console.log(error);
    }

    res.json(true);
});

app.post("/api/transfer-funds", (req,res)=>{
    var requestBody = {
        _links: {
          source: {
            href:
              "https://api-sandbox.dwolla.com/funding-sources/fb60bea3-59be-4429-9be5-0078f26bd6ee",//Joe
          },
          destination: {
            href:
              "https://api-sandbox.dwolla.com/funding-sources/27fd20a5-31e2-4b04-9b1d-f90a038f78b4",//Jane
          },
        },
        amount: {
          currency: "USD",
          value: "225.00",
        },
      };
      
      // For Dwolla API applications, an dwolla can be used for this endpoint. (https://developers.dwolla.com/api-reference/authorization/application-authorization)
      dwolla
        .post("transfers", requestBody)
        .then((res) => res.headers.get("location"));
})

app.listen(8000, ()=>{
    console.log("Server listening on port 8000");
})