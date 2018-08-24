/* global electron, toGlobal, electronStartPos, Ray, BarTweens, EmissionTweens, showNewText, createTween, TWEEN */

class AnimationControl {
  constructor(s0_bars, s1_bars, t1_bars, fluorescence = true) {
    this.s0_bars = s0_bars;
    this.s1_bars = s1_bars;
    this.t1_bars = t1_bars;
    this.fluorescence = fluorescence;

    this.tweenChains = [];
    this.playing = false;

    this.createAnimation();
  }

  play() {
    if (this.playing != true) {
      this.playing = true;
      this._startAnimation();
    }
  }

  pause() {
    this.playing = false;
  }

  step() {
    this.playing = false;
    this._startAnimation();
  }

  reset(fluorescence) {
    if (fluorescence != undefined) {
      this.fluorescence = fluorescence;
    }
    TWEEN.removeAll();
    this.playing = false;
    this.createAnimation();
  }

  isEmpty() {
    return this.tweenChains.length == 0;
  }

  _startAnimation() {
    this.tweenChains[0].start();
  }

  createAnimation() {
    if (this.fluorescence) {
      this._createFluorAnim(this.s0_bars, this.s1_bars);
    } else {
      this._createPhosAnim(this.s0_bars, this.s1_bars, this.t1_bars);
    }

    this._setChaining();
  }

  _setChaining() {
    let self = this;
    this.tweenChains.forEach(function (tweenChain, i, arr) {
      tweenChain.onComplete(function () {
        //starte nächsten Tween (falls alles abgespielt wird) und lösche aus dem Array,
        if (arr.length >= 2 && self.playing == true) {
          arr[1].start();
        }
        arr.shift();
      });
    });
  }

  _createFluorAnim(s0_bars, s1_bars) {

    /*Alle zusätzlichen Informationen die vorher erstellt werden müssen --> zufällige Bars und Info-Texte*/

    let rand_s0 = s0_bars.getRandom();
    let rand_s1 = s1_bars.getRandom();

    let laserStartText = "<h3>Anregung des Elektrons</h3><p>Das Elektron absorbiert ein Photon des Lasers. Es wird in einen der Schwingungszustände des energetisch höher liegenden S1-Zustands angeregt.</p>";
    let infoText_s1_s0 = "<h3>Fluoreszenz</h3><p>Das Elektron gibt Energie in Form von Strahlung ab. Dabei wechselt es in einen Schwingungszustand des Grundzustands.</p>";

    /*Initialisierung aller Tweens die für die Animation benötigt werden*/

    let rayTween = new Ray(s0_bars, s1_bars, rand_s1, laserStartText, 0xff0000);

    let tweens_s1 = new BarTweens(rand_s1, s1_bars.children);

    let tweens_s1_s0 = new EmissionTweens(toGlobal(s1_bars.lastChild), {
      x: electronStartPos.scaled.x,
      y: toGlobal(rand_s0).y,
    }, infoText_s1_s0, 3000, 2000);

    let tweens_s0 = new BarTweens(rand_s0, s0_bars.children);

    /*Speichern der Tweens im Tween-Chain-Array*/

    this.tweenChains = [];
    this.tweenChains.push(rayTween, tweens_s1, tweens_s1_s0, tweens_s0);

    this.tweenChains = this.tweenChains.filter(this._isObsolete);
  }

  _createPhosAnim(s0_bars, s1_bars, t1_bars) {

    /*Alle zustäzlichen Informationen die vorher bestimmt werden müssen*/

    let rand_s0 = s0_bars.getRandom();
    let rand_t1 = t1_bars.getRandom();
    let rand_s1 = s1_bars.getRandom();

    let laserStartText = "<h3>Anregung des Elektrons</h3><p>Das Elektron absorbiert ein Photon des Lasers. Es wird in einen der Schwingungszustände des energetisch höher liegenden S1-Zustands angeregt.</p>";
    let infoText_s1_t1 = "<h3>Interkombination</h3><p>Das Elektron wechselt strahlungslos in den angeregten Triplett-Zustand T1, die Multiplizität ändert sich.</p>";
    let infoText_t1_s0 = "<h3>Phosphoreszenz</h3><p>Das Elektron wechselt unter Emission eines Photons in einen Schwingungszustand des Grundzustands. Der Übergang ist spin-verboten, es können Sekunden vergehen bis er eintritt.</p>";

    /*Initialisierung aller Tweens für die Animation*/

    let rayTween = new Ray(s0_bars, s1_bars, rand_s1, laserStartText, 0xff0000, 1000, 0);

    let tweens_s1 = new BarTweens(rand_s1, s1_bars.children);

    let tween_s1_t1 = createTween(electron, toGlobal(s1_bars.lastChild), toGlobal(rand_t1));
    tween_s1_t1.onStart(function () {
      showNewText(infoText_s1_t1);
    });

    let tweens_t1 = new BarTweens(rand_t1, t1_bars.children);

    let tweens_t1_s0 = new EmissionTweens(toGlobal(t1_bars.lastChild), {
      x: toGlobal(t1_bars.lastChild).x,
      y: toGlobal(rand_s0).y,
    }, infoText_t1_s0, 3000, 4000, 1500, 0);

    let tweens_s0 = new BarTweens(rand_s0, s0_bars.children);

    this.tweenChains = [];
    this.tweenChains.push(rayTween, tweens_s1, tween_s1_t1, tweens_t1, tweens_t1_s0, tweens_s0);

    this.tweenChains = this.tweenChains.filter(this._isObsolete);
  }

  _isObsolete(tweenChain) {
    if (tweenChain.hasOwnProperty("barTweens")) {
      return (tweenChain.isEmpty() ? false : true);
    }
    return true;
  }
}
