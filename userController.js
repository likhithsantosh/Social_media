import imageKit from '../config/imageKit.js';
import { inngest } from '../inngest/Server.js';
import Connection from '../model/Connection.js';
import User from '../model/User.js';
import Post from '../model/Post.js';
import fs from 'fs';
import { clerkClient } from '@clerk/express';

//get user data using userId
export const getUserData = async (req, res) => {
    try{
        const {userId} = req.auth()
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        res.json({success: true, user});
    }catch (error) {
        console.error("Error fetching user data:", error);
        return res.status(500).json({error: "Internal server error", success: false});
    }
}

//update user data
export const updateUserData = async (req, res) => {
    try{
        const {userId} = req.auth();
        const { username, bio, location, full_name}= req.body;
        const user = await User.findById(userId);
        !username && (username = user.username);
        !bio && (bio = user.bio);
        if(user.username !== username){
            const existingUser = await User.findOne({username});
            if(existingUser){
                return res.status(400).json({error: "Username already exists"});
            }

    }
    const updateddata={
        username,
        bio,
        location,
        full_name
    }
    const profile = req.files.profile && req.files.profile[0];
    const cover = req.files.cover && req.files.cover[0];

    if(profile){
        const buffer = fs.readFileSync(profile.path);
        const response = await imageKit.upload({
            file: buffer,
            fileName: profile.originalname,
            folder: 'profile_pictures'
        })
        const url = imageKit.url({
            path : response.filePath,
            transformation: [
                {quality : 'auto'},
                {format: 'webp'},
                {width : '512'}
            ]
        })
        updateddata.profile_picture = url;

        const blob = await fetch(url).then(res => res.blob());
        await clerkClient.users.updateUser(userId, {file:blob});

        if(cover){
            const coverBuffer = fs.readFileSync(cover.path);
            const coverResponse = await imageKit.upload({
                file: coverBuffer,
                fileName: cover.originalname,
                folder: 'cover_pictures'
            });
            const coverUrl = imageKit.url({
                path : coverResponse.filePath,
                transformation: [
                    {quality : 'auto'},
                    {format: 'webp'},
                    {width : '1024'}
                ]
            });
            updateddata.cover_picture = coverUrl;
        }

        const user = await User.findByIdAndUpdate(userId, updateddata, {new: true});
        res.json({success: true, user, message: "User data updated successfully"});
    }
}catch(error){
    console.error("Error updating user data:", error);
}
}

//find users using username email , location, name

export const discoverusers = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {input }= req.body;

        const allusers = await User.find({
            $or:[
                {username: new RegExp(input, 'i')},
                {email: new RegExp(input, 'i')},
                {location: new RegExp(input, 'i')},
                {full_name: new RegExp(input,'i')}
            ]
        })
        const filteredusers = allusers.filter(user=> user._id !== userId);
        res.json({success: true, users: filteredusers});
    }
    catch(error){
        console.error("Error finding users:", error);
        res.json({success: false, error: "Internal server error"});
    }
}

export const followuser = async(req, res)=>{
    try{
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await User.findById(userId);

        if(user.following.includes(id)){
            return res.status(400).json({error: "You are already following this user", success: false});
        }
        user.following.push(id);
        await user.save();

        const touser = await User.findById(id);

        touser.followers.push(userId);
        await touser.save();

        res.json({success: true, message: "User followed successfully", user: touser});
    }
    catch(error){
        console.error("Error following user:", error);
        res.status(500).json({error: "Internal server error", success: false});
    }
}

//unfollow user
export const unfollowuser = async(req, res)=>{
    try{
        const { userId}= req.auth();
        const {id}= req.body;
        const user = await User.findById(userId);

        user.following = user.following.filter(followingId => followingId.toString() !== id);
        await user.save();

        const touser = await User.findById(id);
        touser.followers = touser.followers.filter(user => user !== userId);
        await touser.save();

        res.json({success: true, message: "User unfollowed successfully", user: touser});
    }
    catch(error){
        res.json({success: false, error: "Internal server error"});
        console.error("Error unfollowing user:", error);
    }
}

// send connection request to user
export const sendConnectionRequest = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {id}= req.body;

        //check the user has sent more than 20 connections in 24 hrs
        const last24hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const connectionrequests = await Connection.find({
            from_user_id: userId,
            createdAt: { $gte: last24hours }
        });
        if(connectionrequests.length >=20){
            return res.status(400).json({error: "You have reached the limit of 20 connection requests in 24 hours", success: false, message: "Limit reached"});
            
        }
        // check if users already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId }
            ]
        });
        if(!connection){
            const newconnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id,
        })
        await inngest.send({
            name: 'connection.request',
            data: {
                connectionId: newconnection._id,
                fromUserId: userId,
                toUserId: id
            }
    })
    res.json({success: true, message: "Connection request sent successfully"});
}else if(connection && connection.status === "pending"){
    res.json({success: false, message: "You have already sent a connection request to this"})
}
return res.json({message: false, message: 'connection request pending'})
    }
    catch(error){
        res.json({success: false, error: "Internal server error"});
        console.error("Error sending connection request:", error);
        }
}

// get user connection

export const getUserConnections = async (req, res) => {
    try{
        const { userId}= req.auth();
        const user = await User.findById(userId).populate('connections followers following')

        const connections = user.connections
        const followers = user.followers
        const following = user.following

        const pendingconnections = ( await Connection.find({ to_user_id: userId, status: "pending"}).populate('from_user_id')).map(connection=> connection.from_user_id);
        res.json({success: true, connections, followers, following, pendingconnections})

    }
    catch(error){
        res.json({success: false, error: "Internal server error"});
        console.error("Error getting user connections:", error);
    }
}

//accept connection request
export const acceptConnection = async (req, res) => {
    try{
        const {userId}= req.auth();
        const {id}= req.body;

        const connection = await Connection.findOne({from_user_id: id, to_user_id: userId})
        if(!connection){
            res.json({success: false, message: "Connection request not found"})
        }
        const user = await User.findById(userId);
        user.connections.push(id);
        await user.save();

        const touser = await User.findById(id);
        touser.connections.push(id);
        await touser.save();
        connection.status="accepted";
        await connection.save();
        res.json({success: true, message: "Connection accepted"})


    }
    catch(error){
        res.json({success: false, error: "Internal server error"});
        console.error("Error accepting connection:", error);
    }
}


//get user profiles
export const getProfiles = async (req, res) => {
    try{
        const {profileId}= req.body;
        const profile = await User.findById(profileId);
        if(!profile){
            res.json({success: false, message: "Profile not found"});

    }
    const posts = await Post.find({user_id: profileId}).populate('users');
    res.json({success: true, profile, posts})
}
catch(error){
    res.json({success: false, error: "Internal server error"});
    console.error("Error getting user profiles:", error);
    }
    }