/* global toGlobal, TWEEN, showNewText, electronStartPos, Graphics, electron, createTween, drawArrow, laser, PhotonTweens */

class Ray {
    constructor(s0_bars, s1_bars, endBar, infoText, color, duration = 1500, offset = 30) {
        this.photonTweens;
        this.exciteTween;

        this._createRayAnimation(s0_bars, s1_bars, infoText, color, duration);
        this._createElectronAnimation(s1_bars, endBar, offset);
    }

    _createRayAnimation(s0_bars, s1_bars, infoText, color, duration) {

        //rechtes Ende des Lasers
        let laserStart = {
            x: laser.x + laser.width / 2,
            y: laser.y,
        }
        let laserEnd = electronStartPos.scaled;
        this.photonTweens = new PhotonTweens(laserStart, laserEnd, infoText, absorptionColor, duration);
    }

    _createElectronAnimation(s1_bars, endBar, offset, duration = 3000, delay = 0) {
        let firstElecPos = electronStartPos.scaled;

        this.exciteTween = createTween(electron, firstElecPos, toGlobal(endBar), delay, duration);

        this.exciteTween.onStart(function () {
            drawArrow(firstElecPos, toGlobal(endBar), 8, absorptionColor, duration, 0, true, offset);
        });

        this.photonTweens.onComplete((function () {
                this.exciteTween.start();
            })
            .bind(this));
    }

    start() {
        this.photonTweens.start();
    }

    onComplete(fnc) {
        this.exciteTween.onComplete(fnc);
    }
}
