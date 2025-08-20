// require('dotenv').config()


const nodemailer = require('nodemailer');

const email_value = process.env.SMTP_AUTH_EMAIL;
const pass_value = process.env.SMTP_AUTH_PASSWORD;

console.log(email_value,pass_value)

const createConnection =  async ()=>{

const smtp = nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
        user:email_value,
        pass:pass_value
    }
})

return smtp

}

module.exports = {
    createConnection
}