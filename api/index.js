require('dotenv').config()

const express = require('express')
const cors = require('cors')
const {upload} = require("./middlewares/multer")
const {asyncWrapper} = require("./middlewares/wrapper")
const { auth_router } = require('./routes/auth')
const {password_router} = require("./routes/password")

const app = express();

app.use(cors());
app.use(express.json())
app.use(auth_router)
app.use(password_router)

app.get("/",upload.none(),asyncWrapper(async (__,res)=>{

    res.status(200).send({message:"Welcome to Codachim Server!"})

}))


const PORT = 3210;

app.listen(PORT,(error)=>{
    if(error){
        return console.log(error)
    }
        return console.log("http://localhost:"+PORT)
})