'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const address = require('./store.json')
const { v4: uuid } = require("uuid");
const users = require('./store.json');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

// standard middleware
app.use(morgan(morganOption));
app.use(helmet());
// this allows us to run a react server and our node server at the same time and they can work together
app.use(cors());
// this is the body parser that is part of express and needed to parse any request
app.use(express.json());

// this is validation function for api validations
function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  console.log(apiToken);
  // the authToken always returns with the word 'Bearer'
  const authToken = req.get("Authorization");
  // we want to remote the 'Bearer' with a split
  const realToken = authToken.split(" ")[1];

  if (!authToken || realToken !== apiToken) {
    console.log('this is the authToken given to us', authToken.split(" ")[1], 'this is the authToken without being split', authToken);
    return res.status(401).json({ error: "Unauthorized request" });
  }
  // move to the next middleware
  next();
}


// routes
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

function handleGetRequest(req, res) {
  let response = address;
  res.json(response);
}

app.get("/address", handleGetRequest,);

function handlePostRequest(req, res) {
  console.log(req.body)
  

  const { firstName, lastName, address1, city, state, zip} = req.body
  
  if ( !firstName || !lastName || !address1 || !city || !state || !zip) {
    return res
      .status(400)
      .send('first name, last name, address, city, state and zip are all required fields');
  }

  if (state.length !== 2) {
    return res
      .status(400)
      .send('The state must be abbreviated to 2 characters');
  }
  
  if (zip.toString().length !== 5) {
    return res
      .status(400)
      .send('The zip code must be 5 numbers long');
  }

  if (typeof zip !== 'number') {
    return res
      .status(400)
      .send(`The zip code must be a number value, characters are not allowed, you typed ${zip} and it is a ${typeof zip}`);
  }

  const newAddress = { id: uuid(), ...req.body }
  users.push(newAddress);
  console.log(req.body)
  return res 
    .send(newAddress)
}

app.post('/address', validateBearerToken, handlePostRequest);


function handelDeleteRequest(req , res) {
  const { id } = req.params;
  const index = users.findIndex(x => x.id === id)

  if (index < 0) {
    return res
      .status(404)
      .send('User not found');
  }

  const deletedUser = users.splice(index, 1);


  return res  
    .status(200)
    .json({ message: "target users has been deleted", user: deletedUser})


}

app.delete("/address/:id", validateBearerToken, handelDeleteRequest);



// error handlers
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error, internal error please submit a bug report' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});



module.exports = app;
