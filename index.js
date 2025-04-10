const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const { v4: uuidv4 } = require('uuid');
var cors = require('cors');
app.use(cors());

//let message = 'No message received yet';
let messages = [];

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON payloads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve the HTML page
app.get('/', (req, res) => {
    res.render('index', { messages });
});
app.get('/api-list', (req, res) => {
    res.status(200).send({ status: true, messages });
});

//Serve the API details page. 

app.get('/api-details', (req, res) => {
    res.render('api-details', { messages });
});

// Handle (Webhook) POST requests
app.post('/webhook', (req, res) => {
    try {
        const payload = req.body;

        let message = payload; // Update the message
        message.id = uuidv4();
        message.updatedOn = new Date().getTime();
        messages.push(message); // Store the message in the array

        console.log('Received payload:', message);

        res.render("index", { messages });
    } catch (error) {
        console.error('Error processing payload:', error.message);
        res.status(400).send({ status: 'error', message: error.message });
    }
});

//Handle form submission when API request access is clicked. 

app.post('/request-access', (req, res) => {
    console.log('API request button clicked!');

    var workflowURL = "https://la-gdx-poc.azurewebsites.net:443/api/api-approval/triggers/When_a_HTTP_request_is_received/invoke?api-version=2022-05-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=bHgoXK0tnkobxKE0Gw0Fuh5d-NUqHF0VXyaYQuH04no";
    let jsonMessage = {};
    jsonMessage.Requester = req.body.APIRequester; // Get the requester from the form
    jsonMessage.APIRequested = req.body.APIRequested; // Get the API requested from the form
    jsonMessage.Justification = req.body.Justification; // Get the justification from the form
    jsonMessage.APIProvider = req.body.APIProvider; // Get the API provider from the form
    jsonMessage.GDXApprover = "gdxadmin@qdf.gov.qa"; // Get the GDX approver from the form
    jsonMessage.APIProviderEmail = req.body.APIProviderEmail; // Get the callback URL from the form

    console.log('JSON message:', jsonMessage);


    axios.post(workflowURL, jsonMessage)
        .then(response => {
            console.log('Response from callback URL:', response.data);
        })
        .catch(error => {
            console.error('Error posting to callback URL:', error.message);
        });

    var requestMessage = "API request is submitted.";
    res.render("api-details", { requestMessage }); // Render the updated messages
});

//Handle form submission when button is clicked. This is a POST request to the server when the button is clicked.
app.post('/approve-request', (req, res) => {
    console.log('Button clicked!:  ' + req.body.index);
    let index = messages.findIndex(msg => msg.id == req.body.index); // Get the index of the message to approve
    let message = messages[index]; // Get the message to approve

    //Add additional fields to the message. 
    message.Approver = "GDXAdmin";
    message.IsApproved = true;

    callbackURL = message.callbackURL; // Get the callback URL from the message
    console.log('Callback URL:', callbackURL);

    //post the JSON message to the callback URL.

    axios.post(callbackURL, message)
        .then(response => {
            console.log('Response from callback URL:', response.data);
        })
        .catch(error => {
            console.error('Error posting to callback URL:', error.message);
        });

    messages.pop(index); // Remove the message from the array
    //console.log('Updated messages:', messages);
    res.render("index", { messages }); // Render the updated messages
});

//Error handling middleware.
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).send({ status: 'error', message: 'Internal server error' });
});

//Start the server.
//Use port 3000 unless there exists a preconfigured port
var port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server is running on ' + port);
});