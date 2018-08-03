class Bars {

    constructor(posX, posY, width, height, amount = 5, radius = 1.25, step = 6, hitMargin = 1.2) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.amount = amount;
        this.radius = radius; //Ecken-Radius der einzelnen Bars
        this.step = step;
        this.hitMargin = hitMargin; //prozentuale Verbreiterung der hitArea
        this.container = new Container(); //PIXI.js-Container

        this._createBars();
    }

    //Helfer-Methode zum Bilden von Bars
    _createBars() {
        let bar;

        for(let i = 0; i < this.amount; i++) {
            bar = new Graphics()
                .beginFill()
                .drawRoundedRect(0, 0, this.width, this.height, this.radius)
                .endFill();

            bar.pivot.x = bar.width / 2;
            bar.pivot.y = bar.height / 2;
            bar.hitArea = new Rectangle(0, -this.height * this.hitMargin / 2, this.width, this.height * (1 + this.hitMargin));

            //etwas unschön, sorgt jedoch dafür, das mittig skaliert wird, bei Aufruf von .scale
            bar.y = this.step * Math.pow(i, 1.9) + bar.pivot.y;
            bar.x = 0 + bar.pivot.x;

            bar.interactive = true;
            this.container.addChild(bar);
        }

        this.container.interactive = true;
        this.container.x = this.posX;
        this.container.y = this.posY;
    }

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
