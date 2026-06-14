
console.log("SERVER VERSION 2");
const express = require("express");
const cors = require("cors");

const { initializeApp, cert } =
require("firebase-admin/app");

const { getDatabase } =
require("firebase-admin/database");

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT environment variable not found"
  );
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);
initializeApp({
  credential: cert(serviceAccount),

  databaseURL:
  "https://bee-hive-e4a1f-default-rtdb.europe-west1.firebasedatabase.app"
});


const db = getDatabase();

const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Home Page

app.get("/", (req, res) => {


  res.json({

    status: "online",

    server: "Bee Hive Proxy Server",

    port: PORT,

    database: "connected"

  });

});

// Ping Test Route

app.get("/ping", (req, res) => {

  res.json({
    success: true,
    message: "Server Alive"
  });

});

// SIM800L Test Route

app.get("/simtest", (req, res) => {

  res.send("SIM800 OK");

});


app.get("/testhive", async (req, res) => {
  try {

    await db.ref("hives/Hive01").set({
      temperature: 9,
      humidity: 6,
      weight: 52,
      status: "online"
    });

    const snapshot =
      await db.ref("hives/Hive01").get();

    res.json({
      success: true,
      data: snapshot.val()
    });

  } catch(error) {

    res.json({
      success: false,
      error: error.message
    });

  }
});

app.get("/sendtest", async (req, res) => {

  try {

    const hiveID = "Hive02";

    await db.ref(`hives/${hiveID}`).set({

      temperature: 36.5,

      humidity: 71.3,

      weight: 44.8,

      status: "online",

      lastUpdate: Date.now()

    });

    await db
      .ref(`history/${hiveID}/${Date.now()}`)
      .set({

        temperature: 36.5,

        humidity: 71.3,

        weight: 44.8

      });

    res.json({
      success: true
    });

  } catch(error) {

    res.json({
      success: false,
      error: error.message
    });

  }

});

app.get("/posttest", async (req, res) => {

  const hiveID = "Hive03";

  await db.ref(`hives/${hiveID}`).set({

    temperature: 33.8,
    humidity: 69.5,
    weight: 41.2,
    status: "online",
    lastUpdate: Date.now()

  });

  await db
    .ref(`history/${hiveID}/${Date.now()}`)
    .set({

      temperature: 33.8,
      humidity: 69.5,
      weight: 41.2

    });

  res.send("Hive03 Added");

});

// Receive Hive Data

app.post("/api/hive", async (req, res) => {

  try {

    const {
      hiveID,
      temperature,
      humidity,
      weight
    } = req.body;

    if (!hiveID) {

      return res.status(400).json({
        success: false,
        message: "Missing Hive ID"
      });

    }

    // Save Live Data

    await db.ref(`hives/${hiveID}`).set({

      temperature,

      humidity,

      weight,

      status: "online",

      lastUpdate: Date.now()

    });

    // Save Historical Data

    await db
      .ref(`history/${hiveID}/${Date.now()}`)
      .set({

        temperature,

        humidity,

        weight

      });

    console.log(
      `Received data from ${hiveID}`
    );

    res.json({

      success: true,

      hiveID

    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({

      success:false,

      error:error.message

    });

  }

});

// Offline Detection

setInterval(async ()=>{

  try{

    const snapshot =
    await db.ref("hives").get();

    const hives =
    snapshot.val();

    if(!hives) return;

    const now =
    Date.now();

    for(const hiveID in hives){

      const hive =
      hives[hiveID];

      if(
        now - hive.lastUpdate >
        300000
      ){

        await db
        .ref(`hives/${hiveID}`)
        .update({

          status:"offline"

        });

      }

    }

  }

  catch(error){

    console.log(error);

  }

},60000);
app.get("/routes", (req, res) => {

  res.json({
    routes: [
      "/",
      "/ping",
      "/testhive",
      "/api/hive"
    ]
  });

});
console.log("NEW VERSION LOADED");


app.listen(PORT, () => {

  console.log(
    `Bee Hive Proxy Server Running on ${PORT}`
  );

});
