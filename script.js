// ==================================================
// script.js - نسخة كاملة ومصلحة ومحسنة 100%
// الإصدار: 3.0 - يدعم الصور الحقيقية وفلترة الأقسام ومعرض الصور
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4\";

let supabaseClient;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentCategoryFilter = null;
const PRODUCTS_PER_PAGE = 12;

// تهيئة الاتصال بقاعدة البيانات
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ تم الاتصال بـ Supabase بنجاح");
}

// ألوان احتياطية في حال لم تكن هناك صورة للمنتج
const fallbackColors = ['#0284c7', '#0891b2', '#059669', '#7c3aed', '#db2777'];
function getRandomColor() {
    return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
}

// --------------------------------------------------
// 1. جلب وتحميل المنتجات (الرئيسية والفلترة)
// --------------------------------------------------
async function loadInitialProducts() {
    if (!supabaseClient) return;
    currentPage = 0;
    hasMore = true;
    products = [];
    
    const container = document.getElementById('all-products') || document.getElementById('latest-products');
    if (container) {
        container.innerHTML = '<div class="loading-spinner">⏳ جاري تحميل المنتجات المحدثة...</div>';
    }
    
    await fetchProductsPage();
}

async function fetchProductsPage() {
    if (isLoading || !hasMore || !supabaseClient) return;
    isLoading = true;
    
    try {
        const from = currentPage * PRODUCTS_PER_PAGE;
        const to = from + PRODUCTS_PER_PAGE - 1;
        
        let query = supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: false })
            .range(from, to);
            
        // تطبيق الفلترة بالقسم إذا تم اختيار قسم محدد
        if (currentCategoryFilter !== null && !isNaN(currentCategoryFilter)) {
            query = query.eq('category_id', currentCategoryFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length < PRODUCTS_PER_PAGE) {
            hasMore = false;
        }
        
        if (currentPage === 0) {
            products = data || [];
        } else {
            products = products.concat(data || []);
        }
        
        currentPage++;
        renderProductsList();
        
    } catch (err) {
        console.error("❌ خطأ أثناء جلب المنتجات:", err.message);
    } finally {
        isLoading = false;
        const spinner = document.getElementById('loading-more-spinner');
        if (spinner) spinner.style.display = 'none';
    }
}

// --------------------------------------------------
// 2. عرض المنتجات في الصفحة (مع الصور الحقيقية)
// --------------------------------------------------
function renderProductsList() {
    const container = document.getElementById('all-products') || document.getElementById('latest-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products-message" style="grid-column: 1/-1; text-align: center; padding: 40px; font-size: 1.4rem; color: #64748b;">
                📦 عذراً، لا توجد منتجات في هذا القسم حالياً.
            </div>`;
        return;
    }
    
    const html = products.map(p => {
        const productImg = p.image && p.image.trim() !== "" ? p.image : "";
        const formattedPrice = Number(p.price).toLocaleString();
        
        return `
            <div class="product-card" onclick="goToProductDetail(${p.id})">
                <div class="product-image-container">
                    ${productImg ? 
                        `<img src="${productImg}" alt="${p.name}" class="product-real-image" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'product-fallback-img\\' style=\\'background:${getRandomColor()}\\'>🛍️</div>';">` : 
                        `<div class="product-fallback-img" style="background:${getRandomColor()}">🛍️</div>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-meta">
                        <span class="product-price">${formattedPrice} دينار</span>
                    </div>
                    <button class="add-to-cart-btn-fast" onclick="event.stopPropagation(); fastAddToCart(${p.id});">
                        🛒 أضف للسلة سريعاً
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // إلحاق عنصر مؤشر التحميل السفلي للـ Infinite Scroll
    if (hasMore && !document.getElementById('loading-more-spinner')) {
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'loading-more-spinner';
        spinnerDiv.className = 'loading-spinner';
        spinnerDiv.style.width = '100%';
        spinnerDiv.style.gridColumn = '1 / -1';
        spinnerDiv.innerHTML = '⏳ جاري تحميل المزيد من المنتجات...';
        container.appendChild(spinnerDiv);
    }
}

// --------------------------------------------------
// 3. جلب وعرض الأقسام وإصلاح الفلترة
// --------------------------------------------------
async function loadCategories() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
        if (error) throw error;
        categories = data || [];
        
        // 1. ملء قائمة الفلترة المنسدلة (إن وجدت في صفحة المنتجات)
        const filterSelect = document.getElementById('category-filter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">📂 جميع الأقسام</option>';
            categories.forEach(cat => {
                filterSelect.innerHTML += `<option value="${cat.id}">${cat.icon || '🏷️'} ${cat.name}</option>`;
            });
            
            // مستمع الحدث عند تغيير القسم من القائمة المنسدلة
            filterSelect.onchange = async function() {
                const catId = this.value;
                if (catId === 'all') {
                    currentCategoryFilter = null;
                } else {
                    currentCategoryFilter = parseInt(catId);
                }
                await loadInitialProducts();
            };
        }
        
        // 2. ملء أقسام الصفحة الرئيسية الدائرية (إن وجدت)
        const homeCatsContainer = document.getElementById('categories-list-home');
        if (homeCatsContainer) {
            homeCatsContainer.innerHTML = `
                <div class="category-item active" id="cat-item-all" onclick="filterByHomeCategory('all')">
                    <div class="category-icon-wrapper">🌍</div>
                    <span>الكل</span>
                </div>
            `;
            categories.forEach(cat => {
                homeCatsContainer.innerHTML += `
                    <div class="category-item" id="cat-item-${cat.id}" onclick="filterByHomeCategory(${cat.id})">
                        <div class="category-icon-wrapper">${cat.icon || '🏷️'}</div>
                        <span>${cat.name}</span>
                    </div>
                `;
            });
        }
        
    } catch (err) {
        console.error("❌ خطأ في تحميل الأقسام:", err.message);
    }
}

// دالة الفلترة عند الضغط على الأقسام الدائرية في الصفحة الرئيسية
window.filterByHomeCategory = async function(catId) {
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    
    if (catId === 'all') {
        currentCategoryFilter = null;
        document.getElementById('cat-item-all')?.classList.add('active');
    } else {
        currentCategoryFilter = parseInt(catId);
        document.getElementById(`cat-item-${catId}`)?.classList.add('active');
    }
    await loadInitialProducts();
};

// --------------------------------------------------
// 4. صفحة تفاصيل المنتج ومعرض الصور المتعددة
// --------------------------------------------------
async function loadProductDetail() {
    const detailContainer = document.getElementById('product-detail-content');
    if (!detailContainer) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId || !supabaseClient) {
        detailContainer.innerHTML = '<div class="error-msg">⚠️ لم يتم العثور على المنتج المطلوبة.</div>';
        return;
    }
    
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
            
        if (error || !product) throw new Error("المنتج غير موجود");
        
        // تجميع الصور: الصورة الرئيسية + الصور الإضافية
        let allImages = [];
        if (product.image && product.image.trim() !== "") {
            allImages.push(product.image);
        }
        
        // تحليل حقل الصور الإضافية extra_images (سواء كان مصفوفة أو نص مفصول بفواصل)
        if (product.extra_images) {
            if (Array.isArray(product.extra_images)) {
                allImages = allImages.concat(product.extra_images.filter(img => img && img.trim() !== ""));
            } else if (typeof product.extra_images === 'string') {
                const extraArr = product.extra_images.split(',').map(img => img.trim()).filter(img => img !== "");
                allImages = allImages.concat(extraArr);
            }
        }
        
        // إذا لم تكن هناك أي صورة، نضع صورة افتراضية
        if (allImages.length === 0) {
            allImages.push("");
        }
        
        const formattedPrice = Number(product.price).toLocaleString();
        
        // بناء كود المعرض والThumbnails
        let galleryHtml = '';
        if (allImages[0] !== "") {
            galleryHtml = `
                <div class="product-gallery-wrapper">
                    <div class="main-image-view">
                        <img id="main-detail-img" src="${allImages[0]}" alt="${product.name}">
                    </div>
                    ${allImages.length > 1 ? `
                        <div class="thumbnails-grid">
                            ${allImages.map((img, index) => `
                                <img src="${img}" class="thumb-img ${index === 0 ? 'active-thumb' : ''}" 
                                     onclick="changeDetailImage('${img}', this)" alt="صورة ${index + 1}">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            galleryHtml = `<div class="product-fallback-img-large" style="background:${getRandomColor()}">🛍️ لا توجد صورة متوفرة</div>`;
        }
        
        detailContainer.innerHTML = `
            <div class="product-detail-container">
                <div class="product-detail-image">
                    ${galleryHtml}
                </div>
                <div class="product-detail-info">
                    <h1 class="detail-title">${product.name}</h1>
                    <div class="detail-price-box">
                        <span class="price-label">السعر الحالي:</span>
                        <span class="detail-price-value">${formattedPrice} دينار</span>
                    </div>
                    <p class="detail-description">${product.description || 'لا يوجد وصف مفصل لهذا المنتج حالياً.'}</p>
                    
                    <div class="purchase-controls-box">
                        <button class="btn-add-to-cart-large" onclick="fastAddToCart(${product.id})">
                            🛒 أضف هذا المنتج إلى السلة الآن
                        </button>
                    </div>
                </div>
            </div>
        `;
        
    } catch (err) {
        detailContainer.innerHTML = `<div class="error-msg">⚠️ خطأ أثناء تحميل تفاصيل المنتج: ${err.message}</div>`;
    }
}

// دالة تبديل الصورة الكبيرة عند النقر على الصور المصغرة بالمعرض
window.changeDetailImage = function(imgUrl, thumbElement) {
    const mainImg = document.getElementById('main-detail-img');
    if (mainImg) {
        mainImg.src = imgUrl;
    }
    document.querySelectorAll('.thumb-img').forEach(el => el.classList.remove('active-thumb'));
    thumbElement.classList.add('active-thumb');
};

// --------------------------------------------------
// 5. إدارة السلة المعتمدة والمستقرة
// --------------------------------------------------
window.fastAddToCart = function(id) {
    // جلب بيانات المنتج من المصفوفة المحلية أو مباشرة من Supabase إن لم يكن متوفراً
    const localProd = products.find(p => p.id === id);
    
    if (localProd) {
        addToCartAction(localProd);
    } else {
        if (!supabaseClient) return;
        supabaseClient.from('products').select('*').eq('id', id).single().then(({data}) => {
            if (data) addToCartAction(data);
        });
    }
};

function addToCartAction(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            quantity: 1
        });
    }
    saveCart();
    updateCartCount();
    alert(`✅ تم إضافة "${product.name}" إلى السلة بنجاح`);
}

function saveCart() {
    localStorage.setItem('makani_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        countBadge.innerText = totalQty;
    }
}

// --------------------------------------------------
// 6. صفحة السلة وعرضها المحسن للشاشات والتابلت
// --------------------------------------------------
function renderCartPage() {
    const cartTableBody = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartTableBody || !totalElement) return;
    
    if (cart.length === 0) {
        cartTableBody.innerHTML = `<tr><td colspan="5" class="empty-cart-text">🛒 السلة فارغة تماماً حالياً، تصفح المتجر وأضف منتجات!</td></tr>`;
        totalElement.innerText = "0 دينار";
        return;
    }
    
    let total = 0;
    cartTableBody.innerHTML = cart.map(item => {
        const rowTotal = item.price * item.quantity;
        total += rowTotal;
        const itemImg = item.image && item.image.trim() !== "" ? item.image : "";
        
        return `
            <tr>
                <td>
                    <div class="cart-product-cell">
                        ${itemImg ? `<img src="${itemImg}" class="cart-item-img" alt="${item.name}">` : `<div class="cart-item-fallback-img">🛍️</div>`}
                        <span class="cart-item-name">${item.name}</span>
                    </div>
                </td>
                <td class="text-center">${item.price.toLocaleString()} د.ع</td>
                <td>
                    <div class="quantity-control-wrapper">
                        <button class="qty-btn plus" onclick="updateQty(${item.id}, 1)">+</button>
                        <span class="qty-number-display">${item.quantity}</span>
                        <button class="qty-btn minus" onclick="updateQty(${item.id}, -1)">-</button>
                    </div>
                </td>
                <td class="text-center">${rowTotal.toLocaleString()} د.ع</td>
                <td class="text-center">
                    <button class="cart-delete-btn-large" onclick="removeCartItem(${item.id})">🗑️ حذف</button>
                </td>
            </tr>
        `;
    }).join('');
    
    totalElement.innerText = `${total.toLocaleString()} دينار`;
}

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        updateCartCount();
        renderCartPage();
    }
};

window.removeCartItem = function(id) {
    if (confirm("هل تريد حذف هذا المنتج من السلة؟")) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartCount();
        renderCartPage();
    }
};

// إرسال الطلب للواتساب المستقر والثابت
function handleOrderSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const address = document.getElementById('customer-address')?.value;
    
    if (!name || !phone || !address) return alert("الرجاء ملء جميع الحقول المطلوبة");
    if (cart.length === 0) return alert("السلة فارغة");
    
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let msg = `🛍️ طلب جديد من مكاني ستور\n\n👤 الاسم: ${name}\n📱 الجوال: ${phone}\n📍 العنوان: ${address}\n━━━━━━━━━━━━\nالمنتجات:\n`;
    
    cart.forEach(i => {
        msg += `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString()} دينار\n`;
    });
    
    msg += `━━━━━━━━━━━━\n💰 الإجمالي: ${total.toLocaleString()} دينار\n💵 الدفع عند الاستلام`;
    
    window.open(`https://wa.me/964700000000?text=${encodeURIComponent(msg)}`, '_blank');
    
    cart = [];
    saveCart();
    updateCartCount();
    alert("✅ تم فتح واتساب بنجاح لإرسال طلبك!");
    setTimeout(() => window.location.href = "index.html", 1000);
}

// --------------------------------------------------
// 7. تشغيل الأحداث و Infinite Scroll الذكي
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadCategories();
    
    // إذا كنا في صفحة قائمة المنتجات أو الرئيسية
    if (document.getElementById('all-products') || document.getElementById('latest-products')) {
        loadInitialProducts();
        
        // ميزة كشف التمرير لأسفل (Infinite Scroll)
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
                if (!isLoading && hasMore) {
                    fetchProductsPage();
                }
            }
        });
    }
    
    // إذا كنا في صفحة تفاصيل منتج معين
    if (document.getElementById('product-detail-content')) {
        loadProductDetail();
    }
    
    // إذا كنا في صفحة سلة التسوق
    if (document.getElementById('cart-items')) {
        renderCartPage();
        document.getElementById('order-form')?.addEventListener('submit', handleOrderSubmit);
    }
});

window.goToProductDetail = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};
            
