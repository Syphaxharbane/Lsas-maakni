const SUPABASE_URL="https://upbilsqjypohbelaktkd.supabase.co";
const SUPABASE_KEY="sb_publishable_yE4v2gWFVoPsrVmOxD6ykQ_OSVi5Viz";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const cart=[];
let geo=[];

// Liste des communes chargée depuis une base publique.
const GEO_URL="https://cdn.jsdelivr.net/npm/geoalgeria/data/ecommerce/communes.json";

function changeQty(id,n){const e=document.getElementById(id);e.textContent=Math.max(1,(+e.textContent||1)+n)}
function addProduct(name,price,id){
  const qty=+document.getElementById(id).textContent||1;
  const x=cart.find(x=>x.name===name);
  if(x)x.quantity+=qty;else cart.push({name,price,quantity:qty});
  renderCart();openCart();
}
function changeCartQty(i,n){cart[i].quantity+=n;if(cart[i].quantity<=0)cart.splice(i,1);renderCart()}
function subtotal(){return cart.reduce((s,x)=>s+x.price*x.quantity,0)}
function shipping(){const x=document.querySelector('input[name="delivery"]:checked');return x?+x.value:0}
function updateTotals(){
  const s=subtotal(),d=shipping();
  document.getElementById("subtotal").textContent=s.toLocaleString("fr-FR")+" DA";
  document.getElementById("shipping").textContent=d?d.toLocaleString("fr-FR")+" DA":"À choisir";
  document.getElementById("total").textContent=(s+d).toLocaleString("fr-FR")+" DA";
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function renderCart(){
 const b=document.getElementById("cartItems");
 document.getElementById("cartCount").textContent=cart.reduce((s,x)=>s+x.quantity,0);
 if(!cart.length){b.innerHTML='<div class="empty">Votre panier est vide.</div>';updateTotals();return}
 b.innerHTML=cart.map((x,i)=>`<div class="cartLine"><div><b>${esc(x.name)}</b><small>${x.price.toLocaleString("fr-FR")} DA / unité</small><div class="lineQty"><button onclick="changeCartQty(${i},-1)">−</button><span>${x.quantity}</span><button onclick="changeCartQty(${i},1)">+</button></div></div><b>${(x.price*x.quantity).toLocaleString("fr-FR")} DA</b></div>`).join("");
 updateTotals();
}
function openCart(){document.getElementById("cart").classList.add("show");document.getElementById("overlay").classList.add("show")}
function closeCart(){document.getElementById("cart").classList.remove("show");document.getElementById("overlay").classList.remove("show")}

async function loadWilayas(){
 const s=document.getElementById("wilaya");
 try{
  const r=await fetch(GEO_URL);if(!r.ok)throw 0;geo=await r.json();
  const ws=[...new Map(geo.map(x=>[String(x.wilaya_code),{code:String(x.wilaya_code),name:x.wilaya_name_fr}])).values()].sort((a,b)=>+a.code-+b.code);
  s.innerHTML='<option value="">Choisir une wilaya</option>'+ws.map(w=>`<option value="${w.code}">${String(w.code).padStart(2,"0")} — ${esc(w.name)}</option>`).join("");
 }catch(e){s.innerHTML='<option value="">Erreur de chargement — vérifiez Internet</option>'}
}
function loadCommunes(){
 const code=document.getElementById("wilaya").value,s=document.getElementById("commune");
 if(!code){s.disabled=true;s.innerHTML="<option>Choisir d'abord une wilaya</option>";return}
 const rows=geo.filter(x=>String(x.wilaya_code)===String(code)).sort((a,b)=>a.commune_name_fr.localeCompare(b.commune_name_fr,"fr"));
 s.disabled=false;s.innerHTML='<option value="">Choisir une commune</option>'+rows.map(x=>`<option value="${esc(x.commune_name_fr)}">${esc(x.commune_name_fr)}</option>`).join("");
}

async function saveOrder(){
 if(!cart.length){alert("Votre panier est vide.");return}
 const w=document.getElementById("wilaya"),c=document.getElementById("commune");
 const d=document.querySelector('input[name="delivery"]:checked');
 const name=document.getElementById("name").value.trim(),phone=document.getElementById("phone").value.trim(),address=document.getElementById("address").value.trim();
 if(!w.value||!c.value||!d||!name||!phone){alert("Veuillez remplir le nom, téléphone, wilaya, commune et mode de livraison.");return}
 if(d.value==="900"&&!address){alert("L'adresse est obligatoire pour une livraison à domicile.");return}

 const sub=subtotal(),ship=+d.value;
 const order={
  customer_name:name,phone,
  wilaya:w.options[w.selectedIndex].text,
  commune:c.value,
  delivery_type:d.value==="550"?"Bureau":"Domicile",
  address:d.value==="900"?address:"",
  products:cart.map(x=>({name:x.name,price:x.price,quantity:x.quantity})),
  subtotal:sub,delivery_price:ship,total:sub+ship,status:"nouvelle"
 };
 const btn=document.getElementById("orderBtn");btn.disabled=true;btn.textContent="Enregistrement...";
 const {error}=await db.from("orders").insert(order);
 btn.disabled=false;btn.textContent="Confirmer la commande";
 if(error){console.error(error);alert("Erreur : la commande n'a pas pu être enregistrée. Ouvre la console du navigateur pour voir le détail.");return}
 alert("✅ Commande enregistrée avec succès !");
 cart.length=0;renderCart();
 ["name","phone","address"].forEach(id=>document.getElementById(id).value="");
 w.value="";c.disabled=true;c.innerHTML="<option>Choisir d'abord une wilaya</option>";
 document.querySelectorAll('input[name="delivery"]').forEach(x=>x.checked=false);
 closeCart();
}

loadWilayas();renderCart();
