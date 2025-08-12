import express from 'express';
import {upload} from '/multer.js'
import {protect} from '/auth.js'
import {getstories, addstory} from '/storyController.js'

const storyRouter = express.Router();

storyRouter.post('/create', upload.single('media'),protect,addstory)
storyRouter.get('/get',protect,getstories);

export default storyRouter;  //export the router to use in other files.  //export default storyRouter
