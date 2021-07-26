import * as THREE from './three.module.js';
import {Vector2, Vector3} from "./three.module.js";

//VAR PARAMETERS
let width = 250;
let height = 275;
let depth = 50;//todo auto

let BOIDS_NUMBER = 150;
let VISION = 5;
let ALIGNFORCE = 0.01;



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
        this._velocity = new Vector2().random();
        this._velocity = this._velocity.subScalar(0.5);
        this._velocity.clampLength(Math.random(), Math.random() + 1);
        this._acceleration = new Vector2();

    }

    update() {
        this.position.add(this._velocity);
        this.position.z = 0;//todo 3d
        this._velocity.add(this._acceleration)
    }

    align(boids) {
        let average = new Vector2();
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
            average.sub(this._velocity);
            average.min(new Vector2(ALIGNFORCE, ALIGNFORCE));
            average.max(new Vector2(-ALIGNFORCE, -ALIGNFORCE));
        }
        return average;
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




    }

    computeForces(boids) {
        this._acceleration = this.align(boids);

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
    boids[i].position.x = Math.random() * 50;
    boids[i].position.y = Math.random() * 50;
    boids[i].position.z = Math.random() * 0;

    scene.add(boids[boids.length - 1]);
}


//infinite loop
function animate() {
    requestAnimationFrame(animate);
    for (let boid of boids) {
        boid.computeForces(boids);
        boid.limits();
        boid.update();

    }
    renderer.render(scene, camera);

}

animate();
