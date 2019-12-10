import express from "express";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "/build")));
// app.get("/hello", (req, res) => {
//   res.send("hello");
// });
// app.post("/hello", (req, res) => {
//   res.send(`Hello ${req.body.name}`);
// });
// app.get("/hello/:name", (req, res) => {
//   res.send(`Hello ${req.params.name}`);
// });
const withDB = async function(operations) {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true
    });
    const db = client.db("my-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async db => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  });
});
app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async db => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { upvotes: articleInfo.upvotes + 1 } }
      );
    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticle);
  });
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;
  withDB(async db => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text })
        }
      }
    );
    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).send(updatedArticle);
  });
});
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
