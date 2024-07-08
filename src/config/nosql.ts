import mongoose from "mongoose";
import bluebird from "bluebird";
export type connectType = {
  mongoUrl: string;
  mongoDB: string;
};
const connectDB = async ({ mongoUrl, mongoDB }: connectType) => {
  mongoose.set("strictQuery", true);
  mongoose.Promise = bluebird;
  try {
    const conn = await mongoose.connect(mongoUrl, {
      dbName: mongoDB,
    });
    console.log(
      `Data base connected : ${conn.connection.host}@${conn.connection.name}`
    );
  } catch (error) {
    console.log(
      `MongoDB connection error. Please make sure MongoDB is running. ${error}`
    );
    process.exit(1);
  }
  mongoose.connection.on("disconnected", () => {
    console.log("Test script connected to database");
    connectReload({
      mongoUrl,
      mongoDB,
    });
  });
};
export const connectReload = async ({ mongoUrl, mongoDB }: connectType) => {
  mongoose.set("strictQuery", true);
  mongoose.Promise = bluebird;
  try {
    const conn = await mongoose.connect(mongoUrl, {
      dbName: mongoDB,
    });
    console.log(
      `Data base connected : ${conn.connection.host}@${conn.connection.name}`
    );
  } catch (error) {
    console.log(
      `MongoDB connection error. Please make sure MongoDB is running. ${error}`
    );
  }
};
export default connectDB;
