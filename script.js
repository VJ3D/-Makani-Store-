// ==================================================
// script.js - المتجر يقرأ المنتجات من API مباشرة
// ==================================================

const API_TOKEN = "t1JI0lA";
const API_BASE_URL = "https://rolemall.com/api";

let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let currentPage = 1;
let isLoading = false;
let hasMore = true;
const PRODUCTS_PER_PAGE = 20;

// ==========================================
// جلب المنتجات من API
// ==========================================
async function fetchProducts(page = 1, limit = PRODUCTS_PER_PAGE) {
    try {
        const url = `${API_BASE_URL}/products/?token=${API_TOKEN}&page=${page}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // استخراج المنتجات من الاستجابة
        let productsArray = [];
        if (data && data.data && data.data.products) {
            productsArray = data.data.products;
        } else if (data && data.products) {
            productsArray = data.products;
        } else if (Array.isArray(data)) {
            productsArray = data;
        }
        
        return productsArray.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price || p.sale_price || 0,
            image: p.img || p.image || p.main_image,
            description: p.description || p.body || 'لا يوجد وصف',
            category_id: p.category_id
        }));
    } catch (error) {
        console.error("خطأ:", error);
        return [];
    }
}

// ==========================================
// جلب الأقسام من API
// ==========================================
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`);
        const data = await response.json();
        
        let categoriesArray = [];
        if (data && data.data && data.data.categories) {
            categoriesArray = data.data.categories;
        } else if (data && data.categories) {
            categoriesArray = data.categories;
        } else if (Array.isArray(data)) {
            categoriesArray = data;
        }
        
        return categoriesArray.map(c => ({
            id: c._id || c.id,
            name: c.name,
            image: c.img || c.image
        }));
    } catch (error) {
        console.error("خطأ:", error);
        return [];
    }
}

// ==========================================
// تحميل البيانات
// ==========================================
async function loadData() {
    console.log("🚀 جلب المنتجات من API...");
    
    // جلب الأقسام
    categories = await fetchCategories();
    renderCategories();
    
    // جلب المنتجات
    const newProducts = await fetchProducts(1, PRODUCTS_PER_PAGE);
    products = newProducts;
    currentPage = 1;
    hasMore = newProducts.length === PRODUCTS_PER_PAGE;
    
    renderProducts();
    await loadFeaturedProducts();
    updateCartCount();
}

async function loadMore() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    
    const nextPage = currentPage + 1;
    const newProducts = await fetchProducts(nextPage, PRODUCTS_PER_PAGE);
    
    if (newProducts.length > 0) {
        products = [...products, ...newProducts];
        currentPage = nextPage;
        hasMore = newProducts.length === PRODUCTS_PER_PAGE;
        renderProducts();
    } else {
        hasMore = false;
    }
    isLoading = false;
}

function renderProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ جاري تحميل المنتجات...</div>';
        return;
    }

    container.innerHTML = products.map(p => {
        const cat = categories.find(c => c.id == p.category_id);
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        
        return `
            <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer;" onclick="goToProductDetail(${p.id})">
                <img src="${imageUrl}" style="width:100%; height:160px; object-fit:cover; border-radius:16px;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3>${p.name}</h3>
                <div class="price">${p.price.toLocaleString()} دينار</div>
                <small>${cat ? cat.name : ''}</small><br>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id});">➕ أضف للسلة</button>
            </div>
        `;
    }).join('');
}

async function loadFeaturedProducts() {
    const featured = await fetchProducts(1, 4);
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    container.innerHTML = featured.map(p => {
        const imageUrl = p.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(p.name);
        return `
            <div class="product-card" style="background:white; border-radius:24px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); cursor:pointer;" onclick="goToProductDetail(${p.id})">
                <img src="${imageUrl}" style="width:100%; height:160px; object-fit:cover; border-radius:16px;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
                <h3>${p.name}</h3>
                <div class="price">${p.price.toLocaleString()} دينار</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id});">➕ أضف</button>
            </div>
        `;
    }).join('');
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    if (!categories.length) {
        grid.innerHTML = '<div style="text-align:center; padding:40px;">⏳ جاري تحميل الأقسام...</div>';
        return;
    }
    
    grid.innerHTML = categories.map(c => `
        <a href="products.html?cat=${c.id}" class="category-card">
            <div class="category-icon">📁</div>
            <h3>${c.name}</h3>
        </a>
    `).join('');
    
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">جميع الأقسام</option>' + 
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        filter.onchange = async function() {
            const catId = this.value === 'all' ? null : this.value;
            if (catId) {
                const filtered = await fetchProducts(1, 200);
                products = filtered.filter(p => p.category_id == catId);
                renderProducts();
            } else {
                await loadData();
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
                <button onclick="changeQty(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQty(${item.id}, 1)">+</button>
                <button onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
            <div>${(item.price * item.quantity).toLocaleString()} دينار</div>
        </div>`;
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
        const allProducts = await fetchProducts(1, 500);
        product = allProducts.find(p => p.id == productId);
        if (product) products = allProducts;
    }
    
    if (!product) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">❌ المنتج غير موجود</div>';
        return;
    }
    
    const category = categories.find(c => c.id == product.category_id);
    const imageUrl = product.image || 'https://placehold.co/400x400/0284c7/white?text=' + encodeURIComponent(product.name);
    
    container.innerHTML = `
        <div style="background:white; border-radius:30px; padding:30px; margin:40px 0;">
            <div style="text-align:center;">
                <img src="${imageUrl}" style="max-width:100%; border-radius:20px;" onerror="this.src='https://placehold.co/400x400/0284c7/white?text=صورة'">
            </div>
            <h1 style="margin:20px 0 10px;">${product.name}</h1>
            <div style="color:#0284c7; font-size:2rem; font-weight:bold;">${product.price.toLocaleString()} دينار</div>
            <div style="color:#475569; margin:20px 0;">${product.description}</div>
            <div style="display:flex; align-items:center; gap:15px; margin:20px 0;">
                <button onclick="changeDetailQty(-1)" style="width:45px; height:45px; border-radius:50%; background:#f1f5f9; border:none;">-</button>
                <span id="detailQty" style="font-size:1.3rem;">1</span>
                <button onclick="changeDetailQty(1)" style="width:45px; height:45px; border-radius:50%; background:#f1f5f9; border:none;">+</button>
            </div>
            <button onclick="addToCartFromDetail(${product.id})" style="background:#0284c7; color:white; border:none; padding:15px 30px; border-radius:50px; width:100%; font-size:1.1rem;">🛒 إضافة إلى السلة</button>
            <a href="products.html" style="display:inline-block; margin-top:20px;">← العودة</a>
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
    window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300) {
            loadMore();
        }
    });
});
