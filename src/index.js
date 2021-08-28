import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    DirectionalLight,
    PCFSoftShadowMap,
    Object3D,
    MathUtils,
    Vector3,
    Matrix3
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

const canvas = document.getElementById('scene');
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
const controls = new OrbitControls(camera, renderer.domElement);
const loader = new GLTFLoader();

const settings = {
    x: 97,
    y: 160,
    z: 252,
    depth: 0.5
};

const modelRotation = {
    x: 0,
    y: 0,
    z: 0,
};

const cameraPosition = {
    x: 1,
    y: 5,
    z: 17,
};

const gui = new GUI({ settings });
const hotspotFolder = gui.addFolder('Hotspot');
hotspotFolder.add(settings, 'x', 0, 360);
hotspotFolder.add(settings, 'y', 0, 360);
hotspotFolder.add(settings, 'z', 0, 360);
hotspotFolder.add(settings, 'depth', -1, 1, 0.01);
hotspotFolder.open();

const modelFolder = gui.addFolder('Model');
modelFolder.add(modelRotation, 'x', 0, Math.PI * 2, 0.01).onChange(() => globalObj.scene.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z));
modelFolder.add(modelRotation, 'y', 0, Math.PI * 2, 0.01).onChange(() => globalObj.scene.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z));
modelFolder.add(modelRotation, 'z', 0, Math.PI * 2, 0.01).onChange(() => globalObj.scene.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z));
modelFolder.open();

const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(cameraPosition, 'x', 0, Math.PI * 10, 0.01).onChange(() => camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z));
cameraFolder.add(cameraPosition, 'y', 0, Math.PI * 10, 0.01).onChange(() => camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z));
cameraFolder.add(cameraPosition, 'z', 0, Math.PI * 10, 0.01).onChange(() => camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z));
cameraFolder.open();


renderer.setSize(window.innerWidth, window.innerHeight);
controls.update();

let globalObj;

loader.load(
    '/assets/models/washing-machine/scene.gltf',
    obj => {
        globalObj = obj;
        // obj.traverse(node => {
        //     if (node.isMesh) node.material = material;
        // });
        // obj.castShadow = true;
        // obj.receiveShadow = true;
        obj.scene.children[0].scale.set(5, 5, 5);
        obj.scene.rotation.set(0, 1.69, 0);
        scene.add(obj.scene);
        console.log('Added!');
    },
    xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    err => console.log('An error: ' + err.message)
);

const light = new DirectionalLight(0xffffff, 100, 100);
light.position.set(0, 1, 0);
light.castShadow = true;

light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;

scene.add(light);

camera.position.x = cameraPosition.x;
camera.position.y = cameraPosition.y;
camera.position.z = cameraPosition.z;

const lonHelper = new Object3D();
const latHelper = new Object3D();
lonHelper.add(latHelper);
const positionHelper = new Object3D();
positionHelper.position.z = MathUtils.degToRad(settings.z);
latHelper.add(positionHelper);

const lonFudge = Math.PI * 1.5;
const latFudge = Math.PI;

const hotspot = {
    elem: document.getElementById('hotspot'),
    position: new Vector3()
};

const line = new LeaderLine(
    document.getElementById('legend').getElementsByClassName('legendItem')[0],
    LeaderLine.pointAnchor(document.body, { x: 1, y: 1 }),
    {
        path: 'grid',
        color: 'rgba(255, 237, 0, 1)',
        size: 1,
        endPlug: 'behind',
        endPlugSize: 10
    }
);

const tempV = new Vector3();
const cameraToPoint = new Vector3();
const currentCameraPosition = new Vector3();
const normalMatrix = new Matrix3();

function updateHotspotPos() {
    normalMatrix.getNormalMatrix(camera.matrixWorldInverse);
    camera.getWorldPosition(currentCameraPosition);

    tempV.copy(hotspot.position);
    tempV.applyMatrix3(normalMatrix);

    cameraToPoint.copy(hotspot.position);
    cameraToPoint.applyMatrix4(camera.matrixWorldInverse).normalize();

    const dot = tempV.dot(cameraToPoint);

    if ((dot / Math.PI) > settings.depth) {
        hotspot.elem.style.display = 'none';
        line.hide();
        return;
    }
    hotspot.elem.style.display = '';
    line.show();

    lonHelper.rotation.y = MathUtils.degToRad(settings.x) + lonFudge;
    latHelper.rotation.x = MathUtils.degToRad(settings.y) + latFudge;
    positionHelper.position.z = MathUtils.degToRad(settings.z);
    positionHelper.updateWorldMatrix(true, false);
    positionHelper.getWorldPosition(hotspot.position);

    tempV.copy(hotspot.position);
    tempV.project(camera);

    const x = (tempV.x * .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

    //LeaderLine.pointAnchor(document.body, { x, y})
    line.end = LeaderLine.areaAnchor({ element: hotspot.elem, shape: 'circle', size: 3 });

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