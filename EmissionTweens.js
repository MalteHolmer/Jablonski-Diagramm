/* global createTween, photonAnimation, drawArrow, showNewText, TWEEN, electron, PhotonTweens */

//Zwei Elektronen-Tweens und ein Photon-Tween ergeben zusammen die Emissions-Animation
class EmissionTweens {

  constructor(start_pos, end_pos, infoText, offset = glb.arrowOffset, emissionDuration = glb.emissionDuration, photonDuration = glb.photonDuration, delay = glb.startDelay, emissionColor = glb.emissionColor) {
    this.firstTween;
    this.lastTween;
    this.photonTweens;

    this._createTweens(start_pos, end_pos, infoText, emissionDuration, photonDuration, delay, emissionColor, offset);
  }

  //Methode zum Erstellen der Tweens
  _createTweens(start_pos, end_pos, infoText, emissionDuration, photonDuration, delay, emissionColor, offset) {
    /*Mittlere Position wird benötigt, da Elektron erst die halbe Strecke
      herunterfällt, dann emittiert und dann weiter fällt*/
    let mid_pos = {
      x: start_pos.x + (end_pos.x - start_pos.x) / 2,
      y: start_pos.y + (end_pos.y - start_pos.y) / 2,
    };
    //Position zu der das Photon sich bewegen soll
    let eye_pos = toGlobal(glb.auge);

    //Erste Hälfte der Elektronenanimation
    this.firstTween = createTween(glb.electron, start_pos, mid_pos, emissionDuration / 2, delay, TWEEN.Easing.Sinusoidal.In);
    //Zweite Hälfte der Elektronenanimation
    this.lastTween = createTween(glb.electron, mid_pos, end_pos, emissionDuration / 2, 0, TWEEN.Easing.Sinusoidal.Out);

    //Animation des Photons, realisiert in der Klasse PhotonTweens
    if (glb.fluorescence) {
      this.photonTweens = new PhotonTweens(mid_pos, eye_pos, null, emissionColor, photonDuration);
    } else {
      this.photonTweens = new PhotonTweens(mid_pos, eye_pos, null, emissionColor, photonDuration * 2);
    }


    //Verbinden der Tweens
    this.firstTween.chain(this.lastTween);

    /*Emision des Photons beim Fall des Elektrons, in der Mitte der Animation wird
      emittiert*/
    this.firstTween.onComplete((function () {
        this.photonTweens.start()
      })
      .bind(this));

    /*Zeige einen Pfeil der die Sprungweite angbit und einen Infotext, definiert in
      AnimationControl*/
    this.firstTween.onStart(function () {
      showNewText(infoText);
      drawArrow(start_pos, end_pos, emissionColor, offset, emissionDuration);
    });
  }

  //Starten der Tween-Animation
  start() {
    this.firstTween.start();
  }

  //Starten einer weiteren Funktion nach Ablauf aller Tweens
  onComplete(fnc) {
    this.lastTween.onComplete(fnc);
  }
}
