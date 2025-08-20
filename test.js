const { sendUserEmail } = require("./api/functions/email");

sendUserEmail(
    "E-mail teste",
    "henrykenjiueta@gmail.com",
    "E-mail teste para projeto",
    `<p>Conteúdo do e-mail</p>`,
    {
    onThen(){
    },
    onCatch(error){
        console.log("error",error)
    }
    }
)