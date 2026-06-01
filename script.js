// ==================================================
// script.js - المتجر يقرأ من Supabase مباشرة (سريع)
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
    console.log("✅ Supabase connected");
}

// ==========================================
// تحميل البيانات من Supabase
// ==========================================
async function loadData() {
    console.log("🚀 بدء التحميل من Supabase...");
    
    // جلب الأقسام
    const { data: catData } = await supabase.from('categories').select('*').order('id');
    categories = catData || [];
    renderCategories();
    
    // جلب المنتجات
    const { data: prodData } = await supabase.from('products').select('*').order('id');
    products = prodData || [];
    
    renderProducts();
    loadFeaturedProducts();
    updateCartCount();
    
    console.log(`✅ تم تحميل ${products.length} منتج و ${categories.length} قسم`);
}

// عرض جميع المنتجات
function renderProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="loading">✨ لا توجد منتجات. أضف منتجاتك من لوحة التحكم</div>';
        return;
    }

    container.innerHTML = products.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        
        return `
            <div class="product-card" onclick="goToProduct(${p.id})">
                <img src="${imageUrl}" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3>${p.name}</h3>
                <div class="price">${p.price.toLocaleString()} دينار</div>
                <small>${cat ? cat.name : ''}</small>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">➕ أضف للسلة</button>
            </div>
        `;
    }).join('');
}

// المنتجات المميزة (أول 4)
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    const featured = products.slice(0, 4);
    if (featured.length === 0) {
        container.innerHTML = '<div class="loading">✨ لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = featured.map(p => {
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        return `
            <div class="product-card" onclick="goToProduct(${p.id})">
                <img src="${imageUrl}" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3>${p.name}</h3>
                <div class="price">${p.price.toLocaleString()} دينار</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">➕ أضف</button>
            </div>
        `;
    }).join('');
}

// عرض الأقسام
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    if (!categories.length) {
        grid.innerHTML = '<div class="loading">⏳ جاري تحميل الأقسام...</div>';
        return;
    }
    
    grid.innerHTML = categories.map(c => `
        <a href="products.html?cat=${c.id}" class="category-card">
            <div class="category-icon">${c.icon || '📁'}</div>
            <h3>${c.name}</h3>
        </a>
    `).join('');
    
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">جميع الأقسام</option>' + 
            categories.map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('');
        
        filter.onchange = async function() {
            const catId = this.value === 'all' ? null : this.value;
            if (catId && catId !== 'all') {
                const { data } = await supabase.from('products').select('*').eq('category_id', parseInt(catId));
                products = data || [];
                renderProducts();
                const categoryName = categories.find(c => c.id == parseInt(catId))?.name;
                const titleEl = document.querySelector('.products-header h2');
                if (titleEl && categoryName) titleEl.innerHTML = `📦 منتجات ${categoryName}`;
            } else {
                const { data } = await supabase.from('products').select('*').order('id');
                products = data || [];
                renderProducts();
                const titleEl = document.querySelector('.products-header h2');
                if (titleEl) titleEl.innerHTML = `📦 جميع المنتجات`;
            }
        };
    }
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
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    const exist = cart.find(i => i.id == id);
    if (exist) { exist.quantity += qty; } 
    else { cart.push({ ...product, quantity: qty }); }
    saveCart(); 
    alert(`✅ تم إضافة ${product.name}`);
    if (document.getElementById('cart-items-list')) renderCartPage();
};

function renderCartPage() {
    const container = document.getElementById('cart-items-list');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = '<div class="empty-cart">🛒 السلة فارغة</div>';
        if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = '0 دينار';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} دينار</small></div>
                <div>
                    <button onclick="changeQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})">🗑️</button>
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
        renderCartPage();
    }
};
window.removeFromCart = (id) => { cart = cart.filter(i => i.id != id); saveCart(); renderCartPage(); };

// ==========================================
// صفحة تفاصيل المنتج
// ==========================================
window.goToProduct = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

function getProductId() {
    return parseInt(new URLSearchParams(window.location.search).get('id'));
}

async function loadProductDetail() {
    const container = document.getElementById('productDetail');
    if (!container) return;
    
    const id = getProductId();
    let product = products.find(p => p.id == id);
    
    if (!product) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        product = data;
    }
    
    if (!product) {
        container.innerHTML = '<div class="loading">❌ المنتج غير موجود</div>';
        return;
    }
    
    const category = categories.find(c => c.id == product.category_id);
    const imageUrl = product.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(product.name);
    
    container.innerHTML = `
        <div class="product-detail">
            <img src="${imageUrl}" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
            <div>
                <div class="category-badge">${category ? category.name : 'منتج'}</div>
                <h1>${product.name}</h1>
                <div class="product-price">${product.price.toLocaleString()} دينار</div>
                <div class="product-description">${product.description || 'لا يوجد وصف متاح'}</div>
                <div class="quantity">
                    <button onclick="changeDetailQty(-1)">-</button>
                    <span id="detailQty">1</span>
                    <button onclick="changeDetailQty(1)">+</button>
                </div>
                <button class="add-btn" onclick="addToCartFromDetail(${product.id})">🛒 إضافة إلى السلة</button>
                <a href="products.html" class="back-link">← العودة إلى المنتجات</a>
            </div>
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

// ==========================================
// إرسال الطلب عبر واتساب
// ==========================================
function sendOrder(e) {
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
// بدء التشغيل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', sendOrder);
    if (document.getElementById('productDetail')) loadProductDetail();
    if (document.getElementById('cart-items-list')) renderCartPage();
});
