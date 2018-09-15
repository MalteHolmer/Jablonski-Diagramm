/* global toGlobal, TWEEN, showNewText, electronStartPos, Graphics, electron, createTween, drawArrow, laser, PhotonTweens */

//Erstellt eine Laser-Animation und die Anregung in den S1-Zustand
class Ray {
  constructor(endBar, infoText, offset = glb.arrowOffset, color = glb.absorptionColor, rayDuration = glb.rayDuration, emissionDuration = glb.emissionDuration, photonDuration = glb.photonDuration) {
    this.photonTweens;
    this.exciteTween;

    this._createRayAnimation(infoText, rayDuration, photonDuration, color);
    this._createElectronAnimation(endBar, offset, emissionDuration, color);
  }

  //Erstellt die Laser-Animation
  _createRayAnimation(infoText, rayDuration, photonDuration, color) {

    //Anfang des Lasers ist am rechten Ende des Laser-Images
    let laserStart = {
      x: glb.laser.x + glb.laser.width / 2,
      y: glb.laser.y,
    }
    //der Laser soll in der Start-Position des Elektrons enden
    let laserEnd = glb.electronStartPos.scaled;

    //Photon-Tweens gibt eine bewegte Photonen-Animation zurück
    this.photonTweens = new PhotonTweens(laserStart, laserEnd, infoText, color, photonDuration);
  }

  //Erstellt die Anregungs-Animation in den S1-Zustand
  _createElectronAnimation(endBar, offset, emissionDuration, color) {
    let firstElecPos = glb.electronStartPos.scaled;

    //Vom Grundzustand wird das Elektron in ein durch endBar angegebenes Niveau gehoben
    this.exciteTween = createTween(glb.electron, firstElecPos, toGlobal(endBar), emissionDuration, 0);

    /*Sobald die Animation abgespielt wird, soll durch einen Pfeil angezeit werden
      wie hoch das Elektron gesprungen ist*/
    this.exciteTween.onStart(function () {
      drawArrow(firstElecPos, toGlobal(endBar), color, offset, emissionDuration);
    });

    //nach Ablauf der Laser-Animation erfolgt sofort die Anregungs-Animation
    this.photonTweens.onComplete((function () {
        this.exciteTween.start();
      })
      .bind(this));
  }

  //Starten des TWeens
  start() {
    this.photonTweens.start();
  }

  //start einer weiteren Funktion nach Ablauf aller Tweens
  onComplete(fnc) {
    this.exciteTween.onComplete(fnc);
  }
}
