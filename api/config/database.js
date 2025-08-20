const {createClient} = require('@supabase/supabase-js')
const url = process.env.DATABASE_SERVICE_URL;
const role = process.env.DATABASE_SERVICE_ROLE;


const supabase = createClient(url,role)


module.exports =  {
    supabase
}