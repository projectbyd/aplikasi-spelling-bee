(function(){
  let devtoolsOpen = false;

  const threshold = 160;

  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        alert("Akses diblokir");
        location.href = "login.html";
      }
    } else {
      devtoolsOpen = false;
    }
  }, 1000);
})();

if (localStorage.getItem("sb_auth") !== "ok") {
  window.location.href = "login.html";
}
