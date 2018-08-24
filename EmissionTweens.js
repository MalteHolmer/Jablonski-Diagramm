/* global createTween, photonAnimation, drawArrow, showNewText, TWEEN, electron, PhotonTweens */

class EmissionTweens {

    constructor(start_pos, end_pos, infoText, durationElec = 1000, durationPhot = 1000, delay = 500, offset = 30) {
        this.firstTween;
        this.lastTween;
        this.photonTweens;

        this._createTweens(start_pos, end_pos, infoText, durationElec, durationPhot, delay, offset);
    }

    _createTweens(start_pos, end_pos, infoText, durationElec, durationPhot, delay, offset) {
        let mid_pos = {
            x: start_pos.x + (end_pos.x - start_pos.x) / 2,
            y: start_pos.y + (end_pos.y - start_pos.y) / 2,
        };
        let eye_pos = toGlobal(auge);

        this.firstTween = createTween(electron, start_pos, mid_pos, delay, durationElec / 2, TWEEN.Easing.Sinusoidal.In);

        this.lastTween = createTween(electron, mid_pos, end_pos, 0, durationElec / 2, TWEEN.Easing.Sinusoidal.Out);

        this.photonTweens = new PhotonTweens(mid_pos, eye_pos, null, emissionColor, durationPhot)

        this.firstTween.chain(this.lastTween);

        //Emision des Photons beim Fall des Elektrons
        this.firstTween.onComplete((function () {
                this.photonTweens.start()
            })
            .bind(this));

        this.firstTween.onStart(function () {
            showNewText(infoText);
            drawArrow(start_pos, end_pos, 8, emissionColor, durationElec, 0, true, offset);
        });
    }

    start() {
        this.firstTween.start();
    }

    onComplete(fnc) {
        this.lastTween.onComplete(fnc);
    }
}
