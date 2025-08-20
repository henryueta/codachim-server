const { createConnection } = require("../config/smtp")



const sendUserEmail = async(from,destination,subject,html,treatment)=>{

    const email_connection = await createConnection()
    try {
    const sendUserEmail = email_connection.sendMail({
    from:from,
    to:destination,
    subject:subject,
    html:html
    }).then((result)=>{
        email_connection.close()
        treatment.onThen(result)
    })
    .catch((error)=>{
        console.log(error)
        treatment.onCatch(error)
    })


} catch (error) {
    console.log(error)
}

}

module.exports = {
    sendUserEmail
}