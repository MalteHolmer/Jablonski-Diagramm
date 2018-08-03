class Ray {
    constructor(color, start_pos, end_pos, excitedBars, duration = 500, delay = 0) {
        this.color = color;
        this.duration = duration;
        this.delay = delay;
        this.start_pos = start_pos;
        this.end_pos = end_pos;
        this.excitedBars = excitedBars;
        this.ray = new Graphics();
        this.emitTween;
        this.travelTween;
        this.absorbTween;

        this._createRayAnimation();
    }

    changeColor(color) {
        this.color = color;

        this._createRayAnimation();
    }

    changePositions(start_pos, end_pos) {
        this.start_pos = start_pos;
        this.end_pos = end_pos;

        this._createRayAnimation();
    }

    _createRayAnimation(rayWidth = 100) {
        this.ray.clear()
            .beginFill(this.color)
            .drawRect(0, 0, 0.01, 1.5);
        this.ray.position = this.start_pos;
        this.ray.y -= this.ray.height / 2; //muss so justiert werden, da der Pivot wichtig für die Animation ist und hier nicht genutzt werden kann
        app.stage.addChild(this.ray);

        let dist_x = this.end_pos.x - this.start_pos.x;
        let total_movement = dist_x + rayWidth; //gesamte Bewegungsdistanz des Punktes x=0 des Rays (muss die Länge ausgleichen, da diese in der späteren Animation abgebaut wird)

        this.emitTween = new TWEEN.Tween(this.ray) //Laser wird aufgebaut (wächst auf volle Länge)
            .to({
                width: "+" + rayWidth,
            }, rayWidth / total_movement * this.duration);
        this.travelTween = new TWEEN.Tween(this.ray)
            .to({
                x: "+" + (dist_x - rayWidth), //Bewegung des Lasers außer des letzten Stücks (rayWidth);
            }, (dist_x - rayWidth) / total_movement * this.duration);
        this.absorbTween = new TWEEN.Tween(this.ray)
            .to({
                x: "+" + rayWidth,
                width: "-" + rayWidth,
            }, rayWidth / total_movement * this.duration);

        this.emitTween.chain(this.travelTween);
        this.travelTween.chain(this.absorbTween);

        this.emitTween.onStart(function () {
            tweening = true;
        });

    }

    _exciteElectron(barsToJump, fluorescence) {
        let randBar = barsToJump.getRandom();
        let firstElecPos = electron.position;

        //let exciteTween = createTween(electron, electron.position, toGlobal(randBar));
        let exciteTween = createTween(electron, firstElecPos, toGlobal(randBar));

        if(fluorescence) {
            exciteTween.onComplete(function () {
                fluorRelax(randBar);
            });
        } else {
            exciteTween.onComplete(function () {
                phosRelax(randBar);
            });
        }


        exciteTween.start();
    }

    emitRay(fluorescence = true) {
        this.absorbTween.onComplete((function () {
                this._exciteElectron(this.excitedBars, fluorescence)
            })
            .bind(this));

        this.emitTween.start();
    }
}
