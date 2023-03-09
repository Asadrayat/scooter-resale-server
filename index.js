const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nkyrz6w.mongodb.net/?retryWrites=true&w=majority`;

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    console.log(token);

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const catagoriesCollection = client.db('ScooterDb').collection('category');
        const lowBudgetCollection = client.db('ScooterDb').collection('lowBudget');
        const midBudgetCollection = client.db('ScooterDb').collection('midBudget');
        const highBudget = client.db('ScooterDb').collection('highBudget');
        const usersCollection = client.db('ScooterDb').collection('users');
        const bookingsCollection = client.db('ScooterDb').collection('bookings');
        const productsCollection = client.db('ScooterDb').collection('products');
        const verifyAdmin = async (req, res, next) => {
            // console.log('inside verify admin', redecoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }
        app.get('/catagoryOptions', async (req, res) => {
            const query = {};
            const result = await catagoriesCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/lowbudget', async (req, res) => {
            const query = {};
            const result = await lowBudgetCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/midbudget', async (req, res) => {
            const query = {};
            const result = await midBudgetCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/highbudget', async (req, res) => {
            const query = {};
            const result = await highBudget.find(query).toArray();
            res.send(result);
        });
        app.get('/catagoryOptions/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const catagories = await catagoriesCollection.findOne(query);
            res.send(catagories);
        });
        app.get('/products', async (req, res) => {
            const query = {}
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        app.delete('/products/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })
        app.get('/bookingSpeciality', async (req, res) => {
            const query = {};
            const result = await catagoriesCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.delete('/users/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = { _id:new ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            // console.log(result);
            res.send(result);
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            return res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            return res.send({ isSeller: user?.role === 'seller' });
        })
        app.get('/users/user/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email }
            const user = await usersCollection.findOne(query);
            return res.send({ isUser: user?.role === 'user' });
        })
        app.put('/users/admin/:id',  async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            return res.send(result);
        })
        app.get('/bookings',verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });


    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('recycle scooter server is running');
})

app.listen(port, () => console.log(`Recycle scooter is running on ${port}`))