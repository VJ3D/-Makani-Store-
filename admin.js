let products = JSON.parse(localStorage.getItem('makani_products')) || [];
let categories = JSON.parse(localStorage.getItem('makani_categories')) || [];

function saveProducts() { localStorage.setItem('makani_products', JSON.stringify(products)); }
function saveCategories() { localStorage.setItem('makani_categories', JSON.stringify(categories)); }

function renderAdminProducts() {
    let t = document.getElementById('products-list-admin');
    if(!t) return;
    t.innerHTML = products.map(p=>{ let c=categories.find(c=>c.id==p.categoryId); return `<tr><td>${p.name}</td><td>${p.price} ريال</td><td>${c?c.icon+' '+c.name:'-'}</td><td><input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px"></td><td><button class="btn-sm btn-edit" onclick="updateStock(${p.id})">تحديث</button><button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})">حذف</button></td></tr>`; }).join('');
}

function renderAdminCategories() {
    let c = document.getElementById('categories-list-admin');
    if(!c) return;
    c.innerHTML = categories.map(cat=>`<div class="category-item-admin"><div><span style="font-size:1.5rem">${cat.icon}</span> <strong>${cat.name}</strong></div><div><button class="btn-sm btn-edit" onclick="editCategory(${cat.id})">تعديل</button><button class="btn-sm btn-delete" onclick="deleteCategory(${cat.id})">حذف</button></div></div>`).join('');
}

function updateCategorySelect() {
    let s = document.getElementById('new-category');
    if(s) s.innerHTML = categories.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

function addProduct() {
    let n=document.getElementById('new-name')?.value, p=document.getElementById('new-price')?.value, i=document.getElementById('new-image')?.value||"https://placehold.co/400x400/0077b6/white?text=منتج", c=document.getElementById('new-category')?.value, s=document.getElementById('new-stock')?.value;
    if(!n||!p||!s) { alert("املأ الحقول"); return; }
    products.push({ id:Date.now(), name:n, price:parseInt(p), image:i, categoryId:parseInt(c), stock:parseInt(s) });
    saveProducts(); renderAdminProducts();
    document.getElementById('new-name').value=''; document.getElementById('new-price').value=''; document.getElementById('new-stock').value='';
    alert("✅ تمت الإضافة");
}
function updateStock(id) { let p=products.find(p=>p.id==id); if(p){ p.stock=parseInt(document.getElementById(`stock-${id}`).value); saveProducts(); alert("✅ تم التحديث"); } }
function deleteProduct(id) { if(confirm("حذف؟")){ products=products.filter(p=>p.id!=id); saveProducts(); renderAdminProducts(); } }
function addCategory() { let n=document.getElementById('new-cat-name')?.value, i=document.getElementById('new-cat-icon')?.value||'📁'; if(!n){ alert("أدخل اسم القسم"); return; } categories.push({ id:Date.now(), name:n, icon:i }); saveCategories(); renderAdminCategories(); updateCategorySelect(); document.getElementById('new-cat-name').value=''; alert("✅ تم"); }
function editCategory(id) { let c=categories.find(c=>c.id==id); if(c){ let n=prompt("اسم جديد:",c.name); if(n) c.name=n; let ic=prompt("أيقونة جديدة:",c.icon); if(ic) c.icon=ic; saveCategories(); renderAdminCategories(); updateCategorySelect(); } }
function deleteCategory(id) { if(confirm("حذف القسم مع منتجاته؟")){ products=products.filter(p=>p.categoryId!=id); categories=categories.filter(c=>c.id!=id); saveProducts(); saveCategories(); renderAdminProducts(); renderAdminCategories(); updateCategorySelect(); } }
function showAdminTab(t) { document.getElementById('products-tab').style.display=t==='products'?'block':'none'; document.getElementById('categories-tab').style.display=t==='categories'?'block':'none'; document.querySelectorAll('.admin-tab').forEach((b,i)=>{ b.classList.toggle('active',(t==='products'&&i===0)||(t==='categories'&&i===1)); }); }
function checkAdminLogin() { if(document.getElementById('admin-password')?.value==="admin123"){ localStorage.setItem('admin_logged_in','true'); document.getElementById('login-screen').style.display='none'; document.getElementById('dashboard').style.display='block'; renderAdminProducts(); renderAdminCategories(); updateCategorySelect(); }else alert("كلمة المرور غير صحيحة"); }
function logout() { localStorage.removeItem('admin_logged_in'); location.reload(); }
if(localStorage.getItem('admin_logged_in')==='true'){ document.getElementById('login-screen').style.display='none'; document.getElementById('dashboard').style.display='block'; renderAdminProducts(); renderAdminCategories(); updateCategorySelect(); }
