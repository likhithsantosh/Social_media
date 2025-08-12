import fs from "fs";
import imageKit from "../config/imageKit.js";
import Story from "../model/Story.js";
import User from "../model/User.js";
import {inngest } from "../inngest/Server.js"

// add user story

export const addstory = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const {content, media_type, background_color}= req.body;
        const media = req.file;

        let media_url = ''

        // upload media to imagekit
        if(media_type === "image" || media_type === "video"){
            const filebuffer = fs.readFileSync(media.path)
            const response = await imageKit.upload({
                file:filebuffer,
                fileName:media.originalname,
            })
            media_url= response.url
        }

        // create story
        const story = await Story.create({
            user:userId,
            content,
            media_url,
            background_color,
            media_type
        })

        //schedule story deletion after 24hours

        await inngest.send({
            name:'app/story.delete',
            data:{ storyId : story._id}
        })

        res.json({success: true});
        
    }
    catch(error){
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}


// get user stories
export const getstories = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const user = await User.findById(userId);

        //user connection and followings

        const userids = [userId, ...user.followings, ...user.connections];
        const stories = await Story.find({
            user:{$in:userids}
        
        }).populate('user').sort({createdAt:-1});
        res.json({success: true, stories});
    }
    catch(error){
        console.log(error);
        res.json({success:false, message: error.message});
}
}