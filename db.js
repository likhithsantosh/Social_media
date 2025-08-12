import mongoose from 'mongoose';

const connectDB = async () => {
    try{
        mongoose.connection.on('connected',() => 
            console.log('MongoDB connected successfully'))
        
        await mongoose.connect(process.env.MONGODB_URI)
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process with failure
    }
}
export default connectDB;  // Export the connectDB function