// ==================================================
// هذا الكود خاص بالزبون الذي يتصفح المتجر
// ==================================================

// ------------------------
// 1. إعداد الاتصال بقاعدة البيانات (Supabase)
// ------------------------

// رابط مشروع Supabase الخاص بك (من إعدادات المشروع)
const SUPABASE_URL = "https://ymfxhrbjqubgpgxzh oqx.supabase.co";

// المفتاح العام (anon key) - يسمح فقط بقراءة البيانات
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

// إنشاء عميل Supabase للاتصال بقاعدة البيانات
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------
// 2. المتغيرات العامة (حيث نخزن البيانات مؤقتاً)
// ------------------------

let products = [];      // قائمة المنتجات (ستأتي من قاعدة البيانات)
let categories = [];    // قائمة الأقسام (ستأتي من قاعدة البيانات)
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];  // سلة المشتريات (تحفظ في المتصفح)

// ------------------------
// 3. دوال التحميل من قاعدة البيانات
// ------------------------

// دالة لتحميل المنتجات من Supabase
async function loadProducts() {
    try {
        // استعلام لجلب جميع المنتجات من جدول products
        const { data, error } = await supabase
            .from('products')        // اسم الجدول في قاعدة البيانات
            .select('*')             // نختار جميع الأعمدة
            .order('id', { ascending: true });  // نرتب حسب المعرف
        
        if (error) throw error;      // إذا حدث خطأ، نوقف التنفيذ
        products = data;             // نخزن البيانات في المتغير products
        console.log("✅ تم تحميل المنتجات:", products.length);
    } catch (error) {
        console.error("❌ خطأ في تحميل المنتجات:", error);
        // في حالة الخطأ، نستخدم بيانات افتراضية
        products = [
            { id: 1, name: "ساعة ذكية", price: 45000, image: "https://placehold.co/400x400/0077b6/white?text=ساعة", category_id: 1, stock: 10 }
        ];
    }
}

// دالة لتحميل الأقسام من Supabase
async function loadCategories() {
    try {
        // استعلام لجلب جميع الأقسام من جدول categories
        const { data, error } = await supabase
            .from('categories')      // اسم الجدول في قاعدة البيانات
            .select('*')             // نختار جميع الأعمدة
            .order('id', { ascending: true });
        
        if (error) throw error;
        categories = data;
        console.log("✅ تم تحميل الأقسام:", categories.length);
    } catch (error) {
        console.error("❌ خطأ في تحميل الأقسام:", error);
        // بيانات افتراضية في حالة الخطأ
        categories = [
            { id: 1, name: "أجهزة كهربائية", icon: "🔌" },
            { id: 2, name: "مواد منزلية", icon: "🏠" }
        ];
    }
}

// ------------------------
// 4. دوال السلة (تخزين محلي في المتصفح)
// ------------------------

// حفظ السلة في ذاكرة المتصفح (localStorage)
function saveCart() {
    localStorage.setItem('makani_cart', JSON.stringify(cart));
    updateCartCount();  // تحديث العداد الذي يظهر بجانب أيقونة السلة
}

// تحديث عدد المنتجات في أيقونة السلة
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(badge => {
        if (badge) badge.innerText = count;
    });
}

// إضافة منتج إلى السلة
function addToCart(productId) {
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
    renderCartPage();  // تحديث صفحة السلة إذا كنا فيها
}

// تنسيق السعر (إضافة فواصل آلاف وكتابة "دينار")
function formatPrice(price) {
    return price.toLocaleString() + ' دينار';
}

// عرض المنتجات في الصفحة
function renderProducts(containerId, filterCategory = null, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // فلترة المنتجات حسب القسم إذا طُلب ذلك
    let productsToShow = [...products];
    if (filterCategory && filterCategory !== 'all') {
        productsToShow = productsToShow.filter(p => p.category_id == filterCategory);
    }
    if (limit) {
        productsToShow = productsToShow.slice(0, limit);
    }
    
    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="text-align:center">✨ لا توجد منتجات في هذا القسم حالياً</p>';
        return;
    }
    
    // إنشاء بطاقات المنتجات
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

// عرض الأقسام في الصفحة الرئيسية
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (grid) {
        grid.innerHTML = categories.map(category => `
            <a href="products.html?cat=${category.id}" class="category-card">
                <div class="category-icon">${category.icon}</div>
                <h3>${category.name}</h3>
            </a>
        `).join('');
    }
    
    // تحديث قائمة الفلتر في صفحة المنتجات
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.innerHTML = '<option value="all">📂 جميع الأقسام</option>' + 
            categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
}

// عرض محتويات السلة في صفحة السلة
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
                <div style="flex:2">
                    <strong>${item.name}</strong><br>
                    <small>${formatPrice(item.price)}</small>
                </div>
                <div class="quantity-control">
                    <button onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span style="min-width:30px; text-align:center;">${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:#e63946; font-size:1.2rem; cursor:pointer;">🗑️</button>
                </div>
                <div style="min-width:100px; text-align:left;">
                    <strong>${formatPrice(item.price * item.quantity)}</strong>
                </div>
            </div>
        `;
    }).join('');
    if (totalSpan) totalSpan.innerText = formatPrice(total);
}

// تغيير كمية منتج في السلة
function changeQuantity(id, delta) {
    const item = cart.find(i => i.id == id);
    const product = products.find(p => p.id == id);
    if (item) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
            cart = cart.filter(i => i.id != id);
        } else if (product && newQuantity <= product.stock) {
            item.quantity = newQuantity;
        } else {
            alert("⚠️ الكمية غير متوفرة في المخزون");
            return;
        }
        saveCart();
        renderCartPage();
    }
}

// حذف منتج من السلة بالكامل
function removeFromCart(id) {
    cart = cart.filter(i => i.id != id);
    saveCart();
    renderCartPage();
}

// إرسال الطلب عبر واتساب (الدالة الرئيسية)
function sendOrderToWhatsApp(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        alert("⚠️ السلة فارغة، أضف منتجات أولاً");
        return;
    }
    
    // جلب بيانات العميل من النموذج
    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const address = document.getElementById('customer-address')?.value;
    
    if (!name || !phone || !address) {
        alert("⚠️ يرجى ملء جميع الحقول: الاسم، الجوال، العنوان");
        return;
    }
    
    // حساب المجموع الكلي
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // بناء الرسالة التي ستُرسل إلى واتساب
    let message = `🛍️ طلب جديد من مكاني ستور\n\n`;
    message += `👤 الاسم: ${name}\n`;
    message += `📱 الجوال: ${phone}\n`;
    message += `📍 العنوان: ${address}\n`;
    message += `━━━━━━━━━━━━\n`;
    message += `المنتجات:\n`;
    
    cart.forEach(item => {
        message += `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} دينار\n`;
    });
    
    message += `━━━━━━━━━━━━\n`;
    message += `💰 الإجمالي: ${total.toLocaleString()} دينار\n`;
    message += `💵 طريقة الدفع: الدفع عند الاستلام\n`;
    message += `📅 ${new Date().toLocaleString('ar-IQ')}`;
    
    // ⚠️ استبدل هذا الرقم برقم واتساب أعمالك (عراقي، بدون 0 في البداية)
    const whatsappNumber = "964700000000";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // فتح واتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
    
    // تفريغ السلة بعد إرسال الطلب
    cart = [];
    saveCart();
    
    alert("✅ سيتم فتح واتساب الآن. أرسل الرسالة لتأكيد الطلب");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

// ------------------------
// 5. دالة التشغيل الرئيسية (تُنفذ عند فتح الصفحة)
// ------------------------

async function initializePage() {
    await loadCategories();   // أولاً: تحميل الأقسام
    await loadProducts();     // ثانياً: تحميل المنتجات
    
    renderCategories();       // عرض الأقسام
    
    // عرض المنتجات حسب الصفحة التي نحن فيها
    if (document.getElementById('featured-products')) {
        renderProducts('featured-products', null, 4);  // 4 منتجات مميزة فقط
    }
    
    if (document.getElementById('all-products')) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('cat');
        renderProducts('all-products', categoryId);
        
        // إضافة مستمع لحدث تغيير الفلتر
        const filter = document.getElementById('category-filter');
        if (filter) {
            filter.addEventListener('change', (e) => {
                renderProducts('all-products', e.target.value);
            });
        }
    }
    
    if (document.getElementById('cart-items-list')) {
        renderCartPage();
    }
    
    updateCartCount();
}

// بدء تشغيل المتجر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    
    // إضافة مستمع لحدث إرسال نموذج الطلب
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', sendOrderToWhatsApp);
    }
});
