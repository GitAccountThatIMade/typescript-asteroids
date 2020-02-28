// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/*
Design description:
Most of the global constants are defined at the top, along with the five mutable variables that store information that
  can change, such as the round timer, player health and score, asteroid spawn rate, and the current round number.

A series of helper functions are defined.  One parses the polygon transform string into an array of two integers (X and
  Y translation)
Another is identical except that it returns the direction as an integer
These both are read only, so they are pure.

Following that, two functions that delete an Elem and an Element from the screen.  They are as pure as you can get while
  deleting something,
which is an external taske.

The next is a function to return a nummber wrapped around the edge (effectively a %).  It is read only, and so, pure.

The function "toRads", which converts to radians because Math.cos and Math.sin use those, is pure

CalculateXYStep gets the X and Y components of the vector supplied for the next step (direction and distance)

I implemented a function "mod", as the JavaScript % is different to the Python %, in terms of negative numbers (JS keeps
  the sign, and
  Python returns the absolute value).  I needed the absolute, so I made this function.

The collision detection function takes the bounding rectangle and just checks if they collide based on values read from
  the rect.  It is pure and read only

Movement changes the Elem's transform attribute, and so is impure.  Ideally, we would return a new object and reassign
  it, but that isn't
feasable in this case.

bulletMovement is effectively the same thing, but for circles rather than polygons, and it deletes the asset when it's
  outside the game area.
It is also impure, and it only unsubscribes when a timer runs out.  The timer is a function of the bullet speed and room
  size, so while this isn't perfect,
it will always delete when offscreen

Both these movements use observables

Turn also uses observables, using an interval.  It is impure, and ideally it would return a new element that would be
  assigned to the old.

The mainLoop is then created.  It is an observable that maps the player's health and score.

The startspawn function creates a new asteroid, mapping the points from a string and returning a modified version using
  internal
functions to purely generate a new string of points (multiplied by constants and supplied values)

It adds the asteroid ID and its unsubscribe function to an array.

It calls movement and deals with all of that (as it calls an impure function, it can be considered impure) (it calls an
    observable)

StartSpawn and StartSpawnSpaceInvaders use observables to spawn enemies while the round persists

SpaceInvaderMaker and asteroidMaker call StartSpawnSpaceInvaders and StartSpawn, respectively.  They also change the
  title of the page and stuff, so this could be impure.

The keypresses are then subscribed to, and filtered for single presses, etc.

The mainloop is made and a subscription occurs.  In here, collisions are dealt with.

*/

function asteroids() {
  // Inside this function you will use the classes and functions
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!
  // Explain which ideas you have used ideas from the lectures to
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;

  const maxX = svg.getBoundingClientRect().width; // Create constants with the maximum boundaries for an svg object
  const maxY = svg.getBoundingClientRect().height;
  const shipTag = "ship"; // The tag for the ship group lookup (Defined here because the ship is directly below)
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  const g = new Elem(svg, "g")
    .attr("transform", "translate(" + Math.ceil(maxX / 2) + " " + Math.ceil(maxY / 2)
      + ") rotate(0)") // Spawn it in the middle of the screen
    .attr("id", "MAINSHIP") // Give it a unique ID
    .attr("class", shipTag);

  // create a polygon shape for the space ship as a child of the transform group
  const ship = new Elem(svg, "polygon", g.elem)
    // .attr("points", "-15,20 15,20 0,-20")
    .attr("points", "-15,20 -5,15 5,15 15,20 0,-20") // Made the ship look cooler
    .attr("style", "fill:black;stroke:white;stroke-width:2");


  const turningSpeed = 5; // How many degrees the element can turn
  const frictionConstant = .05; // How much "drag" the ship experiences (when slowing down, etc)
  const goLeft = "a"; // the key to go left
  const goRight = "d"; // the key to go right
  const goForward = "w"; // the key to go up
  const shootButton = " "; // the key to shoot

  const timeRate = 10; // this is used to standardise the time in the Intervals.
  const maxStep = 5; // The max speed the ship can achieve
  // Below are the dimensions of the smallest possible integer asteroid
  const atomicAsteroidDim = "-6,2 -5,3 -6,5 -4,7 -2,7 -1,8 1,6 4,5 3,3 5,2 3,-1 4,-3 2,-5 -3,-4 -5,-1";
  const asteroidTag = "asteroid"; // the tag that the asteroids have (for lookup later)
  const bulletTag = "bullet"; // the tag for the bullet lookup
  const invaderTag = "invader"; // the tag for the space invaders
  const laserTag = "laser"; // the tag for the stuff the invaders shoot
  const shieldTag = "shield"; // The tag for the shield walls in space invaders
  const shieldPoints = "0,0 16,0 16,16, 0,16"; // The points for one shield block
  const shieldArray: Array<{ x: number, y: number }> = [// The array of each coordinate for all shields
    { x: 84, y: 516 }, { x: 84, y: 532 }, { x: 100, y: 500 }, { x: 100, y: 484 }, { x: 116, y: 500 },
    { x: 116, y: 484 }, { x: 132, y: 500 }, { x: 132, y: 484 }, { x: 148, y: 516 }, { x: 148, y: 532 },
    { x: 260, y: 516 }, { x: 260, y: 532 }, { x: 276, y: 500 }, { x: 276, y: 484 }, { x: 292, y: 500 },
    { x: 292, y: 484 }, { x: 308, y: 500 }, { x: 308, y: 484 }, { x: 324, y: 516 }, { x: 324, y: 532 },
    { x: 436, y: 516 }, { x: 436, y: 532 }, { x: 452, y: 500 }, { x: 452, y: 484 }, { x: 468, y: 500 },
    { x: 468, y: 484 }, { x: 484, y: 500 }, { x: 484, y: 484 }, { x: 500, y: 516 }, { x: 500, y: 532 },

  ];
  const spaceInvaderPoints =
    "-24,0 24,0 24,-16 30,-16 30,8 24,8 24,16 30,16 30,24 24,24 24,16 0,16 -24,16 -30,16 -30,24, -24,24, -24,16, -24,8"
    + " -30,8 -30,-16 -24,-16 -24,0"; // The points for a space invader (the concatenation makes it easy to read here)
  const invaderStep = 1; // how fast the invaders move
  const defaultDirection = 0; // the default direction

  const maxAsteroidSize = 7; // The maximum size an asteroid can be reduced
  const minimumAsteroid = 4; // Minimums size an asteroid can be
  const asteroidSpeedMod = 3; // The higher this is, the lower the asteroid speed
  const maxHealth = 200; // The maximum health the player can have
  const spaceLimit = 2; // Every number of rounds divisible by this, there is a space invaders round.
  const asteroidArray: Array<{ id: string, observe: () => (void) }> = []; // Store the asteroids object references

  const shieldRemovalThreshold = 0.6; // The threshold for what percentage of the screen the invaders
  // must be before the shields are destroyed
  const laserPoints = "-4,16 -4,-16 0,-16 0,8, 0,16"; // the dimensions of the lasers
  const invaderGap = 75; // The space between invaders
  const invaderRowMax = 4; // The maximum number of rows of invaders
  const laserChance = 0.001; // The probability of a laser being fired by an Invader each timeStep
  const shipInvaderPos = 0.95; // The percentage of the maximum Y that the ship stays at during space invaders
  const fullCircle = 360; // the number of degrees in a circle
  const quarterCircle = 90; // the number of degrees in a quarter circle
  const halfCircle = 180; // the number of degrees in a half circle
  const eighthCircle = 45; // The number ofdegrees in an eight of a circle
  const threeQuarterCircle = 270; // the number of degrees in a three quarter circle
  const numBase = 10; // The base used in parsing
  const invaderGapMult = 2; // Three constnts for influencing the space and speed of invaders
  const invaderGapDenom = 1.5;
  const invaderSpeedDenom = 2;
  const bulletRadius = 2; // How large the bullets are
  const laserDamage = 10; // The damage taken from a laser
  const laserScore = 50; // Points gained from shooting a laser
  const invaderScore = 200; // Points gained from destroying an invader
  const asteroidScore = 100; // Points gained from destroying an asteroid (including big ones)
  const accelerationReduce = 200; // A factor by which acceleration is reduced
  const asteroidRate = 1.2; // The factor at which asteroids increase in spawn rate
  const roundRate = 2; // The factor at which rounds increase in duration
  const milliCount = 1000; // The number of milliseconds in a second

  /*------------------- GAME VARIABLES FOR MUTATION IN HERE-----------------*/
  const gameAttributes = {

    asteroidSpawnRate: 5000, // A new asteroid every 5 seconds, THIS WILL CHANGE AS THE ROUND PROGRESSES
    health: maxHealth, // The starting health
    prevShipDir: 0, // the direction of the ship in the previous step
    prevShipDist: 0, // the distance of the ship in the previous step
    roundNumber: 1, // This will increment each round
    roundTimer: 20000, // The round lasts 20 seconds.  The round timer will increase as the rounds progress
    score: 0,    // The starting score

  };

  /*-------------------------FUNCTION DEFINITIONS-------------------------*/

  // This function takes the translation given by the 'translation' attribute and converts it to x and y coords
  // This returns an array, where index 0 is x and index 1 is y
  function translateToInt(toParse: string): number[] {

    const translateArg = toParse.split("\n")[0]; // get the string that represents the translation

    const firstSplit = translateArg.split(" "); // Initially, separate the spaces

    const xHalf = firstSplit[0].split("("); // separate the x
    const yHalf = firstSplit[1].split(")"); // separate the y

    const finalX = parseInt(xHalf[1].split(",")[0], numBase); // X is on the right side of the opening bracket,
    // then remove comma
    const finalY = parseInt(yHalf[0], numBase); // Y is on the right side of the closing bracket
    const outputArray = [finalX, finalY];

    return outputArray;
  }

  // This function takes the rotation given by the 'rotation' attribute and converts it to degrees
  // This returns a number.  the function uses hardcoded values dependent on the attributes assigned, which is not ideal
  function rotationToInt(toParse: string): number {

    const rotateArg = toParse.split(" ")[2]; // get the string that represents the rotation

    const firstSplit = rotateArg.split("("); // Initially, separate the first bracket

    const secondSplit = firstSplit[1].split(")"); // Split the second half of the string (as the rotation is to the
    // right of the parenthesis)

    const thirdSplit = secondSplit[0]; // The string after '(' and before ')' is the rotation;

    const rotationFinal = parseInt(thirdSplit, numBase); // convert the degrees into a number

    return rotationFinal;
  }

  // Removes the given asset from the document (Elem())
  const deleteAsset = (asset: Elem) => {

    const element = document.getElementById(asset.attr("id")); // Now get the element and remove it

    if (element !== null) {
      element.remove();
    }

  };
  // "Overridden" to work with elements
  const deleteAssetElement = (asset: Element) => {

    const element = document.getElementById(asset.getAttribute("id")!); // Now get the element and remove it

    if (element !== null) {
      element.remove();
    }

  };

  // This function checks whether the input number goes out the boundaries, and as such, wraps it and returns
  // the desired step.  This new step is moved so that the ship and asteroids no longer fly off the screen into oblivion

  const wrapOnEdge = (nextNum: number, maxNum: number): number => {

    if (nextNum > maxNum) {
      return nextNum - maxNum;

    } else if (nextNum < 0) {
      return maxNum - nextNum;

    } else {
      return nextNum;
    }
  };

  // The function below turns degrees into radians

  const toRads = (degrees: number): number => degrees * (Math.PI / halfCircle);

  // This function takes a direction (in degrees) and a distance and returns the distance on the x and y axis that that
  // vector translates to
  const calculateXYStep = (direction: number, distance: number): number[] => {

    const returnX = Math.abs((distance * Math.sin(toRads(direction)))) * (direction > halfCircle ? -1 : 1);
    // Negative motionif past the x axis, else positive (left vs right)
    const returnY = Math.abs((distance * Math.cos(toRads(direction)))) * (direction > threeQuarterCircle || direction
      < quarterCircle ? -1 : 1);
    // Negative motion if above the y axis, else positive (down vs up)

    return [Math.ceil(returnX), Math.ceil(returnY)];  // Make them whole numbers for consistency
  };

  /*Implements modulus the way python does:
        e.g. -10 % degreeLimit
        JavaScript:  -10
        Python:      350
    This is more useful, so I'm implementing it :)
  */
  const mod = (inputNumber: number, modulus: number): number => {
    const JavaScriptMod = inputNumber % modulus; // Will be valid if the input number is positive, otherwise not

    return inputNumber >= 0 ? JavaScriptMod : modulus + JavaScriptMod; // Either give the JS mod as is, or add on the
    // negative number and find its compliment
  };

  // Detect collision between a two bounding rectanglea
  const collisionDetection = (rectOne: ClientRect, rectTwo: ClientRect): boolean => {
    // const rectOne = firstElem.getBoundingClientRect();
    // const rectTwo = secondElem.getBoundingClientRect();

    if (rectTwo.left < rectOne.right && rectTwo.right > rectOne.left && rectTwo.top < rectOne.bottom && rectTwo.bottom
      > rectOne.top) {
      return true; // its in contacted
    }

    return false;

  };

  // Moves an object foreward, based on their direction and transform given
  // Currently impure as it edits asset directly (but so does attr, so this is just wrapping an impure function)
  const movement = (asset: Elem, distance: number, releaseKey?: string) => {

    const moveObserve = Observable.interval(timeRate).takeUntil(keyUp.filter((event) => !event.repeat)
      .map(({ key }) => ({ pressed: key })).filter(({ pressed }) => pressed.toLowerCase() === releaseKey))
      .subscribe(() => {

        // Prevents the player moving forward during space invaders!
        const nextXY = calculateXYStep(rotationToInt(asset.attr("transform")), distance); // An array, index 0 has the
        // next x offset and index 1 has the next y offset.
        const translateXY = translateToInt(asset.attr("transform")); // An array, index 0 has the current x and index 1
        // has the current y.

        asset.attr("transform", "translate(" +
          wrapOnEdge((translateXY[0] + nextXY[0]), maxX) + // Gets the old X and adds to it, making sure it doesn't go
          // over the edge
          " " + wrapOnEdge((translateXY[1] + // Gets the old Y and adds to it, making sure it doesn't go over the edge.
            nextXY[1]), maxY)
          +
          ") rotate(" +
          rotationToInt(asset.attr("transform")) + // Get the current rotation and pump it back in, without changing it
          // (to maintain the value of transform)
          ")");

      },

      );

    return moveObserve;

  };

  // Moves the bullets and removes them when they're off the page
  // This is impure, as it alters the value of the asset, however, that's the primary function of this and attr is
  // impure anyway because it's calling the Element's funcitons
  const bulletMovement = (asset: Elem, distance: number) => {

    Observable.interval(timeRate).takeUntil(Observable.interval(timeRate * (Math.max(maxX, maxY)))) // The interval here
      // guarantees that the bullet will be offscreen die to the timeRate being related to the bullet speed AND this
      // calculation
      .subscribe(() => {

        const nextXY = calculateXYStep(parseInt(asset.attr("rotation"), numBase), distance); // An array, index 0 has
        // the next x offset and index 1 has the next y offset.

        asset.attr("cx", parseInt(asset.attr("cx"), numBase) + nextXY[0]); // Gets the old X and adds to it
        asset.attr("cy", parseInt(asset.attr("cy"), numBase) + nextXY[1]); // Gets the old Y and adds to it

        if (!(parseInt(asset.attr("cx"), numBase) < maxX && parseInt(asset.attr("cy"), numBase) < maxY
          && parseInt(asset.attr("cx"), numBase) > 0 && parseInt(asset.attr("cy"), numBase) > 0)) {
          // The bullet is not offscreen and thus can move

          deleteAsset(asset); // remove the asset once it leaves the screen

        }

      });

  };

  // Turns an object in a direction (negative/positive -- left/right)
  // Currently impure as it edits asset directly (it contains an impure function attr)

  const turn = (asset: Elem, positive: boolean, releaseKey: string) => {

    // const tuny = Observable.interval

    Observable.interval(timeRate)
      .takeUntil(keyUp.map(({ key }) => ({ upPressed: key })).filter(({ upPressed }) =>
        (upPressed.toLowerCase() === releaseKey.toLowerCase())))
      .subscribe(() => {
        const translateXY = translateToInt(asset.attr("transform")); // An array, index 0 has the current x and index 1
        // has the current y.
        if (gameAttributes.roundNumber % spaceLimit !== 0) { // If in asteroids still, do this

          asset.attr("transform", "translate(" + translateXY[0] + " " + translateXY[1] + ") rotate("
            + mod((rotationToInt(g.attr("transform")) +
              (turningSpeed * (positive ? 1 : -1))) // This little ternary will turn left or right depending on the
              // argument
              , fullCircle) + ")");

        } else { // If in space invaders
          // Ensure the next step is not off the screen (no wrapping in space invaders)
          if ((translateXY[0] + (maxStep * (positive ? 1 : -1))) > 0 && (translateXY[0]
            + (maxStep * (positive ? 1 : -1))) < maxX) {
            asset.attr("transform", "translate(" + (translateXY[0] + ((maxStep / invaderSpeedDenom)
              // The step is halved here to be more true to space invaders
              * (positive ? 1 : -1))) + " " + (maxY * shipInvaderPos) + ") rotate(" + rotationToInt(g.attr("transform"))
              + ")"); // Keep the ship at the same Y value
          }
        }

      });

  };

  /*----------------------------GAME LOGIC-------------------------------------*/

  // GameLoop, variable mapping inspiration taken from
  // https://github.com/harsilspatel/pong-breakout/blob/master/src/breakout.ts (As provided by the lecturer)
  // The variables are being mapped to an observable so it can be filtered when a TakeUntil occurs.
  // This means the game can end when the player runs out of health

  const mainLoop = Observable.interval(timeRate).map(() =>
    ({ pLives: gameAttributes.health, pScore: gameAttributes.score })); // subscribe to this to be able to access main
  // values

  // A function to keep making asteroids
  const startSpawn = (inputSize: number, coordString: string, direction = Math.ceil(Math.random() * fullCircle)) => {
    // the coordString is in the format "x y"

    const uniqueId = (new Date().getTime()).toString() + coordString; // Produce a unique ID for lookup later

    // A function to make the points, by taking a base string and modifying it
    const pointMaker = (points: string, factor: number) => {
      const pointArray = points.split(" "); // create an array of points

      const newArray = pointArray.map((point) => {
        const pointXY = point.split(","); // Get the x and y values separately, then modify them
        const newX = parseInt(pointXY[0], numBase) * factor;
        const newY = parseInt(pointXY[1], numBase) * factor;
        return newX + "," + newY; // Return the new x and y in the same format
      });

      // Turn the array back into a string (basically, flatten it, with some more formatting)
      const toCoordString = (array: string[]): string => {

        return array.length > 0 ? array[0] + " " + toCoordString(array.slice(1, array.length)) : ""; // return a new
        // call with the rest of the list OR empty because we're done

      };

      return toCoordString(newArray);

    };

    // Now get the points:
    const spawnPoint = "translate(" + coordString + ") rotation(" + direction + ")";
    const createdAsteroid = new Elem(svg, "polygon") // create a new asteroid and colour it

      .attr("transform", spawnPoint) // The spawn X and Y and random rotation of the asteroid

      .attr("id", uniqueId)
      .attr("size", inputSize)
      .attr("class", asteroidTag)
      .attr("style", "fill:black;stroke:white;stroke-width:2");

    // Give it a random direction, and a random X and Y position on the edge of the game window

    const movementObservable = movement(createdAsteroid, 1 + Math.ceil(maxStep / (inputSize ** asteroidSpeedMod)));
    // Set the movement, and make the speed a function of the size and constant maxStep (adding one in case it hits 0)

    asteroidArray.push({ id: uniqueId, observe: movementObservable });

    // Okay, so for a split second the asteroid appears at 0,0, then jumps to the right position.
    // So to solve this, I didn't give it any points (effectively making it invisible) until timeRate milliseconds pass
    // This fixes the problem using Functional Reactive Programming!

    Observable.interval(timeRate).takeUntil(Observable.interval(timeRate)).subscribe(() => (undefined), () => {
      createdAsteroid.attr("points", pointMaker(atomicAsteroidDim, inputSize)); // remove that last space from the
      // points and make it
    });

  };

  const startSpawnSpaceInvaders = () => {

    shieldArray.forEach(({ x, y }) => {// Go through and place each shield
      new Elem(svg, "polygon").attr("style", "fill:lime;stroke:lime;stroke-width:2").attr("transform", "translate("
        + x + " " + y + ")").attr("class", shieldTag).attr("points", shieldPoints).attr("id", new Date().getTime()
          + x + y); // Create the shields at the position, with a unique ID
    });

    const numInvaders = Math.floor(maxX / (invaderGap * invaderGapMult)); // The number of invaders on the screen
    // (half the screen)

    const functionalLoop = (currentI: number, currentJ: number) => {
      if (currentJ <= invaderRowMax) {
        if (currentI <= numInvaders) {
          new Elem(svg, "polygon") // create a new asteroid and colour it
            .attr("transform", "translate(" + currentI * invaderGap + " " + Math.ceil(invaderGap / invaderGapDenom)
              * currentJ
              + ") rotate(" + defaultDirection + ")")
            .attr("points", spaceInvaderPoints) // The shape of the space invader
            .attr("class", invaderTag)
            .attr("id", (new Date().getTime()).toString() + currentJ + currentI)// A unique ID for each invader alive
            .attr("style", "fill:white;stroke:black;stroke-width:2");
          functionalLoop(currentI + 1, currentJ); // gotta keep going
        } else {
          // I has elapsed, reset, add one to J
          functionalLoop(1, currentJ + 1); // gotta keep going
        }
      }

    };

    functionalLoop(1, 1); // call the loop, starting at one

    const invade = (positive: boolean) => {

      mainLoop.takeUntil(mainLoop.filter(() => {

        const allInvaders = document.querySelectorAll("." + invaderTag); // Get all the invaders

        // let retVal = false //Bad and mutable, but contained within the function
        return ((Array.from(allInvaders)).filter((element: Element) => {

          const currentXY = translateToInt(element.getAttribute("transform")!);

          return ((currentXY[0] > (maxX - invaderGap / invaderGapMult)) || (currentXY[0] < invaderGap /
            invaderGapMult));  // Check if the invaders are at the right or left

        },

        ).length > 0) || (document.querySelectorAll("." + invaderTag).length < 1); // If there is at least one invalid
        // invader OR no invaders, return true, otherwise false

        // if () { //Also unsubscribe if there are no more invaders
        //   retVal = true;
        // }

        // return retVal; //If we made it to here then none of the invaders are at the right/left so we may proceed
      })).subscribe(() => {

        const allInvaders = document.querySelectorAll("." + invaderTag); // Get all the invaders
        allInvaders.forEach((element: Element) => {

          const currentXY = translateToInt(element.getAttribute("transform")!);

          // impure as it alters the values
          element.setAttribute("transform", "translate(" + (currentXY[0] + invaderStep * (positive ? 1 : -1)) + " "
            + currentXY[1] + ") rotate(" + defaultDirection + ")"); // Move it one step along at the same y

          if (Math.random() < laserChance) {

            const createdShot = new Elem(svg, "polygon") // create a new circle and colour it
              .attr("style", "fill:white;stroke:white;stroke-width:2")
              .attr("class", laserTag)
              .attr("id", new Date().getTime())
              .attr("transform", "translate(" + currentXY[0] + " " + currentXY[1] + ") rotate(" + defaultDirection
                + ")")// Point  from the invader and set the bullet to the invader position
              .attr("points", laserPoints); // Make the laser

            const shotObservable = Observable.interval(timeRate);
            shotObservable.takeUntil(shotObservable.filter(() => (translateToInt(createdShot.attr("transform"))[1]
              > (maxY * 1.2)))).subscribe( // Make sure it stops at a bit off screen
                () => {
                  const xY = translateToInt(createdShot.attr("transform"));
                  // impure as it alters the values
                  createdShot.attr("transform", "translate(" + xY[0] + " " + (xY[1] + invaderStep) + ") rotate("
                    + defaultDirection + ")");

                });

          }

        });

      }, () => {

        const allInvaders = document.querySelectorAll("." + invaderTag); // Get all the invaders
        allInvaders.forEach((element: Element) => {

          const currentXY = translateToInt(element.getAttribute("transform")!);
          const nextStop = positive ? (currentXY[0] - invaderGap) : (currentXY[0] + invaderGap);
          // impure as it alters the values
          element.setAttribute("transform", "translate(" + nextStop + " " + (currentXY[1] + Math.ceil(invaderGap / 1.5))
            + ") rotate(" + defaultDirection + ")"); // Move back to the start and down one row

          if (currentXY[1] > (maxY * shipInvaderPos)) { // Check if the invaders are at the level of the ship
            gameAttributes.health = 0; // Destroy the player ship if the invaders hit the bottom

          }
          if (currentXY[1] > (maxY * shieldRemovalThreshold)) { // Check if the invaders are at the bottom
            document.querySelectorAll("." + shieldTag)!.forEach((toDeleteElement) =>
              deleteAssetElement(toDeleteElement)); // Delete all the remaining shields once a certian point is hit
            // (as per classic space invaders)

          }

        },

        );

        if (gameAttributes.health > 0 && (document.querySelectorAll("." + invaderTag).length > 0)) { // If the player is
          // still alive, and there are invaders, continue the invasion
          invade(!positive); // Renew the invasion in the other direction

        } else {// Otherwise, go back to asteroids

          gameAttributes.roundNumber += 1;
          document.getElementById("pageTitle")!.innerHTML = "GET READY!"; // Display the ready message
          document.querySelectorAll("." + shieldTag)!.forEach((element) => deleteAssetElement(element)); // Delete all
          // the remaining shields for asteroids to commence
          document.querySelectorAll("." + laserTag)!.forEach((element) => deleteAssetElement(element)); // Delete all
          // the remaining lasers for asteroids to commence

          asteroidMaker();
        }

      });

    };
    invade(true);

  };

  // Generate the asteroids outside the mainloop (or they'll appear every timeStep)

  // Space Invaders Observables and Screen Setup
  const spaceInvaderMaker = () => {

    if (gameAttributes.health > 0) { // Don't do any of this if the player is dead
      // Increment the round number and keep playing the normal game
      gameAttributes.health = maxHealth; // Reset the maximum health
      document.getElementById("pageTitle")!.innerHTML = "ROUND " + gameAttributes.roundNumber; // Display the round
      // number
      document.getElementById("roundInfo")!.innerHTML = "Space Invaders!";
      document.getElementById("gamename")!.innerHTML = "Space Invaders";
      g.attr("transform", "translate(" + Math.ceil(maxX / invaderGapMult) + " " + Math.ceil(maxY * shipInvaderPos)
        + ") rotate(0)"); // Put it in the middle x of the screen, at the bottom , facing up
      startSpawnSpaceInvaders();
    }

  };

  // Asteroid Round Observable and screen setup

  // const asteroider = Observable.interval(asteroidSpawnRate).takeUntil(Observable.interval(roundTimer))
  // This method will keep being called until the spaceLimit is hit
  const asteroidMaker = () => Observable.interval(gameAttributes.asteroidSpawnRate).takeUntil(Observable
    .interval(gameAttributes.roundTimer)).subscribe(() => {
      if (gameAttributes.health > 0) {
        document.getElementById("gamename")!.innerHTML = "Asteroids";
        document.getElementById("pageTitle")!.innerHTML = "ROUND " + gameAttributes.roundNumber; // Display the round
        // number
        document.getElementById("roundInfo")!.innerHTML = "This round will last " + Math.floor(gameAttributes.roundTimer
          / milliCount) + " seconds, with " + Math.floor(gameAttributes.roundTimer / gameAttributes.asteroidSpawnRate)
          + " large asteroids."; // converts milliseconds to seconds to display info for the round
        startSpawn(maxAsteroidSize, (Math.random() > 0.5 // 50-50 chance
          ?
          ("0 " + Math.ceil((Math.random() * maxY)))
          :
          ((Math.ceil(Math.random() * maxX)) + " 0")));
      }
    }, () => {

      asteroidArray.length = 0; // Clear the asteroid array for the next round
      document.querySelectorAll("." + asteroidTag)!.forEach((element) => deleteAssetElement(element)); // Delete all
      // remaining asteroids
      document.querySelectorAll("." + bulletTag)!.forEach((element) => deleteAssetElement(element)); // Delete all
      // remaining bullets
      if (gameAttributes.health > 0) {
        gameAttributes.roundNumber += 1;
        document.getElementById("pageTitle")!.innerHTML = "GET READY!"; // Display the get ready text
        if (gameAttributes.roundNumber % spaceLimit === 0) { // If we've hit the limit of the round number, we start
          // space invaders.  Otherwise, NEXT ROUND!

          gameAttributes.health = maxHealth; // Reset the health
          spaceInvaderMaker();
        } else {
          gameAttributes.roundTimer *= roundRate; // Double the time for the next round
          gameAttributes.asteroidSpawnRate *= asteroidRate; // Slightly increase how fast the asteroids spawn
          gameAttributes.health = maxHealth; // Reset the maximum health
          asteroidMaker();
        }
      }

    }); // Generate  asteroids.

  asteroidMaker();

  // When a key is released
  const keyUp = Observable.fromEvent<KeyboardEvent>(document, "keyup");

  // Key press down event for inputs
  const keyDown = Observable.fromEvent<KeyboardEvent>(document, "keydown").filter((event) => !event.repeat
    && gameAttributes.health > 0).map(({ key }) => ({ pressed: key })); // Get the key without multiple presses,
  // AND stop if health is too low

  // This handles if W is pressed (forward)
  keyDown.filter(({ pressed }) => {

    return pressed.toLowerCase() === goForward; // Makes it lowercase just in case shift or caps is pressed
  }).subscribe(() => {

    if (gameAttributes.roundNumber % spaceLimit !== 0) { // Don't let it go over the round limit, otherwise use space
      // invader controls
      // use observable intervals to allow for accellaration and movement
      // Every second keyup W isn't there, for example , go one unit

      const startTime = (new Date()).getTime(); // This is to see how long the ship has been accelerating for
      const accelerator = () => {

        Observable.interval(timeRate)
          .takeUntil(keyUp.filter((event) => !event.repeat).map(({ key }) => ({ pressed: key })).filter(({ pressed }) =>
            pressed.toLowerCase() === goForward))
          .subscribe(() => {
            if (gameAttributes.roundNumber % spaceLimit !== 0) { // If playing asteroids:
              // If the friction is less than the leftover "momentum", reduce the distance by the friction.
              // Otherwise make it 0
              const derivedStep = Math.ceil((((new Date().getTime()) - startTime) / (accelerationReduce)));
              // Calculate the next step to take

              const currentDir = rotationToInt(g.attr("transform"));
              const nextXY = calculateXYStep(rotationToInt(g.attr("transform")),
                derivedStep > maxStep
                  ? maxStep
                  :
                  derivedStep);
              const translateXY = translateToInt(g.attr("transform")); // An array, index 0 has the current x and index
              // 1 has the current y.

              gameAttributes.prevShipDist = frictionConstant < gameAttributes.prevShipDist ? gameAttributes.prevShipDist
                - frictionConstant : 0; // If the friction is less than the leftover "momentum", reduce the distance by
              // the friction.  Otherwise make it 0
              const lastXY = calculateXYStep(gameAttributes.prevShipDir, gameAttributes.prevShipDist); // An array,
              // index 0 has the next x offset and index 1 has the next y offset.

              g.attr("transform", "translate(" + wrapOnEdge(translateXY[0] + nextXY[0] + lastXY[0], maxX) + " "
                + wrapOnEdge(translateXY[1] + nextXY[1] + lastXY[1], maxY) + ") rotate("
                + rotationToInt(g.attr("transform")) + ")");

              gameAttributes.prevShipDist = derivedStep > maxStep ? maxStep : derivedStep;
              gameAttributes.prevShipDir = currentDir;
            }
          },
            () => {
              Observable.interval(timeRate).takeUntil(mainLoop.filter(() => gameAttributes.prevShipDist === 0
                || gameAttributes.health < 0)).takeUntil( // Deccelerate

                  keyDown.filter(({ pressed }) =>

                    pressed.toLowerCase() === goForward, // Makes it lowercase just in case shift or caps is pressed

                  )).subscribe(() => { // Keep going until the player dies, the previous speed hits 0, or W is
                    // pressed again
                    gameAttributes.prevShipDist = frictionConstant < gameAttributes.prevShipDist
                      ?
                      gameAttributes.prevShipDist - frictionConstant
                      :
                      0; // If the friction is less than the leftover "momentum", reduce the distance by the friction.
                    // Otherwise make it 0
                    const nextXY = calculateXYStep(gameAttributes.prevShipDir, gameAttributes.prevShipDist);
                    // An array, index 0 has the next x offset and index 1 has the next y offset.
                    const translateXY = translateToInt(g.attr("transform")); // An array, index 0 has the current x and
                    // index 1 has the current y.
                    g.attr("transform", "translate(" + wrapOnEdge(translateXY[0] + nextXY[0], maxX) + " "
                      + wrapOnEdge(translateXY[1] + nextXY[1], maxY) + ") rotate(" + rotationToInt(g.attr("transform"))
                      + ")");

                  }, () => { gameAttributes.prevShipDir = 0; gameAttributes.prevShipDist = 0; }); // Clear the last
              // direction and distance to reset the acceleration for next time
            });

      };

      accelerator();  // Activate the acceleration timer
    }

  });

  // This handles if D is pressed (right)
  keyDown.filter(({ pressed }) => {
    return pressed.toLowerCase() === goRight; // Makes it lowercase just in case shift or caps is pressed
  }).subscribe(({ pressed }) => {

    turn(g, true, pressed);

  });

  // This handles if A is pressed (left)
  keyDown.filter(({ pressed }) => {

    return pressed.toLowerCase() === goLeft; // Makes it lowercase just in case shift or caps is pressed
  }).subscribe(({ pressed }) => {

    turn(g, false, pressed);

  });

  mainLoop.takeUntil(mainLoop.filter(() => gameAttributes.health <= 0)).subscribe(() => {

    // First, update the score and health displayed to the user
    document.getElementById("score")!.innerHTML = "Score: " + gameAttributes.score;
    document.getElementById("health")!.innerHTML = "Health: " + gameAttributes.health;

    // Check the collision with bullets and shields (not in the main game)

    document.querySelectorAll("." + shieldTag).forEach((shield) => { // Check for collisions with the shields
      document.querySelectorAll("." + bulletTag).forEach((shieldBullet) => { // Check for collisions with the bullets
        if (collisionDetection(shield.getBoundingClientRect(), shieldBullet.getBoundingClientRect())) {
          deleteAssetElement(shield); // Destroy both of them, as per classic space invaders
          deleteAssetElement(shieldBullet);
        }
      });
    });

    // Then, check the collisions between the asteroids and the bullets and the asteroids and the ship

    // const allObj = document.querySelectorAll('.' + asteroidTag);

    asteroidArray.forEach(({ id, observe }) => {

      const element = document.getElementById(id);
      if (element !== null) {
        if (collisionDetection(document.querySelectorAll(".ship")[0].getBoundingClientRect(),
          element.getBoundingClientRect())) {

          gameAttributes.health -= 1;
        }

        const allBullets = document.querySelectorAll("." + bulletTag); // Bullet collisions
        allBullets.forEach((bulletTwo: Element) => {

          if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) {

            deleteAssetElement(bulletTwo);

            // Get the size, and if it's larger than 1 (the absolute minimum size for integer division), split it

            observe(); // call the unsubscribe function from the observable given (to avoid that memory leak)
            const sizeLimit = parseInt(element.getAttribute("size")!, numBase); // Get the  size of the asteroids to use
            // as the limit
            if (sizeLimit > minimumAsteroid) { // stop there from being too small of an asteroid
              const parentXY = translateToInt(element.getAttribute("transform")!);
              startSpawn(sizeLimit - 1, (parentXY[0] + 1) + " " + parentXY[1], (rotationToInt(element.getAttribute(
                "transform")!) + quarterCircle + Math.ceil(eighthCircle / 2 * Math.random())) % fullCircle);
              // Spawn two asteroids because that's fun
              startSpawn(sizeLimit - 1, (parentXY[0] - 1) + " " + parentXY[1], (rotationToInt(element.getAttribute(
                "transform")!) - quarterCircle - Math.ceil(eighthCircle * Math.random())) % fullCircle);
              // Slightly spaced apart so their unique IDs are different
              // Direction is randomised in such a way that they won't go in the same direction but will still be in a
              // different place each time

            }

            deleteAssetElement(element); // Delete the asteroid/meteor
            gameAttributes.score += asteroidScore;

          }

        });
      }
    });

    document.querySelectorAll("." + invaderTag).forEach((element: Element) => {
      const allBullets = document.querySelectorAll("." + bulletTag); // Bullet collisions
      allBullets.forEach((bulletTwo: Element) => {

        if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) {

          deleteAssetElement(bulletTwo);

          deleteAssetElement(element); // Delete the invader

          gameAttributes.score += invaderScore;

        }

      });

    },

    );

    document.querySelectorAll("." + laserTag).forEach((element: Element) => {
      const allBullets = document.querySelectorAll("." + bulletTag); // Bullet collisions
      allBullets.forEach((bulletTwo: Element) => {

        if (collisionDetection(bulletTwo.getBoundingClientRect(), element.getBoundingClientRect())) { // Destroy the
          // bullet and laser if they collide

          deleteAssetElement(bulletTwo);

          deleteAssetElement(element);

          gameAttributes.score += laserScore;

        }

      });

      if (collisionDetection(document.querySelectorAll(".ship")[0].getBoundingClientRect(),
        element.getBoundingClientRect())) { // Hurt the player on hit
        gameAttributes.health -= laserDamage;
        deleteAssetElement(element); // Delete the invader
      }

      document.querySelectorAll("." + shieldTag).forEach((shield: Element) => {

        if (collisionDetection(shield.getBoundingClientRect(), element.getBoundingClientRect())) { // Destroy the shield
          // and laser if they collide
          deleteAssetElement(shield);
          deleteAssetElement(element);

        }
      });
    },
    );

  }, () => {

    document.getElementById("pageTitle")!.innerHTML = "GAME OVER";
    document.getElementById("health")!.innerHTML = "Health: 0"; // Set the health to 0, as it will be 1 (as when the
    // observable ends, it leaves before 0 is changed)
    document.querySelectorAll("*").forEach((element: Element) => {
      if (element.getAttribute("id") !== "pageTitle" && element.getAttribute("id") !== "health"
        && element.getAttribute("id") !== "score" && element.getAttribute("id") !== "gamename"
        && element.getAttribute("id") !== "roundInfo" && element.getAttribute("id") !== "canvas") {
        // Only delete the asset if it isn't one of the text descriptions we made
        deleteAssetElement(element);

      }
    });

  });

  // This handles if SPACE is pressed (fire)
  keyDown.filter(({ pressed }) => (pressed === shootButton)).subscribe(({ pressed }) => {

    const uniqueId = new Date().getTime();
    const shipXY = translateToInt(g.attr("transform"));
    const shipRotation = rotationToInt(g.attr("transform"));
    const createdShot = new Elem(svg, "circle") // create a new circle and colour it
      .attr("style", "fill:black;stroke:white;stroke-width:2")
      .attr("id", uniqueId)
      .attr("cx", shipXY[0])// Create it at the ship
      .attr("cy", shipXY[1])
      .attr("r", bulletRadius)
      .attr("class", bulletTag)
      .attr("rotation", shipRotation);

    bulletMovement(createdShot, maxStep * maxStep); // Set the movement, making the bullets faster than the ship

  });

}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    asteroids();
  };
}
