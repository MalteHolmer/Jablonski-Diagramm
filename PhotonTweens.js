/* global AnimatedSprite, TWEEN, PIXI, showNewText, app*/

class PhotonTweens {

    constructor(start_pos, end_pos, infoText, replaceColor, duration = 6000) {
        this.firstTween;
        this.secondTween;
        this.thirdTween;

        this._createTweens(start_pos, end_pos, infoText, replaceColor, duration);
    }

    _createTweens(start_pos, end_pos, infoText, replaceColor, duration) {
        let x_dist, y_dist, x_sign, y_sign, photonSprite;

        photonSprite = this._createPhotonSprite(start_pos, replaceColor);

        x_dist = end_pos.x - start_pos.x;
        y_dist = end_pos.y - start_pos.y;

        //Only necessary for the Tweens, as their Syntax for relative values is a bit strange
        x_sign = x_dist < 0 ? "" : "+";
        y_sign = y_dist < 0 ? "" : "+";

        let angle = Math.atan(y_dist / x_dist);
        let sprite_length = photonSprite.width;

        let x_offset = Math.abs(Math.cos(angle)) * sprite_length;
        let y_offset = Math.abs(Math.sin(angle)) * sprite_length;

        if(x_dist > 0) {
            x_dist -= x_offset;
        } else {
            x_dist += x_offset;
        }
        if(y_dist > 0) {
            y_dist -= y_offset;
        } else {
            y_dist += y_offset;
        }

        if(x_dist < 0) {
            photonSprite.rotation = Math.PI + angle;
        } else {
            photonSprite.rotation = angle;
        }
        this.firstTween = new TWEEN.Tween(photonSprite)
            .to({
                x: x_sign + x_dist / 3,
                y: y_sign + y_dist / 3,
                alpha: 1,
            }, duration / 3);
        this.secondTween = new TWEEN.Tween(photonSprite)
            .to({
                x: x_sign + x_dist / 3,
                y: y_sign + y_dist / 3,
            }, duration / 3);
        this.thirdTween = new TWEEN.Tween(photonSprite)
            .to({
                x: x_sign + x_dist / 3,
                y: y_sign + y_dist / 3,
                alpha: 0,
            }, duration / 3);


        this.firstTween.chain(this.secondTween);
        this.secondTween.chain(this.thirdTween);

        this.firstTween.onStart(function () {
            photonSprite.play();

            if(infoText != null) {
                showNewText(infoText);
            }
        });
    }

    _createPhotonSprite(pos, replaceColor) {
        var photonSprite;
        var frames = [];

        for(var i = 1; i <= 16; i++) {
            frames.push(PIXI.Texture.fromFrame("photon-sprite_" + i + ".png"));
        }

        photonSprite = new AnimatedSprite(frames, true);
        photonSprite.alpha = 0;
        photonSprite.scale.set(0.1);
        photonSprite.anchor.set(0, 0.5);
        photonSprite.position = pos;
        photonSprite.animationSpeed = 0.8;
        photonSprite.filters = [new PIXI.filters.ColorReplaceFilter(0x000000, Number.parseInt(replaceColor), 0.4)];

        tempGraphics.push(photonSprite);
        app.stage.addChild(photonSprite);

        return photonSprite;
    }

    start() {
        this.firstTween.start();
    }

    onComplete(fnc) {
        this.thirdTween.onComplete(fnc);
    }
}
