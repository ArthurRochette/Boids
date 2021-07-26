import * as THREE from './three.module.js';
import {Vector2, Vector3, VertexColors} from "./three.module.js";

document.addEventListener("DOMContentLoaded", (event) => {


//CONST
    const PI = 3.14159


//VAR PARAMETERS
    let width = 200;
    let height = 200;
    let depth = 500;//todo perspective camera area lookin

    let BOIDS_NUMBER = 500;
    let VISION = 10;
    let SEPARATION_DISTANCE = 5;
    let ALIGN_FORCE = 1;
    let COHESION_FORCE = 1;
    let SEPARATION_FORCE = 1;
    let CENTER_ATTRACTION = 0.1;
    let SPEED = 0.2;

//todo make a var to limit movement in a direction (like gravity)

//link btw js and html
    let triggered = false;
    let trigger = document.getElementById('trigger');
    let paramDiv = document.getElementById('param');
    let boidnumber = document.getElementById('BOIDS_NUMBER');
    boidnumber.value = BOIDS_NUMBER;
    let boidvisiondistance = document.getElementById('BOIDS_VISION');
    boidvisiondistance.value = VISION;
    let boidspeed = document.getElementById('BOIDS_SPEED');
    boidspeed.value = SPEED;
    let boidsepara = document.getElementById('SEPARATION_DISTANCE');
    boidsepara.value = SEPARATION_DISTANCE;

    let alignforce = document.getElementById('ALIGN_FORCE');
    alignforce.value = ALIGN_FORCE;
    let coheforce = document.getElementById('COHESION_FORCE');
    coheforce.value = COHESION_FORCE;
    let separaforce = document.getElementById('SEPARATION_FORCE');
    separaforce.value = SEPARATION_FORCE;
    let centerAttrac = document.getElementById('CENTER_ATTRACTION');
    centerAttrac.value = CENTER_ATTRACTION;


    boidnumber.addEventListener('change', (event) => {
        if(boidnumber.value > -1)
            boidsNumberChanged(boidnumber.value);
        triggered = true;
    })

    boidvisiondistance.addEventListener('change', (event) => {
        VISION = boidvisiondistance.value;
        triggered = true;
    })
    boidspeed.addEventListener('change', (event) => {
        SPEED = boidspeed.value;
        triggered = true;
    })
    boidsepara.addEventListener('change', (event) => {
        SEPARATION_DISTANCE = boidsepara.value;
        triggered = true;
    })

    alignforce.addEventListener('change', (event) => {
        ALIGN_FORCE = alignforce.value;
        triggered = true;
    })
    coheforce.addEventListener('change', (event) => {
        COHESION_FORCE = coheforce.value;
        triggered = true;
    })
    separaforce.addEventListener('change', (event) => {
        SEPARATION_FORCE = separaforce.value;
        triggered = true;
    })
    centerAttrac.addEventListener('change', (event) => {
        CENTER_ATTRACTION = centerAttrac.value;
        triggered = true;
    })

    trigger.addEventListener('click', (event) => {
        if (triggered) {
            triggered = false;
            return;
        }
        if (paramDiv.classList.contains('hide'))
            paramDiv.classList.remove('hide')
        else paramDiv.classList.add('hide')
    })

//CLASS
    class Boid extends THREE.Mesh {
        static counter = 1;
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
            this._id = Boid.counter;
            Boid.counter++;
        }

        update() {
            this.position.add(this._velocity);
            this._velocity.add(this._acceleration)
            this._velocity.clampLength(-SPEED, SPEED);

            this.lookAt(new THREE.Vector3().addVectors(this.position, new THREE.Vector3().add(this._velocity).multiplyScalar(5)))
            this.rotateX(PI / 2);//to align mesh
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

        cohesion(boids) {
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

        //fixme des boids sont bcp trop proche lesun s des autres
        separation(boids) {
            let average = new Vector3();
            let nbr = 0;
            for (let boid of boids) {
                let distance = boid.position.distanceTo(this.position)
                if (distance < SEPARATION_DISTANCE && boid != this) {
                    let diff = new THREE.Vector3().subVectors(this.position, boid.position);
                    diff.multiplyScalar(1 / distance);
                    average.add(diff);
                    nbr++;
                }
            }
            if (nbr > 0) {
                average.divideScalar(nbr);
                average.setLength(SPEED)
                average.sub(this._velocity);
                average.min(new Vector3(SEPARATION_FORCE, SEPARATION_FORCE, SEPARATION_FORCE));
                average.max(new Vector3(-SEPARATION_FORCE, -SEPARATION_FORCE, -SEPARATION_FORCE));
            }
            return average;
        }

        rotateCenter() {
            let toCenter = new Vector3().subVectors(new Vector3(), this.position);
            let distance = new Vector3().distanceTo(this.position);
            toCenter.multiplyScalar(CENTER_ATTRACTION / 1000000);
            toCenter.multiplyScalar(distance); //more we are far from center, more the vector will have power ¯\_(ツ)_/¯
            toCenter.add(this._velocity);
            toCenter.setLength(SPEED);

            return toCenter;

        }

        computeForces(boids) {
            this._acceleration.multiplyScalar(0); // set to 0
            this._acceleration = this.separation(boids);
            this._acceleration.add(this.align(boids));
            this._acceleration.add(this.cohesion(boids));
            this._acceleration.add(this.rotateCenter());

        }


        limits() {
            if (this.position.x >= width) { this.position.x = -width; } else if (this.position.x < -width) { this.position.x = width / 2; }

            if (this.position.y >= height / 2) {
                this.position.y = -height / 2;
            } else if (this.position.y < -height / 2) {
                this.position.y = height / 2;
            }

            if (this.position.z > camera.position.z + 5) {
                this.position.z = camera.position.z - depth;
            } else if (this.position.z < camera.position.z - depth) {
                this.position.z = camera.position.z + 5;
            }

        }
    }


//Visual
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 1000);
    camera.position.z = 200;


    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    let boids = [];
    for (let i = 0; i < BOIDS_NUMBER; i++) {
        boids.push(new Boid());
        boids[i].position.x = Math.random() * 200 - 100;
        boids[i].position.y = Math.random() * 200 - 100;
        boids[i].position.z = Math.random() * 200 - 100;
        boids[i].name = 'boid';
        scene.add(boids[boids.length - 1]);
    }

    function boidsNumberChanged(nbr) {
        console.log(nbr)
        console.log(BOIDS_NUMBER)
        console.log(boids.length)

        if (nbr < BOIDS_NUMBER) {
            for (let i = nbr; i < BOIDS_NUMBER; i++) {
                let obj = scene.getObjectByName('boid');
                for (let i = 0; i < boids.length; i++) {
                    if (boids[i]._id === obj._id) {
                        boids.splice(i, 1);
                        console.log('dele')
                        break;
                    }
                }
                scene.remove(obj);
            }
        } else {
            for (let i = BOIDS_NUMBER; i < nbr; i++) {
                boids.push(new Boid());
                let boid = boids[boids.length - 1];
                boid.position.x = Math.random() * 200 - 100;
                boid.position.y = Math.random() * 200 - 100;
                boid.position.z = Math.random() * 200 - 100;
                boid.name = 'boid';
                scene.add(boids[boids.length - 1]);
                console.log('creat')
            }
        }
        BOIDS_NUMBER = nbr;
        boids.length = BOIDS_NUMBER;
        console.log('end')
        console.log(nbr)
        console.log(BOIDS_NUMBER)
        console.log(boids.length)

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
})