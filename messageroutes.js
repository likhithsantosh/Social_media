import express from 'express';
import {upload} from '../config/multer.js'
import {protect} from '../middleware/auth.js'
import { ssecontroller, sendmessage, getchatmessages, getuserrecentmessages } from '../controller/messageController.js';

const messageeRouter = express.Router();

messageeRouter.post('/send', upload.single('image'),protect,sendmessage)
messageeRouter.get('/:userId', ssecontroller);
messageeRouter.post('/get',protect, getchatmessages);

export default messageeRouter;  //export the router