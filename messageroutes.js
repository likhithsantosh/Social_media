import express from 'express';
import {upload} from '/multer.js'
import {protect} from '/auth.js'
import { ssecontroller, sendmessage, getchatmessages, getuserrecentmessages } from '/messageController.js';

const messageeRouter = express.Router();

messageeRouter.post('/send', upload.single('image'),protect,sendmessage)
messageeRouter.get('/:userId', ssecontroller);
messageeRouter.post('/get',protect, getchatmessages);

export default messageeRouter;  //export the router
