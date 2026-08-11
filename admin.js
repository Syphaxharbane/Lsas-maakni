const SUPABASE_URL="https://upbilsqjypohbelaktkd.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_yE4v2gWFVoPsrVmOxD6ykQ_OSVi5Viz";

const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let allOrders=[];

function money(value){return Number(value||0).toLocaleString("fr-FR")+" DA";}
function escapeHTML(value){
  if(value===null||value===undefined)return "";
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

async function loadOrders(){
  const container=document.getElementById("orders");
  document.getElementById("statusMessage").textContent="Chargement...";
  container.innerHTML='<div class="loading">Chargement des commandes...</div>';

  const {data,error}=await supabaseClient.from("orders").select("*").order("created_at",{ascending:false});

  if(error){
    console.error(error);
    container.innerHTML='<div class="error"><h3>Erreur Supabase</h3><p>'+escapeHTML(error.message)+'</p></div>';
    document.getElementById("statusMessage").textContent="Impossible de charger les commandes.";
    return;
  }

  allOrders=data||[];
  document.getElementById("statusMessage").textContent=allOrders.length+" commande(s) trouvée(s).";
  renderOrders();
}

function renderOrders(){
  const container=document.getElementById("orders");
  const search=document.getElementById("search").value.toLowerCase().trim();
  const status=document.getElementById("statusFilter").value;
  const date=document.getElementById("dateFilter").value;

  const orders=allOrders.filter(order=>{
    const searchable=JSON.stringify(order).toLowerCase();
    if(search&&!searchable.includes(search))return false;
    if(status&&String(order.status||"").toLowerCase()!==status.toLowerCase())return false;
    if(date&&order.created_at){
      const orderDate=new Date(order.created_at).toISOString().substring(0,10);
      if(orderDate!==date)return false;
    }
    return true;
  });

  updateStatistics(orders);

  if(!orders.length){
    container.innerHTML='<div class="empty"><h3>Aucune commande</h3><p>Aucune commande ne correspond à votre recherche.</p></div>';
    return;
  }

  container.innerHTML=orders.map(createOrderCard).join("");
}

function createOrderCard(order){
  let products=[];
  if(order.products){
    try{products=typeof order.products==="string"?JSON.parse(order.products):order.products}catch{products=[];}
  }

  const date=order.created_at?new Date(order.created_at).toLocaleString("fr-FR"):"";
  let productsHTML="";

  if(Array.isArray(products)){
    productsHTML=products.map(product=>`
      <div class="product-line">
        <span>${escapeHTML(product.name||product.product||"Article")} × ${escapeHTML(product.quantity||1)}</span>
        <strong>${money(Number(product.price||0)*Number(product.quantity||1))}</strong>
      </div>`).join("");
  }

  const name=order.name||order.Name||order.customer_name||"-";
  const phone=order.phone||order.Phone||"-";
  const wilaya=order.wilaya||order.Wilaya||"-";
  const commune=order.commune||order.Commune||"-";
  const address=order.address||order.Address||"";
  const delivery=order.delivery_price||order.shipping||0;
  const total=order.total||order.Total||0;

  return `
    <article class="order">
      <div class="order-header">
        <div>
          <div class="order-id">Commande #${escapeHTML(order.id||"")}</div>
          <div class="order-date">${escapeHTML(date)}</div>
        </div>
        <div class="status">${escapeHTML(order.status||"nouvelle")}</div>
      </div>

      <div class="customer-info">
        <div class="info"><label>Client</label><strong>${escapeHTML(name)}</strong></div>
        <div class="info"><label>Téléphone</label><strong>${escapeHTML(phone)}</strong></div>
        <div class="info"><label>Wilaya</label><strong>${escapeHTML(wilaya)}</strong></div>
        <div class="info"><label>Commune</label><strong>${escapeHTML(commune)}</strong></div>
      </div>

      ${address?`<p><strong>Adresse :</strong> ${escapeHTML(address)}</p>`:""}

      <div class="products">${productsHTML||"<p>Aucun détail des articles.</p>"}</div>

      <div class="order-footer">
        <span>Livraison : ${money(delivery)}</span>
        <span class="total">${money(total)}</span>
      </div>
    </article>`;
}

function updateStatistics(orders){
  document.getElementById("ordersCount").textContent=orders.length;

  const revenue=orders.reduce((total,order)=>
    total+Number(order.total||order.Total||0),0);
  document.getElementById("totalRevenue").textContent=money(revenue);

  document.getElementById("homeCount").textContent=orders.filter(order=>
    String(order.delivery_type||order.Delivery||"").toLowerCase().includes("domicile")).length;

  document.getElementById("officeCount").textContent=orders.filter(order=>
    String(order.delivery_type||order.Delivery||"").toLowerCase().includes("bureau")).length;
}

document.getElementById("refreshBtn").addEventListener("click",loadOrders);
document.getElementById("search").addEventListener("input",renderOrders);
document.getElementById("statusFilter").addEventListener("change",renderOrders);
document.getElementById("dateFilter").addEventListener("change",renderOrders);

loadOrders();
