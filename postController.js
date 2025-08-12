import fs from 'fs';
import imageKit from '../config/imageKit.js';
import Post from '../model/Post.js';
import User from '../model/User.js';

//add post
export const addpost = async(req,res)=>{
    try{
        const {userId} = req.auth();
        const {content, post_type}= req.body;
        const images = req.files

        let image_url =[]
        if(images.length){
            image_url = await Promise.all(
                images.map(async(image)=>{
                    const filebuffer = fs.readFileSync(image.path);
                    const response = await imageKit.upload({
                        file: filebuffer,
                        fileName: image.originalname,
                        folder:"posts",
                    })
                    const url = imageKit.url({
                        path: response.filePath,
                        transformation:[
                            {quality:'auto'},
                            {format:'webp'},
                            {width:'1280'}
                        ]
                    })
                    return url
                })
            )
        }
        await Post.create({
            user:userId,
            content,
            image_url,
            post_type
        })
        res.status(201).json({message:"Post created successfully"})
    }
    catch(error){
        res.status(500).json({message:error.message})
        console.log(error);
    }
}

//get posts

export const getposts = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const user = await User.findById(userId)

        //user connections and followings
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({user: {$in: userIds}}).populate('user').sort({createdAt: -1});
        res.status(200).json(posts)
    }
    catch(error){
        res.status(500).json({message:error.message})
        console.log(error);
    }
}

//like the post 
export const likepost = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const {postId}= req.body;

        const post = await Post.findById(postId);
        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user=> user !== userId)
            await post.save();
            res.status(200).json({message:"Post unliked"})
        }
        else{
            post.likes_count.push(userId)
            await post.save();
            res.json({success:true, message:'Post Liked'});
        }
    }
    catch(error){
        res.status(500).json({message:error.message})
        console.log(error);
    }
}