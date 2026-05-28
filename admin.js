let products = JSON.parse(localStorage.getItem('makani_products')) || [];
let categories = JSON.parse(localStorage.getItem('makani_categories')) || [
    { id: 1, name: "أجهزة كهربائية", icon: "🔌" },
    { id: 2, name: "مواد منزلية", icon: "🏠" },
    { id: 3, name: "إلكترونيات", icon: "📱" },
    { id: 4, name: "أزياء", icon: "👕" }
];

function saveProducts() { localStorage.setItem('makani_products', JSON.stringify(products)); }
function saveCategories() { localStorage.setItem('makani_categories', JSON.stringify(categories)); }

function formatPrice(price) { return price.toLocaleString() + ' دينار'; }

function renderAdminProducts() {
    let t = document.getElementById('products-list-admin');
    if(!t) return;
    if(products.length === 0) { t.innerHTML = '<tr><td colspan="6" style="text-align:center">📦 لا توجد منتجات حالياً</td></tr>'; return; }
    t.innerHTML = products.map(p=>{ 
        let c = categories.find(cat=>cat.id == p.categoryId); 
        return `
            <tr>
                <td style="text-align:right"><strong>${p.name}</strong></td>
                <td>${formatPrice(p.price)}</td>
                <td>${c ? c.icon+' '+c.name : '⚠️ بدون قسم'}</td>
                <td><input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px; padding:5px; border-radius:10px; border:1px solid #ccc;"></td>
                <td>
                    <select id="cat-${p.id}" style="padding:5px 10px; border-radius:20px; border:1px solid #ccc;">
                        ${categories.map(cat => `<option value="${cat.id}" ${p.categoryId == cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn-sm btn-edit" onclick="updateProduct(${p.id})">💾 تحديث</button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})">🗑️ حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateProduct(id) {
    let product = products.find(p => p.id == id);
    if(product) {
        let newStock = parseInt(document.getElementById(`stock-${id}`).value);
        let newCategory = parseInt(document.getElementById(`cat-${id}`).value);
        if(isNaN(newStock)) { alert("⚠️ الكمية غير صحيحة"); return; }
        product.stock = newStock;
        product.categoryId = newCategory;
        saveProducts();
        renderAdminProducts();
        alert("✅ تم تحديث المنتج بنجاح");
    }
}

function renderAdminCategories() {
    let c = document.getElementById('categories-list-admin');
    if(!c) return;
    if(categories.length === 0) { c.innerHTML = '<p>⚠️ لا توجد أقسام حالياً. أضف قسم جديد!</p>'; return; }
    c.innerHTML = categories.map(cat=>`
        <div class="category-item-admin">
            <div><span style="font-size:1.8rem">${cat.icon}</span> <strong style="font-size:1.1rem">${cat.name}</strong> <small style="color:#8899aa;">(ID: ${cat.id})</small></div>
            <div>
                <button class="btn-sm btn-edit" onclick="editCategory(${cat.id})">✏️ تعديل</button>
                <button class="btn-sm btn-delete" onclick="deleteCategory(${cat.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function updateCategorySelect() {
    let s = document.getElementById('new-category');
    if(s) {
        s.innerHTML = '<option value="">-- اختر القسم --</option>' + categories.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
}

function addProduct() {
    let n = document.getElementById('new-name')?.value.trim();
    let p = document.getElementById('new-price')?.value;
    let i = document.getElementById('new-image')?.value.trim();
    let c = document.getElementById('new-category')?.value;
    let s = document.getElementById('new-stock')?.value;
    
    if(!n) { alert("⚠️ يرجى إدخال اسم المنتج"); return; }
    if(!p || isNaN(parseInt(p))) { alert("⚠️ يرجى إدخال سعر صحيح"); return; }
    if(!s || isNaN(parseInt(s))) { alert("⚠️ يرجى إدخال كمية صحيحة"); return; }
    if(!c) { alert("⚠️ يرجى اختيار قسم للمنتج"); return; }
    
    let imageUrl = i;
    if(!imageUrl) {
        imageUrl = "https://placehold.co/400x400/0077b6/white?text=" + encodeURIComponent(n);
    }
    
    products.push({ 
        id: Date.now(), 
        name: n, 
        price: parseInt(p), 
        image: imageUrl, 
        categoryId: parseInt(c), 
        stock: parseInt(s) 
    });
    
    saveProducts(); 
    renderAdminProducts();
    
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-image').value = '';
    document.getElementById('new-stock').value = '';
    
    alert("✅ تم إضافة المنتج بنجاح");
}

function deleteProduct(id) { 
    if(confirm("⚠️ هل أنت متأكد من حذف هذا المنتج؟")){ 
        products = products.filter(p => p.id != id); 
        saveProducts(); 
        renderAdminProducts(); 
        alert("✅ تم حذف المنتج");
    } 
}

function addCategory() { 
    let n = document.getElementById('new-cat-name')?.value.trim(); 
    let i = document.getElementById('new-cat-icon')?.value || '📁'; 
    if(!n){ 
        alert("⚠️ يرجى إدخال اسم القسم"); 
        return; 
    } 
    let newId = Date.now();
    categories.push({ id: newId, name: n, icon: i }); 
    saveCategories(); 
    renderAdminCategories(); 
    updateCategorySelect(); 
    renderAdminProducts();
    document.getElementById('new-cat-name').value = ''; 
    document.getElementById('new-cat-icon').value = '';
    alert("✅ تم إضافة القسم بنجاح"); 
}

function editCategory(id) { 
    let c = categories.find(cat=>cat.id==id); 
    if(c){ 
        let n = prompt("✏️ اسم القسم الجديد:", c.name); 
        if(n && n.trim()) c.name = n.trim(); 
        let ic = prompt("✏️ الأيقونة الجديدة (رمز تعبيري):", c.icon); 
        if(ic && ic.trim()) c.icon = ic.trim(); 
        saveCategories(); 
        renderAdminCategories(); 
        updateCategorySelect(); 
        renderAdminProducts();
        alert("✅ تم تعديل القسم");
    } 
}

function deleteCategory(id) { 
    let productsInCat = products.filter(p => p.categoryId == id);
    let msg = productsInCat.length > 0 
        ? `⚠️ هذا القسم يحتوي على ${productsInCat.length} منتج(ات).\nحذف القسم سيؤدي إلى حذف منتجاته أيضاً.\nهل أنت متأكد؟`
        : "⚠️ هل أنت متأكد من حذف هذا القسم؟";
    
    if(confirm(msg)){ 
        products = products.filter(p => p.categoryId != id); 
        categories = categories.filter(c => c.id != id); 
        saveProducts(); 
        saveCategories(); 
        renderAdminProducts(); 
        renderAdminCategories(); 
        updateCategorySelect(); 
        alert("✅ تم حذف القسم");
    } 
}

function showAdminTab(tab) { 
    let productsTab = document.getElementById('products-tab');
    let categoriesTab = document.getElementById('categories-tab');
    let btns = document.querySelectorAll('.admin-tab');
    
    if(tab === 'products') {
        productsTab.style.display = 'block';
        categoriesTab.style.display = 'none';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        renderAdminProducts();
    } else {
        productsTab.style.display = 'none';
        categoriesTab.style.display = 'block';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        renderAdminCategories();
    }
}

function checkAdminLogin() { 
    let password = document.getElementById('admin-password')?.value;
    // 🔒 يمكنك تغيير كلمة المرور هنا
    if(password === "admin123"){ 
        localStorage.setItem('admin_logged_in', 'true'); 
        document.getElementById('login-screen').style.display = 'none'; 
        document.getElementById('dashboard').style.display = 'block'; 
        renderAdminProducts(); 
        renderAdminCategories(); 
        updateCategorySelect(); 
    } else { 
        alert("⚠️ كلمة المرور غير صحيحة"); 
    } 
}

function logout() { 
    localStorage.removeItem('admin_logged_in'); 
    location.reload(); 
}

if(localStorage.getItem('admin_logged_in') === 'true'){ 
    document.getElementById('login-screen').style.display = 'none'; 
    document.getElementById('dashboard').style.display = 'block'; 
    renderAdminProducts(); 
    renderAdminCategories(); 
    updateCategorySelect(); 
}
