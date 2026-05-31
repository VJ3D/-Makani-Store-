// ==================================================
// admin.js - لوحة إدارة مصلحة لعمود الصور المتعددة
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient = null;
let products = [];
let categories = [];
let currentEditingProductId = null;

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadData() {
    if (!supabaseClient) return;
    try {
        const { data: catData } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
        categories = catData || [];
        
        const { data: prodData } = await supabaseClient.from('products').select('*').order('id', { ascending: false });
        products = prodData || [];
        
        renderAdminProducts();
        fillCategorySelects();
    } catch (err) {
        console.error("خطأ تحميل بيانات المسؤول:", err.message);
    }
}

function fillCategorySelects() {
    ['product-category', 'edit-product-category'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">اختر القسم</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        }
    });
}

function renderAdminProducts() {
    const container = document.getElementById('products-table-container');
    if (!container) return;
    
    let html = `<table style="width:100%; border-collapse:collapse; text-align:right;">
        <thead>
            <tr style="background:#f1f5f9;">
                <th style="padding:10px;">الصورة</th>
                <th style="padding:10px;">الاسم</th>
                <th style="padding:10px;">السعر</th>
                <th style="padding:10px;">التحكم</th>
            </tr>
        </thead>
        <tbody>`;
        
    products.forEach(p => {
        html += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;"><img src="${p.image || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'50\\' height=\\'50\\'><rect width=\\'50\\' height=\\'50\\' fill=\\'%23ccc\\'/></svg>'"></td>
                <td style="padding:10px; font-weight:bold;">${p.name}</td>
                <td style="padding:10px;">${Number(p.price).toLocaleString()} د.ع</td>
                <td style="padding:10px;">
                    <button onclick="openEditModal(${p.id})" style="padding:5px 10px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">✏️ تعديل</button>
                    <button onclick="deleteProduct(${p.id})" style="padding:5px 10px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; margin-right:5px;">🗑️ حذف</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

window.addProduct = async function() {
    const name = document.getElementById('product-name')?.value.trim();
    const price = document.getElementById('product-price')?.value.trim();
    const image = document.getElementById('product-image')?.value.trim();
    const extraImages = document.getElementById('product-extra-images')?.value.trim();
    const categoryId = document.getElementById('product-category')?.value;
    const description = document.getElementById('product-desc')?.value.trim();
    
    if (!name || !price || !categoryId) return alert("الرجاء ملء الحقول الأساسية");
    
    try {
        const { error } = await supabaseClient.from('products').insert([{
            name: name,
            price: parseFloat(price),
            image: image || "",
            extra_images: extraImages || "",
            category_id: parseInt(categoryId),
            description: description || ""
        }]);
        if (error) throw error;
        alert("✅ تم إضافة المنتج بنجاح");
        loadData();
    } catch (err) { alert("خطأ الإضافة: " + err.message); }
};

window.openEditModal = function(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    currentEditingProductId = id;
    
    document.getElementById('edit-product-name').value = p.name || '';
    document.getElementById('edit-product-price').value = p.price || '';
    document.getElementById('edit-product-image').value = p.image || '';
    document.getElementById('edit-product-extra-images').value = p.extra_images || '';
    document.getElementById('edit-product-category').value = p.category_id || '';
    document.getElementById('edit-product-desc').value = p.description || '';
    
    document.getElementById('edit-modal').style.display = 'flex';
};

window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};

window.saveProductEdit = async function() {
    if (!currentEditingProductId) return;
    try {
        const { error } = await supabaseClient.from('products').update({
            name: document.getElementById('edit-product-name').value.trim(),
            price: parseFloat(document.getElementById('edit-product-price').value),
            image: document.getElementById('edit-product-image').value.trim(),
            extra_images: document.getElementById('edit-product-extra-images').value.trim(),
            category_id: parseInt(document.getElementById('edit-product-category').value),
            description: document.getElementById('edit-product-desc').value.trim()
        }).eq('id', currentEditingProductId);
        
        if (error) throw error;
        alert("✅ تم تعديل المنتج بنجاح");
        closeEditModal();
        loadData();
    } catch (err) { alert("خطأ التعديل: " + err.message); }
};

window.deleteProduct = async function(id) {
    if (confirm("هل أنت متأكد من الحذف؟")) {
        try {
            await supabaseClient.from('products').delete().eq('id', id);
            loadData();
        } catch (err) { alert(err.message); }
    }
};

window.handleLogin = function(e) {
    if (e) e.preventDefault();
    if (document.getElementById('admin-password').value === "admin123") {
        localStorage.setItem('admin_logged_in', 'true');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData();
    } else { alert("كلمة المرور خاطئة"); }
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('admin_logged_in') === 'true') {
        if (document.getElementById('login-screen')) document.getElementById('login-screen').style.display = 'none';
        if (document.getElementById('dashboard')) document.getElementById('dashboard').style.display = 'block';
        loadData();
    }
});
