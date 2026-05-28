// ==================================================
// script.js - ملف المتجر الرئيسي (نسخة العمل النهائية)
// ==================================================

// ------------------------
// 1. إعداد الاتصال بقاعدة البيانات (Supabase)
// ------------------------

// استخدم نفس الرابط والمفتاح الذي يعمل في admin.js
const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------
// 2. المتغيرات العامة
// ------------------------
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

// ------------------------
// 3. دوال تحميل البيانات (محدثة)
// ------------------------

// دالة لتحميل المنتجات
async function loadProducts() {
    console.log("جاري تحميل المنتجات...");
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("خطأ في تحميل المنتجات:", error);
        products = []; // اتركها فارغة بدلاً من بيانات افتراضية
    } else {
        products = data || [];
        console.log("تم تحميل المنتجات:", products.length);
    }
    // إعادة رسم المنتجات بعد التحميل
    renderAllProducts();
}

// دالة لتحميل الأقسام
async function loadCategories() {
    console.log("جاري تحميل الأقسام...");
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("خطأ في تحميل الأقسام:", error);
        categories = [];
    } else {
        categories = data || [];
        console.log("تم تحميل الأقسام:", categories.length);
    }
    renderCategories(); // عرض الأقسام فور تحميلها
}

// دالة مساعدة لإعادة رسم كل شيء بعد تحميل البيانات
function renderAllProducts() {
    // الصفحة الرئيسية: المنتجات المميزة
    if (document.getElementById('featured-products')) {
        renderProducts('featured-products', null, 4);
    }
    // صفحة جميع المنتجات
    if (document.getElementById('all-products')) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('cat');
        renderProducts('all-products', categoryId);
    }
    // تحديث عداد السلة
    updateCartCount();
}

// ------------------------
// 4. دوال العرض (بدون تغيير)
// ------------------------
function formatPrice(price) {
    return price.toLocaleString() + ' دينار';
}

function renderProducts(containerId, filterCategory = null, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let productsToShow = [...products];
    if (filterCategory && filterCategory !== 'all') {
        productsToShow = productsToShow.filter(p => p.category_id == filterCategory);
    }
    if (limit) {
        productsToShow = productsToShow.slice(0, limit);
    }

    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px;">✨ لا توجد منتجات في هذا القسم حالياً</p>';
        return;
    }

    container.innerHTML = productsToShow.map(product => {
        const category = categories.find(c => c.id == product.category_id);
        return `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <div class="price">${formatPrice(product.price)}</div>
                <small>${category ? category.icon + ' ' + category.name : 'بدون قسم'}</small><br>
                <small>المتبقي: ${product.stock} قطعة</small>
                <button class="add-to-cart" onclick="addToCart(${product.id})">➕ أضف للسلة</button>
            </div>
        `;
    }).join('');
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (grid) {
        if (categories.length === 0) {
            grid.innerHTML = '<p style="text-align:center;">لا توجد أقسام مضافة بعد</p>';
            return;
        }
        grid.innerHTML = categories.map(category => `
            <a href="products.html?cat=${category.id}" class="category-card">
                <div class="category-icon">${category.icon}</div>
                <h3>${category.name}</h3>
            </a>
        `).join('');
    }

    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">📂 جميع الأقسام</option>' +
            categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
}

// ------------------------
// 5. دوال السلة (بدون تغيير)
// ------------------------
function saveCart() {
    localStorage.setItem('makani_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(badge => {
        if (badge) badge.innerText = count;
    });
}

window.addToCart = function(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const existing = cart.find(item => item.id == productId);
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            alert("⚠️ الكمية غير متوفرة في المخزون");
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1 });
        } else {
            alert("⚠️ هذا المنتج غير متوفر حالياً");
            return;
        }
    }
    saveCart();
    alert(`✅ تم إضافة ${product.name} إلى السلة`);
    if (document.getElementById('cart-items-list')) renderCartPage();
};

function renderCartPage() {
    const container = document.getElementById('cart-items-list');
    const totalSpan = document.getElementById('cart-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px;">🛒 السلة فارغة حالياً</p>';
        if (totalSpan) totalSpan.innerText = '0 دينار';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div style="flex:2"><strong>${item.name}</strong><br><small>${formatPrice(item.price)}</small></div>
                <div class="quantity-control">
                    <button onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})">🗑️</button>
                </div>
                <div>${formatPrice(item.price * item.quantity)}</div>
            </div>
        `;
    }).join('');
    if (totalSpan) totalSpan.innerText = formatPrice(total);
}

window.changeQuantity = function(id, delta) {
    const item = cart.find(i => i.id == id);
    const product = products.find(p => p.id == id);
    if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            cart = cart.filter(i => i.id != id);
        } else if (product && newQty <= product.stock) {
            item.quantity = newQty;
        } else {
            alert("⚠️ الكمية غير متوفرة");
            return;
        }
        saveCart();
        renderCartPage();
    }
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id != id);
    saveCart();
    renderCartPage();
};

function sendOrderToWhatsApp(event) {
    event.preventDefault();
    if (cart.length === 0) { alert("⚠️ السلة فارغة"); return; }

    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const address = document.getElementById('customer-address')?.value;
    if (!name || !phone || !address) { alert("⚠️ يرجى ملء جميع الحقول"); return; }

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let message = `🛍️ طلب جديد من مكاني ستور\n\n👤 الاسم: ${name}\n📱 الجوال: ${phone}\n📍 العنوان: ${address}\n━━━━━━━━━━━━\nالمنتجات:\n`;
    cart.forEach(i => { message += `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString()} دينار\n`; });
    message += `━━━━━━━━━━━━\n💰 الإجمالي: ${total.toLocaleString()} دينار\n💵 الدفع عند الاستلام`;

    const whatsappNumber = "964700000000"; // ⚠️ غير هذا الرقم
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    cart = []; saveCart();
    alert("✅ سيتم فتح واتساب...");
    setTimeout(() => window.location.href = "index.html", 1500);
}

// ------------------------
// 6. تشغيل المتجر
// ------------------------
async function initializeSite() {
    await loadCategories();
    await loadProducts();
    if (document.getElementById('cart-items-list')) renderCartPage();

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', sendOrderToWhatsApp);
    
    // إضافة مستمع تغيير الفلتر لصفحة المنتجات
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.addEventListener('change', (e) => renderProducts('all-products', e.target.value));
    }
}

document.addEventListener('DOMContentLoaded', initializeSite);
