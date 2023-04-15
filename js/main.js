let tunnel;
let car;
let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};
let followCamera;
let score = 0;
async function startGame() {
  canvas = document.querySelector("#myCanvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = await createScene();
  var sound = new BABYLON.Sound("music", "assets/music/DRIVE.mp3", scene, null, {
    loop: true,
    autoplay: true
});

  modifySettings();
  // run the render loop
  // render : resituer

  engine.runRenderLoop(() => {
    let deltaTime = engine.getDeltaTime(); 
    car.move();
    sound.loop = true;
    scene.render();
  });
}

//create a scene
async function createScene() {
  scene = new BABYLON.Scene(engine);
  createLight(scene);
  //skybox2(scene);
  createGroundFromGLB(scene);
  tunnel = await createGroundFromGLB(scene);
  car = await createCar(scene);
  console.log(car);
  if (car) {
    followCamera = createFollowCamera(scene, car);
    scene.activeCamera = followCamera;
    
  }


  return scene;
}
//sky from image
function skybox2(scene) {
  var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
    "assets/images/cubemap/",
    scene
  );
  skyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;
}

function createGroundFromGLB(scene) {
  return BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "road.glb", scene).then((result) => {
    let ground = result.meshes[0];
    ground.position = new BABYLON.Vector3(0, 0, 0);
    ground.scaling = new BABYLON.Vector3(4, 4, 4);
    ground.rotation = new BABYLON.Vector3(0, 0, 0);
    ground.checkCollisions = true;
    ground.receiveShadows = true;

    return ground;
  });
}

// Call the function to create the tunnel mesh


//create a follow camera
function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("carFollowCamera", target.position, scene, target);

    camera.radius = 30; // how far from the object to follow
	camera.heightOffset = 8; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

    return camera;
}
// create a light
//up on the sky and light up the scene / from above
function createLight(scene) {
  const light = new BABYLON.HemisphericLight(
    "HemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
}
let zMovement = 5;
//creating a car
async function createCar(scene) {
  let car = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "assets/models/",
    "old_rusty_car.glb",
    scene
  );




  if (car.meshes.length > 0) {
    
    car.meshes[0].position = new BABYLON.Vector3(0, 15,750);
    car.meshes[0].scaling = new BABYLON.Vector3(0.015, 0.015, 0.015);
    car.meshes[0].frontVector = new BABYLON.Vector3(0, 0, 1);
    car.meshes[0].speed = 0.8;
     car.meshes[0].move = () => { 
      let carActionManager = new BABYLON.ActionManager(scene);

      // register an action to be triggered when the car collides with a fish
      carActionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          {
            trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
            parameter: { mesh: car.meshes[0], usePreciseIntersection: true }
          },
        )
      ); 
    
      let yMovement = 0;
      if (car.meshes[0].position.y > 2) {
        zMovement = 0;
        yMovement = -2;
      }

      if (inputStates.up) {
        car.meshes[0].moveWithCollisions(new BABYLON.Vector3(0, 0, -1 * car.meshes[0].speed));
      } 
      if (inputStates.down) {
        car.meshes[0].moveWithCollisions(new BABYLON.Vector3(0, 0, 1 * car.meshes[0].speed));
      }
      if (inputStates.left) {
        car.meshes[0].moveWithCollisions(new BABYLON.Vector3(1 * car.meshes[0].speed, 0, 0));
      }
      if (inputStates.right) {
        car.meshes[0].moveWithCollisions(new BABYLON.Vector3(-1 * car.meshes[0].speed, 0, 0));
      }
    }
    return car.meshes[0];
  } else {
    console.error("No meshes found in car.glb");
    return null;
  }
}


function modifySettings() {
  // as soon as we click on the game window, the mouse pointer is "locked"
  // you will have to press ESC to unlock it
  scene.onPointerDown = () => {
    if (!scene.alreadyLocked) {
      console.log("requesting pointer lock");
      canvas.requestPointerLock();
    } else {
      console.log("Pointer already locked");
    }
  };

  document.addEventListener("pointerlockchange", () => {
    let element = document.pointerLockElement || null;
    if (element) {
      // lets create a custom attribute
      scene.alreadyLocked = true;
    } else {
      scene.alreadyLocked = false;
    }
  });

  // key listeners for the car.meshes[0]
  inputStates.left = false;
  inputStates.right = false;
  inputStates.up = false;
  inputStates.down = false;
  inputStates.space = false;

  //add the listener to the main, window object, and update the states
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        inputStates.left = true;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        inputStates.up = true;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        inputStates.right = true;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        inputStates.down = true;
      } else if (event.key === " ") {
        inputStates.space = true;
      }
    },
    false
  );

  //if the key will be released, change the states object
  window.addEventListener(
    "keyup",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        inputStates.left = false;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        inputStates.up = false;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        inputStates.right = false;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        inputStates.down = false;
      } else if (event.key === " ") {
        inputStates.space = false;
      }
    },
    false
  );
}

window.onload = startGame;
