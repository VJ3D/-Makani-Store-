// ==================================================
// script.js - المتجر الرئيسي مع الصور الحقيقية
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentCategoryFilter = null;
const PRODUCTS_PER_PAGE = 12;

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase connected");
}

// ==========================================
// جلب المنتجات
// ==========================================
async function fetchProductsPage(page, limit = PRODUCTS_PER_PAGE) {
    try {
        const from = page * limit;
        const to = from + limit - 1;
        
        let query = supabaseClient
            .from('products')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('id');
        
        if (currentCategoryFilter) {
            query = query.eq('category_id', currentCategoryFilter);
        }
        
        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data || [], total: count };
    } catch (error) {
        console.error("خطأ:", error);
        return { data: [], total: 0 };
    }
}

async function loadInitialProducts() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);
    
    try {
        const result = await fetchProductsPage(0, PRODUCTS_PER_PAGE);
        products = result.data;
        currentPage = 0;
        hasMore = products.length === PRODUCTS_PER_PAGE;
        renderProducts();
    } catch (error) {
        console.error("خطأ:", error);
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

async function loadMoreProducts() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    showLoading(true);
    
    try {
        const nextPage = currentPage + 1;
        const result = await fetchProductsPage(nextPage, PRODUCTS_PER_PAGE);
        if (result.data.length > 0) {
            products = [...products, ...result.data];
            currentPage = nextPage;
            hasMore = result.data.length === PRODUCTS_PER_PAGE;
            renderProducts();
        } else {
            hasMore = false;
        }
    } catch (error) {
        console.error("خطأ:", error);
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

function renderProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ لا توجد منتجات</div>';
        return;
    }

    container.innerHTML = products.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        // الصورة الحقيقية من قاعدة البيانات
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        
        return `
            <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s;" onclick="goToProductDetail(${p.id})">
                <img src="${imageUrl}" style="width:100%; height:160px; object-fit:cover; border-radius:16px; background:#f1f5f9;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3 style="margin:12px 0 5px; font-size:1rem;">${p.name}</h3>
                <div style="color:#0284c7; font-weight:bold; font-size:1.2rem;">${p.price.toLocaleString()} دينار</div>
                <small>${cat ? cat.name : ''}</small><br>
                <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف للسلة</button>
            </div>
        `;
    }).join('');
}

// ==========================================
// عرض الأقسام
// ==========================================
async function loadCategories() {
    const { data } = await supabaseClient.from('categories').select('*').order('id');
    categories = data || [];
    
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    if (!categories.length) {
        grid.innerHTML = '<div style="text-align:center; padding:40px;">⏳ جاري تحميل الأقسام...</div>';
        return;
    }
    
    grid.innerHTML = categories.map(c => `
        <a href="products.html?cat=${c.id}" class="category-card" style="text-decoration: none; display: block; background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size:2rem; margin-bottom:10px;">📁</div>
            <h3 style="font-size:0.9rem; margin:0;">${c.name}</h3>
        </a>
    `).join('');
    
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">جميع الأقسام</option>' + 
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        filter.onchange = async function() {
            const catId = this.value === 'all' ? null : this.value;
            const titleElement = document.querySelector('.products-header h2');
            
            if (catId && catId !== 'all') {
                currentCategoryFilter = parseInt(catId);
                const categoryName = categories.find(c => c.id == currentCategoryFilter)?.name || 'القسم';
                if (titleElement) titleElement.innerHTML = `📦 منتجات ${categoryName}`;
                products = [];
                currentPage = 0;
                hasMore = true;
                await loadInitialProducts();
            } else {
                currentCategoryFilter = null;
                if (titleElement) titleElement.innerHTML = `📦 جميع المنتجات`;
                products = [];
                currentPage = 0;
                hasMore = true;
                await loadInitialProducts();
            }
        };
    }
}

async function loadFeaturedProducts() {
    const { data } = await supabaseClient
        .from('products')
        .select('*')
        .limit(4);
    
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = data.map(p => {
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        return `
            <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer;" onclick="goToProductDetail(${p.id})">
                <img src="${imageUrl}" style="width:100%; height:160px; object-fit:cover; border-radius:16px;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3 style="margin:12px 0 5px;">${p.name}</h3>
                <div style="color:#0284c7; font-weight:bold;">${p.price.toLocaleString()} دينار</div>
                <button onclick="event.stopPropagation(); addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px 16px; border-radius:30px; cursor:pointer; width:100%; margin-top:10px;">➕ أضف</button>
            </div>
        `;
    }).join('');
}

// ==========================================
// مؤشر التحميل
// ==========================================
let loadingDiv = null;

function showLoading(show) {
    if (show) {
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-indicator';
            loadingDiv.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#0284c7; color:white; padding:10px 20px; border-radius:30px; z-index:9999; font-size:14px;';
            loadingDiv.innerHTML = '⏳ جاري تحميل المزيد...';
            document.body.appendChild(loadingDiv);
        }
        loadingDiv.style.display = 'block';
    } else {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300) {
            loadMoreProducts();
        }
    });
}

// ==========================================
// تحميل البيانات الرئيسي
// ==========================================
async function loadData() {
    console.log("🚀 بدء التشغيل...");
    
    await loadCategories();
    await loadFeaturedProducts();
    
    if (document.getElementById('all-products')) {
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('cat');
        
        if (catParam && catParam !== 'all') {
            currentCategoryFilter = parseInt(catParam);
            const categoryName = categories.find(c => c.id == currentCategoryFilter)?.name || 'القسم';
            const titleElement = document.querySelector('.products-header h2');
            if (titleElement) titleElement.innerHTML = `📦 منتجات ${categoryName}`;
            
            const filter = document.getElementById('category-filter');
            if (filter) filter.value = catParam;
        }
        
        await loadInitialProducts();
        setupInfiniteScroll();
    }
    
    if (document.getElementById('cart-items-list')) {
        renderCartPage();
    }
    if (document.getElementById('product-detail-content')) {
        loadProductDetail();
    }
    updateCartCount();
}

// ==========================================
// دوال السلة
// ==========================================
function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { 
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(b => { if (b) b.innerText = count; }); 
}

window.addToCart = function(id) {
    const p = products.find(p => p.id == id);
    if (!p) return;
    const exist = cart.find(i => i.id == id);
    if (exist) { exist.quantity++; } 
    else { cart.push({ ...p, quantity: 1 }); }
    saveCart(); 
    alert(`✅ تم إضافة ${p.name}`);
    if (document.getElementById('cart-items-list')) renderCartPage();
};

function renderCartPage() {
    const container = document.getElementById('cart-items-list');
    const totalSpan = document.getElementById('cart-total');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = '<div style="text-align:center; padding:50px;">🛒 السلة فارغة</div>';
        if (totalSpan) totalSpan.innerText = '0 دينار';
        return;
    }
    let total = 0;
    let html = '';
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        total += item.price * item.quantity;
        html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eef2f6; flex-wrap: wrap; gap: 10px;">
            <div><strong>${item.name}</strong><br><small>${item.price.toLocaleString()} دينار</small></div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="changeQty(${item.id}, -1)" style="width: 44px; height: 44px; border-radius: 50%; border: none; background: #f0f4f8; cursor: pointer;">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQty(${item.id}, 1)" style="width: 44px; height: 44px; border-radius: 50%; border: none; background: #f0f4f8; cursor: pointer;">+</button>
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; font-size: 1.3rem; cursor: pointer;">🗑️</button>
            </div>
            <div>${(item.price * item.quantity).toLocaleString()} دينار</div>
        </div>`;
    }
    container.innerHTML = html;
    if (totalSpan) totalSpan.innerText = total.toLocaleString() + ' دينار';
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
function getCurrentProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

async function loadProductDetail() {
    const container = document.getElementById('product-detail-content');
    if (!container) return;
    
    const productId = getCurrentProductId();
    let product = products.find(p => p.id == productId);
    
    if (!product) {
        const { data } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        product = data;
    }
    
    if (!product) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#e63946;">❌ المنتج غير موجود</div>';
        return;
    }
    
    const category = categories.find(c => c.id == product.category_id);
    const imageUrl = product.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(product.name);
    
    container.innerHTML = `
        <div style="background:white; border-radius:32px; padding:30px; margin:40px 0; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
            <div style="text-align:center;">
                <img src="${imageUrl}" style="max-width:100%; border-radius:24px;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                ${product.extra_images && product.extra_images.length > 0 ? `
                    <div style="display:flex; gap:10px; margin-top:15px; justify-content:center;">
                        ${product.extra_images.slice(0,3).map(img => `<img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:12px;" onerror="this.src='https://placehold.co/80x80/0284c7/white?text=صورة'">`).join('')}
                    </div>
                ` : ''}
            </div>
            <div>
                <span style="display:inline-block; background:#e0f2fe; padding:6px 16px; border-radius:30px;">${category ? category.name : 'منتج'}</span>
                <h1 style="font-size:1.8rem; margin:15px 0;">${product.name}</h1>
                <div style="font-size:2rem; font-weight:bold; color:#0284c7;">${product.price.toLocaleString()} دينار</div>
                <div style="color:#475569; line-height:1.8; margin:20px 0; padding:15px 0; border-top:1px solid #eef2f6; border-bottom:1px solid #eef2f6;">
                    ${product.description || 'لا يوجد وصف متاح'}
                </div>
                <div style="display:flex; align-items:center; gap:20px; margin:25px 0;">
                    <label>الكمية:</label>
                    <div style="display:flex; align-items:center; gap:12px; background:#f1f5f9; padding:5px 15px; border-radius:60px;">
                        <button onclick="changeDetailQuantity(-1)" style="width:45px; height:45px; border-radius:50%; border:none; background:white; cursor:pointer;">-</button>
                        <span id="detail-quantity" style="font-size:1.3rem; min-width:45px; text-align:center;">1</span>
                        <button onclick="changeDetailQuantity(1)" style="width:45px; height:45px; border-radius:50%; border:none; background:white; cursor:pointer;">+</button>
                    </div>
                </div>
                <button onclick="addProductToCart(${product.id})" style="background:linear-gradient(135deg,#0284c7,#0ea5e9); color:white; border:none; padding:14px 32px; border-radius:50px; font-size:1.1rem; font-weight:bold; cursor:pointer; width:100%;">🛒 إضافة إلى السلة</button>
                <a href="products.html" style="display:inline-block; margin-top:20px; color:#0284c7;">← العودة إلى المنتجات</a>
            </div>
        </div>
    `;
}

let detailQuantity = 1;
function changeDetailQuantity(delta) {
    const newQty = detailQuantity + delta;
    if (newQty >= 1) {
        detailQuantity = newQty;
        const qtySpan = document.getElementById('detail-quantity');
        if (qtySpan) qtySpan.innerText = detailQuantity;
    }
}

function addProductToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    const existing = cart.find(item => item.id == productId);
    if (existing) { existing.quantity += detailQuantity; } 
    else { cart.push({ ...product, quantity: detailQuantity }); }
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
// دوال عامة
// ==========================================
window.goToProductDetail = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

// ==========================================
// بدء التشغيل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 بدء التشغيل");
    loadData();
    if (document.getElementById('order-form')) {
        document.getElementById('order-form').addEventListener('submit', sendOrderToWhatsApp);
    }
});
