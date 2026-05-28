// ==================================================
// script.js - النسخة الآمنة مع نظام حماية ذاتي
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let isLoading = false; // 1. الحماية: منع التحميل المتكرر

// تهيئة العميل
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase ready");
}

// 2. دالة تحميل آمنة: تمنع الطلبات المتزامنة
async function loadDataOnce(key, loadFunction) {
    if (isLoading) return; // إذا كان هناك تحميل جارٍ، اخرج
    const cache = localStorage.getItem(key);
    const cacheTime = localStorage.getItem(`${key}_time`);

    // استخدم البيانات المخزنة إذا كانت حديثة (أقل من 5 دقائق)
    if (cache && cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
        if (key === 'products') products = JSON.parse(cache);
        if (key === 'categories') categories = JSON.parse(cache);
        renderAll();
        return;
    }

    // وإلا، حمل بيانات جديدة
    isLoading = true;
    try {
        const data = await loadFunction();
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_time`, Date.now().toString());
        if (key === 'products') products = data;
        if (key === 'categories') categories = data;
        renderAll();
    } catch (error) {
        console.error(`فشل تحميل ${key}:`, error);
    } finally {
        isLoading = false;
    }
}

async function fetchProducts() {
    const { data } = await supabaseClient.from('products').select('*').order('id');
    return data || [];
}

async function fetchCategories() {
    const { data } = await supabaseClient.from('categories').select('*').order('id');
    return data || [];
}

// 3. دوال العرض (نفسها ولكن مع مزامنة أفضل)
function renderAll() {
    if (document.getElementById('featured-products')) renderProducts('featured-products', null, 4);
    if (document.getElementById('all-products')) {
        const params = new URLSearchParams(window.location.search);
        renderProducts('all-products', params.get('cat'));
    }
    if (document.getElementById('categories-grid')) renderCategories();
    if (document.getElementById('cart-items-list')) renderCartPage();
    updateCartCount();
}

function renderProducts(containerId, filterCat, limit) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let list = filterCat && filterCat !== 'all' ? products.filter(p => p.category_id == filterCat) : [...products];
    if (limit) list = list.slice(0, limit);
    if (!list.length) { container.innerHTML = '<div class="empty-state">✨ لا توجد منتجات</div>'; return; }

    container.innerHTML = list.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        return `<div class="product-card">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <h3>${p.name}</h3>
            <div class="price">${p.price.toLocaleString()} دينار</div>
            <small>${cat ? cat.icon + ' ' + cat.name : ''}</small>
            <button class="add-to-cart" onclick="addToCart(${p.id})">➕ أضف</button>
        </div>`;
    }).join('');
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    if (!categories.length) { grid.innerHTML = '<div class="empty-state">📂 لا توجد أقسام</div>'; return; }
    grid.innerHTML = categories.map(c => `<a href="products.html?cat=${c.id}" class="category-card"><div class="category-icon">${c.icon}</div><h3>${c.name}</h3></a>`).join('');

    const filter = document.getElementById('category-filter');
    if (filter) filter.innerHTML = '<option value="all">جميع الأقسام</option>' + categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

// دوال السلة (آمنة بدون طلبات خارجية)
function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { document.querySelectorAll('#cart-count').forEach(b => { if (b) b.innerText = cart.reduce((s, i) => s + i.quantity, 0); }); }

window.addToCart = function(id) {
    const p = products.find(p => p.id == id);
    if (!p) return;
    const exist = cart.find(i => i.id == id);
    if (exist) { if (exist.quantity < p.stock) exist.quantity++; else { alert("الكمية غير متوفرة"); return; } }
    else { if (p.stock > 0) cart.push({ ...p, quantity: 1 }); else { alert("غير متوفر"); return; } }
    saveCart(); alert(`✅ تم إضافة ${p.name}`);
    if (document.getElementById('cart-items-list')) renderCartPage();
};

function renderCartPage() {
    const container = document.getElementById('cart-items-list');
    const totalSpan = document.getElementById('cart-total');
    if (!container) return;
    if (!cart.length) { container.innerHTML = '<div class="empty-cart">السلة فارغة</div>'; if (totalSpan) totalSpan.innerText = '0 دينار'; return; }
    let total = 0;
    container.innerHTML = cart.map(i => { total += i.price * i.quantity; return `<div class="cart-item"><div>${i.name}<br><small>${i.price.toLocaleString()} دينار</small></div><div><button onclick="changeQty(${i.id},-1)">-</button><span>${i.quantity}</span><button onclick="changeQty(${i.id},1)">+</button><button onclick="removeFromCart(${i.id})">🗑️</button></div><div>${(i.price * i.quantity).toLocaleString()} دينار</div></div>`; }).join('');
    if (totalSpan) totalSpan.innerText = total.toLocaleString() + ' دينار';
}

window.changeQty = function(id, d) {
    const i = cart.find(i => i.id == id);
    const p = products.find(p => p.id == id);
    if (i) { const n = i.quantity + d; if (n <= 0) cart = cart.filter(x => x.id != id); else if (p && n <= p.stock) i.quantity = n; else { alert("الكمية غير متوفرة"); return; } saveCart(); renderCartPage(); }
};
window.removeFromCart = (id) => { cart = cart.filter(i => i.id != id); saveCart(); renderCartPage(); };

// إرسال الطلب (بدون تغيير)
function sendOrderToWhatsApp(e) {
    e.preventDefault();
    if (!cart.length) return alert("السلة فارغة");
    const name = document.getElementById('customer-name')?.value, phone = document.getElementById('customer-phone')?.value, address = document.getElementById('customer-address')?.value;
    if (!name || !phone || !address) return alert("املأ الحقول");
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let msg = `🛍️ طلب جديد\n👤: ${name}\n📱: ${phone}\n📍: ${address}\n━━━━━━\n`;
    cart.forEach(i => { msg += `${i.name} x${i.quantity} = ${(i.price * i.quantity).toLocaleString()} دينار\n`; });
    msg += `━━━━━━\n💰 الإجمالي: ${total.toLocaleString()} دينار\n💵 دفع عند الاستلام`;
    window.open(`https://wa.me/964700000000?text=${encodeURIComponent(msg)}`, '_blank');
    cart = []; saveCart();
    alert("تم فتح واتساب");
    setTimeout(() => window.location.href = "index.html", 1000);
}

// بدء التشغيل الآمن
document.addEventListener('DOMContentLoaded', () => {
    loadDataOnce('categories', fetchCategories);
    loadDataOnce('products', fetchProducts);
    if (document.getElementById('order-form')) document.getElementById('order-form').addEventListener('submit', sendOrderToWhatsApp);
    const filter = document.getElementById('category-filter');
    if (filter) filter.addEventListener('change', (e) => renderProducts('all-products', e.target.value));
});
