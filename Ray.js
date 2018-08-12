/* global toGlobal, app, TWEEN, showNewText, electronStartPos, Graphics, electron, createTween, drawArrow, laser */

class Ray {
  constructor(s0_bars, s1_bars, endBar, color, duration = 1000, offset = 30) {
    this.emitTween;
    this.travelTween;
    this.absorbTween;
    this.exciteTween;

    this._createRayAnimation(s0_bars, s1_bars, color, duration);
    this._createElectronAnimation(s1_bars, endBar, offset);
  }

  _createRayAnimation(s0_bars, s1_bars, color, duration, rayWidth = 100) {

    //rechtes Ende des Lasers
    let laserStartX = laser.x + laser.width / 2;
    //x-Start-Position des Elektrons
    let laserEndX = electronStartPos.scaled.x;
    let ray = new Graphics();

    ray.clear()
      .beginFill(color)
      .drawRect(0, 0, 0.01, 1.5);
    ray.position = {
      x: laserStartX,
      y: laser.y,
    };
    ray.y -= ray.height / 2; //muss so justiert werden, da der Pivot wichtig für die Animation ist und hier nicht genutzt werden kann

    var indexElectron = app.stage.getChildIndex(electron);
    app.stage.addChildAt(ray, indexElectron);

    let dist_x = laserEndX - laserStartX;
    let total_movement = dist_x + rayWidth; //gesamte Bewegungsdistanz des Punktes x=0 des Rays (muss die Länge ausgleichen, da diese in der späteren Animation abgebaut wird)

    this.emitTween = new TWEEN.Tween(ray) //Laser wird aufgebaut (wächst auf volle Länge)
      .to({
        width: "+" + rayWidth,
      }, rayWidth / total_movement * duration);
    this.travelTween = new TWEEN.Tween(ray)
      .to({
        x: "+" + (dist_x - rayWidth), //Bewegung des Lasers außer des letzten Stücks (rayWidth);
      }, (dist_x - rayWidth) / total_movement * duration);
    this.absorbTween = new TWEEN.Tween(ray)
      .to({
        x: "+" + rayWidth,
        width: "-" + rayWidth,
      }, rayWidth / total_movement * duration);

    this.emitTween.onStart(function () {
      showNewText("<h3>Anregung des Elektrons</h3><p>Das Elektron absorbiert ein Photon des Lasers. Es wird in einen der Schwingungszustände des energetisch höher liegenden S1-Zustands angeregt.</p>");
    });

    this.emitTween.chain(this.travelTween);
    this.travelTween.chain(this.absorbTween);
  }

  _createElectronAnimation(s1_bars, endBar, offset, duration = 3000, delay = 0) {
    let firstElecPos = electronStartPos.scaled;

    this.exciteTween = createTween(electron, firstElecPos, toGlobal(endBar), delay, duration);

    this.exciteTween.onStart(function () {
      drawArrow(firstElecPos, toGlobal(endBar), 8, duration, 0, true, offset);
    });

    this.absorbTween.chain(this.exciteTween);
  }

  start() {
    this.emitTween.start();
  }

  onComplete(fnc) {
    this.exciteTween.onComplete(fnc);
  }
}
