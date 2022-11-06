const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@genius-car.twghhbw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    console.log("DB connected successfully");
  } catch (error) {
    console.error(error.message);
  }
};
run();

const Services = client.db("geniusCar").collection("service");
const Orders = client.db("geniusCar").collection("order");

app.get("/", (req, res) => {
  res.send("Genius car server is running successfully.");
});

//first simple GET for all services
app.get("/services", async (req, res) => {
  try {
    const services = Services.find({});
    const result = await services.toArray();
    res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// special GET for checkout product
app.get("/checkout/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Services.findOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//API for post data into server
app.post("/orders", async (req, res) => {
  try {
    const order = req.body;
    const result = await Orders.insertOne(order);
    res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

app.get("/orders", verifyJWT, async (req, res) => {
  try {
    const decoded = req.decoded;
    console.log(decoded);
    let query = {};
    if (decoded.email !== req.query.email) {
      res.status(403).send({ massage: "Unauthorized access" });
    }
    if (req.query?.email) {
      query = { email: req.query?.email };
    }
    const orders = await Orders.find(query).toArray();
    // const result = await orders.toArray();
    res.send({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error(err);
    res.send({
      success: false,
      error: err.message,
    });
  }
});

app.patch("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // const status = req.body.status;
    // const doc = { $set: { status } };
    const updated = await Orders.updateOne(
      { _id: ObjectId(id) },
      { $set: { status: req.body.status } }
    );
    if (updated.matchedCount) {
      res.send({
        success: true,
        data: updated,
      });
    }
  } catch (err) {
    console.log(err);
    res.send({
      success: false,
      error: err.message,
    });
  }
});

app.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Orders.deleteOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.send({
      success: false,
      error: ere.message,
    });
  }
});

// token
app.post("/jwt", (req, res) => {
  try {
    const userInfo = req.body;
    const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    res.send({ token });
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log("Genius car server is running on port ", port);
});
