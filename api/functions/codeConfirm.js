const { supabase } = require("../../api/config/database");
const { sendUserEmail } = require("../functions/email");

const createCheckoutCode = ()=>{

        const code_value_list = [];

        for(let i=0;i < 4;i++){

            code_value_list.push(
                Math.floor(Math.random()*(9 - 1 + 1))+1
            )

        }
        return code_value_list
    }

const onCodePost = async (user_id)=>{

        let code_value = "";
        createCheckoutCode().forEach((code)=>
            code_value+=code
        )
                    
        const code_post = await supabase.from("tb_user_code")
        .insert({
            code:code_value,
            fk_id_user:user_id,
        })
        .select("code")

        if(!code_post.error){
            return {sucess:true,message:"Código gerado com sucesso",code_value:await code_post.data[0].code}
        }
            return {success:false,message:code_post.error,code_value:null}

    }

const checkoutUserEmail = async (id,sendEmail)=>{

            const user_checkout = await supabase.from("tb_user")
            .select("is_checked,email")
            .eq("id",id)

            return !user_checkout.error
            ? !!(user_checkout.data[0].is_checked)
                ? {
                    message:"Usuário confirmado com sucesso",
                    status:200,
                    data:user_checkout.data[0]
                }
                : (async()=>{

                    try {
                    let needCheckout = null;
                    let code_value = null;
                    
                        const code_data = await supabase.from("vw_table_user_code")
                        .select("is_valid,code_is_used,user_is_checked,code_value")
                        .eq("user_id",id)
                    
                        if(code_data.data.length){
                        const current_code = code_data.data.find((code)=>
                            !(code.code_is_used)
                        )
                        
                        if(!current_code){
                            needCheckout = false;
                        }
                    
                        else if (!current_code.is_valid){
                            needCheckout = true;
                            if(!!sendEmail){
                                code_value = (await onCodePost(id)).code_value;
                            }
                        }
                    
                        else if(current_code.is_valid){
                             needCheckout = true;
                             if(!!sendEmail){
                                code_value = current_code.code_value;
                             }
                        }

                    
                        }
                        else{ 
                            needCheckout = true;
                            code_value = (await onCodePost(id)).code_value
                        }
                        
                        if(needCheckout && !!sendEmail){
                            sendUserEmail(
                                "Código de verificação",
                                user_checkout.data[0].email,
                                "Aqui está seu código de verificação",
                                `<p>${code_value}</p>`,
                                {
                                    onThen(){
                                    },
                                    onCatch(error){
                                        console.log("error",error)
                                    }
                                }
                            )

                        }

                        return !!needCheckout
                        ? 
                        {
                            message:"Usuário precisa de confirmação",
                            status:200,
                            data:user_checkout.data[0]
                        }
                        :
                        {
                            message:"Usuário já possui confirmação",
                            status:401,
                        }

                    } catch (error) {
                         console.log(error)
                         return {
                            message:error,
                            status:500
                        }
                    }

                })()
            : {
                message:user_checkout.error,
                status:500
            }
}

    module.exports = {
        createCheckoutCode,
        checkoutUserEmail
    }