import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

//Connect to the DB
const mongoUrl = `mongodb://localhost:27017/mtgtracker`;
const db = () : mongoose.Connection  => {
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
    return db
}



export default db