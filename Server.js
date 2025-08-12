import { Inngest } from 'inngest';
import User from '../model/User.js';
import Message from '../model/Message.js';
import Connection from '../model/Connection.js';
import Story from '../model/Story.js';
import sendEmail from '../config/nodeMailer.js';

// create a client to send and recieve events

export const inngest = new Inngest({id: "likhith-app"});

//ingest function to save user data to a database

const suncusercreation = inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk.user.created'},
    async({event})=>{
        const {id, first_name, last_name, email_address, image_url}= event.data
            let username = email_address[0].email_address.split('@')[0]

            // check availability of username
            const user = await User.findOne({username})

            if(user){
                username = username + Math.floor(Math.random() * 1000);
            }
            const userdata={
                _id:id,
                email: email_address[0].email_address,
                full_name: first_name+''+last_name,
                profile_picture:image_url,
                username
            }
            await user.create(userdata);
            await sendEmail({
                to: email_address[0].email_address,
                subject: "Welcome to Likhith App",
                body: `<h1>Welcome ${first_name}!</h1><p>Thank
    you for joining Likhith App. We are excited to have you on board!</p>`
            }
        )
    }
)

//inngest function to update user data in a database

const syncuserupdatio = inngest.createFunction(
    {id:'update-user-from0clerk'},
    {event:'clerk/user.updated'},
    async({event})=>{
        const {id, first_name, last_name, email_address, image_url}= event.data
        
        const updateddata={
            email: email_address[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture: image_url,
        }
        await User.findByIdAndUpdate(id, updateddata, {new: true}
        );
    }
)

// inngest function to delete user form a database

const syncuserdeletion = inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async({event})=>{
        const {id} = event.data
        await User.findByIdAndUpdate(id)
    }
)

//innget funtion to send a remainder when a new connection request is added

const syncnewconnectionrequestremainder= inngest.createFunction(
    {id:'send-new-connection-remainder'},
    {event:'app/connection-request'},
    async({event, step})=>{
        const {connectionid} = event.data;

        await step.run('send-connection-request-mail', async ()=>{
            const connection = await Connection.findById(connectionid).populate('from_user_id', 'email full_name profile_picture');
            const subject =  `👋 New Connection Request`;
            const body = `<h1>Hi ${connection.from_user_id.full_name}!</h1>
            <p>You have a new connection request from ${connection.from_user_id.full_name}.</p>
            <p>To accept or reject the request, please log in to your account.</p>
            <p>Thank you for using our service!</p>`;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,body
            })
        })
        const in24hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil('wait-for-24-hours',in24hours);
        await step.run('send-connection-remainder',async()=>{
            const connection = await Connection.findById(connectionid).populate('from_user_id', 'email full_name profile_picture');
            const subjectt = `⏰ Reminder: Connection Request Pending`;
            const bodyy = `<h1>Hi ${connection.from_user_id.full_name}!</h1>
            <p>This is a reminder that you have a pending connection request from ${connection.from_user_id.full_name}.</p>
            <p>Please log in to your account to accept or reject the request.</p>
            <p>Thank you for using our service!</p>`;

            if(connection.status=== "accepted" ) {

                return {Message: "Connection accepted"};
            }
            if(connection.status === "rejected") {
                return {Message: "Connection rejected"};
            }
            const subject = `⏰ Reminder: Connection Request Pending`;
            const body = `<h1>Hi ${connection.from_user_id.full_name}!</h1>
            <p>This is a reminder that you have a pending connection request from ${connection.from_user_id.full_name}.</p>
            <p>Please log in to your account to accept or reject the request.</p>
            <p>Thank you for using our service!</p>`;   

            await sendEmail({
                to: connection.to_user_id.email,
                subjectt, bodyy
            });
            return {Message: "Remainder sent successfully"}
        })
    }
)

//inngest function to delete story after 24hours
const syndeletestory = inngest.createFunction(
    {id:'story-delete'},
    {event:'app/story.delete'},
    async(event, step)=>{
        const {storyid} = event.data;
        const in24hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil('wait-for-24-hours',in24hours);
        await step.run('delete-story', async()=>{
            await Story.findByIdAndDelete(storyid)
            return {Message: "Story deleted successfully"};
        })
    }
)

// inngest funtion to send a message to a user for unseen message
const sendnotificationforunseenmessage = inngest.createFunction(
    {id:'send-unseen-messegages-notification'},
    {cron: "TZ=Asia/Kolkata 0 9 * * *"},
    async({step})=>{
        const messages = await Message.find({seen:false}).populate('to_user_id', 'email full_name profile_picture');
        const unseenCount={};
        messages.map(message=>{
            unseenCount[message.to_user_id._id] = (unseenCount[message.to_user_id._id] || 0) + 1;
        })

        for (const userId in unseenCount){
            const user = await User.findById(userId);
            if(!user) continue;

            const subject = `🔔 Unseen Messages Notification`;
            const body = `<h1>Hi ${user.full_name}!</h1>
            <p>You have ${unseenCount[userId]} unseen messages in your inbox.</p>
            <p>Please log in to your account to check them out.</p>
            <p>Thank you for using our service!</p>`;

            await sendEmail({
                to: user.email,
                subject,
                body
            });
            console.log(`Notification sent to ${user.email} for ${unseenCount[userId]} unseen messages.`);
        return {Message: "Unseen messages notification sent successfully"};
        }
    }
)

//to export all the inngest functions
export const functions = [
    suncusercreation,
    syncuserupdatio,
    syncuserdeletion,
    syncnewconnectionrequestremainder,
    syndeletestory,
    sendnotificationforunseenmessage
];

