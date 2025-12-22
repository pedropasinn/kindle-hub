(function () {
  // Resolve base path of this loader so it works from any subfolder.
  var src = (document.currentScript && document.currentScript.src) || "";
  var base = src ? src.slice(0, src.lastIndexOf("/") + 1) : "";
  var isWeb = location.protocol === "http:" || location.protocol === "https:";

  if (isWeb) {
    // Web (Vercel / localhost): do NOT load Cordova Android bridge.
    // Otherwise browsers will show prompt("gap:...") dialogs.
    document.write('<script src="' + base + 'cordova_web_shim.js"><\/script>');
  } else {
    // Cordova app (file://, cdvfile://): load the real Cordova runtime.
    document.write('<script src="' + base + 'cordova.js"><\/script>');
    document.write('<script src="' + base + 'cordova_plugins.js"><\/script>');
  }
})();
