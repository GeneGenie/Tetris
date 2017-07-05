function Game(opts) {


    var fieldSize = {w: 10, h: 20},
        canvasId = opts.canvasId || 'field',
        stage = new createjs.Stage(canvasId),
        cellSize = {w: 10, h: 10},
        fieldMap = [],
        fallDownIntervalTime = 500,
        fallDownInterval,
        figuresSet = [F1, F2, F3, F4, F5, F55],
        currentFigure,
        nextFigure = null,
        score = 0,
        blocksContainer = new createjs.Container(),
        scoreText;





    function initEmptyRow() {
        var arr = [], i = fieldSize.w;
        while (i--) {
            arr[i] = 0;
        }
        return arr;
    }


    function emitParticle(y) {
        //this is very strange plugin actually it is adding particles with huge delay ~200 ms
        //initially i've added particles for each block explosion, but it took to long to remove
        //several lines. so i've decided to add particle per line explosion

        var emitter = new createjs.ParticleEmitter(opts.assets.particle);
        emitter.position = new createjs.Point(fieldSize.w * cellSize.w / 2, y);
        emitter.emitterType = createjs.ParticleEmitterType.OneShot;
        emitter.maxParticles = 120;
        emitter.life = 500;
        emitter.lifeVar = 0;
        emitter.speed = 200;
        emitter.speedVar = 0;
        emitter.positionVarX = fieldSize.w * cellSize.w;
        emitter.positionVarY = 0;
        emitter.accelerationX = 0;
        emitter.accelerationY = 0;
        emitter.radialAcceleration = 0;
        emitter.radialAccelerationVar = 0;
        emitter.tangentalAcceleration = 0;
        emitter.tangentalAccelerationVar = 0;
        emitter.angle = -90;
        emitter.angleVar = 90;
        emitter.startSpin = 0;
        emitter.startSpinVar = 0;
        emitter.endSpin = null;
        emitter.endSpinVar = null;
        emitter.startColor = [255, 255, 0];
        emitter.startColorVar = [0, 0, 0];
        emitter.startOpacity = 1;
        emitter.endColor = null;
        emitter.endColorVar = null;
        emitter.endOpacity = 0;
        emitter.startSize = 20;
        emitter.startSizeVar = 0;
        emitter.endSize = null;
        emitter.endSizeVar = null;
        stage.addChild(emitter);
    }

    function initBg() {
        var bgBlockImg = opts.assets.background,
            canvas = document.getElementById(canvasId),
            bg = new createjs.Container();
        cellSize = {w: bgBlockImg.width, h: bgBlockImg.height};
        canvas.height = cellSize.h * fieldSize.h;
        canvas.width = cellSize.w * fieldSize.w + (cellSize.w * 6);
        var fillBg = new createjs.Shape(); //Create your shape variable
        fillBg.graphics.beginFill("#ececec").drawRect(0, 0, canvas.width, canvas.height);
        stage.addChild(fillBg)

        //init fill game map and draw bg with zeros
        for (var i = 0; i < fieldSize.h; i++) {
            fieldMap[i] = []
            for (var j = 0; j < fieldSize.w; j++) {
                fieldMap[i].push(0);
                var bgBlock = new createjs.Bitmap(bgBlockImg);
                bgBlock.x = j * bgBlockImg.width;
                bgBlock.y = i * bgBlockImg.height;
                bg.addChild(bgBlock);
            }
        }

        stage.addChild(bg)

    }

    function isFullRow(row) {
        for (var j = 0; j < row.length; j++) {
            if (row[j] == 0) {
                return false;
            }
        }
        return true;
    }

    function destroyRow(row, y, cb) {
        for (var x = 0; x < row.length; x++) {
            blocksContainer.removeChild(row[x]);
        }
        soundFactory.play('boom')
        emitParticle(y * cellSize.h + cellSize.h)
        //this timeout is added to support this buggy emitter ~450 ms before it will able to add new emitter
        setTimeout(function () {
            cb && cb();
        }, 450)
    }

    function moveEverythingDown(y) {
        //move down those who were upstairs
        for (var i = 0; i < y; i++) {
            for (var j = 0; j < fieldMap[i].length; j++) {
                if (fieldMap[i][j] instanceof Object) {
                    fieldMap[i][j].y += cellSize.h;
                }
            }
        }
    }

    function checkRows(cb) {
        //recursive checking
        for (var i = fieldMap.length - 1; i >= 0; i--) {
            if (isFullRow(fieldMap[i])) {
                clearInterval(fallDownInterval);
                (function (i) {
                    destroyRow(fieldMap[i], i, function () {
                        moveEverythingDown(i);
                        stage.update()
                        score += 100;
                        updateScore(score);
                        fieldMap.splice(i, 1);
                        fieldMap.unshift(initEmptyRow())
                        //this timeout is added to see blocks to drop
                        setTimeout(function () {
                            checkRows(cb);
                        }, 100)

                    });
                })(i)
                return;
            }
        }

        cb()
    }

    function moveDown() {
        if (currentFigure !== null && !currentFigure.move({x: 0, y: 1}, fieldMap)) {
            var mergeData = currentFigure.getData();
            if (mergeData.y < 0) {
                currentFigure.dispose();
                stop();
                return;
            }
            //copy to field
            for (var i = 0; i < mergeData.map.length; i++) {
                for (var j = 0; j < mergeData.map[i].length; j++) {
                    if (mergeData.map[i][j] == 0) continue;
                    var block = new createjs.Bitmap(mergeData.img);
                    block.x = mergeData.img.width * (j + mergeData.x)
                    block.y = mergeData.img.height * (i + mergeData.y)
                    fieldMap[i + mergeData.y][j + mergeData.x] = block;
                    blocksContainer.addChild(block);
                }

            }

            soundFactory.play('set')
            currentFigure.dispose();
            currentFigure = null;
            clearInterval(fallDownInterval);
            checkRows(function () {
                setFallInterval();
                setRandomFigure();
            })

        }
    }

    function getRandomFigure() {
        return figuresSet[Math.floor(Math.random() * figuresSet.length)]
    }

    function setRandomFigure() {

        var config = {
            stage: stage,
            blocks: opts.assets.blocks
        };
        if (currentFigure === undefined) {
            currentFigure = new (getRandomFigure())().init(config)

        } else {

            currentFigure = nextFigure;
            currentFigure.restoreInitialCoords();

        }

        nextFigure = new (getRandomFigure())().init(config)
        nextFigure.updateCoords({coords: {x: (fieldSize.w + 1), y: 0}});
    }

    function setupEvents() {
        //handle keyboard
        window.addEventListener('keydown', function (e) {

            //disabled move sound, too annoying.
            //soundFactory.play('move')
            switch (e.keyCode) {
                case 37: //left
                    currentFigure.move({x: -1, y: 0}, fieldMap);
                    break;
                case 38: //up
                    currentFigure.rotate(fieldMap);
                    break;
                case 39: //right
                    currentFigure.move({x: 1, y: 0}, fieldMap);

                    break;
                case 40: //down
                    moveDown();
                    break;
            }
            stage.update()
        })

    }

    function setFallInterval() {
        /*
         i know that game lifecycle of the game should be done in single entry point
         Tweenjs provides tick event loop, and stage.update should be used only there
         but anyway i decided to use interval to drop figure,
         because i think Tetris is pretty simple to handle separate interval
         */
        console.log('interval time',fallDownIntervalTime)
        clearInterval(fallDownInterval)
        fallDownInterval = setInterval(function () {
            moveDown();
            stage.update()
        }, fallDownIntervalTime)
    }

    function stop() {
        clearInterval(fallDownInterval)
        currentFigure = null;
        opts.onEnd && opts.onEnd.call(self, score);
    }

    function updateScore() {
        //each 500 points reduce interval time by 10%
        if (score / 100 % 5 == 0) {
            fallDownIntervalTime *= 0.9
            setFallInterval();
        }
        scoreText.text = score;

    }

    function initSideView() {
        //init next figure view
        var previewRect = {x: fieldSize.w * cellSize.w + cellSize.w, y: 0, w: 4, h: 4};
        var bgBlockImg = opts.assets.background;
        for (var i = 0; i < previewRect.w; i++) {
            for (var j = 0; j < previewRect.h; j++) {
                var bgBlock = new createjs.Bitmap(bgBlockImg);
                bgBlock.x = previewRect.x + j * cellSize.w;
                bgBlock.y = previewRect.y + i * cellSize.h;
                stage.addChild(bgBlock)
            }

        }
        var text = new createjs.Text("Score:", "16px Arial", "#000000");
        text.x = previewRect.x;
        text.y = (previewRect.h + 1) * cellSize.h
        stage.addChild(text);
        scoreText = new createjs.Text(score, "16px Arial", "#000000");
        scoreText.x = previewRect.x;
        scoreText.y = (previewRect.h + 2) * cellSize.h
        stage.addChild(scoreText);
    }

    self.restart = function () {
        score = 0;
        updateScore();
        fallDownIntervalTime = 500;
        for (var i = 0; i < fieldMap.length; i++) {
            fieldMap[i] = initEmptyRow();
        }
        blocksContainer.removeAllChildren();

        setFallInterval();
        setRandomFigure()
    }
    self.showRestart = function(){
        //this is not working for some reason. EaselJS 0.3 doesn't support add event listener
        //but i prefer to keep particle more then button support
        stage.enableMouseOver();
        var buttonRect = new createjs.Shape(); //Create your shape variable
        buttonRect.graphics.beginFill("#000").drawRect(0, 0,100, 50);
        stage.addChild(buttonRect)
        var helper = new createjs.ButtonHelper(buttonRect, "out", "over", "down", false, buttonRect, "hit");
        buttonRect.addEventListener("click", handleClick);
        function handleClick(event) {
            self.restart();
        }

    }
    initBg();
    initSideView();
    setupEvents();
    setRandomFigure();
    setFallInterval();
    stage.addChild(blocksContainer)
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addListener(function () {
        stage.update();
    });

}