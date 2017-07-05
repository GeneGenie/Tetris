function SoundFactory(){
    var self = this;
    self.play = function(soundId){
        createjs.Sound.play("sound_"+soundId);
    }
}