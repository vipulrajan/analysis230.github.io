const blurLayer = document.getElementById("blurLayer");

blurLayer.addEventListener('click', function (ev) {
    if (ev.composedPath()[0] === this) {
        toggleBlurVisibility();
    }
});

function toggleBlurVisibility() {
    if (blurLayer.style.display === "none") {
        blurLayer.style.display = "flex";
    } else {
        blurLayer.style.display = "none";
    }
}

function makeVisible(element) {
    element.style.display = "inherit";
}

function hide(element) {
    element.style.display = "none";
}


const addFeatureMenuButton = document.getElementById("addFeatureMenuButton");
const settingsMenuButton = document.getElementById("settingsMenuButton");
const parametersMenuButton = document.getElementById("parametersMenuButton");



const addFeatureMenuCard = document.getElementById("addFeatureMenuCard");
const settingsMenuCard = document.getElementById("settingsMenuCard");
const parametersMenuCard = document.getElementById("parametersMenuCard");

addFeatureMenuButton.addEventListener('click', () => onClickTopMenu(addFeatureMenuCard));
settingsMenuButton.addEventListener('click', () => onClickTopMenu(settingsMenuCard));
parametersMenuButton.addEventListener('click', () => onClickTopMenu(parametersMenuCard));

const menuObjects = [addFeatureMenuCard, settingsMenuCard, parametersMenuCard];


function onClickTopMenu(element) {

    menuObjects.forEach((el) => {
        hide(el);
    });

    blurLayer.style.display = "flex";
    makeVisible(element);
}