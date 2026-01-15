(async function(){

  // 1. jika sudah lolos, stop
  if (localStorage.getItem("sb_auth") === "ok") return;

  // 2. cek email
  const email = localStorage.getItem("sb_email");
  if (!email) {
    location.href = "login.html";
    return;
  }

  try {
    // 3. load users.csv
    const res = await fetch("data/users.csv");
    if (!res.ok) throw new Error("csv not found");

    const text = await res.text();
    const list = text
      .trim()
      .split(/\r?\n/)
      .slice(1) // buang header
      .map(r => r.trim().toLowerCase());

    // 4. validasi
    if (list.includes(email.toLowerCase())) {
      localStorage.setItem("sb_auth", "ok");
    } else {
      alert("Email tidak terdaftar");
      localStorage.clear();
      location.href = "login.html";
    }

  } catch (e) {
    alert("Gagal memuat data user");
    location.href = "login.html";
  }

})();
