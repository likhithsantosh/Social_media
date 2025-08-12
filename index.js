import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { serve } from 'inngest';
import connectDB from './config/db.js';

// Inngest
import { inngest, functions } from './inngest/Server.js';

// Routes
import userRouter from './routes/userroutes.js';
import postRouter from './routes/postroutes.js';
import storyRouter from './routes/storuroutes.js';
import messageRouter from './routes/messageroutes.js';

const app = express();

// Connect to Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/story', storyRouter);
app.use('/api/message', messageRouter);

// Start Server (for local development only)
app.listen(3000, () => {
        console.log('Server running on port 3000');
    });

// For Vercel (export handler)
export default app;
