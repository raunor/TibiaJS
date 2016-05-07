﻿﻿class RenderingSystem implements ISystem {
    private renderer: SpriteGL.SpriteRenderer;
    private mapsToRender = new Array<{ position: PositionComponent; map: RenderMapComponent; }>();
    private dmgTxtList = new Array<{ txtObj; position: Vector2D, lifeTime: number }>();
    private canvas = <HTMLCanvasElement>document.getElementById("GameCanvas");
    constructor(canvas: HTMLCanvasElement, textureAtlas: HTMLImageElement) {
        this.renderer = SpriteGL.SpriteRenderer.fromCanvas(canvas, textureAtlas, SpriteGL.SpriteRenderer.TextureFilteringNearest);
    }

    Process(world: World) {
        var gameObjList = world.entityList;
        for (var i = 0; i < gameObjList.length; i++) {
            if ((gameObjList[i].ComponentSygnature & Componenets.Position) !== Componenets.Position) continue;
            var positionComponent = <PositionComponent> gameObjList[i].ComponentList[Componenets.Position];

            var spriteComponent = <SpriteComponent> gameObjList[i].ComponentList[Componenets.Sprite];
            if (spriteComponent) {
                var pos = {
                    x: positionComponent.PixelPosition.x + spriteComponent.SpriteOnTilePos.x,
                    y: positionComponent.PixelPosition.y + spriteComponent.SpriteOnTilePos.y
                }
                //this.renderer.SetHight(((pos.y * config.MapWidth + pos.x - 100000) / 10000000.0));
                this.renderer.SetHight((((pos.y / config.TileSize) * config.MapWidth) + (pos.x / config.TileSize)) / 1000000.0);
                this.DrawSprite(spriteComponent.RenderingSprite, pos.x, pos.y);

                var chMsg = <CharacterMessageComponent>gameObjList[i].ComponentList[Componenets.CharacterMessage];
                if (chMsg) {

                    if (!chMsg.TextObj || chMsg.TextObj.str !== chMsg.Str) {
                        this.renderer.DisposeTxt(chMsg.TextObj);
                        chMsg.TextObj = this.renderer.PrepareTxt(chMsg.Str, "Yellow", 14, true);

                    }
                    this.renderer.DrawTxt(chMsg.TextObj, (pos.x - chMsg.TextObj.Size.Width / 2) + 10, pos.y - 23);
                }

                var healthComponent = <HealthComponent>gameObjList[i].ComponentList[Componenets.Health];
                if (healthComponent) {
                    this.renderer.SetHight(0.001);
                    this.DrawHealthBar(healthComponent.HP / healthComponent.MaxHP, pos.x, pos.y - 6);
                    this.renderer.SetHight(0.0);

                    if (healthComponent.IsTargeted) {
                        this.renderer.SetHight(-0.0000001);
                        this.DrawSprite(3, positionComponent.PixelPosition.x, positionComponent.PixelPosition.y);
                        this.renderer.SetHight(0);
                    }
                }

                continue;
            }

            var mapComponent = gameObjList[i].ComponentList[Componenets.RenderMap];
            if (mapComponent) {
                this.mapsToRender.push({ position: positionComponent, map: <any> mapComponent });
                continue;
            }
        }

        var txts = world.GetEventByType(Events.TxtSpawn);

        for (var i = 0; i < txts.length; i++) {
            var posComp = <PositionComponent>txts[i].Subject.ComponentList[Componenets.Position];

            var txtObj = this.renderer.PrepareTxt(txts[i].Payload.Str, txts[i].Payload.Color, 11, true);
            this.dmgTxtList.push({
                txtObj: txtObj, position: {
                    x: posComp.PixelPosition.x, y: posComp.PixelPosition.y - (config.TileSize * 0.9)
                }, lifeTime: 0
            });

        }

        this.renderer.SetHight(0.001);
        for (var i = 0; i < this.dmgTxtList.length; i++) {
            this.renderer.DrawTxt(this.dmgTxtList[i].txtObj, this.dmgTxtList[i].position.x, this.dmgTxtList[i].position.y);
            this.dmgTxtList[i].position.y -= 10 / world.FPS;
            this.dmgTxtList[i].lifeTime += 1 / world.FPS;
            if (this.dmgTxtList[i].lifeTime > 1) {
                var txtObjToDispose = this.dmgTxtList.splice(i, 1)[0].txtObj;
                this.renderer.DisposeTxt(txtObjToDispose);
                i--;
            }
        }
        this.renderer.SetHight(0);
    }

    RenderAll(cameraList: Array<Vector2D>) {
        if (cameraList.length === 0) {
            cameraList.push({ x: 55 * config.TileSize, y: 55 * config.TileSize });
        }

        if (this.mapsToRender.length !== 0) {
            this.renderer.SetHight(-0.00001);
            this.DrawMap(cameraList[0], this.mapsToRender[0].position.PixelPosition, this.mapsToRender[0].map.FloorTiles);
            this.renderer.SetHight(0.001);
            this.DrawMapWithDepth(cameraList[0], this.mapsToRender[0].position.PixelPosition, this.mapsToRender[0].map.DecorationTiles);
        }
        this.mapsToRender = [];
        this.renderer.UpdateCamera(cameraList[0].x | 0, cameraList[0].y | 0);
        this.renderer.RenderAll();
    }


    private DrawSprite(index: number, posx: number, posy: number) {
        this.renderer.DrawSpr((index % 32) * 32, ((index / 32) | 0) * 32, 32, 32, posx, posy, config.TileSize, config.TileSize);
    }


    private DrawHealthBar(fraction: number, posx: number, posy: number) {
        var sizeX = 26 * config.TileSize / 32.0 | 0;
        var sizeY = 4 * config.TileSize / 32.0 | 0;
        posy = (posy - sizeY / 2) | 0
        if (fraction > 0.92) { this.renderer.DrawSpr(1, 2, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.84) { this.renderer.DrawSpr(1, 7, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.76) { this.renderer.DrawSpr(1, 12, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.68) { this.renderer.DrawSpr(1, 17, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.6) { this.renderer.DrawSpr(1, 22, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.52) { this.renderer.DrawSpr(1, 27, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.44) { this.renderer.DrawSpr(33, 2, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.36) { this.renderer.DrawSpr(33, 7, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.28) { this.renderer.DrawSpr(33, 12, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.2) { this.renderer.DrawSpr(33, 17, 26, 4, posx, posy, sizeX, sizeY); return; }
        if (fraction > 0.08) { this.renderer.DrawSpr(33, 22, 26, 4, posx, posy, sizeX, sizeY); return; }
        this.renderer.DrawSpr(33, 27, 26, 4, posx, posy, sizeX, sizeY);

    }


    private DrawMap(cameraPos: Vector2D, mapPos: Vector2D, tileMap: Int16Array) {
        for (var i = 0; i < this.mapsToRender.length; i++) {
            var startX = ((cameraPos.x - this.canvas.width / 2) / config.TileSize) | 0;

            var endX = (startX + this.canvas.width / config.TileSize) | 0;
            endX += 2;
            var startY = ((cameraPos.y - this.canvas.height / 2) / config.TileSize) | 0;

            var endY = (startY + this.canvas.height / config.TileSize) | 0;
            endY += 2;
            if (startX < 0) startX = 0;
            if (startY < 0) startY = 0;
            if (endX > config.MapWidth - 1) endX = config.MapWidth - 1;
            if (endY > config.MapHeight - 1) endY = config.MapHeight - 1;
            for (var y = startY; y < endY; y++) {
                for (var x = startX; x < endX; x++) {
                    if (tileMap[y * config.MapWidth + x] === 0) continue;
                    this.DrawSprite(tileMap[y * config.MapWidth + x] - 1, (x * config.TileSize), y * config.TileSize);
                }
            }

        }

    }
    private DrawMapWithDepth(cameraPos: Vector2D, mapPos: Vector2D, tileMap: Int16Array) {
        for (var i = 0; i < this.mapsToRender.length; i++) {
            var startX = ((cameraPos.x - this.canvas.width / 2) / config.TileSize) | 0;

            var endX = (startX + this.canvas.width / config.TileSize) | 0;
            endX += 2;
            var startY = ((cameraPos.y - this.canvas.height / 2) / config.TileSize) | 0;

            var endY = (startY + this.canvas.height / config.TileSize) | 0;
            endY += 2;
            if (startX < 0) startX = 0;
            if (startY < 0) startY = 0;
            if (endX > config.MapWidth - 1) endX = config.MapWidth - 1;
            if (endY > config.MapHeight - 1) endY = config.MapHeight - 1;
            for (var y = startY; y < endY; y++) {
                for (var x = startX; x < endX; x++) {
                    if (tileMap[y * config.MapWidth + x] === 0) continue;
                    this.renderer.SetHight((y * config.MapWidth + x) / 1000000.0);
                    this.DrawSprite(tileMap[y * config.MapWidth + x] - 1, (x * config.TileSize), y * config.TileSize);
                }
            }
        }
    }
}
