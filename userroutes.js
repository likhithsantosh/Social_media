import express from 'express';
import {protect} from '../middleware/auth.js';
import {getUserData, updateUserData, discoverusers, followuser, unfollowuser, sendConnectionRequest, getUserConnections,acceptConnection,getProfiles} from '../controller/userController.js';
import {upload} from '../config/multer.js'
import { getuserrecentmessages } from '../controller/messageController.js';

const userRouter = express.Router();

userRouter.get('/data',protect, getUserData);
userRouter.post('/update',upload.fields([{name:'profile', maxCount: 1}, {name:'cover', maxCount:1}]),protect, updateUserData);
userRouter.post('/discover',protect,discoverusers);
userRouter.post('/follow',protect,followuser);
userRouter.post('/unfollow',protect,unfollowuser)
userRouter.post('/sendrequest',protect,sendConnectionRequest);
userRouter.get('/connections',protect,getUserConnections);
userRouter.post('/acceptrequest',protect,acceptConnection);
userRouter.get('/getprofiles',protect,getProfiles);
userRouter.get('/getrecentmessages',protect,getuserrecentmessages);

export default userRouter;  //export the router to use in other files.  //export default userRouter
