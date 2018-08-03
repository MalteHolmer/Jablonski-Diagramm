//Creates a number of BarTweens and gives access to handy function to manipulate those tweens

//enthält eine Sammlung von Bar-Objecten in einem PIXI.js-Container

class BarTweens {

    constructor(startBar, barArray, infoText = "", ) {
        this.barTweens = [];
        this.barArray = barArray;
        this.startBar = startBar;
        this.infoText = infoText;

        this.createTweens();
    }

    get firstTween() {
        return this.barTweens[0];
    }

    get lastTween() {
        return this.barTweens[this.barTweens.length - 1];
    }

    //wichtig fürs spätere chainen, convenience-Methode
    isEmpty() {
        return this.barTweens.length == 0;
    }

    createTweens() {
        let reducedArray = this.barArray.slice(this.barArray.indexOf(this.startBar));
        let nextBar, newTween;

        reducedArray.forEach(function (bar, i, barArr) {
            if(i < barArr.length - 1) {
                nextBar = barArr[i + 1];
                newTween = createTween(electron, bar.position, nextBar.position);

                this.barTweens.push(newTween);
            }

        }, this);

        this.barTweens.forEach(function (tween, i, tweenArr) {
            if(i < tweenArr.length - 1) {
                tween.chain(tweenArr[i + 1]);
            }
        });

        if(!this.isEmpty()) {
            this.firstTween.onStart(() => {
                tweening = true; //globale Variable, vllt anders besser
                showNewText(this.infoText);
            });

            this.lastTween.onComplete(() => {
                tweening = false;
            })
        }
    }
}
