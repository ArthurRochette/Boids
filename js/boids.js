import * as THREE from './three.module.js';

const PI = 3.14159265359;
const RAD = 180 / PI;
const BOIDS_NBR = 2;
const MAX_SPEED = 0.75;
const ROTATION_SPEED = 5;
const GROUP_AREA = 300; // area around each boid where we check alignement


//CLASS
class Boid extends THREE.Mesh {
    static counter = 0;

    constructor() {
        //basic look
        const boidmaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        const boidgeometry = new THREE.ConeGeometry(1, 3, 3);
        super(boidgeometry, boidmaterial);

        //let's add with wirefram
        const wireframeGeo = new THREE.EdgesGeometry(boidgeometry);
        const wireframeMat = new THREE.LineBasicMaterial({color: 0xffffff})
        const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
        this.add(wireframe)


        Boid.counter++;
        this._id = Boid.counter;
        //renegats statut is activated when a boid goes out of area

        this.velocity = new THREE.Vector3(1, 1, 1);
        this._free = false;
    }


}

//DEBUG INIT
let renegatsLabel = document.getElementById("renegats");


//Visual
//window
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
    0.1, 1000);
const renderer = new THREE.WebGLRenderer();
camera.position.z = 75;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


//compute bounds of the seen world
let vFOV = THREE.MathUtils.degToRad(camera.fov);
let height = 2 * Math.tan(vFOV / 2) * camera.position.z;
let width = height * camera.aspect;


let boids = [];

for (let i = 0; i < BOIDS_NBR; i++) {
    boids.push(new Boid());
    boids[i].position.x = boids[i]._id * 10;
    scene.add(boids[i]);
}


function randomRot() {
    //randomiz rotation
    for (let i = 0; i < BOIDS_NBR; i++) {
        //boids[i].rotation.x += Math.random() * (ROTATION_SPEED / 25) - (ROTATION_SPEED / 25) / 2;
        //boids[i].rotation.y += Math.random() * (ROTATION_SPEED / 25) - (ROTATION_SPEED / 25) / 2;
        boids[i].rotation.z += Math.random() * (ROTATION_SPEED / 25) - (ROTATION_SPEED / 25) / 2;
    }
}

function Move(){

    for (let i = 0; i < BOIDS_NBR; i++) {
        boids[i].position.x += Math.sin(-boids[i].rotation.z) *  (MAX_SPEED);//random btw 0 and 1
        boids[i].position.y += Math.cos(boids[i].rotation.z) *  (MAX_SPEED);
        //boids[i].position.z += Math.cos(boids[i].rotation.x) * Math.random() * (MAX_SPEED/10);//random btw 0 and 1

    }
}

function align() {
    //boids need to sync there alignement with other close boid
    //fixme pb quand un seul boid
    let indexNeighBorArray = [];
    if (BOIDS_NBR === 1) return;
    loop:
        for (let ii = 0; ii < BOIDS_NBR; ii++) {//pour chaque boid
            if(!boids[ii]._free) continue;
            for (let i = 0; i < BOIDS_NBR; i++) {//on trouve les voisins
                if (boids[ii] === boids[i]) continue;//lui meme ne peut etre voisin
                let distance = Math.sqrt(Math.pow(boids[i].position.x - boids[ii].position.x, 2)
                    + Math.pow(boids[i].position.y - boids[ii].position.y, 2)
                    + Math.pow(boids[i].position.z - boids[ii].position.z, 2));
                console.log(distance)
                if (distance > GROUP_AREA) continue loop;//fixme a partir d'un moment ne sort que pas la
                indexNeighBorArray.push(i);

            }
            let averageAngle = new THREE.Euler;
            console.log(indexNeighBorArray.length)
            for (let i = 0; i < indexNeighBorArray.length; i++) {
                averageAngle.x += (boids[indexNeighBorArray[i]].rotation.x);
                averageAngle.y += (boids[indexNeighBorArray[i]].rotation.y);
                averageAngle.z += (boids[indexNeighBorArray[i]].rotation.z);
            }
            averageAngle.x /= indexNeighBorArray.length ;
            averageAngle.y /= indexNeighBorArray.length ;
            averageAngle.z /= indexNeighBorArray.length ;
            console.log("GROUPPP")
            //debug
            averageAngle.y = 0;
            averageAngle.x = 0;

            boids[ii].rotation.z =  (averageAngle.z )



            indexNeighBorArray = [];
        }


}//todo ajouter de quoi les rapprocher


function repulse() {

}

function checkBounds() {
    for (let i = 0; i < BOIDS_NBR; i++) {

        let pos = boids[i].position;
        let rota = boids[i].rotation;
        let renegats = false;
        if (pos.x > width / 2 || pos.x < -(width / 2)) {
            if (boids[i]._free) rota.z += PI ;
            renegats = true;
            boids[i]._free = false;
        }
        if (pos.y > height / 2 || pos.y < -(height / 2)) {
            if (boids[i]._free) rota.z += PI ;
            renegats = true;
            boids[i]._free = false;
        }

        if (renegats === false) boids[i]._free = true;
        if (!renegats && !boids[i]._free) boids[i]._free = true;

        //if (pos.z > camera.position.z- (camera.position.z /2) || pos.z < -(camera.position.z)) rota.x += 0.1;

    }
}


//infinite loop
function animate() {
    requestAnimationFrame(animate);
    randomRot();//that's it

    repulse();//repulse each boids to avoid collision
    checkBounds();
    align();//align each boids with his neighbors fixme ne marche pas aucune difference sans
    Move();//that's it

    renderer.render(scene, camera);
}

animate();

/*
    fixme
        -la tete des boids se desaxe avec le mouvement
        -alignement ne marche pas

 */