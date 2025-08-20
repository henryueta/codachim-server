
const express = require('express');
const { upload } = require('../middlewares/multer');
const { asyncWrapper } = require('../middlewares/wrapper');
const { supabase } = require('../config/database');
const hash = require('password-hash');
const auth_router = express.Router();
const jwt = require('jsonwebtoken')
const {onWriteToken, onReadToken} = require('../functions/token')

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

auth_router.get("/auth/checkout",upload.none(),asyncWrapper(async (req,res)=>{

    const {token} = req.query

    if(!token){
        throw new Error("Token inválido")
    }
    
    const user_auth = onReadToken(token)

        if(!user_auth.validated){
            return res.status(401).send({message:"Usuário não autenticado",status:401})
        } 

        const {sendEmail} = req.query
            
        const userCheckout = await checkoutUserEmail(user_auth.id,!!(sendEmail.toLowerCase() === "true"))

        console.log(userCheckout.message)

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

module.exports = {
    auth_router
}