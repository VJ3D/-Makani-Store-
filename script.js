// ==================================================
// script.js - تحميل تدريجي 12 منتج من Supabase
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabase;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentCategoryFilter = null;
const PRODUCTS_PER_PAGE = 12;

if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase connected");
}

// ==========================================
// جلب المنتجات (مع ترقيم الصفحات)
// ==========================================
async function fetchProductsPage(page, limit = PRODUCTS_PER_PAGE) {
    try {
        const from = page * limit;
        const to = from + limit - 1;
        
        let query = supabase
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

// ==========================================
// تحميل المنتجات الأولية
// ==========================================
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

// ==========================================
// تحميل المزيد عند التمرير
// ==========================================
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

// ==========================================
// عرض المنتجات
// ==========================================
function renderProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="loading">✨ لا توجد منتجات</div>';
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

// ==========================================
// المنتجات المميزة (أول 4)
// ==========================================
async function loadFeaturedProducts() {
    const { data } = await supabase
        .from('products')
        .select('*')
        .limit(4);
    
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">✨ لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = data.map(p => {
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

// ==========================================
// عرض الأقسام
// ==========================================
async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('id');
    categories = data || [];
    
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    if (!categories.length) {
        grid.innerHTML = '<div class="loading">⏳ جاري تحميل الأقسام...</div>';
        return;
    }
    
    grid.innerHTML = categories.map(c => `
        <a href="products.html?cat=${c.id}" class="category-card" style="text-decoration:none; display:block; background:white; border-radius:20px; padding:20px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="font-size:2rem;">${c.icon || '📁'}</div>
            <h3>${c.name}</h3>
        </a>
    `).join('');
    
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">جميع الأقسام</option>' + 
            categories.map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('');
        
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
    if (document.getElementById('productDetail')) {
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
    console.log("🚀 بدء التشغيل - تحميل 12 منتجاً تدريجياً");
    loadData();
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', sendOrder);
    if (document.getElementById('productDetail')) loadProductDetail();
    if (document.getElementById('cart-items-list')) renderCartPage();
});
