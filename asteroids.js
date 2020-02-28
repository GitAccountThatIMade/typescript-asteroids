"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    const maxX = svg.getBoundingClientRect().width;
    const maxY = svg.getBoundingClientRect().height;
    const shipTag = "ship";
    const g = new Elem(svg, "g")
        .attr("transform", "translate(" + Math.ceil(maxX / 2) + " " + Math.ceil(maxY / 2)
        + ") rotate(0)")
        .attr("id", "MAINSHIP")
        .attr("class", shipTag);
    const ship = new Elem(svg, "polygon", g.elem)
        .attr("points", "-15,20 -5,15 5,15 15,20 0,-20")
        .attr("style", "fill:black;stroke:white;stroke-width:2");
    const turningSpeed = 5;
    const frictionConstant = .05;
    const goLeft = "a";
    const goRight = "d";
    const goForward = "w";
    const shootButton = " ";
    const timeRate = 10;
    const maxStep = 5;
    const atomicAsteroidDim = "-6,2 -5,3 -6,5 -4,7 -2,7 -1,8 1,6 4,5 3,3 5,2 3,-1 4,-3 2,-5 -3,-4 -5,-1";
    const asteroidTag = "asteroid";
    const bulletTag = "bullet";
    const invaderTag = "invader";
    const laserTag = "laser";
    const shieldTag = "shield";
    const shieldPoints = "0,0 16,0 16,16, 0,16";
    const shieldArray = [
        { x: 84, y: 516 }, { x: 84, y: 532 }, { x: 100, y: 500 }, { x: 100, y: 484 }, { x: 116, y: 500 },
        { x: 116, y: 484 }, { x: 132, y: 500 }, { x: 132, y: 484 }, { x: 148, y: 516 }, { x: 148, y: 532 },
        { x: 260, y: 516 }, { x: 260, y: 532 }, { x: 276, y: 500 }, { x: 276, y: 484 }, { x: 292, y: 500 },
        { x: 292, y: 484 }, { x: 308, y: 500 }, { x: 308, y: 484 }, { x: 324, y: 516 }, { x: 324, y: 532 },
        { x: 436, y: 516 }, { x: 436, y: 532 }, { x: 452, y: 500 }, { x: 452, y: 484 }, { x: 468, y: 500 },
        { x: 468, y: 484 }, { x: 484, y: 500 }, { x: 484, y: 484 }, { x: 500, y: 516 }, { x: 500, y: 532 },
    ];
    const spaceInvaderPoints = "-24,0 24,0 24,-16 30,-16 30,8 24,8 24,16 30,16 30,24 24,24 24,16 0,16 -24,16 -30,16 -30,24, -24,24, -24,16, -24,8"
        + " -30,8 -30,-16 -24,-16 -24,0";
    const invaderStep = 1;
    const defaultDirection = 0;
    const maxAsteroidSize = 7;
    const minimumAsteroid = 4;
    const asteroidSpeedMod = 3;
    const maxHealth = 200;
    const spaceLimit = 2;
    const asteroidArray = [];
    const shieldRemovalThreshold = 0.6;
    const laserPoints = "-4,16 -4,-16 0,-16 0,8, 0,16";
    const invaderGap = 75;
    const invaderRowMax = 4;
    const laserChance = 0.001;
    const shipInvaderPos = 0.95;
    const fullCircle = 360;
    const quarterCircle = 90;
    const halfCircle = 180;
    const eighthCircle = 45;
    const threeQuarterCircle = 270;
    const numBase = 10;
    const invaderGapMult = 2;
    const invaderGapDenom = 1.5;
    const invaderSpeedDenom = 2;
    const bulletRadius = 2;
    const laserDamage = 10;
    const laserScore = 50;
    const invaderScore = 200;
    const asteroidScore = 100;
    const accelerationReduce = 200;
    const asteroidRate = 1.2;
    const roundRate = 2;
    const milliCount = 1000;
    const gameAttributes = {
        asteroidSpawnRate: 5000,
        health: maxHealth,
        prevShipDir: 0,
        prevShipDist: 0,
        roundNumber: 1,
        roundTimer: 20000,
        score: 0,
    };
    function translateToInt(toParse) {
        const translateArg = toParse.split("\n")[0];
        const firstSplit = translateArg.split(" ");
        const xHalf = firstSplit[0].split("(");
        const yHalf = firstSplit[1].split(")");
        const finalX = parseInt(xHalf[1].split(",")[0], numBase);
        const finalY = parseInt(yHalf[0], numBase);
        const outputArray = [finalX, finalY];
        return outputArray;
    }
    function rotationToInt(toParse) {
        const rotateArg = toParse.split(" ")[2];
        const firstSplit = rotateArg.split("(");
        const secondSplit = firstSplit[1].split(")");
        const thirdSplit = secondSplit[0];
        const rotationFinal = parseInt(thirdSplit, numBase);
        return rotationFinal;
    }
    const deleteAsset = (asset) => {
        const element = document.getElementById(asset.attr("id"));
        if (element !== null) {
            element.remove();
        }
    };
    const deleteAssetElement = (asset) => {
        const element = document.getElementById(asset.getAttribute("id"));
        if (element !== null) {
            element.remove();
        }
    };
    const wrapOnEdge = (nextNum, maxNum) => {
        if (nextNum > maxNum) {
            return nextNum - maxNum;
        }
        else if (nextNum < 0) {
            return maxNum - nextNum;
        }
        else {
            return nextNum;
        }
    };
    const toRads = (degrees) => degrees * (Math.PI / halfCircle);
    const calculateXYStep = (direction, distance) => {
        const returnX = Math.abs((distance * Math.sin(toRads(direction)))) * (direction > halfCircle ? -1 : 1);
        const returnY = Math.abs((distance * Math.cos(toRads(direction)))) * (direction > threeQuarterCircle || direction
            < quarterCircle ? -1 : 1);
        return [Math.ceil(returnX), Math.ceil(returnY)];
    };
    const mod = (inputNumber, modulus) => {
        const JavaScriptMod = inputNumber % modulus;
        return inputNumber >= 0 ? JavaScriptMod : modulus + JavaScriptMod;
    };
    const collisionDetection = (rectOne, rectTwo) => {
        if (rectTwo.left < rectOne.right && rectTwo.right > rectOne.left && rectTwo.top < rectOne.bottom && rectTwo.bottom
            > rectOne.top) {
            return true;
        }
        return false;
    };
    const movement = (asset, distance, releaseKey) => {
        const moveObserve = Observable.interval(timeRate).takeUntil(keyUp.filter((event) => !event.repeat)
            .map(({ key }) => ({ pressed: key })).filter(({ pressed }) => pressed.toLowerCase() === releaseKey))
            .subscribe(() => {
            const nextXY = calculateXYStep(rotationToInt(asset.attr("transform")), distance);
            const translateXY = translateToInt(asset.attr("transform"));
            asset.attr("transform", "translate(" +
                wrapOnEdge((translateXY[0] + nextXY[0]), maxX) +
                " " + wrapOnEdge((translateXY[1] +
                nextXY[1]), maxY)
                +
                    ") rotate(" +
                rotationToInt(asset.attr("transform")) +
                ")");
        });
        return moveObserve;
    };
    const bulletMovement = (asset, distance) => {
        Observable.interval(timeRate).takeUntil(Observable.interval(timeRate * (Math.max(maxX, maxY))))
            .subscribe(() => {
            const nextXY = calculateXYStep(parseInt(asset.attr("rotation"), numBase), distance);
            asset.attr("cx", parseInt(asset.attr("cx"), numBase) + nextXY[0]);
            asset.attr("cy", parseInt(asset.attr("cy"), numBase) + nextXY[1]);
            if (!(parseInt(asset.attr("cx"), numBase) < maxX && parseInt(asset.attr("cy"), numBase) < maxY
                && parseInt(asset.attr("cx"), numBase) > 0 && parseInt(asset.attr("cy"), numBase) > 0)) {
                deleteAsset(asset);
            }
        });
    };
    const turn = (asset, positive, releaseKey) => {
        Observable.interval(timeRate)
            .takeUntil(keyUp.map(({ key }) => ({ upPressed: key })).filter(({ upPressed }) => (upPressed.toLowerCase() === releaseKey.toLowerCase())))
            .subscribe(() => {
            const translateXY = translateToInt(asset.attr("transform"));
            if (gameAttributes.roundNumber % spaceLimit !== 0) {
                asset.attr("transform", "translate(" + translateXY[0] + " " + translateXY[1] + ") rotate("
                    + mod((rotationToInt(g.attr("transform")) +
                        (turningSpeed * (positive ? 1 : -1))), fullCircle) + ")");
            }
            else {
                if ((translateXY[0] + (maxStep * (positive ? 1 : -1))) > 0 && (translateXY[0]
                    + (maxStep * (positive ? 1 : -1))) < maxX) {
                    asset.attr("transform", "translate(" + (translateXY[0] + ((maxStep / invaderSpeedDenom)
                        * (positive ? 1 : -1))) + " " + (maxY * shipInvaderPos) + ") rotate(" + rotationToInt(g.attr("transform"))
                        + ")");
                }
            }
        });
    };
    const mainLoop = Observable.interval(timeRate).map(() => ({ pLives: gameAttributes.health, pScore: gameAttributes.score }));
    const startSpawn = (inputSize, coordString, direction = Math.ceil(Math.random() * fullCircle)) => {
        const uniqueId = (new Date().getTime()).toString() + coordString;
        const pointMaker = (points, factor) => {
            const pointArray = points.split(" ");
            const newArray = pointArray.map((point) => {
                const pointXY = point.split(",");
                const newX = parseInt(pointXY[0], numBase) * factor;
                const newY = parseInt(pointXY[1], numBase) * factor;
                return newX + "," + newY;
            });
            const toCoordString = (array) => {
                return array.length > 0 ? array[0] + " " + toCoordString(array.slice(1, array.length)) : "";
            };
            return toCoordString(newArray);
        };
        const spawnPoint = "translate(" + coordString + ") rotation(" + direction + ")";
        const createdAsteroid = new Elem(svg, "polygon")
            .attr("transform", spawnPoint)
            .attr("id", uniqueId)
            .attr("size", inputSize)
            .attr("class", asteroidTag)
            .attr("style", "fill:black;stroke:white;stroke-width:2");
        const movementObservable = movement(createdAsteroid, 1 + Math.ceil(maxStep / (inputSize ** asteroidSpeedMod)));
        asteroidArray.push({ id: uniqueId, observe: movementObservable });
        Observable.interval(timeRate).takeUntil(Observable.interval(timeRate)).subscribe(() => (undefined), () => {
            createdAsteroid.attr("points", pointMaker(atomicAsteroidDim, inputSize));
        });
    };
    const startSpawnSpaceInvaders = () => {
        shieldArray.forEach(({ x, y }) => {
            new Elem(svg, "polygon").attr("style", "fill:lime;stroke:lime;stroke-width:2").attr("transform", "translate("
                + x + " " + y + ")").attr("class", shieldTag).attr("points", shieldPoints).attr("id", new Date().getTime()
                + x + y);
        });
        const numInvaders = Math.floor(maxX / (invaderGap * invaderGapMult));
        const functionalLoop = (currentI, currentJ) => {
            if (currentJ <= invaderRowMax) {
                if (currentI <= numInvaders) {
                    new Elem(svg, "polygon")
                        .attr("transform", "translate(" + currentI * invaderGap + " " + Math.ceil(invaderGap / invaderGapDenom)
                        * currentJ
                        + ") rotate(" + defaultDirection + ")")
                        .attr("points", spaceInvaderPoints)
                        .attr("class", invaderTag)
                        .attr("id", (new Date().getTime()).toString() + currentJ + currentI)
                        .attr("style", "fill:white;stroke:black;stroke-width:2");
                    functionalLoop(currentI + 1, currentJ);
                }
                else {
                    functionalLoop(1, currentJ + 1);
                }
            }
        };
        functionalLoop(1, 1);
        const invade = (positive) => {
            mainLoop.takeUntil(mainLoop.filter(() => {
                const allInvaders = document.querySelectorAll("." + invaderTag);
                return ((Array.from(allInvaders)).filter((element) => {
                    const currentXY = translateToInt(element.getAttribute("transform"));
                    return ((currentXY[0] > (maxX - invaderGap / invaderGapMult)) || (currentXY[0] < invaderGap /
                        invaderGapMult));
                }).length > 0) || (document.querySelectorAll("." + invaderTag).length < 1);
            })).subscribe(() => {
                const allInvaders = document.querySelectorAll("." + invaderTag);
                allInvaders.forEach((element) => {
                    const currentXY = translateToInt(element.getAttribute("transform"));
                    element.setAttribute("transform", "translate(" + (currentXY[0] + invaderStep * (positive ? 1 : -1)) + " "
                        + currentXY[1] + ") rotate(" + defaultDirection + ")");
                    if (Math.random() < laserChance) {
                        const createdShot = new Elem(svg, "polygon")
                            .attr("style", "fill:white;stroke:white;stroke-width:2")
                            .attr("class", laserTag)
                            .attr("id", new Date().getTime())
                            .attr("transform", "translate(" + currentXY[0] + " " + currentXY[1] + ") rotate(" + defaultDirection
                            + ")")
                            .attr("points", laserPoints);
                        const shotObservable = Observable.interval(timeRate);
                        shotObservable.takeUntil(shotObservable.filter(() => (translateToInt(createdShot.attr("transform"))[1]
                            > (maxY * 1.2)))).subscribe(() => {
                            const xY = translateToInt(createdShot.attr("transform"));
                            createdShot.attr("transform", "translate(" + xY[0] + " " + (xY[1] + invaderStep) + ") rotate("
                                + defaultDirection + ")");
                        });
                    }
                });
            }, () => {
                const allInvaders = document.querySelectorAll("." + invaderTag);
                allInvaders.forEach((element) => {
                    const currentXY = translateToInt(element.getAttribute("transform"));
                    const nextStop = positive ? (currentXY[0] - invaderGap) : (currentXY[0] + invaderGap);
                    element.setAttribute("transform", "translate(" + nextStop + " " + (currentXY[1] + Math.ceil(invaderGap / 1.5))
                        + ") rotate(" + defaultDirection + ")");
                    if (currentXY[1] > (maxY * shipInvaderPos)) {
                        gameAttributes.health = 0;
                    }
                    if (currentXY[1] > (maxY * shieldRemovalThreshold)) {
                        document.querySelectorAll("." + shieldTag).forEach((toDeleteElement) => deleteAssetElement(toDeleteElement));
                    }
                });
                if (gameAttributes.health > 0 && (document.querySelectorAll("." + invaderTag).length > 0)) {
                    invade(!positive);
                }
                else {
                    gameAttributes.roundNumber += 1;
                    document.getElementById("pageTitle").innerHTML = "GET READY!";
                    document.querySelectorAll("." + shieldTag).forEach((element) => deleteAssetElement(element));
                    document.querySelectorAll("." + laserTag).forEach((element) => deleteAssetElement(element));
                    asteroidMaker();
                }
            });
        };
        invade(true);
    };
    const spaceInvaderMaker = () => {
        if (gameAttributes.health > 0) {
            gameAttributes.health = maxHealth;
            document.getElementById("pageTitle").innerHTML = "ROUND " + gameAttributes.roundNumber;
            document.getElementById("roundInfo").innerHTML = "Space Invaders!";
            document.getElementById("gamename").innerHTML = "Space Invaders";
            g.attr("transform", "translate(" + Math.ceil(maxX / invaderGapMult) + " " + Math.ceil(maxY * shipInvaderPos)
                + ") rotate(0)");
            startSpawnSpaceInvaders();
        }
    };
    const asteroidMaker = () => Observable.interval(gameAttributes.asteroidSpawnRate).takeUntil(Observable
        .interval(gameAttributes.roundTimer)).subscribe(() => {
        if (gameAttributes.health > 0) {
            document.getElementById("gamename").innerHTML = "Asteroids";
            document.getElementById("pageTitle").innerHTML = "ROUND " + gameAttributes.roundNumber;
            document.getElementById("roundInfo").innerHTML = "This round will last " + Math.floor(gameAttributes.roundTimer
                / milliCount) + " seconds, with " + Math.floor(gameAttributes.roundTimer / gameAttributes.asteroidSpawnRate)
                + " large asteroids.";
            startSpawn(maxAsteroidSize, (Math.random() > 0.5
                ?
                    ("0 " + Math.ceil((Math.random() * maxY)))
                :
                    ((Math.ceil(Math.random() * maxX)) + " 0")));
        }
    }, () => {
        asteroidArray.length = 0;
        document.querySelectorAll("." + asteroidTag).forEach((element) => deleteAssetElement(element));
        document.querySelectorAll("." + bulletTag).forEach((element) => deleteAssetElement(element));
        if (gameAttributes.health > 0) {
            gameAttributes.roundNumber += 1;
            document.getElementById("pageTitle").innerHTML = "GET READY!";
            if (gameAttributes.roundNumber % spaceLimit === 0) {
                gameAttributes.health = maxHealth;
                spaceInvaderMaker();
            }
            else {
                gameAttributes.roundTimer *= roundRate;
                gameAttributes.asteroidSpawnRate *= asteroidRate;
                gameAttributes.health = maxHealth;
                asteroidMaker();
            }
        }
    });
    asteroidMaker();
    const keyUp = Observable.fromEvent(document, "keyup");
    const keyDown = Observable.fromEvent(document, "keydown").filter((event) => !event.repeat
        && gameAttributes.health > 0).map(({ key }) => ({ pressed: key }));
    keyDown.filter(({ pressed }) => {
        return pressed.toLowerCase() === goForward;
    }).subscribe(() => {
        if (gameAttributes.roundNumber % spaceLimit !== 0) {
            const startTime = (new Date()).getTime();
            const accelerator = () => {
                Observable.interval(timeRate)
                    .takeUntil(keyUp.filter((event) => !event.repeat).map(({ key }) => ({ pressed: key })).filter(({ pressed }) => pressed.toLowerCase() === goForward))
                    .subscribe(() => {
                    if (gameAttributes.roundNumber % spaceLimit !== 0) {
                        const derivedStep = Math.ceil((((new Date().getTime()) - startTime) / (accelerationReduce)));
                        const currentDir = rotationToInt(g.attr("transform"));
                        const nextXY = calculateXYStep(rotationToInt(g.attr("transform")), derivedStep > maxStep
                            ? maxStep
                            :
                                derivedStep);
                        const translateXY = translateToInt(g.attr("transform"));
                        gameAttributes.prevShipDist = frictionConstant < gameAttributes.prevShipDist ? gameAttributes.prevShipDist
                            - frictionConstant : 0;
                        const lastXY = calculateXYStep(gameAttributes.prevShipDir, gameAttributes.prevShipDist);
                        g.attr("transform", "translate(" + wrapOnEdge(translateXY[0] + nextXY[0] + lastXY[0], maxX) + " "
                            + wrapOnEdge(translateXY[1] + nextXY[1] + lastXY[1], maxY) + ") rotate("
                            + rotationToInt(g.attr("transform")) + ")");
                        gameAttributes.prevShipDist = derivedStep > maxStep ? maxStep : derivedStep;
                        gameAttributes.prevShipDir = currentDir;
                    }
                }, () => {
                    Observable.interval(timeRate).takeUntil(mainLoop.filter(() => gameAttributes.prevShipDist === 0
                        || gameAttributes.health < 0)).takeUntil(keyDown.filter(({ pressed }) => pressed.toLowerCase() === goForward)).subscribe(() => {
                        gameAttributes.prevShipDist = frictionConstant < gameAttributes.prevShipDist
                            ?
                                gameAttributes.prevShipDist - frictionConstant
                            :
                                0;
                        const nextXY = calculateXYStep(gameAttributes.prevShipDir, gameAttributes.prevShipDist);
                        const translateXY = translateToInt(g.attr("transform"));
                        g.attr("transform", "translate(" + wrapOnEdge(translateXY[0] + nextXY[0], maxX) + " "
                            + wrapOnEdge(translateXY[1] + nextXY[1], maxY) + ") rotate(" + rotationToInt(g.attr("transform"))
                            + ")");
                    }, () => { gameAttributes.prevShipDir = 0; gameAttributes.prevShipDist = 0; });
                });
            };
            accelerator();
        }
    });
    keyDown.filter(({ pressed }) => {
        return pressed.toLowerCase() === goRight;
    }).subscribe(({ pressed }) => {
        turn(g, true, pressed);
    });
    keyDown.filter(({ pressed }) => {
        return pressed.toLowerCase() === goLeft;
    }).subscribe(({ pressed }) => {
        turn(g, false, pressed);
    });
    mainLoop.takeUntil(mainLoop.filter(() => gameAttributes.health <= 0)).subscribe(() => {
        document.getElementById("score").innerHTML = "Score: " + gameAttributes.score;
        document.getElementById("health").innerHTML = "Health: " + gameAttributes.health;
        document.querySelectorAll("." + shieldTag).forEach((shield) => {
            document.querySelectorAll("." + bulletTag).forEach((shieldBullet) => {
                if (collisionDetection(shield.getBoundingClientRect(), shieldBullet.getBoundingClientRect())) {
                    deleteAssetElement(shield);
                    deleteAssetElement(shieldBullet);
                }
            });
        });
        asteroidArray.forEach(({ id, observe }) => {
            const element = document.getElementById(id);
            if (element !== null) {
                if (collisionDetection(document.querySelectorAll(".ship")[0].getBoundingClientRect(), element.getBoundingClientRect())) {
                    gameAttributes.health -= 1;
                }
                const allBullets = document.querySelectorAll("." + bulletTag);
                allBullets.forEach((bulletTwo) => {
                    if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) {
                        deleteAssetElement(bulletTwo);
                        observe();
                        const sizeLimit = parseInt(element.getAttribute("size"), numBase);
                        if (sizeLimit > minimumAsteroid) {
                            const parentXY = translateToInt(element.getAttribute("transform"));
                            startSpawn(sizeLimit - 1, (parentXY[0] + 1) + " " + parentXY[1], (rotationToInt(element.getAttribute("transform")) + quarterCircle + Math.ceil(eighthCircle / 2 * Math.random())) % fullCircle);
                            startSpawn(sizeLimit - 1, (parentXY[0] - 1) + " " + parentXY[1], (rotationToInt(element.getAttribute("transform")) - quarterCircle - Math.ceil(eighthCircle * Math.random())) % fullCircle);
                        }
                        deleteAssetElement(element);
                        gameAttributes.score += asteroidScore;
                    }
                });
            }
        });
        document.querySelectorAll("." + invaderTag).forEach((element) => {
            const allBullets = document.querySelectorAll("." + bulletTag);
            allBullets.forEach((bulletTwo) => {
                if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) {
                    deleteAssetElement(bulletTwo);
                    deleteAssetElement(element);
                    gameAttributes.score += invaderScore;
                }
            });
        });
        document.querySelectorAll("." + laserTag).forEach((element) => {
            const allBullets = document.querySelectorAll("." + bulletTag);
            allBullets.forEach((bulletTwo) => {
                if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) {
                    deleteAssetElement(bulletTwo);
                    deleteAssetElement(element);
                    gameAttributes.score += laserScore;
                }
            });
            if (collisionDetection(document.querySelectorAll(".ship")[0].getBoundingClientRect(), element.getBoundingClientRect())) {
                gameAttributes.health -= laserDamage;
                deleteAssetElement(element);
            }
            document.querySelectorAll("." + shieldTag).forEach((shield) => {
                if (collisionDetection(shield.getBoundingClientRect(), element.getBoundingClientRect())) {
                    deleteAssetElement(shield);
                    deleteAssetElement(element);
                }
            });
        });
    }, () => {
        document.getElementById("pageTitle").innerHTML = "GAME OVER";
        document.getElementById("health").innerHTML = "Health: 0";
        document.querySelectorAll("*").forEach((element) => {
            if (element.getAttribute("id") !== "pageTitle" && element.getAttribute("id") !== "health"
                && element.getAttribute("id") !== "score" && element.getAttribute("id") !== "gamename"
                && element.getAttribute("id") !== "roundInfo" && element.getAttribute("id") !== "canvas") {
                deleteAssetElement(element);
            }
        });
    });
    keyDown.filter(({ pressed }) => (pressed === shootButton)).subscribe(({ pressed }) => {
        const uniqueId = new Date().getTime();
        const shipXY = translateToInt(g.attr("transform"));
        const shipRotation = rotationToInt(g.attr("transform"));
        const createdShot = new Elem(svg, "circle")
            .attr("style", "fill:black;stroke:white;stroke-width:2")
            .attr("id", uniqueId)
            .attr("cx", shipXY[0])
            .attr("cy", shipXY[1])
            .attr("r", bulletRadius)
            .attr("class", bulletTag)
            .attr("rotation", shipRotation);
        bulletMovement(createdShot, maxStep * maxStep);
    });
}
if (typeof window !== "undefined") {
    window.onload = () => {
        asteroids();
    };
}
//# sourceMappingURL=asteroids.js.map