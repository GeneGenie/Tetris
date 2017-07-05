/*
 * Thanks guys for your attention, i'd like to mention that i know that sprite approach probably will be more
 * performable, but i wanted to play with separate blocks and layers to be able to create custom figures
 * Nothing special, but if you want to see it in action, add F6 class to figure set. Or you can inherit figure yourself
 *
 * You will find some comments that describe particles restrictions plugin.
 * */
function load(cb) {
    var queue = new createjs.LoadQueue(false);
    queue.installPlugin(createjs.Sound);

    //TODO: handle files for loader;
    //queue.on("fileload", handleCompleteFile);
    queue.on("complete", handleComplete);
    queue.loadManifest([
        {id: "background", src: "./resources/background.png"},
        {id: "particle", src: "./resources/particle_base.png"},
        {id: "block_blue", src: "./resources/block_blue.png"},
        {id: "block_red", src: "./resources/block_red.png"},
        {id: "block_cyan", src: "./resources/block_cyan.png"},
        {id: "block_green", src: "./resources/block_green.png"},
        {id: "block_orange", src: "./resources/block_orange.png"},
        {id: "block_purple", src: "./resources/block_purple.png"},
        {id: "block_red", src: "./resources/block_red.png"},
        {id: "block_yellow", src: "./resources/block_yellow.png"},
        {id:"sound_rotate",src:"./resources/sounds/rotate.mp3"},
        {id:"sound_boom",src:"./resources/sounds/boom.mp3"},
        {id:"sound_set",src:"./resources/sounds/squish.mp3"},
        {id:"sound_move",src:"./resources/sounds/move.mp3"}
    ]);
    function handleComplete() {
        var items = queue.getItems()
        var assets = {
            background: queue.getResult('background'),
            particle:queue.getResult('particle'),
            blocks: []

        }
        for (var i in  items) {
            if (items[i].item.id.indexOf('block_') == 0)
                assets.blocks.push(items[i].result);
        }

        cb && cb(assets);
    }
}

function init() {
    load(function (assets) {
        window.soundFactory= new SoundFactory();
        new Game({
            assets: assets, canvasId: "field", onEnd: function (score) {
                //no button support :( just keep simple confirm
                //this.showRestart()
                if (confirm('Your score:'+score+' Want to play again?')) {
                    this.restart();
                }
            }
        })

    })


}
