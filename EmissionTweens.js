class EmissionTweens {

  constructor(object, start_pos, end_pos, infoText, duration = 1000, delay = 1500) {
    this.firstTween;
    this.lastTween;

    this._createTweens(object, start_pos, end_pos, infoText, duration, delay);
  }

  _createTweens(object, start_pos, end_pos, infoText, duration, delay) {
    let mid_pos = {
      x: start_pos.x + (end_pos.x - start_pos.x) / 2,
      y: start_pos.y + (end_pos.y - start_pos.y) / 2,
    }

    this.firstTween = createTween(object, start_pos, mid_pos, delay, duration / 2, TWEEN.Easing.Sinusoidal.In);

    this.lastTween = createTween(object, mid_pos, end_pos, 0, duration / 2, TWEEN.Easing.Sinusoidal.Out);


    this.firstTween.chain(this.lastTween);

    //Emision des Photons beim Fall des Elektrons
    this.firstTween.onComplete(function () {
      photonAnimation(mid_pos, {
        x: 135, //empirisch ermittelt, wo das Zentrum des Auges ist, da Bild
        y: 207,
      }, 2000);
    });
    this.firstTween.onStart(function () {
      showNewText(infoText);
      drawArrow(start_pos, end_pos, 8, duration, 0, true);
    });
  }
}
