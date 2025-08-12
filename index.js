import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { inngest, functions } from './inngest/Server.js'
import { clerkMiddleware } from '@clerk/express';
import connectDB from './config/db.js';
import {serve} from 'inngest/express'
import userRouter from './routes/userroutes.js';
import postRouter from './routes/postroutes.js';
import storyRouter from  './routes/storuroutes.js';
import messageeRouter from './routes/messageroutes.js';

const app = express();
await connectDB();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/inneget', serve({client: inngest, functions}));
app.use('/api/user', userRouter)
app.use('/api/post',postRouter);
app.use('/api/story', storyRouter)
app.use('/api/message', messageeRouter);

app.listen(3000,()=>{
    console.log('server is running on port 3000');
});


