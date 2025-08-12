import express from 'express';
import {upload} from '../config/multer.js'
import {protect} from '../middleware/auth.js'
import {addpost, getposts, likepost} from '../controller/postController.js'

const postRouter = express.Router()

postRouter.post('/add',upload.array('images',4),protect,addpost);
postRouter.get('/feed',protect, getposts);
postRouter.put('/like',protect, likepost);

export default postRouter