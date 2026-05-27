let products = JSON.parse(localStorage.getItem('makani_products')) || [
    { id: 1, name: "ساعة ذكية فاخرة", price: 299, image: "https://placehold.co/400x400/0077b6/white?text=ساعة", categoryId: 3, stock: 10 },
    { id: 2, name: "طقم أواني 7 قطع", price: 189, image: "https://placehold.co/400x400/0077b6/white?text=أواني", categoryId: 2, stock: 15 },
    { id: 3, name: "خلاط كهربائي", price: 159, image: "https://placehold.co/400x400/0077b6/white?text=خلاط", categoryId: 1, stock: 8 },
    { id: 4, name: "سماعة لاسلكية", price: 99, image: "https://placehold.co/400x400/0077b6/white?text=سماعة", categoryId: 3, stock: 25 }
];

let categories = JSON.parse(localStorage.getItem('makani_categories')) || [
    { id: 1, name: "أجهزة كهربائية", icon: "🔌" },
    { id: 2, name: "مواد منزلية", icon: "🏠" },
    { id: 3, name: "إلكترونيات", icon: "📱" }
];

let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { let c = cart.reduce((s,i)=>s+i.quantity,0); document.querySelectorAll('#cart-count').forEach(b=>{if(b)b.innerText=c;}); }

function addToCart(pid) {
    let p = products.find(p=>p.id==pid);
    if(!p) return;
    let ex = cart.find(i=>i.id==pid);
    if(ex) { if(ex.quantity < p.stock) ex.quantity++; else { alert("الكمية غير متوفرة"); return; } }
    else { if(p.stock>0) cart.push({...p, quantity:1}); else { alert("غير متوفر"); return; } }
    saveCart();
    alert(`✅ تم إضافة ${p.name}`);
}

function renderProducts(cid, cat=null, limit=null) {
    let c = document.getElementById(cid);
    if(!c) return;
    let prods = [...products];
    if(cat && cat!='all') prods = prods.filter(p=>p.categoryId==cat);
    if(limit) prods = prods.slice(0,limit);
    c.innerHTML = prods.map(p=>{ let ca = categories.find(c=>c.id==p.categoryId); return `<div class="product-card"><img src="${p.image}"><h3>${p.name}</h3><div class="price">${p.price} ريال</div><small>${ca?ca.icon+' '+ca.name:''}</small><button class="add-to-cart" onclick="addToCart(${p.id})">➕ أضف</button></div>`; }).join('');
}

function renderCategories() {
    let g = document.getElementById('categories-grid');
    if(g) g.innerHTML = categories.map(c=>`<a href="products.html?cat=${c.id}" class="category-card"><div class="category-icon">${c.icon}</div><h3>${c.name}</h3></a>`).join('');
    let f = document.getElementById('category-filter');
    if(f) f.innerHTML = '<option value="all">جميع الأقسام</option>'+categories.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

function renderCartPage() {
    let c = document.getElementById('cart-items-list');
    let t = document.getElementById('cart-total');
    if(!c) return;
    if(cart.length==0) { c.innerHTML='<p>🛒 السلة فارغة</p>'; if(t) t.innerText='0 ريال'; return; }
    let total=0;
    c.innerHTML = cart.map(i=>{ total+=i.price*i.quantity; return `<div class="cart-item"><div><strong>${i.name}</strong><br>${i.price} ريال</div><div class="quantity-control"><button onclick="changeQty(${i.id},-1)">-</button><span>${i.quantity}</span><button onclick="changeQty(${i.id},1)">+</button><button onclick="removeFromCart(${i.id})" style="background:none;border:none;color:red;">🗑️</button></div><div>${i.price*i.quantity} ريال</div></div>`; }).join('');
    if(t) t.innerText = total+' ريال';
}

function changeQty(id, d) {
    let i = cart.find(i=>i.id==id);
    let p = products.find(p=>p.id==id);
    if(i) { let n = i.quantity+d; if(n<=0) cart=cart.filter(x=>x.id!=id); else if(p && n<=p.stock) i.quantity=n; else { alert("الكمية غير متوفرة"); return; } saveCart(); renderCartPage(); }
}
function removeFromCart(id) { cart=cart.filter(i=>i.id!=id); saveCart(); renderCartPage(); }

function sendOrderToWhatsApp(e) {
    e.preventDefault();
    if(cart.length==0) { alert("السلة فارغة"); return; }
    let n=document.getElementById('customer-name')?.value, p=document.getElementById('customer-phone')?.value, a=document.getElementById('customer-address')?.value;
    if(!n||!p||!a) { alert("املأ جميع الحقول"); return; }
    let total=cart.reduce((s,i)=>s+i.price*i.quantity,0);
    let msg = `🛍️ طلب جديد من مكاني ستور\n\n👤 الاسم: ${n}\n📱 الجوال: ${p}\n📍 العنوان: ${a}\n━━━━━━━━━━━━\n`;
    cart.forEach(i=>{ msg+=`• ${i.name} × ${i.quantity} = ${i.price*i.quantity} ريال\n`; });
    msg+=`━━━━━━━━━━━━\n💰 الإجمالي: ${total} ريال\n💵 الدفع عند الاستلام`;
    let num = "966500000000";
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    cart=[]; saveCart();
    alert("✅ سيتم فتح واتساب");
    setTimeout(()=>window.location.href="index.html",1500);
}

document.addEventListener('DOMContentLoaded',()=>{
    renderCategories();
    if(document.getElementById('featured-products')) renderProducts('featured-products',null,4);
    if(document.getElementById('all-products')) {
        let u = new URLSearchParams(location.search).get('cat');
        renderProducts('all-products',u);
        let f=document.getElementById('category-filter');
        if(f) f.addEventListener('change',(e)=>renderProducts('all-products',e.target.value));
    }
    if(document.getElementById('cart-items-list')) renderCartPage();
    let f=document.getElementById('order-form');
    if(f) f.addEventListener('submit',sendOrderToWhatsApp);
    updateCartCount();
});
