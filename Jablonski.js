/* global PIXI, devicePixelRatio, document, Bars, TWEEN, window, AnimationControl $*/

"use strict";

var colorChange = 0xff0000;

//Shortcuts für die ganzen PIXI-Objekte
var Application = PIXI.Application,
  loader = PIXI.loader,
  resources = PIXI.loader.resources,
  Sprite = PIXI.Sprite,
  Graphics = PIXI.Graphics,
  AnimatedSprite = PIXI.extras.AnimatedSprite,
  Text = PIXI.Text,
  Container = PIXI.Container,
  Rectangle = PIXI.Rectangle;

// Animations-Kontroller für die Steuerung des Animationsablaufs
var animationControl;

// Objekte (Sprites) auf die häufig zugegriffen wird
var laser, ray, photon, electron;

// Wichtigste Position, sehr häufig im Code
var electronStartPos;

// Texte und Balken im Diagramm
var s1_bars, s0_bars, t1_bars;
var s1_text, s0_text, t1_text;

// Pfeile im Diagramm
var arrows = [];

// globale Stage, ihre Größe und Skalierung des Ganzen
var app;
var startWidth = 800,
  startHeight = 600;
var scale = 1;

function init() {

  app = new Application({
    resolution: devicePixelRatio,
    width: startWidth,
    height: startHeight,
    autoResize: true,
    transparent: false,
    antialias: true,
    backgroundColor: 0xffffff,
  });
  app.stage.interactive = true;

  document
    .querySelector("#canvas_container")
    .appendChild(app.view);


  loader
    .add([
          "photon_sprites.json",
          "Elektron.png",
          "Laser.png",
          "Auge.png"
        ])
    .load(setup);

  s0_bars = new Bars(375, 475, (575 + 150) - 375, 2.5);

  s1_bars = new Bars(375, 100, 150, 2.5);
  t1_bars = new Bars(575, 200, 150, 2.5);

  s1_text = new Text("S1", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  s1_text.anchor.set(0.5, 0.5);
  s1_text.position.set(s1_bars.container.x - 25, s1_bars.container.y + s1_bars.container.height / 2);

  s0_text = new Text("S0", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  s0_text.anchor.set(0.5, 0.5);
  s0_text.position.set(s0_bars.container.x - 25, s0_bars.container.y + s0_bars.container.height / 2);

  t1_text = new Text("T1", {
    fontFamily: 'Arial Black',
    fontSize: 25,
    align: 'center'
  });
  t1_text.anchor.set(0.5, 0.5);
  t1_text.position.set(t1_bars.container.x - 25, t1_bars.container.y + t1_bars.container.height / 2);

  //Elektron wird als Kreis gezeichnet, es wird das unskalierte Koordinatensystem verwendet, da in diesem vor der Skalierung gezeichnet wird (nur getGlobalPosition statt toGlobal())
  electronStartPos = {
    scaled: {
      x: toGlobal(s1_bars.lastChild).x,
      y: toGlobal(s0_bars.lastChild).y
    },
    unscaled: {
      x: s1_bars.lastChild.getGlobalPosition().x,
      y: s0_bars.lastChild.getGlobalPosition().y
    }
  }

  electron = new Graphics().beginFill(0xff0000).drawCircle(0, 0, 10);
  electron.position = electronStartPos.unscaled;
  electron.interactive = true;

  document.getElementById("fluoro").onclick = fluorPhosToggle;
  document.getElementById("phosphor").onclick = fluorPhosToggle;

  //Binde alle Control-Buttons an die control-Funktion
  $("#control-menu").children().click(controlListener);

  app
    .stage
    .addChild(s1_text, s0_text, t1_text, s1_bars.container, s0_bars.container, t1_bars.container, electron);

  app.ticker.add(function () {
    TWEEN.update();
  });

  resize();
}

function setup() {
  var frames = [];

  for (var i = 1; i <= 8; i++) {
    frames.push(PIXI.Texture.fromFrame("photon-sprite_fr" + i + ".png"));
  }

  photon = new AnimatedSprite(frames, true);
  app.stage.addChild(photon);
  photon.alpha = 0;
  photon.scale.set(0.175);
  photon.anchor.set(0.5, 0.5);
  photon.animationSpeed = 0.3;

  laser = new Sprite(resources["Laser.png"].texture);
  laser.scale.set(0.15, 0.15);
  laser.anchor.set(0.5, 0.5);
  laser.position.y = s0_bars.lastChild.getGlobalPosition().y / scale;
  laser.position.x = 100;
  laser.interactive = true;

  var auge = new Sprite(resources["Auge.png"].texture);
  auge.scale.set(0.1, 0.1);
  auge.anchor.set(0.5, 0.5);
  auge.position.set(100, 200);

  app.stage.addChild(auge, laser, electron);

  animationControl = new AnimationControl(s0_bars, s1_bars, t1_bars, true);
}

//####KLEINE HILFSFUNKTIONEN################################

function toGlobal(bar) {
  var pos = bar.getGlobalPosition();
  return {
    x: pos.x / scale,
    y: pos.y / scale
  }

}

/*Funktion zum Zeichnen von Pfeilen, wenn der Pfeil nach oben gezeichnet wird, wird ein negativer x-Offset eingefügt, andernfalls ein positiver x-Offset sodass es nie zu überschneidungen kommt*/
function drawArrow(start_pos, end_pos, width, duration = 3000, delay = 0, permanent = true, offset = 30) {
  var length = end_pos.y - start_pos.y;
  var arrowHeight = 1.5 * width * Math.tan(1 / 3 * Math.PI) //width*tan(60°)
  arrowHeight = (length > 0) ? arrowHeight : -arrowHeight;

  length = length - arrowHeight;

  var graphics = new Graphics().beginFill(0x0000ff).drawRect(0, 0, width, length);
  graphics.alpha = 0;
  graphics.pivot.set(width / 2, 0);
  if (length > 0) {
    graphics.x = start_pos.x + offset;
    graphics.y = start_pos.y;
  } else {
    graphics.x = start_pos.x - offset;
    graphics.y = start_pos.y;
  }

  //Create the ArrowHead
  graphics
    .moveTo(-width, length)
    .lineTo(width * 2, length)
    .lineTo(width / 2, length + arrowHeight);

  arrows.push(graphics);

  var indexElectron = app.stage.getChildIndex(electron);
  app.stage.addChildAt(graphics, indexElectron);

  var showTween = new TWEEN.Tween(graphics).to({
    alpha: 1.0,
  }, duration).delay(delay).easing(TWEEN.Easing.Exponential.In)

  if (!permanent) {
    var hideTween = new TWEEN.Tween(graphics).to({
      alpha: 0.0,
    }, duration);
    showTween.chain(hideTween);
  }
  showTween.start();
}

function createTween(object, start_pos, end_pos, delay = 500, duration = 1000, easing = TWEEN.Easing.Sinusoidal.InOut) {

  var x_dist = end_pos.x - start_pos.x;
  var y_dist = end_pos.y - start_pos.y;

  var x_sign = x_dist < 0 ? "" : "+";
  var y_sign = y_dist < 0 ? "" : "+";

  var tween = new TWEEN.Tween(object).to({
      x: x_sign + x_dist,
      y: y_sign + y_dist,
    }, duration)
    .easing(easing).delay(delay);
  return tween;
}

function photonAnimation(start_pos, end_pos, duration) {
  var x_sign, y_sign;

  photon.position.set(start_pos.x - photon.width / 2, start_pos.y + photon.height / 2); //account for size of animated photon!
  photon.play();

  var x_dist = end_pos.x - start_pos.x + photon.width; //decrease by width to account for size of the animated photon
  var y_dist = end_pos.y - start_pos.y;

  x_sign = x_dist < 0 ? "" : "+";
  y_sign = y_dist < 0 ? "" : "+";

  photon.rotation = Math.PI + Math.atan(y_dist / x_dist);

  photon.filters = [new PIXI.filters.ColorReplaceFilter(0x000000, colorChange, 0.4)];

  var first = new TWEEN.Tween(photon).to({
    x: x_sign + x_dist / 3,
    y: y_sign + y_dist / 3,
    alpha: 1,
  }, duration / 3);
  var second = new TWEEN.Tween(photon).to({
    x: x_sign + x_dist / 3,
    y: y_sign + y_dist / 3,
  }, duration / 3);
  var third = new TWEEN.Tween(photon).to({
    x: x_sign + x_dist / 3,
    y: y_sign + y_dist / 3,
    alpha: 0,
  }, duration / 3);

  first.chain(second);
  second.chain(third);
  first.start();
}

function showNewText(textInput) {
  var text = $("#text_box");

  if (text.html() != textInput) {
    text.fadeOut(500, function () {
      text.html(textInput);
    });
    text.fadeIn(500);
  }
}

function changeFluorophore(select) {
  switch (select.value) {
    case "TexasRed":
      colorChange = 0xff0731;
      break;
    case "DAPI":
      colorChange = 0x0900ff;
      break;
    case "Atto488":
      colorChange = 0x39ff14;
      break;
    case "YFP":
      colorChange = 0xffff00;
      break;
  }
}

//####EVENT-LISTENER und FUNKTIONEN##########################

/*Event-Listener zum Abfangen von Button-Clicks zur Auswahl von Fluoreszenz oder Phosphoreszenz-Darstellung*/

function controlListener(event) {

  function playAnimation() {
    if (animationControl.isEmpty()) {
      resetAnimation();
    }
    animationControl.play();
  }

  var buttons = $("#control-menu").children();

  var active = $(event.currentTarget);
  var active_id = active.attr("id");

  buttons.removeClass("is-active");
  if (active_id == "play" || active_id == "pause") {
    active.addClass("is-active");
  }

  switch (active.attr("id")) {
    case "play":
      playAnimation();
      break;
    case "pause":
      animationControl.pause();
      break;
    case "step":
      animationControl.step();
      break;
    case "reset":
      resetAnimation();
      break;
  }
}

function fluorPhosToggle(event) {
  var fluoro_button = document.getElementById("fluoro");
  var phosphor_button = document.getElementById("phosphor");

  if (event.target == fluoro_button) {
    fluoro_button.classList.add("is-active");
    phosphor_button.classList.remove("is-active");

    resetAnimation(true);
  } else {
    phosphor_button.classList.add("is-active");
    fluoro_button.classList.remove("is-active");

    resetAnimation(false);
  }
}

function resetAnimation(fluorescence) {
  arrows.forEach(function (arrow) {
    app.stage.removeChild(arrow);
  });

  // Deaktiviere alle Kontroll-Buttons
  $("#control-menu").children().removeClass("is-active");

  // fluorescence darf undefined sein, dann kommt es nicht zur Aenderung des Modus
  animationControl.reset(fluorescence);

  electron.position = electronStartPos.unscaled;

  showNewText('<h3>Das Jablonski-Diagramm</h3><p>Klicke auf <i class="fas fa-play"></i> um die gesamte Animation abzuspielen.</p><p>Mit <i class="fas fa-step-forward"></i> kannst du dir einzelne Sequenzen genauer angucken.</p><p>Die Animation kann mit <i class="fas fa-pause"></i> pausert und mit <i class="fas fa-fast-backward"></i> zurückgesetzt werden<p>');
}

function resize() {
  var parent = app.view.parentNode;

  app.renderer.resize(parent.clientWidth, parent.clientHeight);

  scale = parent.clientWidth / startWidth;
  app.stage.scale.set(scale, scale);
}

window.addEventListener("resize", resize);
