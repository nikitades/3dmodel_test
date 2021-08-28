import { help } from 'commander';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    MeshStandardMaterial,
    DirectionalLight,
    PCFSoftShadowMap,
    Object3D,
    MathUtils,
    Vector3
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

const canvas = document.getElementById('scene');
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
const controls = new OrbitControls(camera, renderer.domElement);
const material = new MeshStandardMaterial({ color: 0x00ff00 });
const loader = new OBJLoader();

const settings = {
    x: 180,
    y: 145,
    z: 252
};
const gui = new GUI({ settings });
const hotspotFolder = gui.addFolder('Hotspot');
hotspotFolder.add(settings, 'x', 0, 360);
hotspotFolder.add(settings, 'y', 0, 360);
hotspotFolder.add(settings, 'z', 0, 360);
hotspotFolder.open();


renderer.setSize(window.innerWidth, window.innerHeight);
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
light.position.set(0, 1, 0);
light.castShadow = true;

light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;

scene.add(light);

camera.position.z = 10;
camera.position.y = 5;
camera.position.x = 10;

const lonHelper = new Object3D();
const latHelper = new Object3D();
lonHelper.add(latHelper);
const positionHelper = new Object3D();
positionHelper.position.z = MathUtils.degToRad(settings.z);
latHelper.add(positionHelper);

const lonFudge = Math.PI * 1.5;
const latFudge = Math.PI;

const position = new Vector3();

const hotspot = {
    elem: document.getElementById('hotspot'),
    position
};

const tempV = new Vector3();


const line = new LeaderLine(
    document.getElementById('legend').getElementsByClassName('legendItem')[0],
    LeaderLine.pointAnchor(document.body, { x: 1, y: 1 })
);

function updateHotspotPos() {
    lonHelper.rotation.y = MathUtils.degToRad(settings.x) + lonFudge;
    latHelper.rotation.x = MathUtils.degToRad(settings.y) + latFudge;
    positionHelper.position.z = MathUtils.degToRad(settings.z);
    positionHelper.updateWorldMatrix(true, false);
    positionHelper.getWorldPosition(position);

    tempV.copy(hotspot.position);
    tempV.project(camera);

    const x = (tempV.x * .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

    line.end = LeaderLine.pointAnchor(document.body, { x, y })

    hotspot.elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

    hotspot.elem.style.zIndex = (-tempV.z * .5 + .5) * 100000 | 0;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
    updateHotspotPos();
}
animate();