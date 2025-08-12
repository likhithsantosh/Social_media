import express from 'express';
import {upload} from '../config/multer.js'
import {protect} from '../middleware/auth.js'
import {getstories, addstory} from '../controller/storyController.js'

const storyRouter = express.Router();

storyRouter.post('/create', upload.single('media'),protect,addstory)
storyRouter.get('/get',protect,getstories);

export default storyRouter;  //export the router to use in other files.  //export default storyRouter