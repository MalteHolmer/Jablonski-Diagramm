//Creates a number of BarTweens and gives access to handy function to manipulate those tweens

//enthält eine Sammlung von Bar-Objecten in einem PIXI.js-Container

class BarTweens {

  constructor(startBar, barArray, startDelay = 1500) {
    this.barTweens = [];
    this.barArray = barArray;
    this.startBar = startBar;
    this.startDelay = startDelay;

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
      //nur wenn ein weiterer Bar existiert, kann es einen Tween geben
      if (i < barArr.length - 1) {
        nextBar = barArr[i + 1];

        //der erste Tween hat eine lange Wartezeit, damit der Text gelesen werden kann
        if (i == 0) {
          newTween = createTween(electron, bar.position, nextBar.position, this.startDelay);
        } else {
          newTween = createTween(electron, bar.position, nextBar.position);
        }

        this.barTweens.push(newTween);
      }

    }, this);

    this.barTweens.forEach(function (tween, i, tweenArr) {
      if (i < tweenArr.length - 1) {
        tween.chain(tweenArr[i + 1]);
      }
    });

    if (!this.isEmpty()) {
      this.firstTween.onStart(() => {
        showNewText("<h3>Vibronische Relaxation</h3><p>Das Elektron gibt seine Schwingungsenergie strahlungslos an Teilchen in der Umgebung ab<p>");
      });
    }
  }
}
