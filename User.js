import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    Full_Name:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        unique:true
    },
    bio:{
        type:String,
        default:"Hey! Hi there 👋 this is built by {LIKHITH SANTOSH}"
    },
    Profile_Image:{
        type:String,
        default:""
    },
    Cover_Image:{
        type:String,
        default:""
    },
    location:{
        type:String,
        default:""
    },
    followers:[{
        type:String,
        ref:'User'
    }
    ],
    following:[{
        type:String,
        ref:'User'
    }
    ],
    connections:[{
        type:String,
        ref:'User'
    }
    ],
}, {timestamps:true, minimize: false});

const User = mongoose.model('User', userSchema);

export default User;

