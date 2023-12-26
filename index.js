const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    const paymentFormDataCollection = client.db("buildingManagement").collection("paymentFormData");
    const paymentCollection = client.db("buildingManagement").collection("payments");
    const amenityCollection = client.db("buildingManagement").collection("amenities");
    const teamCollection = client.db("buildingManagement").collection("team");


    
     //::::::::::::::::: jwt related ::::::::::::::::::
     app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    const verifyMember = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isMember = user?.role === 'member';
      if (!isMember) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }


    //::::::::::::::::: user related ::::::::::::::::::
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

    app.get('/users', verifyToken, verifyAdmin, async(req, res) =>{
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.get('/users/members', verifyToken, verifyAdmin, async(req, res) =>{
      const query = { role: "member" };
      const result = await userCollection.find(query).toArray();
      res.send(result)
    })


   
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })


    app.get('/users/member/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let member = false;
      if (user) {
        member = user?.role === 'member';
      }
      res.send({ member });
    })

    // app.patch('/users/:id',  async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   }
    //   const result = await userCollection.updateOne(filter, updatedDoc);
    //   res.send(result);
    // })

    app.patch('/users/accept/:email', verifyToken, verifyAdmin,  async (req, res) => {
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


    app.patch('/users/reject/:email', verifyToken, verifyAdmin, async (req, res) => {
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


    app.patch('/users/remove/:email', verifyToken, verifyAdmin,  async (req, res) => {
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




    //::::::::::::: apartment related :::::::::::::::::
    app.get('/apartmentsCount', async (req, res) => {
      const count = await apartmentCollection.estimatedDocumentCount();
      res.send({ count });
    })

    app.get('/usersCount', async (req, res) => {
      const count = await userCollection.estimatedDocumentCount();
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



    // agreement related
    app.post('/agreements', verifyToken, async(req, res) =>{
      const agreement = req.body;
      console.log(agreement);
      const result = await agreementCollection.insertOne(agreement);
      res.send(result);
    })

    app.get('/agreements', verifyToken, verifyAdmin, async(req, res) =>{
      const result = await agreementCollection.find().toArray();
      res.send(result)
    })


    app.get('/agreements/rented/:email', verifyToken, verifyMember, async(req, res) =>{
      const email = req.params.email;
      const query = { user_email: email };
      const result = await agreementCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/agreements/pay/:email', verifyToken, verifyMember, async(req, res) =>{
      const email = req.params.email;
      const query = { user_email: email };
      const result = await agreementCollection.find(query).toArray();
      res.send(result)
    })


    app.patch('/agreements/accept/:id', verifyToken, verifyAdmin,  async (req, res) => {
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


    app.patch('/agreements/reject/:id', verifyToken, verifyAdmin,  async (req, res) => {
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

    app.patch('/agreements/remove/:email', verifyToken, verifyAdmin,  async (req, res) => {
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

 
     // announcements related
     app.post('/announcements', verifyToken, verifyAdmin, async(req, res) =>{
      const announcement = req.body;
      console.log(announcement);
      const result = await announcementCollection.insertOne(announcement);
      res.send(result);
    })

    app.get('/announcements', verifyToken, async(req, res) =>{
      const result = await announcementCollection.find().toArray();
      res.send(result)
    })


    // coupons related
     app.post('/coupons', verifyToken, verifyAdmin, async(req, res) =>{
      const coupon = req.body;
      console.log(coupon);
      const result = await couponCollection.insertOne(coupon);
      res.send(result);
    })

    app.get('/coupons', verifyToken, verifyAdmin, async(req, res) =>{
      const result = await couponCollection.find().toArray();
      res.send(result)
    })

    app.patch('/coupons/available/:id', verifyToken, verifyAdmin,  async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      console.log(filter)
      const updatedDoc = {
        $set: {
          availability: 'available',
          
        }
      }
      const result = await couponCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.patch('/coupons/unavailable/:id', verifyToken, verifyAdmin,  async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      console.log(filter)
      const updatedDoc = {
        $set: {
          availability: 'unavailable',
          
        }
      }
      const result = await couponCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.get('/coupons/home', async(req, res) =>{
      const query = {availability: 'available'}
      const result = await couponCollection.find(query).toArray();
      res.send(result)
    })

    

    app.get('/coupons/appliedCode', verifyToken, verifyMember, async (req, res) => {
      
      const filter = req.query;
      console.log(filter)
      const query = {
              
        code: filter.code
      }
      console.log(query)
      const result = await couponCollection.findOne(query);
      res.send(result);
    })



    // paymentFormData related
    app.post('/paymentFormData', verifyToken, verifyMember, async(req, res) =>{
      const paymentFormData = req.body;
      console.log(paymentFormData);
      const result = await paymentFormDataCollection.insertOne(paymentFormData);
      res.send(result);
    })

    app.get('/paymentFormData/:email', verifyToken, verifyMember, async(req, res) =>{
      const email = req.params.email;
      const query = { user_email: email };
      const result = await paymentFormDataCollection.findOne(query);
      res.send(result)
    })



    // payments related
    app.post('/create-payment-intent', async (req, res) => {
      const { amountToPay } = req.body;
      // console.log('in intent', amountToPay)
      const amount = parseInt(amountToPay * 100);
      

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'BDT',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });


    app.post('/payments', verifyToken, verifyMember, async(req, res) =>{
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      const query = {user_email: payment.email};
      const deleteResult = await paymentFormDataCollection.deleteOne(query);

      res.send({paymentResult, deleteResult})
    })


    app.get('/payments', verifyToken, verifyMember, async (req, res) => {
      
      const filter = req.query;
      console.log(filter)
      const query = {
        email: filter.email,
        month: {$regex: filter.search, $options: 'i'}
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })


    // amenities

    app.get('/amenities',  async(req, res) =>{
      const result = await amenityCollection.find().toArray();
      res.send(result)
    })

    
    // team
    app.get('/team', async(req, res) =>{
      const result = await teamCollection.find().toArray();
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