// ==================================================
// admin.js - لوحة تحكم الإدارة الكاملة والمصلحة
// الإصدار: 3.0 - يدعم إدارة الصور المتعددة extra_images بالكامل
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4\";

let supabaseClient = null;
let products = [];
let categories = [];
let currentEditingProductId = null;

if (typeof window.supabase === 'undefined') {
    console.error("❌ مكتبة Supabase لم يتم تحميلها في لوحة التحكم");
    alert("خطأ: تأكد من الاتصال بالإنترنت لتحميل ملفات الإدارة.");
} else {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --------------------------------------------------
// 1. جلب البيانات الأساسية للوحة التحكم
// --------------------------------------------------
async function loadData() {
    if (!supabaseClient) return;
    
    const tableContainer = document.getElementById('products-table-container');
    const catContainer = document.getElementById('categories-list-admin');
    
    if (tableContainer) tableContainer.innerHTML = '⏳ جاري جلب المنتجات الحالية...';
    if (catContainer) catContainer.innerHTML = '⏳ جاري جلب الأقسام الحالية...';
    
    try {
        // جلب الأقسام
        const { data: catData, error: catErr } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
        if (catErr) throw catErr;
        categories = catData || [];
        
        // جلب المنتجات
        const { data: prodData, error: prodErr } = await supabaseClient.from('products').select('*').order('id', { ascending: false });
        if (prodErr) throw prodErr;
        products = prodData || [];
        
        renderAdminCategories();
        renderAdminProducts();
        fillCategorySelects();
        
    } catch (err) {
        alert("❌ فشل في جلب البيانات من السيرفر: " + err.message);
    }
}

// ملء قائمة الاختيارات المنسدلة بالأقسام
function fillCategorySelects() {
    const selects = ['product-category', 'edit-product-category'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">اختر القسم التابع له المنتج</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        }
    });
}

// --------------------------------------------------
// 2. عرض وإدارة الأقسام
// --------------------------------------------------
function renderAdminCategories() {
    const container = document.getElementById('categories-list-admin');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<p>لا توجد أقسام مضافة بعد.</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 1.2rem;">
            <span>${cat.icon || '🏷️'} <strong>${escapeHtml(cat.name)}</strong> (ID: ${cat.id})</span>
            <button onclick="deleteCategory(${cat.id})" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:12px; cursor:pointer; font-size:1.1rem;">🗑️ حذف</button>
        </div>
    `).join('');
}

window.addCategory = async function() {
    const nameInput = document.getElementById('new-cat-name');
    const iconInput = document.getElementById('new-cat-icon');
    
    if (!nameInput || !nameInput.value.trim()) return alert("يرجى إدخال اسم القسم");
    
    try {
        const { error } = await supabaseClient.from('categories').insert([{
            name: nameInput.value.trim(),
            icon: iconInput ? iconInput.value.trim() : '🏷️'
        }]);
        
        if (error) throw error;
        
        nameInput.value = '';
        if (iconInput) iconInput.value = '';
        alert("✅ تم إضافة القسم الجديد بنجاح!");
        loadData();
    } catch (err) {
        alert("❌ خطأ أثناء إضافة القسم: " + err.message);
    }
};

window.deleteCategory = async function(id) {
    if (confirm("⚠️ هل أنت متأكد من حذف هذا القسم؟ قد يؤثر ذلك على عرض منتجاته.")) {
        try {
            const { error } = await supabaseClient.from('categories').delete().eq('id', id);
            if (error) throw error;
            alert("✅ تم حذف القسم");
            loadData();
        } catch (err) {
            alert("❌ خطأ في الحذف: " + err.message);
        }
    }
};

// --------------------------------------------------
// 3. عرض وإدارة المنتجات (إضافة، تعديل، صور متعددة)
// --------------------------------------------------
function renderAdminProducts() {
    const container = document.getElementById('products-table-container');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="padding:20px; font-size:1.2rem;">لا توجد منتجات متوفرة حالياً بالمتجر.</p>';
        return;
    }
    
    let html = `
        <table style="width:100%; border-collapse:collapse; font-size:1.1rem; text-align:right;">
            <thead>
                <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
                    <th style="padding:12px;">الصورة الرئيسية</th>
                    <th style="padding:12px;">اسم المنتج</th>
                    <th style="padding:12px;">السعر</th>
                    <th style="padding:12px;">العمليات الإدارية</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach(p => {
        const imgHtml = p.image ? `<img src="${p.image}" style="width:70px; height:70px; object-fit:cover; border-radius:12px;">` : '❌ بلا صورة';
        html += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px;">${imgHtml}</td>
                <td style="padding:12px; font-weight:bold;">${escapeHtml(p.name)}</td>
                <td style="padding:12px; color:#0284c7;">${Number(p.price).toLocaleString()} دينار</td>
                <td style="padding:12px;">
                    <button onclick="openEditModal(${p.id})" style="background:#3b82f6; color:white; border:none; padding:10px 18px; border-radius:12px; cursor:pointer; margin-left:8px; font-size:1.1rem;">✏️ تعديل</button>
                    <button onclick="deleteProduct(${p.id})" style="background:#ef4444; color:white; border:none; padding:10px 18px; border-radius:12px; cursor:pointer; font-size:1.1rem;">🗑️ حذف</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// إضافة منتج جديد مع الحقول المحدثة
window.addProduct = async function() {
    const name = document.getElementById('product-name')?.value.trim();
    const price = document.getElementById('product-price')?.value.trim();
    const image = document.getElementById('product-image')?.value.trim();
    const extraImages = document.getElementById('product-extra-images')?.value.trim(); // حقل الصور الإضافية المحدث
    const categoryId = document.getElementById('product-category')?.value;
    const description = document.getElementById('product-desc')?.value.trim();
    
    if (!name || !price || !categoryId) {
        return alert("⚠️ يرجى ملء الحقول الأساسية: الاسم، السعر، واختيار القسم!");
    }
    
    try {
        const insertData = {
            name: name,
            price: parseFloat(price),
            image: image || "",
            extra_images: extraImages || "", // حفظ الروابط الإضافية كنص مفصول بفواصل
            category_id: parseInt(categoryId),
            description: description || ""
        };
        
        const { error } = await supabaseClient.from('products').insert([insertData]);
        if (error) throw error;
        
        alert("🎉 تم إضافة المنتج الجديد بنجاح وبدء عرضه بالمتجر!");
        
        // تفريغ المدخلات بعد الحفظ
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-image').value = '';
        document.getElementById('product-extra-images').value = '';
        document.getElementById('product-desc').value = '';
        
        loadData();
    } catch (err) {
        alert("❌ خطأ أثناء حفظ المنتج الجديد: " + err.message);
    }
};

// فتح واجهة نافذة التعديل
window.openEditModal = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    currentEditingProductId = id;
    
    document.getElementById('edit-product-name').value = product.name || '';
    document.getElementById('edit-product-price').value = product.price || '';
    document.getElementById('edit-product-image').value = product.image || '';
    
    // معالجة عرض الصور الإضافية في حقل النص
    let extraImgsStr = '';
    if (product.extra_images) {
        if (Array.isArray(product.extra_images)) {
            extraImgsStr = product.extra_images.join(', ');
        } else {
            extraImgsStr = product.extra_images;
        }
    }
    document.getElementById('edit-product-extra-images').value = extraImgsStr;
    
    document.getElementById('edit-product-category').value = product.category_id || '';
    document.getElementById('edit-product-desc').value = product.description || '';
    
    document.getElementById('edit-modal').style.display = 'flex';
};

window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditingProductId = null;
};

// حفظ التعديلات وإرسالها لـ Supabase
window.saveProductEdit = async function() {
    if (!currentEditingProductId || !supabaseClient) return;
    
    const name = document.getElementById('edit-product-name').value.trim();
    const price = document.getElementById('edit-product-price').value.trim();
    const image = document.getElementById('edit-product-image').value.trim();
    const extraImages = document.getElementById('edit-product-extra-images').value.trim();
    const categoryId = document.getElementById('edit-product-category').value;
    const description = document.getElementById('edit-product-desc').value.trim();
    
    if (!name || !price || !categoryId) {
        return alert("⚠️ يرجى تعبئة كافة البيانات الأساسية للمنتج!");
    }
    
    try {
        const updateData = {
            name: name,
            price: parseFloat(price),
            image: image,
            extra_images: extraImages, // حفظ الروابط المعدلة بالكامل
            category_id: parseInt(categoryId),
            description: description
        };
        
        const { error } = await supabaseClient
            .from('products')
            .update(updateData)
            .eq('id', currentEditingProductId);
            
        if (error) throw error;
        
        alert("✅ تم تعديل وتحديث بيانات المنتج والصور بنجاح!");
        closeEditModal();
        loadData();
    } catch (err) {
        alert("❌ فشل تحديث بيانات المنتج: " + err.message);
    }
};

window.deleteProduct = async function(id) {
    if (confirm("⚠️ هل أنت متأكد من رغبتك بحذف هذا المنتج نهائياً من قاعدة البيانات المتجر؟")) {
        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) throw error;
            alert("✅ تم حذف المنتج نهائياً");
            loadData();
        } catch (err) {
            alert("❌ خطأ أثناء محاولة الحذف: " + err.message);
        }
    }
};

// --------------------------------------------------
// 4. نظام تسجيل الدخول البسيط والتبويب
// --------------------------------------------------
window.switchTab = function(tabName) {
    const pTab = document.getElementById('products-tab');
    const cTab = document.getElementById('categories-tab');
    const pBtn = document.getElementById('btn-tab-products');
    const cBtn = document.getElementById('btn-tab-categories');
    
    if (tabName === 'products') {
        if (pTab) pTab.style.display = 'block';
        if (cTab) cTab.style.display = 'none';
        pBtn?.classList.add('active');
        cBtn?.classList.remove('active');
    } else {
        if (pTab) pTab.style.display = 'none';
        if (cTab) cTab.style.display = 'block';
        cBtn?.classList.add('active');
        pBtn?.classList.remove('active');
    }
};

window.handleLogin = function(e) {
    if (e) e.preventDefault();
    const passwordInput = document.getElementById('admin-password');
    if (!passwordInput) return;
    
    if (passwordInput.value === "admin123") {
        localStorage.setItem('admin_logged_in', 'true');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData();
    } else {
        alert("⚠️ كلمة المرور المدخلة غير صحيحة!");
    }
};

window.logout = function() {
    localStorage.removeItem('admin_logged_in');
    location.reload();
};

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        loadData();
    }
});
    
