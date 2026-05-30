// ==================================================
// script.js - النسخة النهائية
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ألوان عشوائية جميلة للصور الافتراضية
const colors = ['#0284c7', '#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#4f46e5'];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
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
            <a href="products.html?cat=${c.id}" class="category-card" style="text-decoration:none; display:block; background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:transform 0.2s;">
                <div style="font-size:3rem; margin-bottom:10px;">📁</div>
                <h3 style="margin:0;">${c.name}</h3>
            </a>
        `).join('');
    }
    
    // جلب المنتجات المميزة (أول 4)
    const { data: featured } = await supabaseClient.from('products').select('*').limit(4);
    const featuredContainer = document.getElementById('featured-products');
    if (featuredContainer && featured) {
        featuredContainer.innerHTML = featured.map(p => {
            const color = getRandomColor();
            return `
                <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s;" onclick="goToProductDetail(${p.id})">
                    <div style="background:${color}; height:150px; display:flex; align-items:center; justify-content:center; border-radius:16px; margin-bottom:15px; color:white; font-size:3rem;">
                        🛍️
                    </div>
                    <h3 style="margin:10px 0 5px; font-size:1rem;">${p.name.length > 30 ? p.name.substring(0,27)+'...' : p.name}</h3>
                    <div style="color:#0284c7; font-weight:bold; font-size:1.2rem;">${p.price.toLocaleString()} دينار</div>
                    <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف للسلة</button>
                </div>
            `;
        }).join('');
    }
    
    // صفحة جميع المنتجات
    if (document.getElementById('all-products')) {
        const urlParams = new URLSearchParams(window.location.search);
        const catId = urlParams.get('cat');
        
        let query = supabaseClient.from('products').select('*');
        if (catId && catId !== 'all') {
            query = query.eq('category_id', parseInt(catId));
            const { data: categoriesData } = await supabaseClient.from('categories').select('*');
            const categoryName = categoriesData?.find(c => c.id == parseInt(catId))?.name;
            const titleEl = document.querySelector('.products-header h2');
            if (titleEl && categoryName) titleEl.innerHTML = `📦 منتجات ${categoryName}`;
        }
        
        const { data: allProducts } = await query.limit(100);
        const container = document.getElementById('all-products');
        if (container && allProducts) {
            container.innerHTML = allProducts.map(p => {
                const color = getRandomColor();
                return `
                    <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s;" onclick="goToProductDetail(${p.id})">
                        <div style="background:${color}; height:150px; display:flex; align-items:center; justify-content:center; border-radius:16px; margin-bottom:15px; color:white; font-size:3rem;">
                            🛍️
                        </div>
                        <h3 style="margin:10px 0 5px; font-size:0.95rem;">${p.name.length > 35 ? p.name.substring(0,32)+'...' : p.name}</h3>
                        <div style="color:#0284c7; font-weight:bold; font-size:1.1rem;">${p.price.toLocaleString()} دينار</div>
                        <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف للسلة</button>
                    </div>
                `;
            }).join('');
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
    
    const color = getRandomColor();
    
    container.innerHTML = `
        <div style="background:white; border-radius:32px; padding:30px; margin:40px 0; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
            <div style="text-align:center;">
                <div style="background:${color}; height:300px; display:flex; align-items:center; justify-content:center; border-radius:24px; color:white; font-size:5rem;">
                    🛍️
                </div>
            </div>
            <div>
                <h1 style="font-size:1.8rem; margin-bottom:15px;">${product.name}</h1>
                <div style="font-size:2rem; font-weight:bold; color:#0284c7; margin:20px 0;">${product.price.toLocaleString()} دينار</div>
                <div style="color:#475569; line-height:1.8; margin:20px 0; padding:15px 0; border-top:1px solid #eef2f6; border-bottom:1px solid #eef2f6;">
                    ${product.description || 'لا يوجد وصف متاح لهذا المنتج'}
                </div>
                <div style="display:flex; align-items:center; gap:20px; margin:25px 0;">
                    <label>الكمية:</label>
                    <div style="display:flex; align-items:center; gap:12px; background:#f1f5f9; padding:5px 15px; border-radius:60px;">
                        <button onclick="changeDetailQty(-1)" style="width:45px; height:45px; border-radius:50%; border:none; background:white; cursor:pointer; font-size:1.3rem;">-</button>
                        <span id="detail-qty" style="font-size:1.3rem; min-width:45px; text-align:center;">1</span>
                        <button onclick="changeDetailQty(1)" style="width:45px; height:45px; border-radius:50%; border:none; background:white; cursor:pointer; font-size:1.3rem;">+</button>
                    </div>
                </div>
                <button onclick="addToCartFromDetail(${product.id})" style="background:linear-gradient(135deg,#0284c7,#0ea5e9); color:white; border:none; padding:14px 32px; border-radius:50px; font-size:1.1rem; font-weight:bold; cursor:pointer; width:100%;">🛒 إضافة إلى السلة</button>
                <a href="products.html" style="display:inline-block; margin-top:20px; color:#0284c7; text-decoration:none;">← العودة إلى المنتجات</a>
            </div>
        </div>
    `;
}

let detailQty = 1;
function changeDetailQty(delta) {
    const newQty = detailQty + delta;
    if (newQty >= 1) {
        detailQty = newQty;
        const span = document.getElementById('detail-qty');
        if (span) span.innerText = detailQty;
    }
}

function addToCartFromDetail(id) {
    addToCart(id, detailQty);
    detailQty = 1;
    const span = document.getElementById('detail-qty');
    if (span) span.innerText = detailQty;
}

// ==========================================
// دوال السلة
// ==========================================
function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { 
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(b => { if (b) b.innerText = count; }); 
}

window.addToCart = async function(id, qty = 1) {
    const { data: product } = await supabaseClient.from('products').select('*').eq('id', id).single();
    if (!product) return;
    
    const exist = cart.find(i => i.id == id);
    if (exist) { exist.quantity += qty; } 
    else { cart.push({ ...product, quantity: qty }); }
    saveCart(); 
    alert(`✅ تم إضافة ${qty} × ${product.name}`);
    if (document.getElementById('cart-items-list')) renderCartPage();
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
        return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eef2f6; flex-wrap: wrap; gap:10px;">
            <div style="flex:2;"><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} دينار</small></div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="changeCartQty(${item.id}, -1)" style="width:40px; height:40px; border-radius:50%; border:none; background:#f1f5f9; cursor:pointer;">-</button>
                <span style="min-width:35px; text-align:center;">${item.quantity}</span>
                <button onclick="changeCartQty(${item.id}, 1)" style="width:40px; height:40px; border-radius:50%; border:none; background:#f1f5f9; cursor:pointer;">+</button>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>
            </div>
            <div style="min-width:100px; text-align:left;">${(item.price * item.quantity).toLocaleString()} دينار</div>
        </div>`;
    }).join('');
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = total.toLocaleString() + ' دينار';
}

window.changeCartQty = function(id, d) {
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

// ==========================================
// إرسال الطلب
// ==========================================
function sendOrderToWhatsApp(e) {
    e.preventDefault();
    if (!cart.length) return alert("السلة فارغة");
    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const address = document.getElementById('customer-address')?.value;
    if (!name || !phone || !address) return alert("املأ جميع الحقول");
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let msg = `🛍️ طلب جديد من مكاني ستور\n\n👤 الاسم: ${name}\n📱 الجوال: ${phone}\n📍 العنوان: ${address}\n━━━━━━━━━━━━\nالمنتجات:\n`;
    cart.forEach(i => { msg += `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString()} دينار\n`; });
    msg += `━━━━━━━━━━━━\n💰 الإجمالي: ${total.toLocaleString()} دينار\n💵 الدفع عند الاستلام`;
    window.open(`https://wa.me/964700000000?text=${encodeURIComponent(msg)}`, '_blank');
    cart = [];
    saveCart();
    alert("✅ تم فتح واتساب");
    setTimeout(() => window.location.href = "index.html", 1500);
}

// ==========================================
// دوال عامة
// ==========================================
window.goToProductDetail = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

// ==========================================
// بدء التشغيل
// ==========================================
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
