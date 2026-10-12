const $ = s => document.querySelector(s);
let authMode = 'login';
let sessionToken = localStorage.getItem('ecocredits_token') || '';
let currentUser = JSON.parse(localStorage.getItem('ecocredits_user') || 'null');
const money = n => Number(n || 0).toFixed(2);
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000)}
async function api(path, options={}) { const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(sessionToken?{Authorization:`Bearer ${sessionToken}`} : {}),...(options.headers||{})}});let data={};try{data=await res.json()}catch{} if(!res.ok)throw new Error(data.message||'Something went wrong.');return data; }
function showAuth(mode='login'){setAuthMode(mode);$('#authModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function hideAuth(){$('#authModal').classList.add('hidden');document.body.style.overflow='';$('#authMessage').textContent='';}
function setAuthMode(mode){authMode=mode;document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#nameField').classList.toggle('hidden',mode!=='signup');$('#nameField input').required=mode==='signup';$('#authTitle').textContent=mode==='login'?'Welcome to your greener side.':'Create your EcoCredits account.';$('.auth-subtitle').textContent=mode==='login'?'Sign in to view your credits and demo deposit history.':'Start tracking your demo recycling returns.';$('#authSubmit').textContent=mode==='login'?'Log in':'Create account';$('#authMessage').textContent='';}
function showDashboard(){hideAuth();$('#dashboardView').classList.remove('hidden');document.body.style.overflow='hidden';renderDashboard();}
function hideDashboard(){ $('#dashboardView').classList.add('hidden');document.body.style.overflow=''; }
function saveSession(data){sessionToken=data.token;currentUser=data.user;localStorage.setItem('ecocredits_token',sessionToken);localStorage.setItem('ecocredits_user',JSON.stringify(currentUser));}
async function refreshDashboard(){const data=await api('/api/dashboard');currentUser=data.user;localStorage.setItem('ecocredits_user',JSON.stringify(currentUser));renderDashboard(data);}
function renderDashboard(data){if(!currentUser)return;$('#dashName').textContent=currentUser.name.split(' ')[0];$('#avatarInitial').textContent=(currentUser.name||'R').trim().charAt(0).toUpperCase();$('#creditBalance').textContent=money(currentUser.credits);$('#bottleCount').textContent=currentUser.bottles||0;if(data)renderDeposits(data.deposits||[]);else refreshDashboard().catch(()=>{});}
function renderDeposits(deposits){const list=$('#depositList');if(!deposits.length){list.innerHTML='<div class="empty-state"><span>♻</span><b>Your story starts here</b><p>Demo returns will appear here after you record one.</p></div>';return;}list.innerHTML=deposits.map(d=>`<div class="deposit-row"><div class="deposit-icon">♻</div><div class="deposit-detail"><b>${d.count} bottle${d.count===1?'':'s'} · Demo return</b><small>${new Date(d.createdAt).toLocaleString()} · ${d.machineId||'Demo machine'}</small></div><div class="deposit-credit">+${money(d.credits)}</div></div>`).join('');}
$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  // Keep a direct reference to the form: e.currentTarget becomes null after an await.
  const formElement = e.currentTarget;
  const payload = Object.fromEntries(new FormData(formElement).entries());
  const submittedMode = authMode;
  const submitButton = $('#authSubmit');
  submitButton.disabled = true;
  submitButton.textContent = 'Please wait…';
  $('#authMessage').textContent = '';

  try {
    const data = await api(submittedMode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    saveSession(data);
    formElement.reset();
    showDashboard();
    toast(submittedMode === 'signup' ? 'Account created. Welcome to EcoCredits!' : 'Welcome back!');
  } catch (err) {
    const message = err.message || 'Something went wrong. Please try again.';
    if (submittedMode === 'signup' && /already exists|already registered/i.test(message)) {
      // This account is already saved. Switch to login and keep the email for convenience.
      setAuthMode('login');
      const emailInput = $('#authForm [name="email"]');
      if (emailInput) emailInput.value = payload.email || '';
      $('#authMessage').textContent = 'This email is already registered. Please log in with your existing password.';
    } else {
      $('#authMessage').textContent = message;
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = authMode === 'login' ? 'Log in' : 'Create account';
  }
});
$('#headerLogin').addEventListener('click',()=>showAuth('login'));$('#heroSignup').addEventListener('click',()=>showAuth('signup'));$('#rewardsSignup').addEventListener('click',()=>showAuth('signup'));$('#closeAuth').addEventListener('click',hideAuth);$('#authModal').addEventListener('click',e=>{if(e.target===$('#authModal'))hideAuth()});document.querySelectorAll('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.mode)));
$('#backHome').addEventListener('click',hideDashboard);$('#openDeposit').addEventListener('click',()=>{if(!currentUser)return showAuth('login');$('#depositModal').classList.remove('hidden');$('#depositMessage').textContent='';updateEstimate();});$('#navDeposit').addEventListener('click',()=>$('#openDeposit').click());$('#closeDeposit').addEventListener('click',()=>$('#depositModal').classList.add('hidden'));$('#depositModal').addEventListener('click',e=>{if(e.target===$('#depositModal'))$('#depositModal').classList.add('hidden')});
function updateEstimate(){const count=Math.max(1,Math.min(50,Math.floor(Number($('#bottleInput').value)||1)));$('#estimatedCredits').textContent='+'+money(count*.25);}
$('#bottleInput').addEventListener('input',updateEstimate);
$('#confirmDeposit').addEventListener('click',async()=>{const count=Math.max(1,Math.min(50,Math.floor(Number($('#bottleInput').value)||1)));$('#confirmDeposit').disabled=true;try{const data=await api('/api/deposits/demo',{method:'POST',body:JSON.stringify({count})});currentUser=data.user;localStorage.setItem('ecocredits_user',JSON.stringify(currentUser));$('#depositModal').classList.add('hidden');await refreshDashboard();toast(`Demo recorded: +${money(data.deposit.credits)} EcoCredits`);}catch(err){$('#depositMessage').textContent=err.message;}finally{$('#confirmDeposit').disabled=false;}});
$('#showRewards').addEventListener('click',()=>toast('Rewards are a preview. No real partner redemption is connected yet.'));$('#navRewards').addEventListener('click',()=>$('#showRewards').click());$('#navOverview').addEventListener('click',()=>{document.querySelector('.dashboard-main').scrollTo?.(0,0);window.scrollTo(0,0)});$('#navProfile').addEventListener('click',()=>toast(currentUser?`${currentUser.name} · ${currentUser.email}`:'Please log in first.'));
$('#logoutButton').addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST',body:'{}'})}catch{}sessionToken='';currentUser=null;localStorage.removeItem('ecocredits_token');localStorage.removeItem('ecocredits_user');hideDashboard();toast('You have logged out.');});
if(sessionToken&&currentUser){api('/api/dashboard').then(data=>{currentUser=data.user;localStorage.setItem('ecocredits_user',JSON.stringify(currentUser));renderDashboard(data)}).catch(()=>{sessionToken='';currentUser=null;localStorage.removeItem('ecocredits_token');localStorage.removeItem('ecocredits_user')});}
