/* global PIXI, devicePixelRatio, document, Bars, TWEEN, window, AnimationControl $*/

"use strict";

/*
  #############################################################
  # GLOBALE VARIABLEN UND EINSTELLUNGEN                       #
  #                                                           #
  # gebunden an Objekt "glb", um den globalen Scope nicht     #
  # zu vermüllen                                              #
  #############################################################
*/

var glb = function () {

  var fluorescence = true;
  var drag = false;

  var absorptionColor = 0xffd200;
  var emissionColor = 0xff8900;
  var photonColors = {
    "GFP": {
      absorption: "0x00d5ff",
      emission: "0x00ff00"
    },
    "DAPI": {
      absorption: "0x610061",
      emission: "0x00a9ff"
    },
    "Texas Red": {
      absorption: "0xffd200",
      emission: "0xff8900"
    },
    "YFP": {
      absorption: "0x00ff28",
      emission: "0x46ff00"
    },
    "Strontiumaluminat": {
      absorption: "0x610061",
      emission: "0x36ff00"
    }
  }

  // Wichtigste Position, sehr häufig im Code
  var electronStartPos;
  // Animations-Kontroller für die Steuerung des Animationsablaufs
  var animationControl;
  // Objekte (Sprites) auf die häufig zugegriffen wird
  var laser, ray, photon, electron, auge;
  // Balken im Diagramm
  var s1_bars, s0_bars, t1_bars;
  // temporäre Grafiken im Diagramm
  var tempGraphics = [];

  // globale Stage, ihre Größe und Skalierung des Ganzen
  var app;
  var scale = 1;

  //ENUM für die verschiedenen abspiel-Zustände, benötigt zur Animationskontrolle
  const playState = {
    IDLE: 1,
    PLAY: 2,
    PAUSE: 3,
    STEP: 4,
    properties: {
      1: {
        name: "idle"
      },
      2: {
        name: "play"
      },
      3: {
        name: "pause"
      },
      4: {
        name: "step"
      }
    }
  }

  /*======Globale Einstellungen für Animationen und Darstellung======*/

  //Darstellung der Balken
  var barHeight = 2.5,
    barWidthExcited = 150,
    barWidthGround = 350,
    hitMargin = 1.2,
    step = 6;

  //Größe des Canvas -> Hier auch Möglichkeit das Seitenverhältnis zu variieren
  var startWidth = 800,
    startHeight = 600;

  //Dateipfad für alle Bilder
  var path = "images/";

  //Animations-Geschwindigkeiten
  var startDelay = 500;
  var interDelay = 250;
  var photonDuration = 2000;
  var elecDuration = 1000;
  var emissionDuration = 3000;
  var dragArrowDuration = 1000;

  //Darstellung der Pfeile
  var arrowOffset = 30;
  var arrowWidth = 8;

  return {
    fluorescence: fluorescence,
    absorptionColor: absorptionColor,
    emissionColor: emissionColor,
    photonColors: photonColors,

    barHeight: barHeight,
    barWidthExcited: barWidthExcited,
    barWidthGround: barWidthGround,
    hitMargin: hitMargin,
    step: step,

    startWidth: startWidth,
    startHeight: startHeight,

    app: app,

    s0_bars: s0_bars,
    s1_bars: s1_bars,
    t1_bars: t1_bars,

    scale: scale,

    electronStartPos: electronStartPos,

    electron: electron,
    ray: ray,
    photon: photon,
    auge: auge,

    playState: playState,

    tempGraphics: tempGraphics,

    path: path,

    startDelay: startDelay,
    interDelay: interDelay,
    photonDuration: photonDuration,
    elecDuration: elecDuration,
    emissionDuration: emissionDuration,
    arrowOffset: arrowOffset,
    arrowWidth: arrowWidth,
    dragArrowDuration: dragArrowDuration,
  }
}();

//Shortcuts für die Vielzahl von PIXI-Objekten
var Application = PIXI.Application,
  loader = PIXI.loader,
  resources = PIXI.loader.resources,
  Sprite = PIXI.Sprite,
  Graphics = PIXI.Graphics,
  AnimatedSprite = PIXI.extras.AnimatedSprite,
  Text = PIXI.Text,
  Container = PIXI.Container,
  Rectangle = PIXI.Rectangle;

/*
  #######################################################
  # INITIALISIERUNGSFUNKTION                            #
  #                                                     #
  # wird nach erfolgreichem Laden des HTML-Dokuments    #
  # gerufen und initialisiert die graphischen Objekte   #
  # und Handler                                         #
  #######################################################
*/

function init() {

  //Beschriftung der Elektronen-Energiezustände im Diagramm
  var s1_text, s0_text, t1_text;


  /*Setup der Applikation mit weißer Hintergrundfarbe und der Möglichkeit der
    Skalierung des Canvas */
  glb.app = new Application({
    resolution: devicePixelRatio,
    width: glb.startWidth,
    height: glb.startHeight,
    autoResize: true,
    transparent: false,
    antialias: true,
    backgroundColor: 0xffffff,
  });
  glb.app.stage.interactive = true;
  document
    .querySelector("#canvas_container")
    .appendChild(glb.app.view);

  /*Loader-Objekt von PIXI.js der convenience-Methoden zum Laden von Texturen und
    Sprite-Sheets ermöglicht */
  loader
    .add([
          "images/Photon-Sprites.json",
          "images/Elektron.png",
          "images/Laser.png",
          "images/Auge.png"
        ])
    .load(setup);

  /*======Initialisierung der graphischen Objekte======*/

  //lässt die Balken für die verschiedenen vibronischen Zustände Zeichnen
  glb.s0_bars = new Bars(375, 575, glb.barWidthGround, glb.barHeight, glb.hitMargin, glb.step);
  glb.s1_bars = new Bars(375, 150, glb.barWidthExcited, glb.barHeight, glb.hitMargin, glb.step);
  glb.t1_bars = new Bars(575, 250, glb.barWidthExcited, glb.barHeight, glb.hitMargin, glb.step);

  //Initialisierung der Texte
  s1_text = new Text("S1", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  s1_text.anchor.set(0.5, 0.5);
  s1_text
    .position
    .set(glb.s1_bars.container.x - 25, glb.s1_bars.container.y + glb.s1_bars.container.height / 2);

  s0_text = new Text("S0", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  s0_text.anchor.set(0.5, 0.5);
  s0_text
    .position
    .set(glb.s0_bars.container.x - 25, glb.s0_bars.container.y + glb.s0_bars.container.height / 2);

  t1_text = new Text("T1", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  t1_text.anchor.set(0.5, 0.5);
  t1_text
    .position
    .set(glb.t1_bars.container.x - 25, glb.t1_bars.container.y + glb.t1_bars.container.height / 2);

  //Elektron wird als Kreis gezeichnet, es wird das unskalierte Koordinatensystem verwendet, da in diesem vor der Skalierung gezeichnet wird (nur getGlobalPosition statt toGlobal())
  glb.electronStartPos = {
    scaled: {
      x: toGlobal(glb.s1_bars.lastChild)
        .x,
      y: toGlobal(glb.s0_bars.lastChild)
        .y
    },
    unscaled: {
      x: glb.s1_bars.lastChild.getGlobalPosition()
        .x,
      y: glb.s0_bars.lastChild.getGlobalPosition()
        .y
    }
  }

  //Initialisierung des Elektrons als roter Kreis
  glb.electron = new Graphics()
    .beginFill(0xff0000)
    .drawCircle(0, 0, 10);
  glb.electron.position = glb.electronStartPos.unscaled;
  glb.electron.interactive = true;
  glb.electron.cursor = "pointer";
  setupElectronDrag(glb.electron);


  /*======Anbinden der Event-Handler======*/

  //Binde die Auswahl der Fluorophore und Phosphore an Handler
  document.getElementById("fluoro")
    .onclick = fluorPhosToggle;
  document.getElementById("phosphor")
    .onclick = fluorPhosToggle;
  document.getElementById("fluorophores")
    .onchange = changeFluorophorePicture;

  //Binde alle Control-Buttons an die control-Funktion
  $("#control-menu")
    .children()
    .click(controlListener);

  /*Anbinden der resize-Methode, die bei Veränderung der Fenster-Größe den Canvas
    neu skaliert*/
  window.addEventListener("resize", resize);

  /*======Verbinden der graphischen Objekte mit der Applikation======*/

  //Hinzufügen aller Objekte zur Zeichen-Oberfläche
  glb.app
    .stage
    .addChild(s1_text, s0_text, t1_text, glb.s1_bars.container, glb.s0_bars.container, glb.t1_bars.container, glb.electron);

  //Anbinden der TWEEN.js-Library an den 60fps-Ticker der
  glb.app.ticker.add(function () {
    TWEEN.update();
  });

  /*Triggern von resize um den Canvas direkt an die korrekte Anzeigegröße anzupassen
    diese bestimmt sich aus der Größe des umgebenden HTML-Divs (2/3 von 16:9)*/
  resize();
}

/*
###################################################
# SETUP-FUNKTION                                  #
#                                                 #
# Initialisiert wie init(), jedoch für alle Tex-  #
# Initialisiert wie init(), jedoch für alle Tex-  #
# turen, auf deren erfolgreiches Laden gewartet   #
# wird                                            #
###################################################
*/

function setup() {
  //Initialisierung des Lasers und Anbinden an den laserClicked-Handler
  glb.laser = new Sprite(resources["images/Laser.png"].texture);
  glb.laser.scale.set(0.15, 0.15);
  glb.laser.anchor.set(0.5, 0.5);
  glb.laser.position.y = glb.s0_bars.lastChild.getGlobalPosition()
    .y / glb.scale;
  glb.laser.position.x = 100;
  glb.laser.interactive = true;
  glb.laser.on("click", laserClicked);
  glb.laser.cursor = "pointer";

  //Initialisierung des Auges, zu dem die Photonen gelenkt werden
  glb.auge = new Sprite(resources["images/Auge.png"].texture);
  glb.auge.scale.set(0.1, 0.1);
  glb.auge.anchor.set(0.5, 0.5);
  glb.auge.position.set(100, 200);
  glb.app.stage.addChild(glb.auge, glb.laser, glb.electron);

  /*Initialisierung der Animations-Kontrolle, muss an dieser Stelle getan werden,
    da die Initialisierung bereits die Animations-Tweens erstellt und diese in Ab-
    hängigkeit zu der Position der verschiedenen graphischen Objekte stehen*/
  glb.animationControl = new AnimationControl();
  setInterval(checkPlayState, 200);
}

/*
#####################################################
# HILFSFUNKTIONEN                                   #
#                                                   #
# werden überall im Skript verwendet um kleinere    #
# Code-Abschnitte auszuführen, die repetitiv aus-   #
# geführt werden                                    #
#####################################################
*/
function checkPlayState() {
  var currentState = glb.animationControl.getPlayState();
  var buttons = $("#control-menu")
    .children().removeClass("is-active");
  if (currentState != glb.playState.IDLE) {
    $("#" + glb.playState.properties[currentState].name).addClass("is-active");
  }
}

function toGlobal(bar) {
  var pos = bar.getGlobalPosition();
  return {
    x: pos.x / glb.scale,
    y: pos.y / glb.scale
  }
}

/*
Funktion zum Zeichnen von Pfeilen, wenn der Pfeil nach oben gezeichnet wird, wird ein negativer x-Offset eingefügt, andernfalls ein positiver x-Offset sodass es nie zu Überschneidungen kommt
*/
function drawArrow(start_pos, end_pos, color, offset, duration, width = glb.arrowWidth, delay = 0, permanent = true) {
  var length = end_pos.y - start_pos.y;

  //trigonometrische Berechnung der Pfeilhöhe aus der Gesamtlänge des Pfeils
  var arrowHeight = 1.5 * width * Math.tan(1 / 3 * Math.PI) //width*tan(60°)
  arrowHeight = (length > 0) ? arrowHeight : -arrowHeight;

  //Pfeil-Schweif-Länge um Länge der Spitze reduziert
  length = length - arrowHeight;

  //Zeichnen des Pfeils-Schweifes
  var graphics = new Graphics()
    .beginFill(color)
    .drawRect(0, 0, width, length);
  graphics.alpha = 0;
  graphics.pivot.set(width / 2, 0);
  /*je nachdem, ob der Pfeil nach oben oder unten gezeichnet wird, ist
    der Pfeil links oder rechts verschoben (wenn dies gewollt ist)*/
  if (length > 0) {
    graphics.x = start_pos.x + offset;
    graphics.y = start_pos.y;
  } else {
    graphics.x = start_pos.x - offset;
    graphics.y = start_pos.y;
  }

  //Zeichnen der Pfeilspitze
  graphics
    .moveTo(-width, length)
    .lineTo(width * 2, length)
    .lineTo(width / 2, length + arrowHeight);

  /*
  Abspeichern in stack-artiger-Collection, da die Pfeile zu den temporären
  Grafik-Elementen gehören
  */
  glb.tempGraphics.push(graphics);

  //Hinzufügen des Pfeiles, sodass er vom z-Index her direkt hinter dem Elektorn liegt
  var indexElectron = glb.app.stage.getChildIndex(glb.electron);
  glb.app.stage.addChildAt(graphics, indexElectron);

  //Animiertes Erscheinen des Pfeils
  var showTween = new TWEEN.Tween(graphics)
    .to({
      alpha: 1.0,
    }, duration)
    .delay(delay)
    .easing(TWEEN.Easing.Exponential.In)

  //Möglichkeit den Pfeil wieder verschwinden zu lassen
  if (!permanent) {
    var hideTween = new TWEEN.Tween(graphics)
      .to({
        alpha: 0.0,
      }, duration);
    showTween.chain(hideTween);
  }


  showTween.start();
}

/*
Erstellt eine Tween-Animation, die von einer Start- zu einer Endposition führt,
dabei kann die Dauer, die Verzögerung sowie die Easing-Function variiert werden
*/

function createTween(object, start_pos, end_pos, duration, delay, easing = TWEEN.Easing.Sinusoidal.InOut) {

  //Berechnen der Distanz
  var x_dist = end_pos.x - start_pos.x;
  var y_dist = end_pos.y - start_pos.y;

  //Bestimmen des Vorzeichens (TWEEN.js-Library hat eine etwas blöde Notation für rel. Werte)
  var x_sign = x_dist < 0 ? "" : "+";
  var y_sign = y_dist < 0 ? "" : "+";

  //Erstellen des Tweens mit dem richtigen Vorzeichen
  var tween = new TWEEN.Tween(object)
    .to({
      x: x_sign + x_dist,
      y: y_sign + y_dist,
    }, duration)
    .easing(easing)
    .delay(delay);
  return tween;
}

//Zeigt den übergebenen Text im Text-Fenster an
function showNewText(textInput) {
  var text = $("#text_box");

  text.animate({
    opacity: "0"
  }, 500, function () {
    text.html(textInput);
  });

  text.animate({
    opacity: "1"
  }, 500);
}

//Verbietet oder erlaubt Interaktion mit dem Laser und Elektron (klick und drag and drop)
function setInteraction(bool) {
  glb.laser.interactive = bool;
  glb.electron.interactive = bool;
}

/*
##################################################
# EVENT-LISTENER                  	             #
#                                                #
# bewerkstelligen die Interaktivität des Pro-    #
# gramms                                         #
##################################################
*/

//Bei klicken des Lasers wird die momentan ausgewählte Animation gestartet
function laserClicked() {
  //ist der Laser geklickt sind weitere Interaktionen mit Laser und Elektron verboten
  setInteraction(false);
  glb.animationControl.play();
}

/*Verbunden mit den 4 Kontroll-Knöpfen, je nachdem welcher gedrückt wird, kommt es
  zum Stopp, Neustart oder stückweise Abspielen der Animation*/
function controlListener(event) {

  /*wird der Play-Button gedrückt startet die Animation da wo sie gestoppt wurde oder startet neu
   */
  function playAnimation() {
    if (glb.animationControl.isEmpty()) {
      resetAnimation();
    }
    glb.animationControl.play();
  }

  var active_id = $(event.currentTarget).attr("id");

  switch (active_id) {
    case "play":
      playAnimation();
      break;
    case "pause":
      glb.animationControl.pause();
      break;
    case "step":
      glb.animationControl.step();
      break;
    case "reset":
      resetAnimation();
      break;
  }
}

//Setzt die Animation auf den Ausgangszustand zurück in dem das Skript geladen wurde
function resetAnimation() {
  //Lösche alle temporären Grafiken vom Canvas
  glb.tempGraphics.forEach(function (temps) {
    glb.app.stage.removeChild(temps);
  });

  // Deaktiviere alle Kontroll-Buttons
  $("#control-menu")
    .children()
    .removeClass("is-active");

  //Setze die Animations-Tweens zurück
  glb.animationControl.reset();

  //Setzte das Elektron an die Start-Position
  glb.electron.position = glb.electronStartPos.unscaled;

  //Erlaube drag and drop und klicken des lasers
  setInteraction(true);

  //Zeige den Einführungs-Text
  showNewText('<h3>Das Jablonski-Diagramm</h3><p>Klicke auf <i class="fas fa-play"></i> um die gesamte Animation abzuspielen.</p><p>Mit <i class="fas fa-step-forward"></i> kannst du dir einzelne Sequenzen genauer angucken.</p><p>Die Animation kann mit <i class="fas fa-pause"></i> pausert und mit <i class="fas fa-fast-backward"></i> zurückgesetzt werden<p>');
}

/*einfacher switch zwischen Fluoreszenz und Phosphoreszenz, aktualisiert ebenfalls
  die Drop-Down-Auswahl über changeDropdown()*/
function fluorPhosToggle(event) {
  var fluoro_button = document.getElementById("fluoro");
  var phosphor_button = document.getElementById("phosphor");

  if (event.target == fluoro_button) {
    glb.fluorescence = true;
    fluoro_button.classList.add("is-active");
    phosphor_button.classList.remove("is-active");

    changeDropdown();
  } else {
    glb.fluorescence = false;
    phosphor_button.classList.add("is-active");
    fluoro_button.classList.remove("is-active");

    changeDropdown();
  }
}

//wechselt zwischen Fluorophor- und Phosphor-Auswahl in der Dropdown-liste
function changeDropdown() {
  var fluorSelection = ["Texas Red", "GFP", "YFP", "DAPI"];
  var phosSelection = ["Strontiumaluminat"];
  var dropSelect = document.getElementById("fluorophores");
  var dropImage = document.getElementById("fluorophor-selector_img");

  //kleine Funktion, die die Drop-Down-Liste resettet
  clearOptions(dropSelect);

  if (glb.fluorescence) {
    //fügt alle Fluorophore der Dropliste hinzu
    fluorSelection.forEach(function (fluorophore) {
      var option = document.createElement("option");
      option.text = fluorophore;
      dropSelect.add(option);
    });
    //Dropdown-Liste startet immer bei TexasRed
    dropImage.src = "images/Texas-Red.png";
    changePhotonColor("Texas Red");
  } else {
    //fügt alle Phosphore der Dropliste hinzu
    phosSelection.forEach(function (phosphor, i) {
      var option = document.createElement("option");
      option.text = phosphor;
      dropSelect.add(option);
    });
    //Dropdown-Liste starte immer bei Strontium-Aluminat
    dropImage.src = "images/Strontium-Aluminat.png";
    changePhotonColor("Strontiumaluminat");
  }

  //resettet die gesamte drop-down-Liste
  function clearOptions(selectBox) {
    for (var i = selectBox.length - 1; i >= 0; i--) {
      selectBox.remove(i);
    }
  }
}

//Ändert das angezeigte Fluorophor oder Phosphor im Bild
function changeFluorophorePicture(event) {
  var pictureLinks = {
    "Texas Red": "Texas-Red.png",
    "DAPI": "DAPI.png",
    "YFP": "YFP.jpg",
    "GFP": "GFP.png"
  }
  var dropImage = document.getElementById("fluorophor-selector_img");

  //Pfad zu den Bildern, kann am Anfang des Quellcodes global angepasst werden
  dropImage.src = glb.path + pictureLinks[event.target.value];
  changePhotonColor(event.target.value);
}

//ändert die Farben der Photonen, je nachdem welches Substrat ausgewählt wurde
function changePhotonColor(substrate) {
  glb.emissionColor = glb.photonColors[substrate]["emission"];
  glb.absorptionColor = glb.photonColors[substrate]["absorption"];
  //Zurück setzten der Animationen, sodass in jedem Fall die richtigen Photonen-Farben verwendet werden
  resetAnimation();
}

/*Ermöglicht Drag and Drop für das übergebene Elektron, dieses kann dann auf die
  s1_bars gedroppt werden und löst eine Animation aus*/
function setupElectronDrag(electron) {
  //Interaction-Manager von PIXI.js der einfach hitTests ermöglicht
  var interaction = glb.app.renderer.plugins.interaction;

  electron.interactive = true;

  //Funktionen zum Vergrößern und Verkleinern der Bars beim drüberhovern
  function scaleUp(bar) {
    new TWEEN.Tween(bar).to({
      height: glb.barHeight * 2,
    }, 100).start();
  }

  function scaleDown(bar) {
    new TWEEN.Tween(bar).to({
      height: glb.barHeight,
    }, 100).start();
  }

  //wird auf das Elektron draufgedrückt, ist dieses ein drag-Objekt
  electron.on("mousedown", function (e) {
    glb.drag = electron;
  });

  /*wird das Elektron über den richtigen Bars gedroppt, startet es von dort eine Animation, ansonsten fällt es in die Grundposition zurück*/
  electron.on("mouseup", function (e) {
    var hit = interaction.hitTest(e.data.global, glb.s1_bars.container);
    var offset = 30;

    glb.drag = false;
    electron.position = glb.electronStartPos.scaled;

    if (hit) {
      electron.position = toGlobal(hit);
      scaleDown(hit);

      if (!glb.fluorescence) {
        offset = 0;
      }

      drawArrow(glb.electronStartPos.scaled, toGlobal(hit), glb.absorptionColor, offset, glb.dragArrowDuration);

      glb.animationControl.playDrag(hit);
    }
  });

  /*Bei Bewegung der Maus, wenn das Elektron angeklickt und gehalten wurde, folgt es dem Cursor und löst Hover-Effekte bei den s1_bars aus*/
  electron.on("mousemove", function (e) {
    if (glb.drag) {
      glb.drag.position.x = e.data.global.x / glb.scale;
      glb.drag.position.y = e.data.global.y / glb.scale;

      var hit = interaction.hitTest(e.data.global, glb.s1_bars.container);
      if (hit) {
        scaleUp(hit);
      }
      glb.s1_bars.children.forEach(function (bar) {
        if (bar != hit) {
          scaleDown(bar);
        }
      });
    }
  });
}

/*Skaliert den gesamten Canvas so, dass er exakt in den darunterliegenden Container
  passt, somit verhält sich der Canvas "responsive" im HTML-Dokument*/
function resize() {
  var parent = glb.app.view.parentNode;

  glb.app.renderer.resize(parent.clientWidth, parent.clientHeight);

  glb.scale = parent.clientWidth / glb.startWidth;
  glb.app.stage.scale.set(glb.scale, glb.scale);
}
