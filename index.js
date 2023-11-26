const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcynqnr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const apartmentCollection = client.db("buildingManagement").collection("apartments");
    const agreementCollection = client.db("buildingManagement").collection("agreements");

    app.get('/apartmentsCount', async (req, res) => {
      const count = await apartmentCollection.estimatedDocumentCount();
      res.send({ count });
    })

    app.get('/apartments', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      // console.log(page, size)
      const result = await apartmentCollection.find()
      .skip(page * size)
      .limit(size)
      .toArray();
      res.send(result);
    });

    app.post('/agreements', async(req, res) =>{
      const agreement = req.body;
      console.log(agreement);
      const result = await agreementCollection.insertOne(agreement);
      res.send(result);
    })













    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) =>{
    res.send("Building management server is running.")
})

app.listen(port, () =>{
    console.log(`Building management is running on port ${port}`)
})