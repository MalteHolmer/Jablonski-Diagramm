/* global Container, Graphics, Rectangle */

class Bars {

  /*
    hitMargin - prozentuale Vergrößerung der Trefferfläche
    step - Distanz zwichen Bars
    amount - Anzahl der Bars
    radius - Abrundungsgrad
  */
  constructor(posX, posY, width, height, hitMargin, step, amount = 5, radius = 1.25) {
    //PIXI.js-Container
    this.container = new Container();

    this._createBars(posX, posY, width, height, hitMargin, step, amount, radius);
  }

  //Helfer-Methode zum Bilden von Bars
  _createBars(posX, posY, width, height, hitMargin, step, amount, radius) {
    let bar;

    //Erstelle die Bars und füge diese dem Container hinzu
    for (let i = 0; i < amount; i++) {
      bar = new Graphics()
        .beginFill()
        .drawRoundedRect(0, 0, width, height, radius)
        .endFill();

      //sorgt dafür, dass beim Skalieren mittig skaliert wird
      bar.pivot.x = bar.width / 2;
      bar.pivot.y = bar.height / 2;

      //Verändert die Treffer-Fläche zum Aktivieren des "Hover-Effekts"
      bar.hitArea = new Rectangle(0, -height * hitMargin / 2, width, height * (1 + hitMargin));

      //einfache Funktion damit die Verteilung der Bars etwas an Jablosnki erinenrt ^^
      bar.y = step * Math.pow(i, 1.9) + bar.pivot.y;
      //Bars sollen mittig im Container liegen (+ bar.pivot.x damit der mittige pivot ausgeglichen wird)
      bar.x = 0 + bar.pivot.x;

      bar.interactive = true;
      this.container.addChild(bar);
    }

    //Container an ausgewählte Position setzen
    this.container.interactive = true;
    this.container.x = posX;
    this.container.y = posY;
  }

  //wählt randomisiert eine Bar aus und lifert diese zurück (convenience Method)
  getRandom() {
    return this.container.children[Math.floor(Math.random() * this.container.children.length)];
  }

  get firstChild() {
    return this.container.children[0];
  }

  get lastChild() {
    return this.container.children[this.container.children.length - 1];
  }

  get children() {
    return this.container.children;
  }
}
