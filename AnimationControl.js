class AnimationControl {
  constructor() {
    this.tweenChains = [];
    this.playing = false;
  }

  add(tweenChain) {
    this.tweenChains.push(tweenChain);
  }

  isEmpty() {
    return this.tweenChains.length == 0;
  }

  start() {

  }

  step() {

  }
}
