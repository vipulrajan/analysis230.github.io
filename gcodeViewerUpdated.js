import * as THREE from './three.js-master/build/three.module.js';
import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js';

import Stats from './three.js-master/examples/jsm/libs/stats.module.js';
import { GUI } from './three.js-master/examples/jsm/libs/dat.gui.module.js';

import { LineMaterial } from './three.js-master/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './three.js-master/examples/jsm/lines/LineGeometry.js';
import { GeometryUtils } from './three.js-master/examples/jsm/utils/GeometryUtils.js';
import { Line2 } from './three.js-master/examples/jsm/lines/Line2.js';
//import { MeshLine, MeshLineMaterial } from './Three.MeshLine.js';

var clientWidth = document.getElementById('gcodeViewerContainer').clientWidth;
var clientHeight = document.getElementById('gcodeViewerContainer').clientHeight;


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 1, 1000);
camera.position.set(170, 210, 50);



const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(clientWidth, clientHeight);



const container = document.getElementById("gcodeViewerContainer")
container.appendChild(renderer.domElement);


const light1 = new THREE.PointLight(0xFFFFFF, 0.4, 0, 1);
light1.position.set(150, 150, 50);


const light2 = new THREE.AmbientLight(0x404040); // soft white light

const light3 = new THREE.PointLight(0xFFFFFF, 0.4, 0, 1);
light3.position.set(-150, 150, -150,);

const light4 = new THREE.PointLight(0xFFFFFF, 0.4, 0, 1);
light4.position.set(-150, 300, 0);

const light5 = new THREE.PointLight(0xFFFFFF, 0.4, 0, 1);
light5.position.set(150, 300, 0);




const size = 250;
const divisions = 25;

const gridHelper = new THREE.GridHelper(size, divisions, 0xff0000, 0xff0000);


const axesHelper = new THREE.AxesHelper(200);

axesHelper.rotateY(Math.PI);

scene.add(axesHelper);


scene.add(gridHelper);
scene.add(light1);
scene.add(light2);
scene.add(light3);
scene.add(light4);
scene.add(light5);

//Controls
var controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // optional

//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;

controls.screenSpacePanning = true;

controls.minDistance = 2;
controls.maxDistance = 500;

controls.maxPolarAngle = Math.PI;


function onWindowResize() {

    clientWidth = document.getElementById('gcodeViewerContainer').clientWidth;
    clientHeight = document.getElementById('gcodeViewerContainer').clientHeight;

    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(clientWidth, clientHeight);
}

new ResizeObserver(onWindowResize).observe(container);
//container.addEventListener('resize', onWindowResize);

let matLine = new LineMaterial({

    color: 0xffffff,
    linewidth: 0.4, // in pixels
    vertexColors: true,
    //resolution: new THREE.Vector2(container.innerWidth / 2, clientHeight / 2),
    dashed: false,
    alphaToCoverage: true,

});



function animate() {
    requestAnimationFrame(animate);


    controls.update();
    matLine.resolution.set(clientWidth, clientHeight);
    renderer.render(scene, camera);
}
animate();

function resetCamera() {
    controls.reset();

}



document.getElementById('resetCamera').addEventListener('click', resetCamera);




////////////GCODE VISUALISER BELOW//////////////

const gcodeSlider = document.getElementById("gcodeSlider");

const ABSOLUTE = "ABS"
const RELATIVE = "REL"

let positions = [];
let colors = [];

let points = [];

const yellowColor = new THREE.Color(1, 1, 0);
const whiteColor = new THREE.Color(1, 1, 1);





function flipMode(mode) {
    if (flipMode == ABSOLUTE) { return RELATIVE; }
    else {
        return ABSOLUTE;
    }
}
const materialLineSolid = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 0.1,
    opacity: 0.5
});

const materialLineTravel = new THREE.LineBasicMaterial({
    color: 0xFFFF00,
    linewidth: 0.1,
    opacity: 0.5
});




function getAdjustedPoint(x, y, z) {

    return { "Z": -1 * (x - 125), "Y": z, "X": -1 * (y - 125) };
}

function calculateEndingPoint(currentPosition, gcodeCommand, mode) {


    let endingPoint = {};
    if (mode == ABSOLUTE) {
        if (gcodeCommand["X"] == undefined) {
            gcodeCommand["X"] = currentPosition["X"];
        }
        if (gcodeCommand["Y"] == undefined) {
            gcodeCommand["Y"] = currentPosition["Y"];
        }
        if (gcodeCommand["Z"] == undefined) {
            gcodeCommand["Z"] = currentPosition["Z"];
        }

        endingPoint["X"] = gcodeCommand["X"];
        endingPoint["Y"] = gcodeCommand["Y"];
        endingPoint["Z"] = gcodeCommand["Z"];

    }
    else {
        if (gcodeCommand["X"] == undefined) {
            endingPoint["X"] = currentPosition["X"];
        }
        else {
            endingPoint["X"] = gcodeCommand["X"] + currentPosition["X"];
        }


        if (gcodeCommand["Y"] == undefined) {
            endingPoint["Y"] = currentPosition["Y"];
        }
        else {
            endingPoint["Y"] = gcodeCommand["Y"] + currentPosition["Y"];
        }


        if (gcodeCommand["Z"] == undefined) {
            endingPoint["Z"] = currentPosition["Z"];
        }
        else {
            endingPoint["Z"] = gcodeCommand["Z"] + currentPosition["Z"];
        }

    }
    return endingPoint;
}

var isEqualsJson = (obj1, obj2) => {
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    //return true when the two json has same length and all the properties has same value key by key
    return keys1.length === keys2.length && Object.keys(obj1).every(key => obj1[key] == obj2[key]);
}

function getG0Geometry(currentPosition, gcodeCommand, mode) {


    const endingPoint = calculateEndingPoint(currentPosition, gcodeCommand, mode);
    const adjustedEndingPoint = getAdjustedPoint(endingPoint["X"], endingPoint["Y"], endingPoint["Z"]);

    const point2 = new THREE.Vector3(adjustedEndingPoint["X"], adjustedEndingPoint["Y"], adjustedEndingPoint["Z"]);

    positions.push(point2.x, point2.y, point2.z);
    colors.push(yellowColor.r, yellowColor.g, yellowColor.b);

    return [undefined, endingPoint]

}
function getG1Geometry(currentPosition, gcodeCommand, mode) {


    const endingPoint = calculateEndingPoint(currentPosition, gcodeCommand, mode);
    const adjustedEndingPoint = getAdjustedPoint(endingPoint["X"], endingPoint["Y"], endingPoint["Z"]);

    if (!isEqualsJson(currentPosition, endingPoint)) {
        const point2 = new THREE.Vector3(adjustedEndingPoint["X"], adjustedEndingPoint["Y"], adjustedEndingPoint["Z"]);


        if (gcodeCommand["E"] > 0) {
            positions.push(point2.x, point2.y, point2.z);
            colors.push(whiteColor.r, whiteColor.g, whiteColor.b);

        }
        else {
            positions.push(point2.x, point2.y, point2.z);
            colors.push(yellowColor.r, yellowColor.g, yellowColor.b);
        }

        return [undefined, endingPoint]
    }
    else {
        return [undefined, endingPoint]
    }

}
function getGeometry(currentPosition, gcodeCommand, mode) {


    let geometryAndEndingPoint;

    switch (gcodeCommand["G"]) {
        case 0:
            geometryAndEndingPoint = getG0Geometry(currentPosition, gcodeCommand, mode);
            break;
        case 1:
            geometryAndEndingPoint = getG1Geometry(currentPosition, gcodeCommand, mode);
            break;
        case 90:
            mode = ABSOLUTE;
            geometryAndEndingPoint = [undefined, currentPosition];
            break;
        case 91:
            mode = RELATIVE;
            geometryAndEndingPoint = [undefined, currentPosition];
            break;
        default:
            geometryAndEndingPoint = [undefined, currentPosition];
            break;

    }

    return { "feature": geometryAndEndingPoint[0], "endingPoint": geometryAndEndingPoint[1], "mode": mode };
}

function parseGCodeCommand(str) {

    let trimmedCommand = str.split(";")[0].trim().toUpperCase();

    let tokenizedString = trimmedCommand.split(/\s+/);

    const reducer = (accumulator, currentValue) => {
        accumulator[currentValue[0]] = Number(currentValue.substring(1));
        return accumulator;
    };

    return tokenizedString.reduce(reducer, {});
}


document.getElementById('loadGcode').addEventListener('click', loadGcode);

let previousObject;
let currentSliderValue;
function loadGcode() {

    //Vector3 {x: 125, y: 0, z: 125}x: 125y: 0z: 125__proto__: Object Vector3 {x: 122, y: 0, z: 124}

    const generatedGCodeAndPrameters = getGCode(ace.edit("editor"));

    const generatedGCode = generatedGCodeAndPrameters[0];
    const finalParameters = generatedGCodeAndPrameters[1];


    points = [];
    positions = [];
    colors = [];

    if (previousObject != undefined) {
        scene.remove(previousObject);
    }

    const editor = ace.edit("editor2");

    const startGcode = getStartGCode(currentSettings.printerSettings.printerType, currentSettings.temperatureSettings.nozzleTemp, currentSettings.temperatureSettings.bedTemp) + "\n";

    const endGCode = getEndGCode(currentSettings.printerSettings.printerType, finalParameters["Z"])


    editor.setValue(startGcode + generatedGCode.join("\n") + endGCode, 1);



    const gcodeLines = generatedGCode.map((str) => str.trim()).filter((str) => str.toUpperCase().startsWith("G"));

    let parsedCommands = gcodeLines.map((gcodeLine) => parseGCodeCommand(gcodeLine));


    const slider = document.getElementById("gcodeSlider");



    let startingPoint = { "X": 0, "Y": 0, "Z": 0 };
    let mode = "ABS";

    for (let i = 0; i < parsedCommands.length; i++) {
        const result = getGeometry(startingPoint, parsedCommands[i], mode);
        startingPoint = result["endingPoint"];
        mode = result["mode"];

    }


    slider.max = positions.length;
    currentSliderValue = slider.max;
    slider.value = currentSliderValue;

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);


    let line = new Line2(geometry, matLine);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    previousObject = line;
    scene.add(line);
    //matLine.resolution.set(container.innerWidth, clientHeight);
}


document.getElementById("gcodeSlider").addEventListener('input', sliderControl);
function sliderControl() {

    currentSliderValue = document.getElementById("gcodeSlider").value;
    let newPositions = positions.slice(0, currentSliderValue);
    let newColors = colors.slice(0, currentSliderValue);

    if (previousObject != undefined) {
        scene.remove(previousObject);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(newPositions);
    geometry.setColors(newColors);

    let line = new Line2(geometry, matLine);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    previousObject = line;
    scene.add(line);

}



