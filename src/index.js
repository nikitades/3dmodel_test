import { help } from 'commander';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    MeshStandardMaterial,
    DirectionalLight,
    PlaneGeometry,
    Mesh,
    PCFSoftShadowMap
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
const controls = new OrbitControls(camera, renderer.domElement);
const material = new MeshStandardMaterial({ color: 0x00ff00 });
const loader = new OBJLoader();


renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
controls.update();

loader.load(
    './teapot.obj',
    obj => {
        obj.traverse(node => {
            if (node.isMesh) node.material = material;
        });
        obj.castShadow = true;
        obj.receiveShadow = true;
        scene.add(obj);
        console.log('Added!');
    },
    xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    err => console.log('An error: ' + err.message)
);

const light = new DirectionalLight(0xffffff, 1, 100);
light.position.set(0, 1, 0); //default; light shining from top
light.castShadow = true; // default false

light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default

scene.add(light);

camera.position.z = 10;
camera.position.y = 5;
camera.position.x = 10;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}
animate();