let currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) window.location.href = "login.html";

document.getElementById("username").textContent = currentUser.name;

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}
