import { createClient } from '@supabase/supabase-js';
export async function handler(event){
  try{
    const email = new URLSearchParams(event.queryStringParameters).get('email');
    const password = new URLSearchParams(event.queryStringParameters).get('password');
    if(!email || !password) return bad('pass ?email= & ?password=');
    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const list = await supa.auth.admin.listUsers({ page:1, perPage:1000 });
    if (list.error) return bad(list.error.message);
    const user = (list.data?.users||[]).find(u=>u.email===email);
    if (!user) return bad('user not found');
    const upd = await supa.auth.admin.updateUserById(user.id, { password });
    if (upd.error) return bad(upd.error.message);
    return ok({ id: upd.data.user.id, email });
  }catch(e){return bad(e.message||'error');}
}
const ok=b=>({statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
const bad=m=>({statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:m})});
