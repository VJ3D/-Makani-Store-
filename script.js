// ==================================================
// script.js - نسخة مصلحة بالكامل ومستقرة وسريعة
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
}

// ألوان احتياطية في حال لم تكن هناك صورة للمنتج
const fallbackColors = ['#0284c7', '#0891b2', '#059669', '#7c3aed', '#db2777'];
function getRandomColor() {
    return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
}

// --------------------------------------------------
// 1. جلب وتحميل المنتجات (Infinite Scroll الفعال)
// --------------------------------------------------
async function loadInitialProducts() {
    currentPage = 0;
    hasMore = true;
    products = [];
    
    const container = document.getElementById('all-products') || document.getElementById('latest-products');
    if (container) {
        container.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:20px; font-size:1.2rem;">⏳ جاري تحميل المنتجات...</div>';
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
            
        // تطبيق الفلترة بالقسم بشكل صحيح ومباشر
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
            // إزالة مكررات المنتجات إن وجدت
            const existingIds = new Set(products.map(p => p.id));
            const newProducts = (data || []).filter(p => !existingIds.has(p.id));
            products = products.concat(newProducts);
        }
        
        currentPage++;
        renderProductsList();
        
    } catch (err) {
        console.error("خطأ جلب المنتجات:", err.message);
    } finally {
        isLoading = false;
        const spinner = document.getElementById('loading-more-spinner');
        if (spinner) spinner.style.display = 'none';
    }
}

// --------------------------------------------------
// 2. عرض المنتجات (إصلاح مشكلة الصور الحقيقية)
// --------------------------------------------------
function renderProductsList() {
    const container = document.getElementById('all-products') || document.getElementById('latest-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; font-size:1.2rem; color:#64748b;">📦 لا توجد منتجات في هذا القسم حالياً.</div>`;
        return;
    }
    
    const html = products.map(p => {
        const productImg = p.image && p.image.trim() !== "" ? p.image : "";
        const formattedPrice = Number(p.price).toLocaleString();
        
        // تم استبدال الأيقونات بـ كود وسام الصورة الحقيقية img
        return `
            <div class="product-card" onclick="goToProductDetail(${p.id})">
                <div class="product-image-container" style="position:relative; width:100%; height:250px; background:#f8fafc; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    ${productImg ? 
                        `<img src="${productImg}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:3rem; background:${getRandomColor()}\\'>🛍️</div>';">` : 
                        `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:3rem; background:${getRandomColor()}">🛍️</div>`
                    }
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-meta">
                        <span class="product-price" style="font-weight:bold; color:#0284c7;">${formattedPrice} دينار</span>
                    </div>
                    <button class="add-to-cart-btn-fast" style="width:100%; padding:10px; margin-top:10px; cursor:pointer;" onclick="event.stopPropagation(); fastAddToCart(${p.id});">
                        🛒 أضف للسلة سريعاً
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    if (hasMore && !document.getElementById('loading-more-spinner')) {
        const spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'loading-more-spinner';
        spinnerDiv.className = 'loading-spinner';
        spinnerDiv.style.width = '100%';
        spinnerDiv.style.gridColumn = '1 / -1';
        spinnerDiv.style.textCenter = 'center';
        spinnerDiv.innerHTML = '⏳ جاري تحميل المزيد...';
        container.appendChild(spinnerDiv);
    }
}

// --------------------------------------------------
// 3. الأقسام والفلترة الصحيحة
// --------------------------------------------------
async function loadCategories() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
        if (error) throw error;
        categories = data || [];
        
        const filterSelect = document.getElementById('category-filter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">📂 جميع الأقسام</option>';
            categories.forEach(cat => {
                filterSelect.innerHTML += `<option value="${cat.id}">${cat.icon || '🏷️'} ${cat.name}</option>`;
            });
            
            filterSelect.onchange = async function() {
                const catId = this.value;
                currentCategoryFilter = (catId === 'all') ? null : parseInt(catId);
                await loadInitialProducts();
            };
        }
        
        const homeCatsContainer = document.getElementById('categories-list-home');
        if (homeCatsContainer) {
            homeCatsContainer.innerHTML = `
                <div class="category-item active" id="cat-item-all" onclick="filterByHomeCategory('all')">
                    <span>الكل</span>
                </div>
            `;
            categories.forEach(cat => {
                homeCatsContainer.innerHTML += `
                    <div class="category-item" id="cat-item-${cat.id}" onclick="filterByHomeCategory(${cat.id})">
                        <span>${cat.icon || '🏷️'} ${cat.name}</span>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error("خطأ تحميل الأقسام:", err.message);
    }
}

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
        detailContainer.innerHTML = '<div>⚠️ لم يتم العثور على المنتج.</div>';
        return;
    }
    
    try {
        const { data: product, error } = await supabaseClient.from('products').select('*').eq('id', productId).single();
        if (error || !product) throw new Error("المنتج غير موجود");
        
        let allImages = [];
        if (product.image && product.image.trim() !== "") allImages.push(product.image);
        
        if (product.extra_images) {
            if (Array.isArray(product.extra_images)) {
                allImages = allImages.concat(product.extra_images.filter(img => img && img.trim() !== ""));
            } else if (typeof product.extra_images === 'string') {
                const extraArr = product.extra_images.split(',').map(img => img.trim()).filter(img => img !== "");
                allImages = allImages.concat(extraArr);
            }
        }
        if (allImages.length === 0) allImages.push("");
        
        const formattedPrice = Number(product.price).toLocaleString();
        
        let galleryHtml = '';
        if (allImages[0] !== "") {
            galleryHtml = `
                <div class="gallery-container" style="display:flex; flex-direction:column; gap:15px;">
                    <div class="main-img-box" style="width:100%; height:350px; background:#f8fafc; border-radius:16px; overflow:hidden;">
                        <img id="main-detail-img" src="${allImages[0]}" style="width:100%; height:100%; object-fit:contain;">
                    </div>
                    <div class="thumbs-box" style="display:flex; gap:10px; overflow-x:auto; padding:5px;">
                        ${allImages.map(img => `
                            <img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid #e2e8f0;" onclick="document.getElementById('main-detail-img').src='${img}'">
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            galleryHtml = `<div style="width:100%; height:300px; display:flex; align-items:center; justify-content:center; font-size:4rem; background:${getRandomColor()}">🛍️</div>`;
        }
        
        detailContainer.innerHTML = `
            <div class="product-detail-container" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:30px;">
                <div class="product-detail-image">${galleryHtml}</div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <h2 style="color:#0284c7; margin:15px 0;">${formattedPrice} دينار</h2>
                    <p style="margin-bottom:20px; white-space:pre-line;">${product.description || 'لا يوجد وصف لهذا المنتج.'}</p>
                    <button class="btn-add-to-cart-large" style="padding:15px 30px; font-size:1.2rem; cursor:pointer; background:#22c55e; color:white; border:none; border-radius:12px;" onclick="fastAddToCart(${product.id})">
                        🛒 أضف إلى السلة الآن
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        detailContainer.innerHTML = `<div>⚠️ خطأ: ${err.message}</div>`;
    }
}

// --------------------------------------------------
// 5. السلة والواتساب المعتمد لديك
// --------------------------------------------------
window.fastAddToCart = function(id) {
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
        cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    alert(`✅ تم إضافة "${product.name}" إلى السلة`);
}

function saveCart() { localStorage.setItem('makani_cart', JSON.stringify(cart)); }
function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCartPage() {
    const tbody = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!tbody || !totalEl) return;
    
    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">السلة فارغة.</td></tr>';
        totalEl.innerText = "0 دينار";
        return;
    }
    
    let total = 0;
    tbody.innerHTML = cart.map(item => {
        const rowTotal = item.price * item.quantity;
        total += rowTotal;
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} د.ع</td>
                <td>
                    <button style="padding:5px 10px; font-weight:bold;" onclick="updateQty(${item.id}, 1)">+</button>
                    <span style="margin:0 10px; font-weight:bold;">${item.quantity}</span>
                    <button style="padding:5px 10px; font-weight:bold;" onclick="updateQty(${item.id}, -1)">-</button>
                </td>
                <td>${rowTotal.toLocaleString()} د.ع</td>
                <td><button style="color:red; background:none; border:none; cursor:pointer;" onclick="removeCartItem(${item.id})">🗑️ حذف</button></td>
            </tr>
        `;
    }).join('');
    totalEl.innerText = `${total.toLocaleString()} دينار`;
}

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart(); updateCartCount(); renderCartPage();
    }
};

window.removeCartItem = function(id) {
    if (confirm("حذف المنتج؟")) {
        cart = cart.filter(i => i.id !== id);
        saveCart(); updateCartCount(); renderCartPage();
    }
};

// تشغيل الأحداث والتمرير
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadCategories();
    
    if (document.getElementById('all-products') || document.getElementById('latest-products')) {
        loadInitialProducts();
        
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
                if (!isLoading && hasMore) fetchProductsPage();
            }
        });
    }
    if (document.getElementById('product-detail-content')) loadProductDetail();
    if (document.getElementById('cart-items')) renderCartPage();
});
