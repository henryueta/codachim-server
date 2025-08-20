
const jsonwebtoken = require('jsonwebtoken')

const onWriteToken = (auth)=>{
    const token = jsonwebtoken.sign({
    user_id:auth
    },process.env.JWT_TOKEN_KEY)
    return token
} 

const onReadToken = (auth)=>{
    
    if(!auth){
        return {
            validated:false,
            id:null
        }
    }
    const formated_token = jsonwebtoken.verify(auth.token,process.env.JWT_TOKEN_KEY);

    return {
        validated:true,
        id:formated_token['user_id']
    }
}

module.exports = {
    onReadToken,
    onWriteToken
}