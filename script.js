// ==================================================
// script.js - ملف المتجر الرئيسي (مع صفحة التفاصيل)
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let isLoading = false;
let detailQuantity = 1;

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadData() {
    if (isLoading) return;
    isLoading = true;
    try {
        const { data: productsData } = await supabaseClient.from('products').select('*').order('id');
        const { data: categoriesData } = await supabaseClient.from('categories').select('*').order('id');
        if (productsData) products = productsData;
        if (categoriesData) categories = categoriesData;
        renderAll();
    } catch (error) {
        console.error("خطأ:", error);
    } finally {
        isLoading = false;
    }
}

function renderAll() {
    if (document.getElementById('featured-products')) renderProducts('featured-products', null, 4);
    if (document.getElementById('all-products')) {
        const params = new URLSearchParams(window.location.search);
        renderProducts('all-products', params.get('cat'));
    }
    if (document.getElementById('categories-grid')) renderCategories();
    if (document.getElementById('cart-items-list')) renderCartPage();
    if (document.getElementById('product-detail-content')) loadProductDetail();
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
        return `<a href="product-detail.html?id=${p.id}" class="product-card" style="text-decoration: none;">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <h3>${p.name}</h3>
            <div class="price">${p.price.toLocaleString()} دينار</div>
            <small>${cat ? cat.icon + ' ' + cat.name : ''}</small><br>
            <small>📦 المتبقي: ${p.stock} قطعة</small>
            <button class="add-to-cart" onclick="event.preventDefault(); addToCart(${p.id});">➕ أضف للسلة</button>
        </a>`;
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
    
    if (!cart.length) {
        container.innerHTML = '<div style="text-align:center; padding:50px; color:#8899aa;">🛒 السلة فارغة</div>';
        if (totalSpan) totalSpan.innerText = '0 دينار';
        return;
    }
    
    let total = 0;
    let html = '';
    
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        total += item.price * item.quantity;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 2px solid #eef2f6; flex-wrap: wrap; gap: 15px;">
                <div style="min-width: 140px; flex: 2;">
                    <strong style="font-size: 1.05rem;">${item.name}</strong><br>
                    <small style="color: #64748b;">${item.price.toLocaleString()} دينار</small>
                </div>
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: nowrap;">
                    <div style="display: flex; align-items: center; gap: 12px; background: #f1f5f9; padding: 5px 15px; border-radius: 60px;">
                        <button onclick="changeQty(${item.id}, -1)" style="width: 55px; height: 55px; border-radius: 50%; border: none; background: white; cursor: pointer; font-size: 2rem; font-weight: bold; color: #0284c7;">-</button>
                        <span style="font-size: 1.4rem; font-weight: bold; min-width: 45px; text-align: center;">${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)" style="width: 55px; height: 55px; border-radius: 50%; border: none; background: white; cursor: pointer; font-size: 2rem; font-weight: bold; color: #0284c7;">+</button>
                    </div>
                    <div style="min-width: 110px; text-align: center;">
                        <span style="font-weight: bold; font-size: 1.1rem; color: #0284c7;">${(item.price * item.quantity).toLocaleString()} دينار</span>
                    </div>
                    <button onclick="removeFromCart(${item.id})" style="background: #fee2e2; border: none; width: 55px; height: 55px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; color: #e63946; display: flex; align-items: center; justify-content: center;">🗑️</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    if (totalSpan) totalSpan.innerText = total.toLocaleString() + ' دينار';
}

window.changeQty = function(id, d) {
    const i = cart.find(i => i.id == id);
    const p = products.find(p => p.id == id);
    if (i) {
        const n = i.quantity + d;
        if (n <= 0) cart = cart.filter(x => x.id != id);
        else if (p && n <= p.stock) i.quantity = n;
        else { alert("الكمية غير متوفرة"); return; }
        saveCart();
        renderCartPage();
    }
};

window.removeFromCart = (id) => { 
    cart = cart.filter(i => i.id != id); 
    saveCart(); 
    renderCartPage(); 
};

// ==========================================
// دوال صفحة تفاصيل المنتج
// ==========================================

function getCurrentProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

async function loadProductDetail() {
    const container = document.getElementById('product-detail-content');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        container.innerHTML = '<div class="error-detail">❌ لم يتم تحديد المنتج</div>';
        return;
    }
    
    let product = products.find(p => p.id == parseInt(productId));
    
    if (!product && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .eq('id', parseInt(productId))
                .single();
            if (!error && data) product = data;
        } catch(e) { console.log(e); }
    }
    
    if (!product) {
        container.innerHTML = '<div class="error-detail">❌ المنتج غير موجود</div>';
        return;
    }
    
    const category = categories.find(c => c.id == product.category_id);
    const inStock = product.stock > 0;
    
    container.innerHTML = `
        <div class="product-detail-container">
            <div class="product-detail-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-detail-info">
                <span class="product-detail-category">${category ? category.icon + ' ' + category.name : 'منتج'}</span>
                <h1>${product.name}</h1>
                <div class="product-detail-price">${product.price.toLocaleString()} دينار</div>
                <div class="product-detail-stock">
                    ${inStock ? `✅ متوفر (${product.stock} قطعة)` : '❌ غير متوفر حالياً'}
                </div>
                <div class="product-detail-description">
                    ${product.description || 'وصف المنتج غير متوفر حالياً. يرجى الاتصال بنا للحصول على تفاصيل إضافية.'}
                </div>
                <div class="quantity-selector">
                    <label>الكمية:</label>
                    <div class="quantity-control-detail">
                        <button onclick="changeDetailQuantity(-1)">-</button>
                        <span id="detail-quantity">1</span>
                        <button onclick="changeDetailQuantity(1)">+</button>
                    </div>
                </div>
                <button class="add-to-cart-detail" onclick="addProductToCart(${product.id})">
                    🛒 إضافة إلى السلة
                </button>
                <a href="products.html" class="back-to-products">← العودة إلى المنتجات</a>
            </div>
        </div>
    `;
}

function changeDetailQuantity(delta) {
    const productId = getCurrentProductId();
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const newQty = detailQuantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
        detailQuantity = newQty;
        const qtySpan = document.getElementById('detail-quantity');
        if (qtySpan) qtySpan.innerText = detailQuantity;
    } else if (newQty < 1) {
        // لا شيء
    } else {
        alert(`⚠️ الكمية المتاحة: ${product.stock} قطعة فقط`);
    }
}

function addProductToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id == productId);
    if (existing) {
        if (existing.quantity + detailQuantity <= product.stock) {
            existing.quantity += detailQuantity;
        } else {
            alert(`⚠️ الكمية المتاحة: ${product.stock} قطعة فقط`);
            return;
        }
    } else {
        if (detailQuantity <= product.stock) {
            cart.push({ ...product, quantity: detailQuantity });
        } else {
            alert(`⚠️ الكمية المتاحة: ${product.stock} قطعة فقط`);
            return;
        }
    }
    
    saveCart();
    alert(`✅ تم إضافة ${detailQuantity} × ${product.name} إلى السلة`);
    detailQuantity = 1;
    const qtySpan = document.getElementById('detail-quantity');
    if (qtySpan) qtySpan.innerText = detailQuantity;
    
    if (document.getElementById('cart-items-list')) renderCartPage();
}

// ==========================================
// إرسال الطلب عبر واتساب
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
// بدء تشغيل المتجر
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (document.getElementById('order-form')) document.getElementById('order-form').addEventListener('submit', sendOrderToWhatsApp);
    const filter = document.getElementById('category-filter');
    if (filter) filter.addEventListener('change', (e) => renderProducts('all-products', e.target.value));
});
