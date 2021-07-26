import * as THREE from './three.module.js';
import {Vector2, Vector3} from "./three.module.js";

//VAR PARAMETERS
let width = 200;
let height = 200;
let depth = 500;//todo perspective camera area lookin

let BOIDS_NUMBER = 300;
let VISION = 15;
let SEPARATION_DISTANCE = 10;
let ALIGN_FORCE = 0.1;
let COHESION_FORCE = 0.1;
let SEPARATION_FORCE = 0.1;
let ROTATION_FORCE = 0.1;
let SPEED = 0.5;

//todo make a var to limit movement in a direction (like gravity)


//CLASS
class Boid extends THREE.Mesh {
    constructor() {
        const boidmaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        const boidgeometry = new THREE.ConeGeometry(1, 3, 3);
        super(boidgeometry, boidmaterial);

        //let's add a wirefram
        const wireframeGeo = new THREE.EdgesGeometry(boidgeometry);
        const wireframeMat = new THREE.LineBasicMaterial({color: 0xffffff})
        const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
        wireframe.name = "wireframe";
        this.add(wireframe)
        this._velocity = new Vector3().random();
        this._velocity = this._velocity.subScalar(0.5);
        this._velocity.clampLength(Math.random(), Math.random() + 1);
        this._acceleration = new Vector3();

    }

    update() {
        this.position.add(this._velocity);

        this._velocity.add(this._acceleration)
        this._velocity.clampLength(-SPEED, SPEED);
    }

    align(boids) {
        let average = new Vector3();
        let nbr = 0;
        for (let boid of boids) {
            let distance = boid.position.distanceTo(this.position)
            if (distance < VISION && boid != this) {
                nbr++;
                average.add(boid._velocity);
            }
        }
        if (nbr > 0) {
            average.divideScalar(nbr);
            average.setLength(SPEED);//magnitude
            average.sub(this._velocity);
            average.min(new Vector3(ALIGN_FORCE, ALIGN_FORCE, ALIGN_FORCE));
            average.max(new Vector3(-ALIGN_FORCE, -ALIGN_FORCE, -ALIGN_FORCE));
        }
        return average;
    }

    cohesion(boids){
        let average = new Vector3();
        let nbr = 0;
        for (let boid of boids) {
            let distance = boid.position.distanceTo(this.position)
            if (distance < VISION && boid != this) {
                nbr++;
                average.add(boid.position);
            }
        }
        if (nbr > 0) {
            average.divideScalar(nbr);
            average.sub(this.position);
            average.setLength(SPEED)
            average.min(new Vector3(COHESION_FORCE, COHESION_FORCE, COHESION_FORCE));
            average.max(new Vector3(-COHESION_FORCE, -COHESION_FORCE, -COHESION_FORCE));
        }
        return average;
    }

    separation(boids){
        let average = new Vector3();
        let nbr = 0;
        for (let boid of boids) {
            let distance = boid.position.distanceTo(this.position)
            if (distance < SEPARATION_DISTANCE && boid != this) {
                let diff = new THREE.Vector3().subVectors(this.position, boid.position);
                diff.multiplyScalar(distance);//invertional prop
                average.add(diff);
                nbr++;
            }
        }
        if (nbr > 0) {
            average.divideScalar(nbr);
            average.setLength(SPEED)
            average.min(new Vector3(SEPARATION_FORCE, SEPARATION_FORCE, SEPARATION_FORCE));
            average.sub(this._velocity);
            average.max(new Vector3(-SEPARATION_FORCE, -SEPARATION_FORCE, -SEPARATION_FORCE));
        }
        return average;
    }

    rotateCenter(){

    }

    computeForces(boids) {
        this._acceleration.multiplyScalar(0); // set to 0
        this._acceleration = this.separation(boids);
        this._acceleration.add(this.align(boids));
        this._acceleration.add(this.cohesion(boids));

    }


    limits(){
        if(this.position.x >= width){
            this.position.x = -width;
        }else if(this.position.x < -width){
            this.position.x = width/2;
        }

        if(this.position.y >= height/2){
            this.position.y = -height/2;
        }else if(this.position.y < -height/2){
            this.position.y = height/2;
        }

        if(this.position.z > camera.position.z+5){
            this.position.z = camera.position.z - depth;
        }else if(this.position.z < camera.position.z - depth){
            this.position.z = camera.position.z +5;
        }

    }

}


//Visual
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
    0.1, 1000);
camera.position.z = 200;

console.log();
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


let boids = [];
for (let i = 0; i < BOIDS_NUMBER; i++) {
    boids.push(new Boid());
    boids[i].position.x = Math.random() * 200;
    boids[i].position.y = Math.random() * 200;
    boids[i].position.z = Math.random() * 200;

    scene.add(boids[boids.length - 1]);
}


//infinite loop
function animate() {
    requestAnimationFrame(animate);
    for (let boid of boids) {
        boid.limits();
        boid.computeForces(boids);
        boid.update();

    }
    renderer.render(scene, camera);

}

animate();
