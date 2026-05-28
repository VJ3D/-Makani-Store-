// ==================================================
// هذا الكود خاص بلوحة تحكم المدير
// ==================================================

// ------------------------
// 1. إعداد الاتصال بقاعدة البيانات
// ------------------------

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzh oqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------
// 2. المتغيرات العامة
// ------------------------

let products = [];
let categories = [];

// ------------------------
// 3. تحميل البيانات من قاعدة البيانات
// ------------------------

async function loadData() {
    try {
        // تحميل المنتجات
        const { data: productsData } = await supabase.from('products').select('*');
        // تحميل الأقسام
        const { data: categoriesData } = await supabase.from('categories').select('*');
        
        if (productsData) products = productsData;
        if (categoriesData) categories = categoriesData;
        
        renderAdminProducts();
        renderAdminCategories();
        updateCategorySelect();
    } catch (error) {
        console.error("خطأ في التحميل:", error);
    }
}

// ------------------------
// 4. عرض المنتجات في جدول الإدارة
// ------------------------

function renderAdminProducts() {
    const tbody = document.getElementById('products-list-admin');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">📦 لا توجد منتجات حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id == product.category_id);
        return `
            <tr>
                <td style="text-align:right"><strong>${product.name}</strong></td>
                <td>${product.price.toLocaleString()} دينار</td>
                <td>${category ? category.icon + ' ' + category.name : '-'}</td>
                <td>
                    <input type="number" id="stock-${product.id}" value="${product.stock}" style="width:70px; padding:5px; border-radius:10px; border:1px solid #ccc;">
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
    }).join('');
}

// تحديث منتج (المخزون والقسم)
async function updateProduct(id) {
    const newStock = parseInt(document.getElementById(`stock-${id}`).value);
    const newCategory = parseInt(document.getElementById(`cat-${id}`).value);
    
    if (isNaN(newStock)) {
        alert("⚠️ الكمية غير صحيحة");
        return;
    }
    
    try {
        const { error } = await supabase
            .from('products')
            .update({ stock: newStock, category_id: newCategory })
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم تحديث المنتج بنجاح");
        loadData();  // إعادة تحميل البيانات
    } catch (error) {
        console.error("خطأ في التحديث:", error);
        alert("❌ حدث خطأ في التحديث");
    }
}

// حذف منتج
async function deleteProduct(id) {
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم حذف المنتج");
        loadData();
    } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("❌ حدث خطأ في الحذف");
    }
}

// إضافة منتج جديد
async function addProduct() {
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
        const { error } = await supabase
            .from('products')
            .insert([{
                id: Date.now(),           // معرف فريد
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
        alert("❌ حدث خطأ في إضافة المنتج");
    }
}

// ------------------------
// 5. إدارة الأقسام
// ------------------------

function renderAdminCategories() {
    const container = document.getElementById('categories-list-admin');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<p>⚠️ لا توجد أقسام حالياً</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="category-item-admin">
            <div><span style="font-size:1.8rem">${cat.icon}</span> <strong>${cat.name}</strong></div>
            <div>
                <button class="btn-sm btn-edit" onclick="editCategory(${cat.id})">✏️ تعديل</button>
                <button class="btn-sm btn-delete" onclick="deleteCategory(${cat.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function updateCategorySelect() {
    const select = document.getElementById('new-category');
    if (select) {
        select.innerHTML = '<option value="">-- اختر القسم --</option>' +
            categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
}

async function addCategory() {
    const name = document.getElementById('new-cat-name')?.value.trim();
    const icon = document.getElementById('new-cat-icon')?.value || '📁';
    
    if (!name) {
        alert("⚠️ يرجى إدخال اسم القسم");
        return;
    }
    
    try {
        const { error } = await supabase
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
        alert("❌ حدث خطأ في إضافة القسم");
    }
}

async function editCategory(id) {
    const category = categories.find(c => c.id == id);
    if (!category) return;
    
    const newName = prompt("✏️ اسم القسم الجديد:", category.name);
    if (newName && newName.trim()) {
        const newIcon = prompt("✏️ الأيقونة الجديدة (رمز تعبيري):", category.icon);
        
        try {
            const { error } = await supabase
                .from('categories')
                .update({ 
                    name: newName.trim(), 
                    icon: newIcon || category.icon 
                })
                .eq('id', id);
            
            if (error) throw error;
            
            alert("✅ تم تعديل القسم");
            loadData();
        } catch (error) {
            console.error("خطأ في التعديل:", error);
            alert("❌ حدث خطأ في تعديل القسم");
        }
    }
}

async function deleteCategory(id) {
    const productsInCat = products.filter(p => p.category_id == id);
    const message = productsInCat.length > 0
        ? `⚠️ هذا القسم يحتوي على ${productsInCat.length} منتج(ات).\nحذف القسم سيؤدي إلى حذف منتجاته أيضاً.\nهل أنت متأكد؟`
        : "⚠️ هل أنت متأكد من حذف هذا القسم؟";
    
    if (!confirm(message)) return;
    
    try {
        // أولاً: حذف المنتجات المرتبطة بهذا القسم
        if (productsInCat.length > 0) {
            const { error: productsError } = await supabase
                .from('products')
                .delete()
                .eq('category_id', id);
            
            if (productsError) throw productsError;
        }
        
        // ثانياً: حذف القسم نفسه
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert("✅ تم حذف القسم");
        loadData();
    } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("❌ حدث خطأ في حذف القسم");
    }
}

// ------------------------
// 6. التنقل بين التبويبات (المنتجات / الأقسام)
// ------------------------

function showAdminTab(tab) {
    const productsTab = document.getElementById('products-tab');
    const categoriesTab = document.getElementById('categories-tab');
    const buttons = document.querySelectorAll('.admin-tab');
    
    if (tab === 'products') {
        productsTab.style.display = 'block';
        categoriesTab.style.display = 'none';
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
    } else {
        productsTab.style.display = 'none';
        categoriesTab.style.display = 'block';
        buttons[0].classList.remove('active');
        buttons[1].classList.add('active');
    }
}

// ------------------------
// 7. نظام الدخول إلى لوحة التحكم
// ------------------------

function checkAdminLogin() {
    const password = document.getElementById('admin-password')?.value;
    // 🔒 يمكنك تغيير كلمة المرور هنا
    if (password === "admin123") {
        localStorage.setItem('admin_logged_in', 'true');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData();  // تحميل البيانات بعد الدخول
    } else {
        alert("⚠️ كلمة المرور غير صحيحة");
    }
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    location.reload();
}

// ------------------------
// 8. التحقق من حالة الدخول عند تحميل الصفحة
// ------------------------

if (localStorage.getItem('admin_logged_in') === 'true') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadData();
        }
