/* global glb */

class AnimationControl {
  constructor() {
    this.s0_bars = glb.s0_bars;
    this.s1_bars = glb.s1_bars;
    this.t1_bars = glb.t1_bars;

    this.tweenChains = [];
    this.playState = glb.playState.IDLE;

    this.createAnimation();
  }

  /*solange die Animation auf weitere Eingaben wartet und es noch Animationen in der
    Warteschlange gibt, spiele diese ab*/
  play() {
    if (this.playState == glb.playState.IDLE && !this.isEmpty()) {
      setInteraction(false);
      this.playState = glb.playState.PLAY;
      this._startAnimation();
    }
  }

  /*solange die Animation gerade nicht wartet, setze sie auf pause, was ein
    "unchainen" der Animation bewirkt, sie stoppt beim nächsten Tween*/
  pause() {
    if (this.playState != glb.playState.IDLE) {
      this.playState = glb.playState.PAUSE;
    }
  }

  /*Spiele einen einzelnen Schritt der Animation, auch hierfür muss die Animation
    warten und die Warteschlange nicht leer sein*/
  step() {
    if (this.playState == glb.playState.IDLE && !this.isEmpty()) {
      setInteraction(false);
      this.playState = glb.playState.STEP;
      this._startAnimation();
    }
  }

  /*Setzte die Animation wieder zurück, aktualisiere dabei zunächst die fluor-flag,
    lösche alle Animationen und erstelle neue auf Basis der Flag*/
  reset() {
    TWEEN.removeAll();
    this.playState = glb.playState.IDLE;
    this.createAnimation();
  }

  //convenience-Methode, ob es noch weitere Tweens zum abspielen gibt
  isEmpty() {
    return this.tweenChains.length == 0;
  }

  //Starte die nächste Animation in der Warteschlange
  _startAnimation() {
    this.tweenChains[0].start();
  }

  //auch eher convenience, erstellt je nach Flag eine Fluor oder Phos-Animation
  createAnimation() {
    if (glb.fluorescence) {
      this._createFluorAnim(this.s0_bars, this.s1_bars);
    } else {
      this._createPhosAnim(this.s0_bars, this.s1_bars, this.t1_bars);
    }

    this._setChaining();
  }

  /*Verbindet alle Tweens miteinander, je nach Bedingung in dem ausgewählten Ablauf,
    wird ein weiterer Tween abgespielt, oder die Animation stoppt und stellt sich
    auf IDLE, Tweens löschen sich selber aus dem Array nach erfolgreichem Abspielen*/
  _setChaining() {
    let self = this;
    this.tweenChains.forEach(function (tweenChain, i, arr) {
      tweenChain.onComplete(function () {
        //starte nächsten Tween (falls alles abgespielt wird) und lösche aus dem Array,
        if (arr.length >= 2 && self.playState == glb.playState.PLAY) {
          arr[1].start();
        } else if (self.playState == glb.playState.STEP || self.playState == glb.playState.PAUSE || arr.length == 1) {
          self.playState = glb.playState.IDLE;
        }
        arr.shift();
      });
    });

  }

  //Erstellt die Fluoreszenz-Animationen
  _createFluorAnim(s0_bars, s1_bars) {

    /*====Alle zusätzlichen Informationen die vorher erstellt werden müssen --> zufällige Bars und Info-Texte====*/
    let rand_s0 = s0_bars.getRandom();
    let rand_s1 = s1_bars.getRandom();

    let laserStartText = "<h3>Anregung des Elektrons</h3><p>Das Elektron absorbiert ein Photon des Lasers. Es wird in einen der Schwingungszustände des energetisch höher liegenden S1-Zustands angeregt.</p>";
    let infoText_s1_s0 = "<h3>Fluoreszenz</h3><p>Das Elektron gibt Energie in Form von Strahlung ab. Dabei wechselt es in einen Schwingungszustand des Grundzustands.</p>";

    //=====Initialisierung aller Tweens die für die Animation benötigt werden=====

    //Animation für Abschießen des Lasers und Sprung ins S1-Niveau
    let rayTween = new Ray(rand_s1, laserStartText);

    //Relaxieren zum Grundzustand von S1
    let tweens_s1 = new BarTweens(rand_s1, s1_bars.children);

    //Strahlungs-emittierender Übergang von S1 zu S0
    let tweens_s1_s0 = new EmissionTweens(toGlobal(s1_bars.lastChild), {
      x: glb.electronStartPos.scaled.x,
      y: toGlobal(rand_s0)
        .y,
    }, infoText_s1_s0);

    //Relaxieren zum Grundzustand von S0
    let tweens_s0 = new BarTweens(rand_s0, s0_bars.children);

    //Speichern der Tweens im Tween-Chain-Array
    this.tweenChains = [];
    this.tweenChains.push(rayTween, tweens_s1, tweens_s1_s0, tweens_s0);

    //Löschen aller überflüssigen Tween-Chains, die keine Tweens enthalten
    this.tweenChains = this.tweenChains.filter(function (tweens) {
      return !this._isObsolete(tweens);
    }, this);
  }

  //Erstellt die Phosphoreszenz-Animationen
  _createPhosAnim(s0_bars, s1_bars, t1_bars) {

    /*Alle zustäzlichen Informationen die vorher bestimmt werden müssen*/
    let rand_s0 = s0_bars.getRandom();
    let rand_t1 = t1_bars.getRandom();
    let rand_s1 = s1_bars.getRandom();

    let laserStartText = "<h3>Anregung des Elektrons</h3><p>Das Elektron absorbiert ein Photon des Lasers. Es wird in einen der Schwingungszustände des energetisch höher liegenden S1-Zustands angeregt.</p>";
    let infoText_s1_t1 = "<h3>Interkombination</h3><p>Das Elektron wechselt strahlungslos in den angeregten Triplett-Zustand T1, die Multiplizität ändert sich.</p>";
    let infoText_t1_s0 = "<h3>Phosphoreszenz</h3><p>Das Elektron wechselt unter Emission eines Photons in einen Schwingungszustand des Grundzustands. Der Übergang ist spin-verboten, es können Sekunden vergehen bis er eintritt.</p>";

    /*Initialisierung aller Tweens für die Animation*/

    //Animation für Abschießen des Lasers und Sprung ins S1-Niveau
    let rayTween = new Ray(rand_s1, laserStartText);

    //Relaxieren zum Grundzustand von S1
    let tweens_s1 = new BarTweens(rand_s1, s1_bars.children);

    //Interkombination von S1 zu T1
    let tween_s1_t1 = createTween(glb.electron, toGlobal(s1_bars.lastChild), toGlobal(rand_t1), glb.elecDuration, glb.startDelay);
    tween_s1_t1.onStart(function () {
      showNewText(infoText_s1_t1);
    });

    //Relaxieren zum Grundzustand von T1
    let tweens_t1 = new BarTweens(rand_t1, t1_bars.children);

    //Strahlungs-emittierender Übergang von T1 zu S0
    let tweens_t1_s0 = new EmissionTweens(toGlobal(t1_bars.lastChild), {
      x: toGlobal(t1_bars.lastChild)
        .x,
      y: toGlobal(rand_s0)
        .y,
    }, infoText_t1_s0, 0);

    //Relaxieren zum Grundzustand von S0
    let tweens_s0 = new BarTweens(rand_s0, s0_bars.children);

    //Speichern der Tweens im Tween-Chain-Array
    this.tweenChains = [];
    this.tweenChains.push(rayTween, tweens_s1, tween_s1_t1, tweens_t1, tweens_t1_s0, tweens_s0);

    //Löschen aller überflüssigen Tween-Chains, die keine Tweens enthalten
    this.tweenChains = this.tweenChains.filter(function (tweens) {
      return !this._isObsolete(tweens);
    }, this);
  }

  //convenience, die prüft ob eine BarTween-Animation gar keine Tweens enthält
  _isObsolete(tweenChain) {
    if (tweenChain.hasOwnProperty("barTweens")) {
      return (tweenChain.isEmpty() ? true : false);
    }
    return false;
  }

  //gibt den PlayState der Animation zurück
  getPlayState() {
    return this.playState;
  }

  //spezielle Methode, die die Animationen anpasst, wenn drag-and-drop verwenet wird
  playDrag(rand_s1) {
    this.tweenChains.shift();
    this.tweenChains.shift();
    this.tweenChains.unshift(new BarTweens(rand_s1, this.s1_bars.children));
    this._setChaining();

    //Lösche überflüssigen Tween, wenn in das S1-Grundniveau gedroppt wude
    if (this._isObsolete(this.tweenChains[0])) {
      this.tweenChains.shift();
    }

    this.play();
  }
}
