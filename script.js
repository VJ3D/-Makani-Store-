// ==================================================
// script.js - متجر بسيط وسريع
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabase;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

// تهيئة Supabase
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// تحميل البيانات
// ==========================================
async function loadData() {
    const { data: p } = await supabase.from('products').select('*').order('id');
    const { data: c } = await supabase.from('categories').select('*').order('id');
    products = p || [];
    categories = c || [];
    
    renderCategories();
    renderFeatured();
    
    if (document.getElementById('all-products')) {
        renderAllProducts();
    }
    if (document.getElementById('cart-items-list')) {
        renderCart();
    }
    if (document.getElementById('product-detail-content')) {
        loadProductDetail();
    }
    updateCartCount();
}

// عرض الأقسام
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    if (categories.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:40px;">⏳ جاري التحميل...</div>';
        return;
    }
    
    grid.innerHTML = categories.map(c => `
        <a href="products.html?cat=${c.id}" class="category-card" style="text-decoration:none; display:block; background:white; border-radius:20px; padding:20px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="font-size:2rem;">📁</div>
            <h3>${c.name}</h3>
        </a>
    `).join('');
}

// المنتجات المميزة
async function renderFeatured() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    const featured = products.slice(0, 4);
    if (featured.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = featured.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        return `
            <div class="product-card" style="background:white; border-radius:20px; padding:15px; text-align:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.05);" onclick="goToProduct(${p.id})">
                <div style="background:#f1f5f9; height:150px; display:flex; align-items:center; justify-content:center; border-radius:15px; margin-bottom:10px;">🖼️</div>
                <h3>${p.name}</h3>
                <div style="color:#0284c7; font-weight:bold;">${p.price.toLocaleString()} دينار</div>
                <small>${cat ? cat.name : ''}</small><br>
                <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px; border-radius:25px; margin-top:10px; width:100%;">➕ أضف</button>
            </div>
        `;
    }).join('');
}

// عرض جميع المنتجات
function renderAllProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('cat');
    
    let filtered = [...products];
    if (catId && catId !== 'all') {
        filtered = filtered.filter(p => p.category_id == parseInt(catId));
        const category = categories.find(c => c.id == parseInt(catId));
        const title = document.querySelector('.products-header h2');
        if (title && category) title.innerHTML = `📦 منتجات ${category.name}`;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        return `
            <div class="product-card" style="background:white; border-radius:20px; padding:15px; text-align:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.05);" onclick="goToProduct(${p.id})">
                <div style="background:#f1f5f9; height:150px; display:flex; align-items:center; justify-content:center; border-radius:15px; margin-bottom:10px;">🖼️</div>
                <h3>${p.name}</h3>
                <div style="color:#0284c7; font-weight:bold;">${p.price.toLocaleString()} دينار</div>
                <small>${cat ? cat.name : ''}</small><br>
                <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px; border-radius:25px; margin-top:10px; width:100%;">➕ أضف</button>
            </div>
        `;
    }).join('');
}

// ==========================================
// دوال السلة
// ==========================================
function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { 
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(b => { if (b) b.innerText = count; }); 
}

window.addToCart = function(id, qty = 1) {
    const p = products.find(p => p.id == id);
    if (!p) return;
    const exist = cart.find(i => i.id == id);
    if (exist) { exist.quantity += qty; } 
    else { cart.push({ ...p, quantity: qty }); }
    saveCart(); 
    alert(`✅ تم إضافة ${p.name}`);
    if (document.getElementById('cart-items-list')) renderCart();
};

function renderCart() {
    const container = document.getElementById('cart-items-list');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = '<div style="text-align:center; padding:50px;">🛒 السلة فارغة</div>';
        if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = '0 دينار';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eef2f6;">
                <div><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} دينار</small></div>
                <div>
                    <button onclick="changeQty(${item.id}, -1)">-</button>
                    <span style="margin:0 10px;">${item.quantity}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})" style="margin-left:10px;">🗑️</button>
                </div>
                <div>${(item.price * item.quantity).toLocaleString()} دينار</div>
            </div>
        `;
    }).join('');
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = total.toLocaleString() + ' دينار';
}

window.changeQty = function(id, d) {
    const i = cart.find(i => i.id == id);
    if (i) {
        const n = i.quantity + d;
        if (n <= 0) cart = cart.filter(x => x.id != id);
        else i.quantity = n;
        saveCart();
        renderCart();
    }
};
window.removeFromCart = (id) => { cart = cart.filter(i => i.id != id); saveCart(); renderCart(); };

// ==========================================
// صفحة تفاصيل المنتج
// ==========================================
function getProductId() {
    return parseInt(new URLSearchParams(window.location.search).get('id'));
}

async function loadProductDetail() {
    const container = document.getElementById('product-detail-content');
    if (!container) return;
    
    const id = getProductId();
    const product = products.find(p => p.id == id);
    
    if (!product) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">❌ منتج غير موجود</div>';
        return;
    }
    
    const category = categories.find(c => c.id == product.category_id);
    
    container.innerHTML = `
        <div style="background:white; border-radius:30px; padding:30px; margin:40px 0;">
            <div style="background:#f1f5f9; height:250px; display:flex; align-items:center; justify-content:center; border-radius:20px; margin-bottom:20px;">🖼️</div>
            <h1>${product.name}</h1>
            <div style="color:#0284c7; font-size:2rem; font-weight:bold; margin:15px 0;">${product.price.toLocaleString()} دينار</div>
            <div style="color:#475569; margin:20px 0;">${product.description || 'لا يوجد وصف'}</div>
            <div style="display:flex; align-items:center; gap:15px; margin:20px 0;">
                <button onclick="changeDetailQty(-1)" style="width:45px; height:45px; border-radius:50%; background:#f1f5f9; border:none;">-</button>
                <span id="detailQty" style="font-size:1.3rem;">1</span>
                <button onclick="changeDetailQty(1)" style="width:45px; height:45px; border-radius:50%; background:#f1f5f9; border:none;">+</button>
            </div>
            <button onclick="addToCartFromDetail(${product.id})" style="background:#0284c7; color:white; border:none; padding:15px; border-radius:50px; width:100%; font-size:1.1rem;">🛒 إضافة إلى السلة</button>
            <a href="products.html" style="display:block; margin-top:20px; text-align:center;">← العودة</a>
        </div>
    `;
}

let detailQty = 1;
function changeDetailQty(delta) {
    const newQty = detailQty + delta;
    if (newQty >= 1) {
        detailQty = newQty;
        document.getElementById('detailQty').innerText = detailQty;
    }
}

function addToCartFromDetail(id) {
    addToCart(id, detailQty);
    detailQty = 1;
    document.getElementById('detailQty').innerText = detailQty;
}

// إرسال الطلب
function sendOrder(e) {
    e.preventDefault();
    if (!cart.length) return alert("السلة فارغة");
    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const address = document.getElementById('customer-address')?.value;
    if (!name || !phone || !address) return alert("املأ الحقول");
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let msg = `🛍️ طلب جديد\n👤: ${name}\n📱: ${phone}\n📍: ${address}\n━━━━━━\n`;
    cart.forEach(i => { msg += `${i.name} x${i.quantity} = ${(i.price * i.quantity).toLocaleString()} دينار\n`; });
    msg += `━━━━━━\n💰 المجموع: ${total.toLocaleString()} دينار`;
    window.open(`https://wa.me/964700000000?text=${encodeURIComponent(msg)}`, '_blank');
    cart = []; saveCart();
    alert("✅ تم فتح واتساب");
    setTimeout(() => window.location.href = "index.html", 1000);
}

window.goToProduct = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', sendOrder);
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.addEventListener('change', () => renderAllProducts());
    }
});
