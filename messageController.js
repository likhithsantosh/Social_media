import fs from "fs";
import imageKit from "../config/imageKit.js";
import Message from "../model/Message.js";

// create an empty object to store ss Event connections
const connections = {};

//controller funtion for the sse endpoint

export const ssecontroller = (req, res)=>{
    const {userId} = req.params;
    console.log("new client connected", userId);

    // set SSE headers
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');
    res.setHeader('Access-Control-Allow-Origin','*');

    //add the clients response object to the connection object

    connections[userId]= res
    // send an initial event to the client

    res.write('log: Connected to SSE stream\n\n');

    //handle client disconnection
    req.on('close',()=>{
        //remove the clients response object from the connections
        delete connections[userId];
        console.log("Client disconnected");
    })
}

//send Message
export const sendmessage = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const {to_user_id, text}= req.body;
        const image = req.file;

        let media_url='';
        let messege_type=image? 'image' : 'text';

        if(messege_type === "image"){
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imageKit.upload({
                file: fileBuffer,
                fileName: image.originalname
            });
            media_url= imageKit.url({
                path : response.filePath,
                transformation:[
                    {quality: 'auto'},
                    {format:'webp'},
                    {width: '1280'}
                ]
            })
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        res.json({message:true, message});

        //send message to to_user_id using SSE

        const messagewithuserdata = await Message.findById(message._id).populate('from_user_id');

        if(connections[to_user_id]){
            connections[to_user_id].write(`data: ${JSON.stringify(messagewithuserdata)}\n\n`);

        }
    }
    catch(error){
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//get chat messages

export const getchatmessages = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId}
                ]
        }).sort({created_at: -1})

        // mark messages as seen

        await Message.updateMany({form_user_id:to_user_id, to_user_id: userId}, {seen: true})

        res.json({success: true, messages});
    }
    catch(error){
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

export const getuserrecentmessages = async(req, res)=>{
    try{
        const {userId}= req.auth();
        const messages = await Message.find({to_user_id: userId}).populate('form_user_id to_user_id').sort({created_at: -1});
        res.json({success: true, messages});
    }
    catch(error){
        console.log(error);
        res.json({success: false, message: error.message});
    }
}