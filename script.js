// ==================================================
// script.js - نسخة بسيطة للاختبار
// ==================================================

const SUPABASE_URL = "https://ymfxhrbjqubgpgxzhoqx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZnhocmJqcXViZ3BneHpob3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MzksImV4cCI6MjA5NTUzMzQzOX0.4hahW-U_IOOBJFfwl2P0qdFl2gXp6QUVuanRis8XLt4";

let supabaseClient;
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('makani_cart')) || [];

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase connected");
}

// نافذة تشخيص صغيرة
const debugDiv = document.createElement('div');
debugDiv.style.cssText = 'position:fixed; bottom:10px; left:10px; background:#1e293b; color:#4ade80; padding:8px 15px; border-radius:20px; font-size:12px; z-index:9999; font-family:monospace;';
debugDiv.innerHTML = '🔄 جاري التحميل...';
document.body.appendChild(debugDiv);

async function loadData() {
    debugDiv.innerHTML = '📡 جلب الأقسام...';
    
    // جلب الأقسام
    const { data: cats } = await supabaseClient.from('categories').select('*');
    categories = cats || [];
    debugDiv.innerHTML = `✅ ${categories.length} قسم`;
    
    // عرض الأقسام
    const grid = document.getElementById('categories-grid');
    if (grid && categories.length) {
        grid.innerHTML = categories.map(c => `
            <div style="background:white; border-radius:20px; padding:15px; text-align:center;">
                <div style="font-size:2rem;">📁</div>
                <h3>${c.name}</h3>
            </div>
        `).join('');
    }
    
    // جلب المنتجات
    debugDiv.innerHTML = '📡 جلب المنتجات...';
    const { data: prods } = await supabaseClient.from('products').select('*').limit(12);
    products = prods || [];
    debugDiv.innerHTML = `✅ ${products.length} منتج`;
    
    // عرض المنتجات المميزة
    const featured = document.getElementById('featured-products');
    if (featured && products.length) {
        featured.innerHTML = products.slice(0,4).map(p => `
            <div style="background:white; border-radius:20px; padding:15px; text-align:center;">
                <div style="background:#f1f5f9; height:120px; display:flex; align-items:center; justify-content:center; border-radius:12px;">🖼️</div>
                <h3>${p.name}</h3>
                <div style="color:#0284c7;">${p.price} دينار</div>
            </div>
        `).join('');
    }
    
    // عرض جميع المنتجات
    const allProducts = document.getElementById('all-products');
    if (allProducts && products.length) {
        allProducts.innerHTML = products.map(p => `
            <div style="background:white; border-radius:20px; padding:15px; text-align:center;">
                <div style="background:#f1f5f9; height:120px; display:flex; align-items:center; justify-content:center; border-radius:12px;">🖼️</div>
                <h3>${p.name}</h3>
                <div style="color:#0284c7;">${p.price} دينار</div>
                <button onclick="addToCart(${p.id})" style="background:#f1f5f9; border:none; padding:8px; border-radius:20px; margin-top:10px;">➕ أضف</button>
            </div>
        `).join('');
    }
}

window.addToCart = function(id) {
    const p = products.find(p => p.id == id);
    if (p) {
        cart.push({...p, quantity: 1});
        localStorage.setItem('makani_cart', JSON.stringify(cart));
        alert(`✅ تم إضافة ${p.name}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
