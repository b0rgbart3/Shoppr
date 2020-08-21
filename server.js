const express = require("express");
const routes = require("./routes");
// for integrating app with google AI Vision localized Object
const vision = require('@google-cloud/vision');
const fs = require('fs');
global.__basedir = __dirname;

// For saving session data as cookies
var session = require("express-session");
// Requiring passport as we've configured it
// This is authentication middlewear
var passport = require("./config/passport");
var db = require("./models");

const PORT = process.env.PORT || 3001;

// This is our Express App creation
const app = express();

// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// We need to use sessions to keep track of our user's login status
app.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));

// Configure Passport-- for authentication (only required on certain components)
// Initializing our passport middlewear
app.use(passport.initialize());
// using passport to create a session
app.use(passport.session());

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}


// Here are our Routes
app.use(routes);

//Logic to connect to Google AI
async function extractObjectFromImageBlob() {
  // pass image path here
  const client = new vision.ImageAnnotatorClient();
  const gcsUri = `./Assets/test.jpg`;

  //const gcsUri = `https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSbh3pPT5LZ--CNMCgz0vMJp4_d-yernWmHRA&usqp=CAU`;

  const [result] = await client.objectLocalization(gcsUri);
  const objects = result.localizedObjectAnnotations;
  objects.forEach(object => {
    console.log(`Name: ${object.name}`);
    console.log(`Confidence: ${object.score}`);
    const veritices = object.boundingPoly.normalizedVertices;
    veritices.forEach(v => console.log(`x: ${v.x}, y:${v.y}`));
  });
}

async function extractObjectFromImageURL() {
  // [START vision_localize_objects_gcs]
  // Imports the Google Cloud client libraries

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  /**
   * TODO(developer): Uncomment the following line before running the sample.
   */
   const gcsUri = `https://cloud.google.com/vision/docs/images/bicycle_example.png`;

  const [result] = await client.objectLocalization(gcsUri);
  const objects = result.localizedObjectAnnotations;
  objects.forEach(object => {
    console.log(`Name: ${object.name}`);
    console.log(`Confidence: ${object.score}`);
    const veritices = object.boundingPoly.normalizedVertices;
    veritices.forEach(v => console.log(`x: ${v.x}, y:${v.y}`));
  });
  // [END vision_localize_objects_gcs]
}

// For test
//extractObjectFromImageURL();

// Syncing our database and logging a message to the user upon success
db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
});

// Start our Node APP 
app.listen(PORT, () => {
  console.log("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
});




