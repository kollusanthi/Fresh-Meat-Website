
/* ===============================
   MEATMATE CUSTOMER WEBSITE
================================ */

const PRODUCTS = [
 {id:1,name:"Premium Chicken Curry Cut",category:"Chicken",price:220,unit:"500g",image:"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600"},
 {id:2,name:"Boneless Chicken",category:"Chicken",price:280,unit:"500g",image:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600"},
 {id:3,name:"Fresh Chicken Breast",category:"Chicken",price:320,unit:"500g",image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600"},
 {id:4,name:"Fresh Mutton Curry Cut",category:"Mutton",price:450,unit:"500g",image:"https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600"},
 {id:5,name:"Premium Mutton Boneless",category:"Mutton",price:520,unit:"500g",image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600"},
 {id:6,name:"Fresh Rohu Fish",category:"Fish",price:180,unit:"500g",image:"https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600"},
 {id:7,name:"Fresh Seer Fish",category:"Fish",price:350,unit:"500g",image:"https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"},
 {id:8,name:"Fresh Prawns",category:"Seafood",price:300,unit:"250g",image:"https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600"}
];

const $ = id => document.getElementById(id);

const getData = (key, fallback=[]) => {
 try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
 catch { return fallback; }
};

const setData = (key,value) => localStorage.setItem(key,JSON.stringify(value));

let currentUser = getData("meatmateSession",null);
let selectedCategory = "All";
let cart = getData("meatmateCart",[]);
let editingAddressId = null;

function userKey(type) {
 return currentUser ? `mm_${type}_${currentUser.id}` : null;
}

function getUserData(type,fallback=[]) {
 return userKey(type) ? getData(userKey(type),fallback) : fallback;
}

function saveUserData(type,data) {
 if(currentUser) setData(userKey(type),data);
}

function showToast(message) {
 const toast=$("toast");
 toast.textContent=message;
 toast.classList.add("show");
 setTimeout(()=>toast.classList.remove("show"),2500);
}

/* PRODUCTS */

function renderProducts() {
 const search=$("searchInput").value.toLowerCase();
 let products=PRODUCTS.filter(p=>
   (selectedCategory==="All" || p.category===selectedCategory) &&
   p.name.toLowerCase().includes(search)
 );

 const sort=$("sortSelect").value;
 if(sort==="low") products.sort((a,b)=>a.price-b.price);
 if(sort==="high") products.sort((a,b)=>b.price-a.price);

 $("productGrid").innerHTML=products.map(p=>`
  <article class="product-card">
   <button class="wishlist-btn" onclick="toggleWishlist(${p.id})">
    ${getUserData("wishlist",[]).includes(p.id)?"♥":"♡"}
   </button>
   <img src="${p.image}" alt="${p.name}" loading="lazy">
   <div class="product-info">
    <small>${p.category} · ${p.unit}</small>
    <h3>${p.name}</h3>
    <div class="product-price">₹${p.price}</div>
    <button class="primary-btn" onclick="addToCart(${p.id})">Add to Bag +</button>
   </div>
  </article>
 `).join("");

 $("emptyState").hidden=products.length!==0;
}

$("categoryGrid").addEventListener("click",e=>{
 const btn=e.target.closest("[data-category]");
 if(!btn)return;
 selectedCategory=btn.dataset.category;
 document.querySelectorAll(".category-card").forEach(b=>b.classList.remove("selected"));
 btn.classList.add("selected");
 renderProducts();
});

$("searchInput").addEventListener("input",renderProducts);
$("sortSelect").addEventListener("change",renderProducts);
$("searchToggle").onclick=()=>{
 $("searchInput").focus();
 $("products").scrollIntoView({behavior:"smooth"});
};

/* AUTHENTICATION DEMO */

function openAuth(mode) {
 $("authModal").classList.add("show");
 $("authMessage").textContent="";
 $("authForm").reset();
 switchAuth(mode);
 $("profileDropdown").classList.remove("show");
}

function closeAuth() {
 $("authModal").classList.remove("show");
}

function switchAuth(mode) {
 const register=mode==="register";
 $("authTitle").textContent=register?"Create Account":"Welcome Back";
 $("authSubmit").textContent=register?"Register":"Login";
 $("registerFields").hidden=!register;
 $("regName").required=register;
 $("regPhone").required=register;

 $("authSwitch").innerHTML=register
 ? 'Already have an account? <a href="#" onclick="switchAuth(\'login\');return false;">Login</a>'
 : 'New to MeatMate? <a href="#" onclick="switchAuth(\'register\');return false;">Create Account</a>';
}

$("authForm").addEventListener("submit",async e=>{
 e.preventDefault();

 const email=$("authEmail").value.trim().toLowerCase();
 const password=$("authPassword").value;

 if(password.length<6) {
  $("authMessage").textContent="Password must have at least 6 characters.";
  return;
 }

 const users=getData("meatmateUsers",[]);

 if($("authTitle").textContent==="Create Account") {
  const name=$("regName").value.trim();
  const phone=$("regPhone").value.trim();

  if(!/^[6-9]\d{9}$/.test(phone)) {
   $("authMessage").textContent="Enter a valid 10-digit mobile number.";
   return;
  }

  if(users.some(u=>u.email===email)) {
   $("authMessage").textContent="This email is already registered. Please login.";
   return;
  }

  const user={
   id:"MM"+Date.now(),
   name,email,phone,
   password
  };

  users.push(user);
  setData("meatmateUsers",users);
  setData("meatmateSession",user);
  currentUser=user;
  setData(userKey("wishlist"),[]);
  setData(userKey("addresses"),[]);
  setData(userKey("orders"),[]);
  setData(userKey("notifications"),[
   {id:Date.now(),message:"Welcome to MeatMate! Start shopping fresh.",date:new Date().toLocaleString(),read:false}
  ]);
  setData(userKey("support"),[]);

  closeAuth();
  updateAccountUI();
  showToast("Registration successful! Welcome to MeatMate.");
  return;
 }

 const user=users.find(u=>u.email===email && u.password===password);

 if(!user) {
  $("authMessage").textContent="Invalid email or password.";
  return;
 }

 currentUser=user;
 setData("meatmateSession",user);
 closeAuth();
 updateAccountUI();
 showToast("Login successful. Welcome back!");
});


function logout() {
    if (!currentUser) return;

    // Clear previous customer's cart
    cart = [];
    setData("meatmateCart", []);

    // Clear login session
    currentUser = null;
    localStorage.removeItem("meatmateSession");

    // Close account pages and return home
    closeCart();
    closeCheckout();
    closeAccountPages();

    // Update header and cart count
    updateAccountUI();

    showToast("Logged out successfully!");
}


/* ACCOUNT */

function updateAccountUI() {
 const loggedIn=!!currentUser;

 $("guestLinks").hidden=loggedIn;
 $("userLinks").hidden=!loggedIn;
 $("dropdownUser").textContent=loggedIn?`Hello, ${currentUser.name}`:"Welcome, Guest";

 if(loggedIn) {
  $("sidebarUser").textContent=currentUser.name;
  $("accountName").value=currentUser.name;
  $("accountEmail").value=currentUser.email;
  $("accountPhone").value=currentUser.phone;
 }
 renderCart();
 renderProducts();
}

$("profileBtn").onclick=()=>{
 $("profileDropdown").classList.toggle("show");
};

document.addEventListener("click",e=>{
 if(!e.target.closest(".profile-wrap")) {
  $("profileDropdown").classList.remove("show");
 }
});

function openPage(pageId) {
 if(!currentUser) {
  openAuth("login");
  return;
 }

 $("homeContent").hidden=true;
 $("customerPages").hidden=false;

 document.querySelectorAll(".account-page").forEach(p=>p.hidden=true);
 $(pageId).hidden=false;

 $("profileDropdown").classList.remove("show");

 if(pageId==="addressPage")renderAddresses();
 if(pageId==="ordersPage")renderOrders();
 if(pageId==="wishlistPage")renderWishlist();
 if(pageId==="notificationsPage")renderNotifications();
 if(pageId==="supportPage")renderSupport();

 window.scrollTo({top:0,behavior:"smooth"});
}


function closeAccountPages() {
    $("customerPages").hidden = true;
    $("homeContent").hidden = false;

    // Show homepage
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Remove active account page
    document.querySelectorAll(".account-page").forEach(page => {
        page.hidden = true;
    });

    // Close profile dropdown
    $("profileDropdown").classList.remove("show");
}


$("accountForm").addEventListener("submit",e=>{
 e.preventDefault();
 if(!currentUser)return;

 const name=$("accountName").value.trim();
 const email=$("accountEmail").value.trim().toLowerCase();
 const phone=$("accountPhone").value.trim();

 if(!/^[6-9]\d{9}$/.test(phone)) {
  showToast("Enter a valid mobile number.");
  return;
 }

 const users=getData("meatmateUsers",[]);
 if(users.some(u=>u.email===email && u.id!==currentUser.id)) {
  showToast("Email is already used by another account.");
  return;
 }

 const oldEmail=currentUser.email;
 const user=users.find(u=>u.id===currentUser.id);
 if(!user)return;

 user.name=name;
 user.email=email;
 user.phone=phone;

 currentUser=user;
 setData("meatmateUsers",users);
 setData("meatmateSession",user);
 $("sidebarUser").textContent=name;
 $("dropdownUser").textContent=`Hello, ${name}`;
 showToast("Account details updated.");
});

/* ADDRESSES */

function showAddressForm(id=null) {
 editingAddressId=id;
 $("addressForm").hidden=false;
 $("addressForm").reset();

 if(id) {
  const a=getUserData("addresses",[]).find(x=>x.id===id);
  if(!a)return;
  $("addressLabel").value=a.label;
  $("addressName").value=a.name;
  $("addressPhone").value=a.phone;
  $("addressText").value=a.text;
  $("addressCity").value=a.city;
  $("addressPincode").value=a.pincode;
  $("defaultAddress").checked=a.isDefault;
 }
 $("addressForm").scrollIntoView({behavior:"smooth"});
}

function hideAddressForm() {
 $("addressForm").hidden=true;
 editingAddressId=null;
}

$("addressForm").addEventListener("submit",e=>{
 e.preventDefault();

 const phone=$("addressPhone").value.trim();
 const pin=$("addressPincode").value.trim();

 if(!/^[6-9]\d{9}$/.test(phone))return showToast("Enter a valid mobile number.");
 if(!/^\d{6}$/.test(pin))return showToast("Enter a valid 6-digit pincode.");

 let addresses=getUserData("addresses",[]);

 const address={
  id:editingAddressId || Date.now(),
  label:$("addressLabel").value.trim(),
  name:$("addressName").value.trim(),
  phone,
  text:$("addressText").value.trim(),
  city:$("addressCity").value.trim(),
  pincode:pin,
  isDefault:$("defaultAddress").checked
 };

 if(address.isDefault)addresses=addresses.map(a=>({...a,isDefault:false}));

 if(editingAddressId) {
  addresses=addresses.map(a=>a.id===editingAddressId?address:a);
 } else {
  addresses.push(address);
 }

 if(addresses.length===1)addresses[0].isDefault=true;

 saveUserData("addresses",addresses);
 hideAddressForm();
 renderAddresses();
 showToast("Address saved successfully.");
});

function renderAddresses() {
 const addresses=getUserData("addresses",[]);
 $("addressList").innerHTML=addresses.length?addresses.map(a=>`
  <div class="data-card">
   <h3>${escapeHTML(a.label)} ${a.isDefault?'<span class="status"> · Default</span>':""}</h3>
   <p>${escapeHTML(a.name)} · ${escapeHTML(a.phone)}<br>
   ${escapeHTML(a.text)}<br>${escapeHTML(a.city)} - ${escapeHTML(a.pincode)}</p>
   <button class="secondary-btn" onclick="showAddressForm(${a.id})">Edit</button>
   <button class="secondary-btn" onclick="deleteAddress(${a.id})">Delete</button>
   ${!a.isDefault?`<button class="secondary-btn" onclick="setDefaultAddress(${a.id})">Set Default</button>`:""}
  </div>
 `).join():'<p class="empty-state">No saved addresses. Add your first address.</p>';
}

function deleteAddress(id) {
 if(!confirm("Delete this address?"))return;
 let addresses=getUserData("addresses",[]).filter(a=>a.id!==id);
 if(addresses.length && !addresses.some(a=>a.isDefault))addresses[0].isDefault=true;
 saveUserData("addresses",addresses);
 renderAddresses();
 showToast("Address deleted.");
}

function setDefaultAddress(id) {
 let addresses=getUserData("addresses",[]).map(a=>({...a,isDefault:a.id===id}));
 saveUserData("addresses",addresses);
 renderAddresses();
 showToast("Default address updated.");
}

/* WISHLIST */

function toggleWishlist(id) {
 if(!currentUser) return openAuth("login");

 let wishlist=getUserData("wishlist",[]);
 if(wishlist.includes(id)) {
  wishlist=wishlist.filter(x=>x!==id);
  showToast("Removed from wishlist.");
 } else {
  wishlist.push(id);
  showToast("Added to wishlist.");
 }
 saveUserData("wishlist",wishlist);
 renderProducts();
 if(!$("wishlistPage").hidden)renderWishlist();
}

function renderWishlist() {
 const wishlist=getUserData("wishlist",[]);
 const products=PRODUCTS.filter(p=>wishlist.includes(p.id));

 $("wishlistList").innerHTML=products.length?products.map(p=>`
  <article class="product-card">
   <img src="${p.image}" alt="${p.name}">
   <div class="product-info">
    <h3>${p.name}</h3>
    <div class="product-price">₹${p.price}</div>
    <button class="primary-btn" onclick="addToCart(${p.id})">Add to Bag</button>
    <button class="secondary-btn" onclick="toggleWishlist(${p.id})">Remove ♥</button>
   </div>
  </article>
 `).join():'<p class="empty-state">Your wishlist is empty.</p>';
}

/* CART */

function addToCart(id) {
 const product=PRODUCTS.find(p=>p.id===id);
 const item=cart.find(x=>x.id===id);

 if(item)item.qty++;
 else cart.push({id,qty:1});

 setData("meatmateCart",cart);
 renderCart();
 showToast(product.name+" added to your bag.");
}

function changeQty(id,amount) {
 const item=cart.find(x=>x.id===id);
 if(!item)return;
 item.qty+=amount;
 if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
 setData("meatmateCart",cart);
 renderCart();
}

function renderCart() {
 const count=cart.reduce((s,x)=>s+x.qty,0);
 const total=cart.reduce((s,x)=>{
  const p=PRODUCTS.find(p=>p.id===x.id);
  return s+(p?p.price*x.qty:0);
 },0);

 $("cartCount").textContent=count;
 $("drawerCount").textContent=`(${count})`;
 $("cartSubtotal").textContent="₹"+total;

 $("cartItems").innerHTML=cart.length?cart.map(item=>{
  const p=PRODUCTS.find(p=>p.id===item.id);
  if(!p)return "";
  return `
   <div class="cart-item">
    <img src="${p.image}" alt="${p.name}">
    <div class="cart-item-info">
     <h4>${p.name}</h4>
     <p>₹${p.price} / ${p.unit}</p>
     <div class="qty-controls">
      <button onclick="changeQty(${p.id},-1)">−</button>
      ${item.qty}
      <button onclick="changeQty(${p.id},1)">+</button>
     </div>
    </div>
    <strong>₹${p.price*item.qty}</strong>
   </div>
  `;
 }).join():'<p class="empty-state">Your bag is waiting for something fresh. Explore our products!</p>';
}

$("cartOpen").onclick=()=>{
 $("cartDrawer").classList.add("open");
 $("overlay").classList.add("show");
};
$("cartClose").onclick=closeCart;
$("overlay").onclick=closeCart;

function closeCart() {
 $("cartDrawer").classList.remove("open");
 $("overlay").classList.remove("show");
}

/* CHECKOUT AND ORDERS */

function checkout() {
 if(!cart.length)return showToast("Your bag is empty.");
 if(!currentUser) {
  closeCart();
  return openAuth("login");
 }

 const addresses=getUserData("addresses",[]);
 if(!addresses.length) {
  closeCart();
  openPage("addressPage");
  showToast("Please add a delivery address first.");
  return;
 }

 $("checkoutAddress").innerHTML=addresses.map(a=>`
  <option value="${a.id}" ${a.isDefault?"selected":""}>
   ${escapeHTML(a.label)} - ${escapeHTML(a.city)}
  </option>
 `).join();

 $("checkoutSummary").innerHTML=`
  <div class="data-card">
   <h3>Order Summary</h3>
   ${cart.map(item=>{
    const p=PRODUCTS.find(p=>p.id===item.id);
    return `<p>${escapeHTML(p.name)} × ${item.qty} = ₹${p.price*item.qty}</p>`;
   }).join("")}
   <hr>
   <h3>Subtotal: ₹${cart.reduce((s,x)=>s+PRODUCTS.find(p=>p.id===x.id).price*x.qty,0)}</h3>
  </div>`;

 closeCart();
 $("checkoutModal").classList.add("show");
}

function closeCheckout() {
 $("checkoutModal").classList.remove("show");
}

function placeOrder() {
 const addressId=Number($("checkoutAddress").value);
 const address=getUserData("addresses",[]).find(a=>a.id===addressId);
 if(!address)return showToast("Select a valid address.");

 const items=cart.map(item=>{
  const p=PRODUCTS.find(p=>p.id===item.id);
  return {
   productId:p.id,
   name:p.name,
   price:p.price,
   qty:item.qty
  };
 });

 const total=items.reduce((s,x)=>s+x.price*x.qty,0);

 const order={
  id:"MM"+Date.now(),
  date:new Date().toLocaleString(),
  items,
  total,
  address:{...address},
  status:"Order Placed",
  payment:"Cash on Delivery"
 };

 const orders=getUserData("orders",[]);
 orders.unshift(order);
 saveUserData("orders",orders);

 addNotification("Your order "+order.id+" has been placed successfully.");

 cart=[];
 setData("meatmateCart",cart);
 renderCart();
 closeCheckout();
 showToast("Order placed successfully! Order ID: "+order.id);

 openPage("ordersPage");
}

function renderOrders() {
 const orders=getUserData("orders",[]);
 $("ordersList").innerHTML=orders.length?orders.map(o=>`
  <div class="data-card">
   <h3>Order #${escapeHTML(o.id)}</h3>
   <p>${escapeHTML(o.date)}</p>
   <div class="order-items">
    ${o.items.map(i=>`${escapeHTML(i.name)} × ${i.qty} — ₹${i.price*i.qty}`).join("<br>")}
   </div>
   <p><strong>Total: ₹${o.total}</strong></p>
   <p>Payment: ${escapeHTML(o.payment)}</p>
   <p>Delivery: ${escapeHTML(o.address.text)}, ${escapeHTML(o.address.city)} - ${escapeHTML(o.address.pincode)}</p>
   <p class="status">Status: ${escapeHTML(o.status)}</p>
  </div>
 `).join():'<p class="empty-state">You have not placed any orders yet.</p>';
}

/* NOTIFICATIONS */

function addNotification(message) {
 let notifications=getUserData("notifications",[]);
 notifications.unshift({
  id:Date.now(),
  message,
  date:new Date().toLocaleString(),
  read:false
 });
 saveUserData("notifications",notifications);
}

function renderNotifications() {
 const list=getUserData("notifications",[]);
 $("notificationList").innerHTML=list.length?list.map(n=>`
  <div class="data-card">
   <h3>${escapeHTML(n.message)}</h3>
   <p>${escapeHTML(n.date)}</p>
   <p class="status">${n.read?"Read":"New"}</p>
  </div>
 `).join():'<p class="empty-state">No notifications yet.</p>';
}

function markNotificationsRead() {
 let list=getUserData("notifications",[]).map(n=>({...n,read:true}));
 saveUserData("notifications",list);
 renderNotifications();
 showToast("Notifications marked as read.");
}

/* HELP AND SUPPORT */

$("supportForm").addEventListener("submit",e=>{
 e.preventDefault();

 const tickets=getUserData("support",[]);
 const ticket={
  id:"SUP"+Date.now(),
  subject:$("supportSubject").value.trim(),
  order:$("supportOrder").value.trim(),
  message:$("supportMessage").value.trim(),
  date:new Date().toLocaleString(),
  status:"Submitted"
 };

 tickets.unshift(ticket);
 saveUserData("support",tickets);
 addNotification("Your support request "+ticket.id+" was submitted.");

 $("supportForm").reset();
 renderSupport();
 showToast("Your support request has been saved.");
});

function renderSupport() {
 const tickets=getUserData("support",[]);
 $("supportHistory").innerHTML=tickets.length?`
  <h3>Previous Support Requests</h3>
  ${tickets.map(t=>`
   <div class="data-card">
    <h3>${escapeHTML(t.subject)}</h3>
    <p>Ticket ID: ${escapeHTML(t.id)}</p>
    <p>${escapeHTML(t.message)}</p>
    <p>${escapeHTML(t.date)}</p>
    <p class="status">${escapeHTML(t.status)}</p>
   </div>
  `).join("")}
 `:'<p class="empty-state">No support requests submitted.</p>';
}

/* NEWSLETTER */

$("newsletterForm").addEventListener("submit",e=>{
 e.preventDefault();
 const email=$("newsletterEmail").value.trim().toLowerCase();
 let emails=getData("meatmateSubscribers",[]);
 if(emails.includes(email))return showToast("You are already subscribed.");
 emails.push(email);
 setData("meatmateSubscribers",emails);
 $("newsletterForm").reset();
 showToast("Thank you for subscribing!");
});

/* NAVIGATION */

$("menuToggle").onclick=()=> $("mainNav").classList.toggle("show");

$("mainNav").addEventListener("click",e=>{
 if(e.target.tagName==="A") $("mainNav").classList.remove("show");
});

function escapeHTML(value) {
 return String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 })[c]);
}

/* INITIAL LOAD */

function init() {
 if(currentUser) {
  const users=getData("meatmateUsers",[]);
  const validUser=users.find(u=>u.id===currentUser.id);
  if(validUser)currentUser=validUser;
  else {
   currentUser=null;
   localStorage.removeItem("meatmateSession");
  }
 }

 updateAccountUI();
 renderProducts();
 renderCart();
}

init();




function goHome() {

    // Hide account pages
    $("customerPages").hidden = true;

    // Show homepage
    $("homeContent").hidden = false;

    // Close profile dropdown
    $("profileDropdown").classList.remove("show");

    // Close cart if open
    closeCart();

    // Close checkout if open
    closeCheckout();

    // Scroll to homepage
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

