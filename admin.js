// ==================================================
// admin.js - لوحة تحكم مكاني ستور
// ==================================================

// ------------------------
// 1. إعداد الاتصال بقاعدة البيانات (Supabase)
// ------------------------

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzh oqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient = null;
let products = [];
let categories = [];

// محاولة إنشاء عميل Supabase
try {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ تم الاتصال بـ Supabase بنجاح");
    } else {
        console.error("❌ مكتبة Supabase لم يتم تحميلها");
    }
} catch(e) {
    console.error("❌ خطأ في الاتصال:", e);
}

// ------------------------
// 2. تحميل البيانات من قاعدة البيانات
// ------------------------

async function loadData() {
    if (!supabaseClient) {
        console.error("لا يوجد اتصال بقاعدة البيانات");
        return;
    }
    
    try {
        console.log("جاري تحميل المنتجات...");
        const { data: productsData, error: productsError } = await supabaseClient
            .from('products')
            .select('*');
        
        if (productsError) throw productsError;
        
        console.log("جاري تحميل الأقسام...");
        const { data: categoriesData, error: categoriesError } = await supabaseClient
            .from('categories')
            .select('*');
        
        if (categoriesError) throw categoriesError;
        
        products = productsData || [];
        categories = categoriesData || [];
        
        console.log(`✅ تم التحميل: ${products.length} منتج, ${categories.length} قسم`);
        
        renderAdminProducts();
        renderAdminCategories();
        updateCategorySelect();
    } catch (error) {
        console.error("❌ خطأ في التحميل:", error);
        alert("خطأ في تحميل البيانات: " + error.message);
    }
}

// ------------------------
// 3. عرض المنتجات في جدول الإدارة
// ------------------------

function renderAdminProducts() {
    const tbody = document.getElementById('products-list-admin');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">📦 لا توجد منتجات حالياً. أضف منتجاً جديداً!</td></tr>';
        return;
    }
    
    let html = '';
    for (let product of products) {
        const category = categories.find(c => c.id == product.category_id);
        html += `
            <tr>
                <td style="text-align:right"><strong>${escapeHtml(product.name || '')}</strong></td>
                <td>${(product.price || 0).toLocaleString()} دينار</td>
                <td>${category ? category.icon + ' ' + category.name : '-'}</td>
                <td>
                    <input type="number" id="stock-${product.id}" value="${product.stock || 0}" style="width:70px; padding:5px; border-radius:10px; border:1px solid #ccc;">
                </td>
                <td>
                    <select id="cat-${product.id}" style="padding:5px 10px; border-radius:20px; border:1px solid #ccc;">
                        ${categories.map(cat => `<option value="${cat.id}" ${product.category_id == cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn-sm btn-edit" onclick="updateProduct(${product.id})">💾 تحديث</button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct(${product.id})">🗑️ حذف</button>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

// دالة مساعدة لتنظيف النص من HTML
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ------------------------
// 4. تحديث منتج (المخزون والقسم)
// ------------------------

async function updateProduct(id) {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const stockInput = document.getElementById(`stock-${id}`);
    const catSelect = document.getElementById(`cat-${id}`);
    
    if (!stockInput || !catSelect) {
        alert("⚠️ لم يتم العثور على عناصر التحديث");
        return;
    }
    
    const newStock = parseInt(stockInput.value);
    const newCategory = parseInt(catSelect.value);
    
    if (isNaN(newStock)) {
        alert("⚠️ الكمية غير صحيحة");
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ stock: newStock, category_id: newCategory })
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم تحديث المنتج بنجاح");
        loadData();
    } catch (error) {
        console.error("خطأ في التحديث:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
}

// ------------------------
// 5. حذف منتج
// ------------------------

async function deleteProduct(id) {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم حذف المنتج");
        loadData();
    } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
}

// ------------------------
// 6. إضافة منتج جديد
// ------------------------

async function addProduct() {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const name = document.getElementById('new-name')?.value.trim();
    const price = document.getElementById('new-price')?.value;
    const image = document.getElementById('new-image')?.value.trim();
    const categoryId = document.getElementById('new-category')?.value;
    const stock = document.getElementById('new-stock')?.value;
    
    // التحقق من صحة المدخلات
    if (!name) { alert("⚠️ يرجى إدخال اسم المنتج"); return; }
    if (!price || isNaN(parseInt(price))) { alert("⚠️ يرجى إدخال سعر صحيح"); return; }
    if (!stock || isNaN(parseInt(stock))) { alert("⚠️ يرجى إدخال كمية صحيحة"); return; }
    if (!categoryId) { alert("⚠️ يرجى اختيار قسم للمنتج"); return; }
    
    // إذا لم يضع صورة، نستخدم صورة افتراضية
    const imageUrl = image || "https://placehold.co/400x400/0077b6/white?text=" + encodeURIComponent(name);
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .insert([{
                id: Date.now(),
                name: name,
                price: parseInt(price),
                image: imageUrl,
                category_id: parseInt(categoryId),
                stock: parseInt(stock)
            }]);
        
        if (error) throw error;
        
        alert("✅ تم إضافة المنتج بنجاح");
        
        // تفريغ الحقول
        document.getElementById('new-name').value = '';
        document.getElementById('new-price').value = '';
        document.getElementById('new-image').value = '';
        document.getElementById('new-stock').value = '';
        
        loadData();
    } catch (error) {
        console.error("خطأ في الإضافة:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
}

// ------------------------
// 7. عرض الأقسام في لوحة التحكم
// ------------------------

function renderAdminCategories() {
    const container = document.getElementById('categories-list-admin');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<p>⚠️ لا توجد أقسام حالياً. أضف قسم جديد!</p>';
        return;
    }
    
    let html = '';
    for (let cat of categories) {
        html += `
            <div class="category-item-admin">
                <div><span style="font-size:1.8rem">${cat.icon || '📁'}</span> <strong>${escapeHtml(cat.name)}</strong></div>
                <div>
                    <button class="btn-sm btn-edit" onclick="editCategory(${cat.id})">✏️ تعديل</button>
                    <button class="btn-sm btn-delete" onclick="deleteCategory(${cat.id})">🗑️ حذف</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ------------------------
// 8. تحديث قائمة الأقسام في نموذج الإضافة
// ------------------------

function updateCategorySelect() {
    const select = document.getElementById('new-category');
    if (select) {
        let options = '<option value="">-- اختر القسم --</option>';
        for (let cat of categories) {
            options += `<option value="${cat.id}">${cat.icon || '📁'} ${escapeHtml(cat.name)}</option>`;
        }
        select.innerHTML = options;
    }
}

// ------------------------
// 9. إضافة قسم جديد
// ------------------------

async function addCategory() {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const name = document.getElementById('new-cat-name')?.value.trim();
    const icon = document.getElementById('new-cat-icon')?.value || '📁';
    
    if (!name) {
        alert("⚠️ يرجى إدخال اسم القسم");
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categories')
            .insert([{
                id: Date.now(),
                name: name,
                icon: icon
            }]);
        
        if (error) throw error;
        
        alert("✅ تم إضافة القسم بنجاح");
        document.getElementById('new-cat-name').value = '';
        document.getElementById('new-cat-icon').value = '';
        loadData();
    } catch (error) {
        console.error("خطأ في الإضافة:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
}

// ------------------------
// 10. تعديل قسم
// ------------------------

async function editCategory(id) {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const category = categories.find(c => c.id == id);
    if (!category) return;
    
    const newName = prompt("✏️ اسم القسم الجديد:", category.name);
    if (newName && newName.trim()) {
        const newIcon = prompt("✏️ الأيقونة الجديدة (رمز تعبيري):", category.icon);
        
        try {
            const { error } = await supabaseClient
                .from('categories')
                .update({ 
                    name: newName.trim(), 
                    icon: (newIcon && newIcon.trim()) ? newIcon.trim() : category.icon 
                })
                .eq('id', id);
            
            if (error) throw error;
            
            alert("✅ تم تعديل القسم");
            loadData();
        } catch (error) {
            console.error("خطأ في التعديل:", error);
            alert("❌ حدث خطأ: " + error.message);
        }
    }
}

// ------------------------
// 11. حذف قسم (مع منتجاته)
// ------------------------

async function deleteCategory(id) {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const productsInCat = products.filter(p => p.category_id == id);
    const message = productsInCat.length > 0
        ? `⚠️ هذا القسم يحتوي على ${productsInCat.length} منتج(ات).\nحذف القسم سيؤدي إلى حذف منتجاته أيضاً.\nهل أنت متأكد؟`
        : "⚠️ هل أنت متأكد من حذف هذا القسم؟";
    
    if (!confirm(message)) return;
    
    try {
        // حذف المنتجات المرتبطة بهذا القسم أولاً
        if (productsInCat.length > 0) {
            const { error: productsError } = await supabaseClient
                .from('products')
                .delete()
                .eq('category_id', id);
            
            if (productsError) throw productsError;
        }
        
        // ثم حذف القسم نفسه
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم حذف القسم");
        loadData();
    } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
}

// ------------------------
// 12. التنقل بين تبويبات المنتجات والأقسام
// ------------------------

function showAdminTab(tab) {
    const productsTab = document.getElementById('products-tab');
    const categoriesTab = document.getElementById('categories-tab');
    const buttons = document.querySelectorAll('.admin-tab');
    
    if (tab === 'products') {
        if (productsTab) productsTab.style.display = 'block';
        if (categoriesTab) categoriesTab.style.display = 'none';
        if (buttons[0]) buttons[0].classList.add('active');
        if (buttons[1]) buttons[1].classList.remove('active');
    } else {
        if (productsTab) productsTab.style.display = 'none';
        if (categoriesTab) categoriesTab.style.display = 'block';
        if (buttons[0]) buttons[0].classList.remove('active');
        if (buttons[1]) buttons[1].classList.add('active');
    }
}

// ------------------------
// 13. نظام الدخول إلى لوحة التحكم
// ------------------------

function checkAdminLogin() {
    console.log("تم الضغط على زر الدخول");
    const passwordInput = document.getElementById('admin-password');
    
    if (!passwordInput) {
        console.error("لم يتم العثور على حقل كلمة المرور");
        alert("خطأ: لم يتم العثور على حقل كلمة المرور");
        return;
    }
    
    const password = passwordInput.value;
    console.log("كلمة المرور المدخلة:", password);
    
    // 🔒 كلمة المرور: admin123 (يمكنك تغييرها هنا)
    if (password === "admin123") {
        console.log("كلمة المرور صحيحة");
        localStorage.setItem('admin_logged_in', 'true');
        
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        // تحميل البيانات بعد الدخول
        loadData();
    } else {
        console.log("كلمة المرور غير صحيحة");
        alert("⚠️ كلمة المرور غير صحيحة");
    }
}

// ------------------------
// 14. تسجيل الخروج
// ------------------------

function logout() {
    localStorage.removeItem('admin_logged_in');
    location.reload();
}

// ------------------------
// 15. التحقق من حالة الدخول عند تحميل الصفحة
// ------------------------

document.addEventListener('DOMContentLoaded', function() {
    console.log("تم تحميل admin.html");
    
    // التحقق من وجود مكتبة Supabase
    if (typeof window.supabase === 'undefined') {
        console.error("❌ مكتبة Supabase غير موجودة");
        alert("خطأ: لم يتم تحميل مكتبة Supabase.\nتأكد من اتصالك بالإنترنت.");
    } else {
        console.log("✅ مكتبة Supabase موجودة");
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("✅ تم إنشاء عميل Supabase");
        } catch(e) {
            console.error("❌ خطأ في إنشاء العميل:", e);
        }
    }
    
    // التحقق من حالة الدخول المحفوظة
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    console.log("حالة الدخول المحفوظة:", isLoggedIn);
    
    if (isLoggedIn === 'true') {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        loadData();
    }
});

// ------------------------
// 16. جعل الدوال عامة (متاحة من HTML)
// ------------------------

window.checkAdminLogin = checkAdminLogin;
window.logout = logout;
window.showAdminTab = showAdminTab;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.addCategory = addCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
