import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import app from './app.js';


// Connect to database then start server
const connectionString=process.env.MONGO_URI;
mongoose.connect(connectionString).then(()=>{
  console.log("Connected to MongoDB");
}).catch((error)=>{
  console.log("Error connecting to MongoDB",error);
}
);
app.listen(5000, () => {
  console.log("Server running in port 5000");
});