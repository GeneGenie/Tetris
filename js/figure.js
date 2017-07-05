function Figure() {
    //var this = this;
    var blockSize = {w: 10, h: 10};



    this.rotateArray=function(arr, fieldMap) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr[i].length; j++) {
                result[j] = result[j] || [];
                result[j].unshift(arr[i][j]);
            }
        }
        //if new figure map will interact only with empty cells
        for (var _y = 0; _y < result.length; _y++) {
            for (var _x = 0; _x < result[_y].length; _x++) {
                if (result[_y][_x] == 1 && fieldMap[_y + this.y][_x + this.x] !== 0) return false;
            }
        }


        return result;
    }

    this.checkSidesMovement=function(dir, fieldMap) {
        //conditions can be joined in 1 but for logic clearance
        //left border
        if (this.x + dir.x < 0) return false;
        //right border
        if (this.x + this.map[0].length + dir.x > fieldMap[0].length)  return false;
        //and of course other elements
        if (this.y >= 0 && dir.x != 0) {

            for (var i = 0; i < this.map.length; i++) {
                for (var j = 0; j < this.map[i].length; j++) {
                    if (this.map[i][j] == 1) {
                        if (fieldMap[i + this.y][j + this.x + dir.x] != 0)
                            return false;
                        break;
                    }
                }
                for (var j = this.map[i].length - 1; j >= 0; j--) {
                    if (this.map[i][j] == 1) {
                        if (fieldMap[i + this.y][j + this.x + dir.x] != 0)
                            return false;
                        break;
                    }
                }
            }


        }
        return true;
    }

    this.finishMovement=function(direction, fieldMap) {
        //check if any bottom cell in figure reached bottom of the screen
        //find bottoms
        for (var figurex = 0; figurex < this.map[0].length; figurex++) {
            for (var figurey = this.map.length - 1; figurey >= 0; figurey--) {
                if (this.map[figurey][figurex] == 1) {

                    //if we came here - then this is a bot filled cell in figure map
                    //we need to check direction movement for each
                    //figurex/y - coords of filled cell relative to figure layer(container)
                    //but we need absolute

                    var nX = this.x + figurex, nY = this.y + figurey;

                    if (nY >= -1 && (fieldMap[nY + direction.y] == undefined || fieldMap[nY + direction.y][nX] == undefined || fieldMap[nY + direction.y][nX] instanceof Object)) {
                        return true;
                    }

                    break;
                }

            }
        }

        return false;
    }

    this.pickRandomBlock=function() {
        //get random color block
        //figure decides which color it will use, but ofc this logic
        // can be moved to Game, to remove blocks from Figure this;
        return this.blocks[Math.floor(Math.random() * this.blocks.length)];
    }

    this.rotate = function (fieldMap) {
        //check if rotation will not interact with existing blocks
        // or with borders. Otherwise, just return (block rotation)
        //this can be improved, by moving figure away from borders.
        var rotationResult = this.rotateArray(this.map, fieldMap);
        if (rotationResult === false) return
        var angle = this.container.rotation += 90;
        this.map = rotationResult;
        //some rotation magic.
        //pay attention, x,y, become messy coords to support simple rotation.
        //so we copy them
        //probably here should be better logic. Maybe relative coords rotation
        var figureSize = {w: this.map[0].length, h: this.map.length}

        var _x = this.x, _y = this.y;
        if (angle / 90 % 4 == 1) {
            _x = this.x + figureSize.w
        } else if (angle / 90 % 4 == 2) {
            _y = this.y + figureSize.h
            _x = this.x + figureSize.w
        } else if (angle / 90 % 4 == 3) {
            _y = this.y + figureSize.h
        }
        soundFactory.play('rotate')
        this.updateCoords({coords: {x: _x, y: _y}});

        //anyway this rotation is not perfect
        //coz it uses 0,0 of figure as transform center
        //that's why we can see a little artifact on rotation
        //add rotate fix for 1 px
    }
    this.move = function (direction, fieldMap) {
        if (this.checkSidesMovement(direction, fieldMap)) {
            //if moving to bottom - check if we can, if not - send false to game
            if (direction.y == 1 && this.finishMovement(direction, fieldMap)) return false;

            this.x += direction.x;
            this.y += direction.y;
            this.updateCoords({direction: direction});
        }
        return true;
    }
    this.getData = function () {
        return {
            x: this.x, y: this.y, map: this.map, img: this.getMyImage()
        }
    }
    this.dispose = function () {

        this.container.removeAllChildren();
        this.stage.removeChild(this.container);
    }
    this.init = function (opts) {
        this.id = Date.now() + Math.random();
        this.container = new createjs.Container();
        this.map = this.map || [[1, 1, 1, 1]]
        this.stage = opts.stage;
        this.blocks = opts.blocks
        var blockImg = this.pickRandomBlock();
        blockSize = {
            w: blockImg.height,
            h: blockImg.width
        };
        this.x = 0;
        this.y = -this.map.length;
        this.initialCoords = {coords: {x: this.x, y: this.y}};
        for (var i = 0; i < this.map.length; i++) {
            var row = this.map[i];
            for (var j = 0; j < row.length; j++) {
                var el = row[j];
                if (el) {
                    var block = new createjs.Bitmap(blockImg);
                    block.x = j * blockSize.w;
                    block.y = i * blockSize.h;
                    this.container.addChild(block);
                }
            }
        }
        this.stage.addChild(this.container);
        this.updateCoords({coords: {x: this.x, y: this.y}});
        this.getMyImage = function () {
            return blockImg;
        }
        return this;
    }
    this.updateCoords = function (data) {
        // if coords were passed, use them

        if (data.coords) {
            this.container.x = (data.coords.x ) * blockSize.w;
            this.container.y = (data.coords.y ) * blockSize.h;
        }
        //if direction - just add pixels
        //this is a fix for a movement + rotation issue,
        //this allowed removal of _y,_x from scope
        if (data.direction) {
            this.container.x += (data.direction.x ) * blockSize.w;
            this.container.y += (data.direction.y ) * blockSize.h;
        }


    }
    this.restoreInitialCoords = function () {

        this.updateCoords(this.initialCoords)
    }

}

function F1() {

    this.map = [[1, 1, 1], [1, 0, 0]];
}
F1.prototype = new Figure()
function F2() {


    this.map = [[1, 1, 1, 1]];
}
F2.prototype = new Figure()


function F3() {

    this.map = [[1, 1], [1, 1]];
}
F3.prototype = new Figure()

function F4() {


    this.map = [[0, 1, 0], [1, 1, 1]];
}
F4.prototype = new Figure()
function F5() {


    this.map = [[1, 1, 0], [0, 1, 1]];
}
F5.prototype = new Figure()
function F55() {

    this.map = [[0, 1, 1], [1, 1, 0]];
}
F55.prototype = new Figure()

function F6() {
    this.map = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
}
F6.prototype = new Figure()