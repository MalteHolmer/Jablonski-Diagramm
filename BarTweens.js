/* global createTween, showNewText, electron */

//Creates a number of BarTweens and gives access to handy function to manipulate those tweens

//enthält eine Sammlung von Bar-Objecten in einem PIXI.js-Container

class BarTweens {

  constructor(startBar, barArray, elecDuration = glb.elecDuration, startDelay = glb.startDelay, interDelay = glb.interDelay) {
    this.barTweens = [];

    this._createTweens(startBar, barArray, elecDuration, startDelay, interDelay);
  }

  //wichtig fürs spätere chainen, convenience-Methode
  isEmpty() {
    return this.barTweens.length == 0;
  }

  _createTweens(startBar, barArray, elecDuration, startDelay, interDelay) {
    //nur die Bars ab dem startBar sollen durchlaufen werden bzw. brauchen animation
    let reducedArray = barArray.slice(barArray.indexOf(startBar));
    let nextBar, newTween;

    //Erstelle zwischen jedem Bar einen Tween
    reducedArray.forEach(function (bar, i, barArr) {
      //nur wenn ein weiterer Bar existiert, kann es einen Tween geben
      if (i < barArr.length - 1) {
        nextBar = barArr[i + 1];

        //der erste Tween hat eine lange Wartezeit, damit der Text gelesen werden kann
        if (i == 0) {
          newTween = createTween(glb.electron, bar.position, nextBar.position, elecDuration, startDelay);
        } else {
          newTween = createTween(glb.electron, bar.position, nextBar.position, elecDuration, interDelay);
        }

        this.barTweens.push(newTween);
      }

    }, this); //this-Binding nötig für pushen auf das Array barTweens

    //alle Tweens werden zusammengefügt
    this.barTweens.forEach(function (tween, i, tweenArr) {
      if (i < tweenArr.length - 1) {
        tween.chain(tweenArr[i + 1]);
      }
    });

    //gibt es Animationen zu spielen, wir der Info-Text angezeigt
    if (!this.isEmpty()) {
      this.barTweens[0].onStart(() => {
        showNewText("<h3>Vibronische Relaxation</h3><p>Das Elektron gibt seine Schwingungsenergie strahlungslos an Teilchen in der Umgebung ab<p>");
      });
    }
  }

  start() {
    if (this.barTweens.length > 0) {
      this.barTweens[0].start();
    }
  }

  get length() {
    return this.barTweens.length;
  }

  //fügt ans Ende der Tweens eine Funktion an, die dann ausgeführt wird
  onComplete(fnc) {
    if (this.barTweens.length > 0) {
      this.barTweens[this.barTweens.length - 1].onComplete(fnc);
    }
  }

}
