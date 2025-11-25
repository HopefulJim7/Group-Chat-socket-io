const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_PRODUCTION, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB Connected")
    } catch (error) {
        console.error("MongoDB connection Error", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;