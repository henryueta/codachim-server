

const onInvalidData = (data,message,cond)=>{

    if(!data || !(cond)){

        throw new Error(message)
    }

}

module.exports = {
    onInvalidData
}