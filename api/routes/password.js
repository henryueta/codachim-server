
const express = require('express');
const { upload } = require('../middlewares/multer');
const { asyncWrapper } = require('../middlewares/wrapper');
const { supabase } = require('../config/database');
const hash = require('password-hash');
const { onInvalidData } = require('../functions/invalidData');
const { onWriteToken, onReadToken } = require('../functions/token');
const { sendUserEmail } = require('../functions/email');
const password_router = express.Router();


password_router.put("/auth/password-recovery",upload.none(),asyncWrapper(async(req,res)=>{


        const {token} = req.query
        const {password} = req.body

        onInvalidData(token,"Token inválido",true)

        onInvalidData(password,"Campo senha inválido",true)

        const check_token = onReadToken({token:token})

        const user_put = await supabase.from("tb_user")
        .update({
            password:hash.generate(password)
        })
        .eq("id",check_token.id)
        .select("id")
        
        if(!user_put.error){
            return res.status(201).send({message:"Senha alterada com sucesso",status:201})
        }

        return res.status(500).send({message:user_put.error,status:500})

}))

password_router.get("/auth/forgot",upload.none(),asyncWrapper(async(req,res)=>{

        const {token} = req.query

        onInvalidData(token,"Token inválido",true)
        
        const check_token = await supabase.from("vw_table_password_recovery")
        .select("is_valid")
        .eq("token_value",token) 
        .eq("is_valid",true)

        if(!!check_token.data.length){
            return res.status(200).send({message:"Token validado com sucesso",status:200})
        }

        return res.status(401).send({message:"Token inválido ou expirado",status:401})

}))

const sendAuthRecovery = (token,email)=>{

    const recovery_url = process.env.CLIENT_BASE_URL+"recovery/password/"+token;
                
        sendUserEmail(
            "Recuperação de senha",
            email,
            "Clique no link para alterar sua senha.Não compartilhe com ninguém",
            `<a href=${recovery_url}>Alterar senha</a>`,
            {
                onThen(result){
                     // console.log("result",result)
                },
                onCatch(error){
                    console.log("error",error)
                }
            }
        )
}

password_router.post("/auth/forgot",upload.none(),asyncWrapper(async (req,res)=>{

            const {email} = req.body

                onInvalidData(email,"Campo email inválido",true)

            const check_email = await supabase.from("tb_user")
            .select("email")
            .eq("email",email)

            if(!!check_email.data.length){
                const recovery_data = await supabase.from("vw_table_password_recovery")
                .select("token_value,token_is_used,is_valid")
                .eq("user_email",check_email.data[0].email)  
                .eq("is_valid",true)

                const user_id_data = await supabase.from("tb_user")
                .select("id")
                .eq("email",check_email.data[0].email)

                !(recovery_data.data.length)
                ? (async()=>{
                    const token_post = await supabase.from("tb_password_recovery")
                    .insert({
                        token:onWriteToken(await user_id_data.data[0].id),
                        fk_id_user:await user_id_data.data[0].id,
                    })
                    .select("token")

                    let currentTokenValue = await token_post.data[0].token
                    sendAuthRecovery(currentTokenValue,check_email.data[0].email)
                })()
                
                : (async()=>{
                    let currentTokenValue = await recovery_data.data[0].token_value
                    sendAuthRecovery(currentTokenValue,check_email.data[0].email)
                })()        

                return res.status(201).send({message:"Email verificado com sucesso",status:201})
            }

            return res.status(401).send({message:"Email inválido ou inexistente",status:401})

}))

module.exports = {
    password_router
}