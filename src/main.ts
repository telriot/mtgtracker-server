import dotenv from "dotenv";
import express from "express";
import path from "path";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { onError, onListening } from "utils/handlers";
import http from "http";
import cors from "cors";
import indexRouter from "routes/index";
import collectionsRouter from "routes/collections";

dotenv.config();
const app = express();
const mongoLocal = "mongodb://localhost:27017/mtgtracker";

app.use(
    cors({
        origin: "http://localhost:3000",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // allow session cookie from browser to pass through
        exposedHeaders: ["x-auth-token"],
    })
);

//Connect to the DB
const mongoUrl =
    process.env.NODE_ENV === "test"
        ? mongoLocal
        : process.env.MONGO_URI || mongoLocal;
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("DB Connected");
});
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

//Local environment
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../../mtgtracker-client/public")));

if (!process.env.SESSION_SECRET) throw new Error("No session secret found");
// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl }),
    })
);
//Create Routes

app.use("/api", indexRouter);
app.use("/api/collections", collectionsRouter);

// Prepare Production Settings

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "..", "..", "client", "build", "index.html"));
//   });
// }

// Get port from environment and store in Express.
const port = process.env.PORT || "5000";
app.set("port", port);
const server = http.createServer(app);

server.listen(port);
server.on("error", (error) => onError(error, port));
server.on("listening", () => onListening(server));
export default app;
