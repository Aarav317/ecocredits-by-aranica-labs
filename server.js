const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const PORT = Number(process.env.PORT || 3000);
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], sessions: {}, deposits: [] }, null, 2));
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = db => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
const send = (res, status, body, headers={}) => { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, Authorization', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', ...headers }); res.end(JSON.stringify(body)); };
const readBody = req => new Promise((resolve, reject) => { let s=''; req.on('data', c => { s += c; if(s.length > 1e6) req.destroy(); }); req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch(e) { reject(e); } }); req.on('error', reject); });
const hash = (password, salt=crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });
const publicUser = u => ({ id:u.id, name:u.name, email:u.email, credits:u.credits, bottles:u.bottles });
function getUser(req, db) { const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,''); const id=db.sessions[token]; return { token, user:db.users.find(u=>u.id===id) }; }
const server = http.createServer(async (req,res) => {
  if(req.method==='OPTIONS') return send(res,204,{});
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if(url.pathname.startsWith('/api/')) {
      const db=readDB();
      if(req.method==='GET' && url.pathname==='/api/health') return send(res,200,{ success:true, app:'EcoCredits by Aranica Labs', status:'running' });
      if(req.method==='POST' && url.pathname==='/api/auth/signup') {
        const b=await readBody(req); const name=String(b.name||'').trim(), email=String(b.email||'').trim().toLowerCase(), password=String(b.password||'');
        if(!name || !email || password.length<6) return send(res,400,{success:false,message:'Name, valid email and password (at least 6 characters) are required.'});
        if(db.users.some(u=>u.email===email)) return send(res,409,{success:false,message:'An account with this email already exists.'});
        const p=hash(password), user={id:crypto.randomUUID(),name,email,salt:p.salt,passwordHash:p.hash,credits:0,bottles:0,createdAt:new Date().toISOString()}; db.users.push(user); const token=crypto.randomUUID(); db.sessions[token]=user.id; writeDB(db);
        return send(res,201,{success:true,token,user:publicUser(user)});
      }
      if(req.method==='POST' && url.pathname==='/api/auth/login') {
        const b=await readBody(req), email=String(b.email||'').trim().toLowerCase(), password=String(b.password||''); const user=db.users.find(u=>u.email===email);
        if(!user || hash(password,user.salt).hash!==user.passwordHash) return send(res,401,{success:false,message:'Email or password is incorrect.'});
        const token=crypto.randomUUID(); db.sessions[token]=user.id; writeDB(db); return send(res,200,{success:true,token,user:publicUser(user)});
      }
      const {token,user}=getUser(req,db);
      if(req.method==='POST' && url.pathname==='/api/auth/logout') { delete db.sessions[token]; writeDB(db); return send(res,200,{success:true}); }
      if(!user) return send(res,401,{success:false,message:'Please log in to continue.'});
      if(req.method==='GET' && url.pathname==='/api/dashboard') { const deposits=db.deposits.filter(d=>d.userId===user.id).slice(-12).reverse(); return send(res,200,{success:true,user:publicUser(user),deposits,rate:'0.25 EcoCredits per accepted bottle'}); }
      if(req.method==='POST' && url.pathname==='/api/deposits/demo') {
        const b=await readBody(req), count=Math.max(1,Math.min(50,Math.floor(Number(b.count)||1))); const credits=Math.round(count*0.25*100)/100;
        user.bottles+=count; user.credits=Math.round((user.credits+credits)*100)/100;
        const deposit={id:crypto.randomUUID(),userId:user.id,count,credits,machineId:'DEMO-MACHINE-01',status:'SIMULATED',createdAt:new Date().toISOString()}; db.deposits.push(deposit); writeDB(db);
        return send(res,201,{success:true,message:'Demo deposit recorded. This is a simulation, not a verified physical deposit.',deposit,user:publicUser(user)});
      }
      if(req.method==='POST' && url.pathname==='/api/rewards/redeem') return send(res,501,{success:false,message:'Rewards are a preview only. No real brand or merchant redemption is connected yet.'});
      return send(res,404,{success:false,message:'API route not found.'});
    }
    let requested=decodeURIComponent(url.pathname==='/ ' ? '/' : url.pathname); if(requested==='/') requested='/index.html';
    const file=path.resolve(ROOT, '.'+requested); if(!file.startsWith(ROOT)) return send(res,403,{success:false,message:'Forbidden'});
    fs.readFile(file,(err,data)=>{ if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found');} const ext=path.extname(file); const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'}; res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(data); });
  } catch(err) { console.error(err); send(res,500,{success:false,message:'Server error. Please try again.'}); }
});
server.listen(PORT,()=>console.log(`EcoCredits by Aranica Labs running at http://localhost:${PORT}`));
