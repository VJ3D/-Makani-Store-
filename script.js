// ==================================================
// script.js - نسخة سريعة وبسيطة
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// تحميل وعرض المنتجات
// ==========================================
async function loadData() {
    console.log("🚀 بدء التحميل...");
    
    // جلب الأقسام
    const { data: categories } = await supabaseClient.from('categories').select('*').limit(20);
    const categoriesGrid = document.getElementById('categories-grid');
    if (categoriesGrid && categories) {
        categoriesGrid.innerHTML = categories.map(c => `
            <a href="products.html?cat=${c.id}" class="category-card" style="text-decoration:none; display:block; background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <div style="font-size:2rem;">📁</div>
                <h3>${c.name}</h3>
            </a>
        `).join('');
    }
    
    // جلب المنتجات المميزة (أول 4)
    const { data: featured } = await supabaseClient.from('products').select('*').limit(4);
    const featuredContainer = document.getElementById('featured-products');
    if (featuredContainer && featured) {
        featuredContainer.innerHTML = featured.map(p => `
            <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer;" onclick="goToProductDetail(${p.id})">
                <div style="background:#f1f5f9; height:140px; display:flex; align-items:center; justify-content:center; border-radius:16px; margin-bottom:10px;">🖼️</div>
                <h3>${p.name}</h3>
                <div style="color:#0284c7; font-weight:bold;">${p.price.toLocaleString()} دينار</div>
                <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف</button>
            </div>
        `).join('');
    }
    
    // صفحة جميع المنتجات
    if (document.getElementById('all-products')) {
        const urlParams = new URLSearchParams(window.location.search);
        const catId = urlParams.get('cat');
        
        let query = supabaseClient.from('products').select('*');
        if (catId && catId !== 'all') {
            query = query.eq('category_id', parseInt(catId));
            const categoryName = categories.find(c => c.id == parseInt(catId))?.name;
            const titleEl = document.querySelector('.products-header h2');
            if (titleEl && categoryName) titleEl.innerHTML = `📦 منتجات ${categoryName}`;
        }
        
        const { data: allProducts } = await query.limit(50);
        const container = document.getElementById('all-products');
        if (container && allProducts) {
            container.innerHTML = allProducts.map(p => `
                <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer;" onclick="goToProductDetail(${p.id})">
                    <div style="background:#f1f5f9; height:140px; display:flex; align-items:center; justify-content:center; border-radius:16px; margin-bottom:10px;">🖼️</div>
                    <h3>${p.name}</h3>
                    <div style="color:#0284c7; font-weight:bold;">${p.price.toLocaleString()} دينار</div>
                    <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف</button>
                </div>
            `).join('');
        }
    }
    
    updateCartCount();
}

// ==========================================
// صفحة تفاصيل المنتج
// ==========================================
async function loadProductDetail() {
    const container = document.getElementById('product-detail-content');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    const { data: product } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (!product) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">❌ منتج غير موجود</div>';
        return;
    }
    
    container.innerHTML = `
        <div style="background:white; border-radius:32px; padding:30px; margin:40px 0; text-align:center;">
            <div style="background:#f1f5f9; height:200px; display:flex; align-items:center; justify-content:center; border-radius:20px; margin-bottom:20px;">🖼️</div>
            <h1>${product.name}</h1>
            <div style="font-size:2rem; color:#0284c7; margin:20px 0;">${product.price.toLocaleString()} دينار</div>
            <p style="color:#475569; margin:20px 0;">${product.description || 'لا يوجد وصف'}</p>
            <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin:25px 0;">
                <button onclick="changeQty(-1)" style="width:45px; height:45px; border-radius:50%; border:none; background:#f1f5f9; cursor:pointer;">-</button>
                <span id="qty" style="font-size:1.3rem; min-width:45px;">1</span>
                <button onclick="changeQty(1)" style="width:45px; height:45px; border-radius:50%; border:none; background:#f1f5f9; cursor:pointer;">+</button>
            </div>
            <button onclick="addToCartFromDetail(${product.id})" style="background:#0284c7; color:white; border:none; padding:14px 32px; border-radius:50px; font-size:1.1rem; cursor:pointer; width:100%;">🛒 إضافة إلى السلة</button>
            <a href="products.html" style="display:inline-block; margin-top:20px; color:#0284c7;">← العودة</a>
        </div>
    `;
}

let detailQty = 1;
function changeQty(delta) {
    const newQty = detailQty + delta;
    if (newQty >= 1) {
        detailQty = newQty;
        document.getElementById('qty').innerText = detailQty;
    }
}

function addToCartFromDetail(id) {
    addToCart(id, detailQty);
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
    // نحتاج لجلب المنتج من قاعدة البيانات أولاً
    (async () => {
        const { data: product } = await supabaseClient.from('products').select('*').eq('id', id).single();
        if (!product) return;
        
        const exist = cart.find(i => i.id == id);
        if (exist) { exist.quantity += qty; } 
        else { cart.push({ ...product, quantity: qty }); }
        saveCart(); 
        alert(`✅ تم إضافة ${qty} × ${product.name}`);
        if (document.getElementById('cart-items-list')) renderCartPage();
    })();
};

function renderCartPage() {
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
        return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eef2f6;">
            <div><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} دينار</small></div>
            <div>
                <button onclick="changeQtyCart(${item.id}, -1)" style="width:35px; height:35px; border-radius:50%; border:none; background:#f1f5f9;">-</button>
                <span style="margin:0 10px;">${item.quantity}</span>
                <button onclick="changeQtyCart(${item.id}, 1)" style="width:35px; height:35px; border-radius:50%; border:none; background:#f1f5f9;">+</button>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; margin-left:10px;">🗑️</button>
            </div>
            <div>${(item.price * item.quantity).toLocaleString()} دينار</div>
        </div>`;
    }).join('');
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = total.toLocaleString() + ' دينار';
}

window.changeQtyCart = function(id, d) {
    const i = cart.find(i => i.id == id);
    if (i) {
        const n = i.quantity + d;
        if (n <= 0) cart = cart.filter(x => x.id != id);
        else i.quantity = n;
        saveCart();
        renderCartPage();
    }
};
window.removeFromCart = (id) => { cart = cart.filter(i => i.id != id); saveCart(); renderCartPage(); };

function sendOrderToWhatsApp(e) {
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

window.goToProductDetail = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (document.getElementById('order-form')) {
        document.getElementById('order-form').addEventListener('submit', sendOrderToWhatsApp);
    }
    if (document.getElementById('product-detail-content')) {
        loadProductDetail();
    }
    if (document.getElementById('cart-items-list')) {
        renderCartPage();
    }
});
