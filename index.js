const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();

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

// Handle (Webhook) POST requests
app.post('/webhook', (req, res) => {
    try {
        const payload = req.body;

        let  message = payload; // Update the message
        messages.push(message); // Store the message in the array
       
        console.log('Received payload:', message);

        res.render("index",  { messages });
    } catch (error) {
        console.error('Error processing payload:', error.message);
        res.status(400).send({ status: 'error', message: error.message });
    }
});

//Handle form submission when button is clicked. This is a POST request to the server when the button is clicked.
app.post('/approve-request', (req, res) => {
    console.log('Button clicked!:  ' + req.body.index);
    let index = req.body.index; // Get the index of the message to approve
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
    console.log('Server is running on '+ port);
});