/* __MISAL_WEB_SHIM__ */
(function () {
  try {
    if (typeof window === 'undefined') return;
    if (window.__missalWebShimInstalled) return;
    window.__missalWebShimInstalled = true;

    // Stubs mínimos para o app não quebrar fora do Cordova
    if (!window.plugins) window.plugins = {};
    if (!window.plugins.insomnia) {
      window.plugins.insomnia = {
        keepAwake: function () {},
        allowSleepAgain: function () {}
      };
    }

    if (!navigator.app) navigator.app = {};
    if (typeof navigator.app.exitApp !== 'function') {
      navigator.app.exitApp = function () {
        console.log('[web] exitApp() ignorado');
      };
    }

    if (!window.device) {
      window.device = {
        platform: 'Browser',
        version: '1.0',
        manufacturer: 'Web',
        model: 'Browser'
      };
    }

    // Garante deviceready no navegador (Cordova real continua com o fluxo normal)
    var fired = false;
    document.addEventListener('deviceready', function () { fired = true; }, { once: true });

    function isNativeShell() {
      try {
        var url = (document.URL || '').toLowerCase();
        var proto = (location.protocol || '').toLowerCase();
        if (proto === 'cdvfile:') return true;
        if (proto === 'file:' && url.indexOf('android_asset') !== -1) return true;
        // Cordova/iOS/Android normalmente roda em file://; na web fica em http(s)://
        if (proto === 'file:' && url.indexOf('http') !== 0) return true;
      } catch (e) {}
      return false;
    }

    function fireDevicereadyFallback() {
      if (fired) return;
      if (isNativeShell()) return;
      try {
        document.dispatchEvent(new Event('deviceready'));
      } catch (e) {
        var ev = document.createEvent('Event');
        ev.initEvent('deviceready', true, true);
        document.dispatchEvent(ev);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(fireDevicereadyFallback, 0);
        setTimeout(fireDevicereadyFallback, 800);
      }, { once: true });
    } else {
      setTimeout(fireDevicereadyFallback, 0);
      setTimeout(fireDevicereadyFallback, 800);
    }
  } catch (e) {
    console.warn('missal web shim falhou:', e);
  }
})();

function getUrlVars() {
  var url = window.location.href.replace(window.location.hash, "")
  var vars = {}
  var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value
  })
  return vars
}

function dime_pref(key, defecto) {
  var resultado = window.localStorage.getItem(key)
  if (resultado == null) resultado = defecto
  //console.log('Saco: '+ key+ '... -> ... '+resultado)
  return resultado
}

function getSafeAreaTop() {
  let testDiv = document.createElement("div");
  testDiv.style.cssText = "position: absolute; top: 0; height: env(safe-area-inset-top); visibility: hidden;";
  document.body.appendChild(testDiv);
  let safeAreaTop = testDiv.offsetHeight;
  document.body.removeChild(testDiv);
  return safeAreaTop || 0; // Devuelve 0 si no hay margen seguro
}
function arregla_top() {
let safeAreaTop = getSafeAreaTop();
    $('#header').css('padding-top', (parseInt(dime_pref('margen_superior_defecto', 0)) + safeAreaTop) + 'px');
    padHeader = parseInt($("#header").css("padding-top"))
    $("#contenedor").css("top", $("#header").outerHeight(true) + "px");
$("#icono-sticky, #icono-gear").css("top", parseInt(parseInt(padHeader) + 10) + "px")
//alert(dime_pref('margen_superior_defecto', 0)+'-'+safeAreaTop+'-'+$("#header").outerHeight(true)+'-'+padHeader )
}


function getSafeAreaBottom() {
  let testDiv = document.createElement("div");
  testDiv.style.cssText = "position: absolute; bottom: 0; height: env(safe-area-inset-bottom); visibility: hidden;";
  document.body.appendChild(testDiv);

  let safeAreaBottom = testDiv.offsetHeight;
  document.body.removeChild(testDiv);

  return safeAreaBottom || 0; // Devuelve 0 si no hay margen seguro
}
function arregla_bottom() {
  let safeAreaBottom = getSafeAreaBottom()
$('#piedepantalla').css('padding-bottom', (parseInt(dime_pref('margen_inferior_defecto', 0)) + safeAreaBottom) + 'px');
}

function ejecutarCodigo(el) {
  let codigo = el.getAttribute("data-url")
  let funcion = new Function(codigo)
  funcion() // Ejecuta el código almacenado en data-url
}

function cambialengua(objeto) {
  // según sean las preferencias y la primera letra del id del div padre del elemento desde el que se ha llamado esta funcion muestra/oculta un idioma, u otro
  if (modocopia) return false
  if (
    a == 1 ||
    mipreferencia["presentaciontexto"] <= 1 ||
    mimisal_1 == mimisal_2
  )
    return
  cambia = false
  cambiaAlatin = false
  cambiaAcast = false
  if (objeto.tagName == "SPAN") objeto = objeto.parentNode
  if (
    objeto.parentNode.className == "pueblo" ||
    mipreferencia["presentacionrespuestas"] == 5
  ) {
    cambia = true
  } else if (
    mipreferencia["presentaciontexto"] == 2 &&
    objeto.className != "botonlengua"
  ) {
    cambia = true
  } else if (
    mipreferencia["presentaciontexto"] == 3 &&
    objeto.className == "botonlengua"
  )
    cambia = true
  if (cambia) {
    encontrado = false
    if (objeto.className == mimisal_2) {
      cambiaAlatin = true
      encontrado = true
    } else if (objeto.className == mimisal_1) {
      cambiaAcast = true
      encontrado = true
    }
    if (!encontrado) {
      if ($(objeto).parents("." + mimisal_2).length > 0) {
        cambiaAlatin = true
      } else if ($(objeto).parents("." + mimisal_1).length > 0)
        cambiaAcast = true
    }
    if (cambiaAlatin) {
      if (encontrado) {
        padre = $(objeto).parents()[0]
      } else {
        padre = $(objeto)
          .parents("." + mimisal_2)[0]
          .parent()[0]
      }
      if ($(padre).children("." + mimisal_1).length > 0) {
        $(padre)
          .children("." + mimisal_2)
          .css("display", "none")
        $(padre)
          .children("." + mimisal_1)
          .css("display", "block")
        $(padre)
          .children("." + mimisal_1 + ":empty")
          .text("--- ??? ---")
      }
    } else if (cambiaAcast) {
      if (encontrado) {
        padre = $(objeto).parents()[0]
      } else {
        padre = $(objeto)
          .parents("." + mimisal_1)[0]
          .parent()[0]
      }
      if ($(padre).children("." + mimisal_2).length > 0) {
        $(padre)
          .children("." + mimisal_2)
          .css("display", "block")
        $(padre)
          .children("." + mimisal_1)
          .css("display", "none")
        $(padre)
          .children("." + mimisal_2 + ":empty")
          .text("--- ??? ---")
      }
    }
  }
  return
}

function pon_pref(key, value) {
  window.localStorage.setItem(key, value)
  //console.log('Guardo: '+value + ' ... --> ... ' + key)
}

function cambia_vista(miId) {
  mielemento = document.getElementById(miId)
  $("#" + miId).toggle()
}

function scrollToElementWithOffset(element, offsetEm = 0) {
  element.scrollIntoView({
      behavior: "smooth",
      block: "start"
  });

  const parent = document.getElementById('contenedor');
  const fontSize = parseFloat(getComputedStyle(element).fontSize); // 1em en px
  const offset = -offsetEm * fontSize;

  let lastScrollTop = parent.scrollTop;
  let isScrolling;

  // Escuchar el scroll del contenedor
  function onScroll() {
      clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
          if (Math.abs(parent.scrollTop - lastScrollTop) < 2) {
              parent.removeEventListener('scroll', onScroll);
              parent.scrollBy({ top: offset, behavior: "smooth" });
          } else {
              lastScrollTop = parent.scrollTop;
          }
      }, 100); // Espera a que deje de moverse
  }

  parent.addEventListener('scroll', onScroll);
}

function mi_oracion() {
  var hoy = new Date()
  var dl = hoy.getDate()
  var dia = hoy.getDay()
  if (dl > 14 && dl < 22 && dia == 0) {
    muestraono("otras", true)
    muestraono("orac23", true)
    id_orac = "#orac023"
  } else if (dia == 2) {
    muestraono("otras", true)
    muestraono("orac18", true)
    id_orac = "#orac018"
  } else if (dia == 4) {
    muestraono("otras", true)
    muestraono("orac25", true)
    id_orac = "#orac025"
  } else {
    muestraono("gracias", true)
    muestraono("orac17", true)
    id_orac = "#orac017"
  }



  const element = document.querySelector(id_orac);

  scrollToElementWithOffset(element, 0);
  contador = 0;
}

function muestraono(miId, siono) {
  var mielemento = document.getElementById(miId)
  if (siono) {
    mielemento.style.display = "block"
  } else mielemento.style.display = "none"
}

function botonPantAbajo() {
  avance = dime_pref("avance_defecto", 100);
  const contenedor = document.querySelector("#contenedor")
  contenedor.scrollBy({
    top: contenedor.clientHeight*avance/100 , // Altura visible del contenedor menos el offset
    behavior: "smooth",
  })
}

function botonPantArriba() {
  avance = dime_pref("avance_defecto", 100);
  const contenedor = document.querySelector("#contenedor")
  contenedor.scrollBy({
    top: -(contenedor.clientHeight*avance/100), // Altura visible del contenedor menos el offset
    behavior: "smooth",
  })
}

function editarCampo(operacion) {
  if (operacion == 4) {
    $("#micampo").val("")
  } else {
    $("#solo_ver_int").toggle()
    $("#micampo").toggle()
    $("#boton_guardar").toggle()
    if (operacion == 0) {
      $("#micampo").get(0).scrollIntoView()
    } else if (operacion == 1) {
      pon_pref("misintenciones", $("#micampo").val().replace(/\n/g, "<br>"))
      $("#misinttxt").html(dime_pref("misintenciones", "---"))
      $("#misintenciones").get(0).scrollIntoView()
    } else if (operacion == 3) {
      $("#micampo").val(misintenciones_inic.replace(/<br>/gi, "\n"))
    }
  }
}

var esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && 'ontouchstart' in document);
function loaded() {
  document.addEventListener("deviceready", onDeviceReady, false)
    $("#cont_dev").on("scrollstart", function (event) {
      a = 1
    })
    $("#cont_dev").on("scrollstop", function (event) {
      setTimeout(function () {
        a = 0
      }, 10)
    })
    const esDispositivoMovil =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

    if (!esDispositivoMovil) {
      var elementos = document.querySelectorAll("[ontouchend]")
      elementos.forEach(function (elemento) {
        var contenido = elemento.getAttribute("ontouchend")
        elemento.removeAttribute("ontouchend")
        elemento.setAttribute("onclick", contenido)
      })
    }
    if (esDispositivoMovil) {
      console.log("El dispositivo tiene pantalla táctil")
      // Aquí puedes agregar el código que necesites para dispositivos con pantalla táctil
    } else {
      console.log("El dispositivo no tiene pantalla táctil")
      // Aquí puedes agregar el código que necesites para dispositivos sin pantalla táctil
    }
    if (getUrlParameter("editar") === "1") {
      $("#devotionarium").show()
      // Hacer visible el elemento #mis_intenciones
      cambia_vista("misintenciones") // Ejecutar la función editarCampo(0)
      editarCampo(0)
    }

    $("#boton_MR").click(async function() {
      try {
        await aseguraCarga();
        console.log("aseguraCarga() completada después del clic");
          
        // Aquí puedes ejecutar código adicional después de que aseguraCarga() se complete
      } catch (error) {
        console.error("Error en aseguraCarga() durante el clic:", error);
        // Aquí puedes manejar el error si es necesario
      }
    });
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  var results = regex.exec(location.search)
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "))
}
function backKeyDown() {
  //console.log("Back Button Pressed!");
  navigator.app.exitApp()
}

function onDeviceReady() {
  // Register the event listener
  //console.log("PhoneGap preparado!");    
  // 
  if (esIOS) {
    $("#exitBtn").css('display' ,"none");
  } else {
    document.addEventListener("volumeupbutton", retrasa_pantalla, false)
  
  document.addEventListener("volumedownbutton", avanza_pantalla, false)
  document.addEventListener("backbutton", backKeyDown, true)

}

    arregla_top()
    arregla_bottom()
}
function cambia_pref(pref, nuevovalor) {
  mipreferencia[pref] = nuevovalor
  preferencias = "?fondo=" + mipreferencia["fondo"]
  preferencias += "&tamanotexto=" + mipreferencia["tamanotexto"]
  preferencias += "&avance=" + mipreferencia["avance"]
  preferencias += "&tipoletra=" + mipreferencia["tipoletra"]
  preferencias += "&tamanorubrica=" + mipreferencia["tamanorubrica"]
  preferencias += "&margen_superior=" + mipreferencia["margen_superior"]
  preferencias += "&margen_inferior=" + mipreferencia["margen_inferior"]
  preferencias += "&misal_pral=" + mipreferencia["misal_pral"]
  preferencias += "&tamanomenus=" + mipreferencia["tamanomenus"]
  preferencias += "&segundoidioma=" + mipreferencia["segundoidioma"]
  preferencias += "&presentaciontexto=" + mipreferencia["presentaciontexto"]
  preferencias +=
    "&presentacionrespuestas=" + mipreferencia["presentacionrespuestas"]
  preferencias +=
    "&presentacionpestanas=" + mipreferencia["presentacionpestanas"]
  preferencias += "&presentacionbotones=" + mipreferencia["presentacionbotones"]
  preferencias += "&oracionestodos=" + mipreferencia["oracionestodos"]
  preferencias += "&botoneszurdos=" + mipreferencia["botoneszurdos"]
  preferencias += "&ordinarionormal=" + mipreferencia["ordinarionormal"]
  window.localStorage.setItem("preferencias", preferencias)

  pon_pref("cambiartamano", 1)
}

function retrasa_pantalla() {
  // myScroll.scrollTo(0, -eval(document.getElementById('contenedor').offsetHeight-10), 0, true);

  const headerBottom = document.getElementById("header").getBoundingClientRect().bottom;
  const pieTop = document.getElementById("piedepantalla").getBoundingClientRect().top;
  const paginaAltura = pieTop - headerBottom;
  $("#contenedor").animate(
    {
      scrollTop:
        "-=" + eval(paginaAltura- 10),
    },
    200
  )
}
function avanza_pantalla() {
  //myScroll.scrollTo(0, eval(document.getElementById('contenedor').offsetHeight-10), 0, true);

  const headerBottom = document.getElementById("header").getBoundingClientRect().bottom;
  const pieTop = document.getElementById("piedepantalla").getBoundingClientRect().top;
  const paginaAltura = pieTop - headerBottom;
  $("#contenedor").animate(
    {
      scrollTop:
        "+=" + eval(paginaAltura - 10),
    },
    200
  )
}

function cambia_vista2(miId) {
  $("#" + miId).popup("close")
}

function ponletreros(num) {
  $("#titulo" + num).html(
    "-> " + num + ": (" + dime_pref("titulo" + num, "- " + num + " -") + ")"
  )
  $("#titulo0" + num).html(
    num + ": " + dime_pref("titulo" + num, "- " + num + " -")
  )
}

function cambia_fuente() {
  if (mipreferencia["tipoletra"] == 1) {
    $("body").css("font-family", "Times New Roman")
    nuevaletra = 0
  } else {
    $("body").css("font-family", "Arial")
    nuevaletra = 1
  }
}

function cambia_tamanoletra(num) {
  $("body").css("font-size", num + "pt")
  maspeq = num - 1
  masgrande = num + 1
  $("#titulo002").html(
    mipreferencia["tamanotexto"] +
      "&nbsp;=>&nbsp;<span style=' font-size: 120%; '>" +
      masgrande +
      "</span>"
  )
  $("#titulo003").html(
    mipreferencia["tamanotexto"] +
      "&nbsp;=>&nbsp;<span style=' font-size: 80%; '>" +
      maspeq +
      "</span>"
  )
}
// para recargar la página antes utilizaba
// window.location=window.location.pathname+"?embutidos="+embutidos + "&posicion="+ window.pageYOffset;
function pon_noche() {
  // Cambia el estado del modo oscuro
  $("body, #contenedor").toggleClass("noche")
}

var desplaz = getUrlVars()["posicion"]
if (typeof desplaz === "undefined") {
  desplaz = 0
}
var estoymac_def = window.localStorage.getItem("estoymac")
var idiomas = ["latin", "cast", "engl", "germ", "ital", "port", "fran"]
var mipestana = "dev"
var sinmisal = false
var mipreferencia = new Array()
var embutidos = getUrlVars()["embutidos"]
if (typeof embutidos === "undefined") embutidos = ""
var misintenciones_inic = dime_pref("misintenciones", "---")
var miposicion = 0
var a = 0
var b = 0
var esDispositivoMovil = false
var modocopia = false
var mipreferencia = new Array()

mipreferencia["misal_pral"] = dime_pref("misal_pral_defecto", 0)
mipreferencia["segundoidioma"] = dime_pref("segundoidioma_defecto", 1)
mipreferencia["presentaciontexto"] = dime_pref("presentaciontexto_defecto", 2)
mipreferencia["presentacionrespuestas"] = dime_pref(
  "presentacionrespuestas_defecto",
  5
)
mipreferencia["fondo"] = dime_pref("fondo_defecto", 1)
mipreferencia["tipoletra"] = dime_pref("tipoletra_defecto", 1)
mipreferencia["tamanotexto"] = dime_pref("tamanotexto_defecto", 12)
mipreferencia["tamanorubrica"] = dime_pref("tamanorubrica_defecto", 90)
mipreferencia["tamanomenus"] = dime_pref("tamanomenus_defecto", 10)
mipreferencia["oracionestodos"] = dime_pref("oracionestodos_defecto", 0)
mipreferencia["presentacionpestanas"] = dime_pref(
  "presentacionpestanas_defecto",
  0
)
mipreferencia["presentacionbotones"] = dime_pref("presentacionbotones_defecto")
mipreferencia["botoneszurdos"] = dime_pref("botoneszurdos_defecto", 0)
mipreferencia["ordinarionormal"] = dime_pref("ordinarionormal_defecto", 0)
mipreferencia["avance"] = dime_pref("avance_defecto", 100)
mipreferencia["margen_superior"] = dime_pref("margen_superior_defecto", 0)
mipreferencia["margen_inferior"] = dime_pref("margen_inferior_defecto", 0)

if (estoymac_def == null) {
  estoymac = false
} else estoymac = true

mimisal_1 = dime_pref("idioma_dev_1", idiomas[mipreferencia["misal_pral"]])
mimisal_2 = dime_pref("idioma_dev_2", idiomas[mipreferencia["segundoidioma"]])
var parcial2 = getUrlVars()["parcial"]
mitexto = ""
if (mipreferencia["tipoletra"] == 1) {
  mitexto = ' body { font-family: "Times New Roman"; } '
} else mitexto = ' body { font-family: "Arial"; } '
if (mipreferencia["fondo"] == 0) {
  mitexto =
    +" body {background-color: white; background-image: none; font-size: " +
    mipreferencia["tamanotexto"] +
    "pt } "
} else if (mipreferencia["fondo"] == 1) {
  mitexto += " body { font-size: " + mipreferencia["tamanotexto"] + "pt; } "
}
mitexto +=
  ' .red , .roja {     color:#B50000; } span.boton { background: url("../boton.png") top right no-repeat; color: white; padding: 5px; } '
mitexto +=
  " .latin , .cast , .engl , .ital , .port , .germ  , .fran , .misal_latin , .misal_cast , .misal_engl , .misal_ital , .misal_port , .misal_germ, .misal_fran { display: none; } "
mitexto +=
  " div div.latin , div div.cast , div div.engl , div div.ital , div div.port , div div.germ  , div div.fran { margin-top: 1em; } "
mitexto +=
  " .cruzroja {     color:#B50000; font-size: 100%; font-weight: bold;}    "
mitexto += "a h4 { width: 100%; } "
mitexto += " .ui-grid-solo , .ui-block-a , .titulo_orac { clear: both; } "
// presentaciontexto: 0    Sin traduccion    1    dos columnas    2    cambio tocando
if (mimisal_1 == mimisal_2) {
  mitexto +=
    " div .re , hr .re { float: left; width: 100%; } ." +
    mimisal_1 +
    " , .lengua1 { float: left; width: 98%; display: block; margin: 1%; } .botonlengua { background-image: none; padding-left: 0; padding-right: 0; } "
} else {
  //    mitexto += ' .texto_oracion { margin-right: 1%; margin-left: 1%; width: 98%; } ';
  mitexto +=
    " div .re , hr .re { float: left; width: 100%; } ." +
    mimisal_1 +
    " , .lengua1 { float: left; width: 49%; display: block; } ." +
    mimisal_2 +
    " , .lengua2 { float: right; display: block; width: 47%; margin-right: 1%; } .botonlengua { background-image: none; padding-left: 0; padding-right: 0; } h1 { width: 80%; }"
}
mitexto += " .misal_" + mimisal_1 + " { display: block; } "
var contador = 0
document.write("<style> " + mitexto + " </style>")
directorio2 = "../"
// menu diamante
var nuevoidioma2 = dime_pref(
  "idioma_dev_1",
  idiomas[mipreferencia["misal_pral"]]
)
var nuevoidioma1 = dime_pref(
  "idioma_dev_2",
  idiomas[mipreferencia["segundoidioma"]]
)
masgrande = eval(mipreferencia["tamanotexto"]) + 1
maspeq = eval(mipreferencia["tamanotexto"]) - 1
if (mipreferencia["tipoletra"] == 1) {
  nuevaletra = 0
} else nuevaletra = 1
