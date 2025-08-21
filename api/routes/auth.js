
const express = require('express');
const { upload } = require('../middlewares/multer');
const { asyncWrapper } = require('../middlewares/wrapper');
const { supabase } = require('../config/database');
const hash = require('password-hash');
const auth_router = express.Router();
const jwt = require('jsonwebtoken')
const {onWriteToken, onReadToken} = require('../functions/token')
const {checkoutUserEmail} = require('../functions/codeConfirm')

auth_router.post("/auth/login",upload.none(),asyncWrapper(async (req,res)=>{

    const {email,password} = req.body;

    if(!email){
        throw new Error("Campo email inválido");
    }

    if(!password){
        throw new Error("Campo senha inválido");
    }

    const email_check = await supabase
    .from("tb_user")
    .select("password,id")
    .eq("email",email)

    if(!email_check.data.length){
        return res.status(401).send({message:"E-mail inválido ou inexistente"});
    }

    const password_check = hash.verify(password,email_check.data[0].password);

    if(!password_check){
        return res.status(401).send({message:"Senha inválida"})
    }

    const auth_token = onWriteToken(email_check.data[0].id) 

    return res.status(201).send({message:"Usuário autenticado com sucesso",data:{
        token:auth_token
    }})

}))

auth_router.post("/auth/register",upload.none(),asyncWrapper(async (req,res)=>{
    
    console.log("body",req.body)

    const {email,username,password} = req.body

    if(!username){
        throw new Error("Campo username inválido")
    }

    if(!email){
        throw new Error("Campo email inválido")
    }

    if(!password){
        throw new Error("Campo senha inválido")
    }
    
    const database_users = await supabase
    .from("tb_user")
    .select("username,email")
    .or("username.eq."+username+",email.eq."+email)

    if(database_users.data.length){
        res.status(401).send({message:"Username ou email já estão em uso",status:401})
    }

    const password_hashed = hash.generate(password)
    const user_insert = await supabase
    .from("tb_user")
    .insert({
        username:username,
        email:email,
        password:password_hashed
    })
    .select("id")

    if(user_insert.error){
        throw new Error("Falha no cadastro de usuário. Tente novamente.")
    }

    const auth_token = onWriteToken(user_insert.data[0].id) 

    res.status(201).send({message:"Usuário cadastrado com sucesso",status:201,data:{
        token:auth_token
    }})

}))

const tokenCoolDowns = new Map();
const cooldownTime = 60 * 1000

auth_router.get("/auth/email-cooldown",upload.none(),asyncWrapper(async (req,res)=>{

    const {token} = req.query

    if(!token){
        throw new Error("Token inválido")
    }   

    const user_auth = onReadToken({
        token:token
    })

    if(!user_auth.validated){
            return res.status(401).send({message:"Usuário não autenticado",status:401})
    }

    const last_send = tokenCoolDowns.get(user_auth.id)

    if(last_send && Date.now() - last_send < cooldownTime){

        const secondsLeft = Math.ceil((cooldownTime - (Date.now() - last_send)) / 1000);
        return res.status(429).send({ message: `Aguarde ${secondsLeft}s para reenviar o código.`,data:{
            secondsLeft:secondsLeft
        }});

    }

    return res.status(200).send({message:"Código pronto para envio",data:{secondsLeft:59}})

}))

auth_router.get("/auth/checkout",upload.none(),asyncWrapper(async (req,res)=>{

    const {token,sendEmail} = req.query

    if(!token){
        throw new Error("Token inválido")
    }
    
    const user_auth = onReadToken({
        token:token
    })

        if(!user_auth.validated){
            return res.status(401).send({message:"Usuário não autenticado",status:401})
        } 

            
        const userCheckout = await checkoutUserEmail(user_auth.id,!!(sendEmail.toLowerCase() === "true"))

        console.log(userCheckout.message)

        if(userCheckout.data.email && sendEmail.toLowerCase() === "true"){
            tokenCoolDowns.set(user_auth.id,Date.now())

        }

        res.status(userCheckout.status).send(
            {
            message:userCheckout.message,
            status:userCheckout.status,
            data:(
                !!userCheckout.data
                ? userCheckout.data
                : null
            )

        }
    )

}))

auth_router.post("/auth/checkout",upload.none(),asyncWrapper(async(req,res)=>{
    
    const {token} = req.query
    
    const {code} = req.body

    if(!token){
        throw new Error("Token inválido")
    }

    const user_auth = onReadToken({
        token:token
    })

    if(!user_auth){
        return res.status(401).send({message:"Usuário não autenticado",status:401})
    } 

    if(!code){
        throw new Error("Código inválido")
    }
        const current_user_code = await supabase.from("vw_table_user_code")
        .select("code_id")
        .eq("user_id",user_auth.id)
        .eq("code_value",code)
        .eq('is_valid',true)
        .eq("code_is_used",false)


        if(current_user_code.data.length){
            
            await supabase.from("tb_user_code")
            .update({
                is_used:true
            })
            .eq("id",current_user_code.data[0].code_id)


            await supabase.from("tb_user")
            .update({
                is_checked:true,
            })
            .eq("id",user_auth.id)
            
            return res.status(201).send({message:"Usuário verificado com sucesso",status:201,
                data:{
                    is_checked:true
                }
            })
        }

        if(!(current_user_code.data.length)){

            return res.status(401).send({message:"Código de confirmação inválido",status:401,
                data:{
                    is_checked:false
                }
            })
        }

        if(current_user_code.error){
            return res.status(500).send({message:current_user_code.error,status:500})
        }

    
}))


module.exports = {
    auth_router
}