/* global PIXI, devicePixelRatio, document, Bars, TWEEN, window, AnimationControl $*/

"use strict";

// globale Option "Fluorescence
var fluorescence = true;

// color for the laser-Animations

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
var laser, ray, photon, electron, auge;

// Wichtigste Position, sehr häufig im Code
var electronStartPos;

// Texte und Balken im Diagramm
var s1_bars, s0_bars, t1_bars;
var s1_text, s0_text, t1_text;

// temporäre Grafiken im Diagramm
var tempGraphics = [];

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
          "images/Photon-Sprites.json",
          "images/Elektron.png",
          "images/Laser.png",
          "images/Auge.png"
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
            x: toGlobal(s1_bars.lastChild)
                .x,
            y: toGlobal(s0_bars.lastChild)
                .y
        },
        unscaled: {
            x: s1_bars.lastChild.getGlobalPosition()
                .x,
            y: s0_bars.lastChild.getGlobalPosition()
                .y
        }
    }

    electron = new Graphics()
        .beginFill(0xff0000)
        .drawCircle(0, 0, 10);
    electron.position = electronStartPos.unscaled;
    electron.interactive = true;

    document.getElementById("fluoro")
        .onclick = fluorPhosToggle;
    document.getElementById("phosphor")
        .onclick = fluorPhosToggle;
    document.getElementById("fluorophores")
        .onchange = fluoroSelection;

    //Binde alle Control-Buttons an die control-Funktion
    $("#control-menu")
        .children()
        .click(controlListener);

    app
        .stage
        .addChild(s1_text, s0_text, t1_text, s1_bars.container, s0_bars.container, t1_bars.container, electron);

    app.ticker.add(function () {
        TWEEN.update();
    });

    resize();
}

function setup() {
    laser = new Sprite(resources["images/Laser.png"].texture);
    laser.scale.set(0.15, 0.15);
    laser.anchor.set(0.5, 0.5);
    laser.position.y = s0_bars.lastChild.getGlobalPosition()
        .y / scale;
    laser.position.x = 100;
    laser.interactive = true;

    auge = new Sprite(resources["images/Auge.png"].texture);
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
function drawArrow(start_pos, end_pos, width, color, duration = 3000, delay = 0, permanent = true, offset = 30) {
    var length = end_pos.y - start_pos.y;
    var arrowHeight = 1.5 * width * Math.tan(1 / 3 * Math.PI) //width*tan(60°)
    arrowHeight = (length > 0) ? arrowHeight : -arrowHeight;

    length = length - arrowHeight;

    console.log(typeof color);
    console.log(color);

    var graphics = new Graphics()
        .beginFill(color)
        .drawRect(0, 0, width, length);
    graphics.alpha = 0;
    graphics.pivot.set(width / 2, 0);
    if(length > 0) {
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

    tempGraphics.push(graphics);

    var indexElectron = app.stage.getChildIndex(electron);
    app.stage.addChildAt(graphics, indexElectron);

    var showTween = new TWEEN.Tween(graphics)
        .to({
            alpha: 1.0,
        }, duration)
        .delay(delay)
        .easing(TWEEN.Easing.Exponential.In)

    if(!permanent) {
        var hideTween = new TWEEN.Tween(graphics)
            .to({
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

    var tween = new TWEEN.Tween(object)
        .to({
            x: x_sign + x_dist,
            y: y_sign + y_dist,
        }, duration)
        .easing(easing)
        .delay(delay);
    return tween;
}

function showNewText(textInput) {
    var text = $("#text_box");

    if(text.html() != textInput) {
        text.animate({
            opacity: "0"
        }, 500, function () {
            text.html(textInput);
        });

        text.animate({
            opacity: "1"
        }, 500);
    }
}

//####EVENT-LISTENER und FUNKTIONEN##########################

/*Event-Listener zum Abfangen von Button-Clicks zur Auswahl von Fluoreszenz oder Phosphoreszenz-Darstellung*/

function controlListener(event) {

    function playAnimation() {
        if(animationControl.isEmpty()) {
            resetAnimation();
        }
        animationControl.play();
    }

    var buttons = $("#control-menu")
        .children();

    var active = $(event.currentTarget);
    var active_id = active.attr("id");

    buttons.removeClass("is-active");
    if(active_id == "play" || active_id == "pause") {
        active.addClass("is-active");
    }

    switch(active.attr("id")) {
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

function fluoroSelection(event) {
    var pictureLinks = {
        "path": "images/",
        "Texas Red": "Texas-Red.png",
        "DAPI": "DAPI.png",
        "YFP": "YFP.jpg",
        "GFP": "GFP.png"
    }
    var dropImage = document.getElementById("fluorophor-selector_img");

    dropImage.src = pictureLinks["path"] + pictureLinks[event.target.value];
    changePhotonColor(event.target.value);
}

function changePhotonColor(substrate) {
    emissionColor = photonColors[substrate]["emission"];
    absorptionColor = photonColors[substrate]["absorption"];
    resetAnimation(fluorescence);
}

function fluorPhosToggle(event) {
    var fluoro_button = document.getElementById("fluoro");
    var phosphor_button = document.getElementById("phosphor");

    if(event.target == fluoro_button) {
        fluorescence = true;
        fluoro_button.classList.add("is-active");
        phosphor_button.classList.remove("is-active");

        changeDropdown(fluorescence);
    } else {
        fluorescence = false;
        phosphor_button.classList.add("is-active");
        fluoro_button.classList.remove("is-active");

        changeDropdown(fluorescence);
    }
}

//Change Drop-Down list from showing fluorophores to phosphores and back
function changeDropdown(fluorescence) {
    var fluorSelection = ["Texas Red", "GFP", "YFP", "DAPI"];
    var phosSelection = ["Strontiumaluminat"];
    var dropSelect = document.getElementById("fluorophores");
    var dropImage = document.getElementById("fluorophor-selector_img");

    clearOptions(dropSelect);

    if(fluorescence) {
        fluorSelection.forEach(function (fluorophore) {
            var option = document.createElement("option");
            option.text = fluorophore;
            dropSelect.add(option);
        });
        dropImage.src = "images/Texas-Red.png";
        changePhotonColor("Texas Red");
    } else {
        phosSelection.forEach(function (phosphor, i) {
            var option = document.createElement("option");
            option.text = phosphor;
            dropSelect.add(option);
            if(i == 0) {

            }
        });
        dropImage.src = "images/Strontium-Aluminat.png";
        changePhotonColor("Strontiumaluminat");
    }

    function clearOptions(selectBox) {
        for(var i = selectBox.length - 1; i >= 0; i--) {
            selectBox.remove(i);
        }
    }
}

function resetAnimation(fluorescence) {
    tempGraphics.forEach(function (temps) {
        app.stage.removeChild(temps);
    });

    // Deaktiviere alle Kontroll-Buttons
    $("#control-menu")
        .children()
        .removeClass("is-active");

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
