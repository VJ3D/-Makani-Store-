// ==================================================
// admin.js - لوحة تحكم المدير
// الإصدار: 2.0 - محسن ومستقر
// ==================================================

// ------------------------
// 1. إعداد الاتصال بـ Supabase
// ------------------------
const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient = null;
let products = [];
let categories = [];

// التحقق من وجود المكتبة
if (typeof window.supabase === 'undefined') {
    console.error("❌ مكتبة Supabase لم يتم تحميلها");
    alert("خطأ: لم يتم تحميل مكتبة Supabase. تأكد من اتصالك بالإنترنت.");
} else {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ تم تهيئة Supabase بنجاح");
}

// ------------------------
// 2. دوال المساعدة
// ------------------------
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return price.toLocaleString() + ' دينار';
}

async function getNextId(tableName) {
    if (!supabaseClient) return Date.now();
    
    const { data, error } = await supabaseClient
        .from(tableName)
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
    
    if (error || !data || data.length === 0) {
        return 1;
    }
    return data[0].id + 1;
}

// ------------------------
// 3. تحميل البيانات
// ------------------------
async function loadData() {
    if (!supabaseClient) {
        console.error("لا يوجد اتصال بقاعدة البيانات");
        return;
    }
    
    try {
        console.log("🔄 جاري تحميل البيانات...");
        
        const { data: productsData, error: productsError } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });
        
        if (productsError) throw productsError;
        
        const { data: categoriesData, error: categoriesError } = await supabaseClient
            .from('categories')
            .select('*')
            .order('id', { ascending: true });
        
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
// 4. عرض المنتجات في الجدول
// ------------------------
function renderAdminProducts() {
    const container = document.getElementById('products-table-container');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">📦 لا توجد منتجات حالياً. أضف منتجاً جديداً!</div>';
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>القسم</th>
                    <th>المخزون</th>
                    <th>تغيير القسم</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let product of products) {
        const category = categories.find(c => c.id == product.category_id);
        html += `
            <tr>
                <td style="text-align:right"><strong>${escapeHtml(product.name)}</strong></td>
                <td>${formatPrice(product.price)}</td>
                <td>${category ? category.icon + ' ' + escapeHtml(category.name) : '-'}</td>
                <td>
                    <input type="number" id="stock-${product.id}" value="${product.stock}" style="width:70px; padding:5px; border-radius:10px; border:1px solid #ccc;">
                </td>
                <td>
                    <select id="cat-${product.id}" style="padding:5px 10px; border-radius:20px; border:1px solid #ccc;">
                        ${categories.map(cat => `<option value="${cat.id}" ${product.category_id == cat.id ? 'selected' : ''}>${cat.icon} ${escapeHtml(cat.name)}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn-sm btn-edit" onclick="updateProduct(${product.id})">💾 تحديث</button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct(${product.id})">🗑️ حذف</button>
                 </td>
            </tr>
        `;
    }
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ------------------------
// 5. تحديث منتج
// ------------------------
window.updateProduct = async function(id) {
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
};

// ------------------------
// 6. حذف منتج
// ------------------------
window.deleteProduct = async function(id) {
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
};

// ------------------------
// 7. إضافة منتج جديد
// ------------------------
window.addProduct = async function() {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const name = document.getElementById('new-name')?.value.trim();
    const price = document.getElementById('new-price')?.value;
    const image = document.getElementById('new-image')?.value.trim();
    const categoryId = document.getElementById('new-category')?.value;
    const stock = document.getElementById('new-stock')?.value;
    
    if (!name) { alert("⚠️ يرجى إدخال اسم المنتج"); return; }
    if (!price || isNaN(parseInt(price))) { alert("⚠️ يرجى إدخال سعر صحيح"); return; }
    if (!stock || isNaN(parseInt(stock))) { alert("⚠️ يرجى إدخال كمية صحيحة"); return; }
    if (!categoryId) { alert("⚠️ يرجى اختيار قسم للمنتج"); return; }
    
    const imageUrl = image || "https://placehold.co/400x400/0284c7/white?text=" + encodeURIComponent(name);
    const nextId = await getNextId('products');
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .insert([{
                id: nextId,
                name: name,
                price: parseInt(price),
                image: imageUrl,
                category_id: parseInt(categoryId),
                stock: parseInt(stock)
            }]);
        
        if (error) throw error;
        
        alert("✅ تم إضافة المنتج بنجاح");
        
        document.getElementById('new-name').value = '';
        document.getElementById('new-price').value = '';
        document.getElementById('new-image').value = '';
        document.getElementById('new-stock').value = '';
        
        loadData();
    } catch (error) {
        console.error("خطأ في الإضافة:", error);
        alert("❌ حدث خطأ: " + error.message);
    }
};

// ------------------------
// 8. عرض الأقسام في لوحة التحكم
// ------------------------
function renderAdminCategories() {
    const container = document.getElementById('categories-list-admin');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state">⚠️ لا توجد أقسام حالياً. أضف قسم جديد!</div>';
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
// 9. تحديث قائمة الأقسام في نموذج الإضافة
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
// 10. إضافة قسم جديد
// ------------------------
window.addCategory = async function() {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const name = document.getElementById('new-cat-name')?.value.trim();
    const icon = document.getElementById('new-cat-icon')?.value || '📁';
    
    if (!name) {
        alert("⚠️ يرجى إدخال اسم القسم");
        return;
    }
    
    const nextId = await getNextId('categories');
    
    try {
        const { error } = await supabaseClient
            .from('categories')
            .insert([{
                id: nextId,
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
};

// ------------------------
// 11. تعديل قسم
// ------------------------
window.editCategory = async function(id) {
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
};

// ------------------------
// 12. حذف قسم
// ------------------------
window.deleteCategory = async function(id) {
    if (!supabaseClient) { alert("⚠️ لا يوجد اتصال بقاعدة البيانات"); return; }
    
    const productsInCat = products.filter(p => p.category_id == id);
    const message = productsInCat.length > 0
        ? `⚠️ هذا القسم يحتوي على ${productsInCat.length} منتج(ات).\nحذف القسم سيؤدي إلى حذف منتجاته أيضاً.\nهل أنت متأكد؟`
        : "⚠️ هل أنت متأكد من حذف هذا القسم؟";
    
    if (!confirm(message)) return;
    
    try {
        if (productsInCat.length > 0) {
            const { error: productsError } = await supabaseClient
                .from('products')
                .delete()
                .eq('category_id', id);
            
            if (productsError) throw productsError;
        }
        
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
};

// ------------------------
// 13. التنقل بين التبويبات
// ------------------------
window.showAdminTab = function(tab) {
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
};

// ------------------------
// 14. نظام الدخول إلى لوحة التحكم
// ------------------------
window.checkAdminLogin = function() {
    console.log("🔐 محاولة الدخول...");
    const passwordInput = document.getElementById('admin-password');
    
    if (!passwordInput) {
        console.error("لم يتم العثور على حقل كلمة المرور");
        alert("خطأ: لم يتم العثور على حقل كلمة المرور");
        return;
    }
    
    const password = passwordInput.value;
    
    // 🔒 كلمة المرور: admin123 (يمكنك تغييرها هنا)
    if (password === "admin123") {
        console.log("✅ كلمة المرور صحيحة");
        localStorage.setItem('admin_logged_in', 'true');
        
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        loadData();
    } else {
        console.log("❌ كلمة المرور غير صحيحة");
        alert("⚠️ كلمة المرور غير صحيحة");
    }
};

window.logout = function() {
    localStorage.removeItem('admin_logged_in');
    location.reload();
};

// ------------------------
// 15. التحقق من حالة الدخول عند تحميل الصفحة
// ------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 تم تحميل admin.html");
    
    // التحقق من حالة الدخول المحفوظة
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    
    if (isLoggedIn === 'true') {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        loadData();
    }
});
