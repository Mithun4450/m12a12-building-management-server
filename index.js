const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



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
    

    const apartmentCollection = client.db("buildingManagement").collection("apartments");
    const agreementCollection = client.db("buildingManagement").collection("agreements");
    const userCollection = client.db("buildingManagement").collection("users");
    const announcementCollection = client.db("buildingManagement").collection("announcements");
    const couponCollection = client.db("buildingManagement").collection("coupons");
    

    app.get('/apartmentsCount', async (req, res) => {
      const count = await apartmentCollection.estimatedDocumentCount();
      res.send({ count });
    })

    // apartment related 
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



    // agreement related
    app.post('/agreements', async(req, res) =>{
      const agreement = req.body;
      console.log(agreement);
      const result = await agreementCollection.insertOne(agreement);
      res.send(result);
    })

    app.get('/agreements', async(req, res) =>{
      const result = await agreementCollection.find().toArray();
      res.send(result)
    })


    app.get('/agreements/rented/:email', async(req, res) =>{
      const email = req.params.email;
      const query = { user_email: email };
      const result = await agreementCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/agreements/pay/:email', async(req, res) =>{
      const email = req.params.email;
      const query = { user_email: email };
      const result = await agreementCollection.find(query).toArray();
      res.send(result)
    })


    app.patch('/agreements/accept/:id',  async (req, res) => {
      const agreement_accept_date = req.body.agreement_accept_date;
      console.log(agreement_accept_date)
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      console.log(filter)
      const updatedDoc = {
        $set: {
          status: 'checked',
          role: 'member',
          agreement_accept_date
        }
      }
      const result = await agreementCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.patch('/agreements/reject/:id',  async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      console.log(filter)
      const updatedDoc = {
        $set: {
          status: 'checked',
          role: 'user'
        }
      }
      const result = await agreementCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.patch('/agreements/remove/:email',  async (req, res) => {
      const email = req.params.email;
      
      const filter = { user_email: email };
      console.log(filter)
      const updatedDoc = {
        $set: {
          
          role: 'user'
        }
      }
      const result = await agreementCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    

    // user related
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async(req, res) =>{
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.get('/users/members', async(req, res) =>{
      const query = { role: "member" };
      const result = await userCollection.find(query).toArray();
      res.send(result)
    })


   
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })


    app.get('/users/member/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let member = false;
      if (user) {
        member = user?.role === 'member';
      }
      res.send({ member });
    })

    app.patch('/users/:id',  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.patch('/users/accept/:email',  async (req, res) => {
      const email = req.params.email;
      
      const filter = { email: email };
      console.log(filter)
      const updatedDoc = {
        $set: {
          
          role: 'member'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.patch('/users/reject/:email',  async (req, res) => {
      const email = req.params.email;
      
      const filter = { email: email };
      console.log(filter)
      const updatedDoc = {
        $set: {
          
          role: 'user'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.patch('/users/remove/:email',  async (req, res) => {
      const email = req.params.email;
      
      const filter = { email: email };
      console.log(filter)
      const updatedDoc = {
        $set: {
          
          role: 'user'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })





     // announcements related
     app.post('/announcements', async(req, res) =>{
      const announcement = req.body;
      console.log(announcement);
      const result = await announcementCollection.insertOne(announcement);
      res.send(result);
    })

    app.get('/announcements', async(req, res) =>{
      const result = await announcementCollection.find().toArray();
      res.send(result)
    })


    // coupons related
     app.post('/coupons', async(req, res) =>{
      const coupon = req.body;
      console.log(coupon);
      const result = await couponCollection.insertOne(coupon);
      res.send(result);
    })

    app.get('/coupons', async(req, res) =>{
      const result = await couponCollection.find().toArray();
      res.send(result)
    })

    app.get('/coupons/home', async(req, res) =>{
      const result = await couponCollection.find().toArray();
      res.send(result)
    })


     
    // Send a ping to confirm a successful connection
    
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