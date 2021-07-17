const menuTabs = document.getElementsByClassName("settingsMenuTab");
const menuPages = document.getElementsByClassName("settingsMenuPage");

function getStartGCode(printerModel, first_layer_temperature, first_layer_bed_temperature) {

    if (printerModel === "PrusaMk3s") {

        return `M115 U3.9.2 ; tell printer latest fw version
    G90 ; use absolute coordinates
    M83 ; extruder relative mode
    M104 S${first_layer_temperature} ; set extruder temp
    M140 S${first_layer_bed_temperature} ; set bed temp
    M190 S${first_layer_bed_temperature} ; wait for bed temp
    M109 S${first_layer_temperature}  ; wait for extruder temp
    G28 W ; home all without mesh bed level
    G80 ; mesh bed leveling
    G1 Y-3.0 F1000.0 ; go outside print area
    G92 E0.0
    G1 X60.0 E9.0 F1000.0 ; intro line
    G1 X100.0 E12.5 F1000.0 ; intro line
    G92 E0.0
    M221 S100
    
    ; Don't change E values below. Excessive value can damage the printer.
    M907 E430 
    G21 ; set units to millimeters
    G90 ; use absolute coordinates
    M83 ; use relative distances for extrusion
    M900 K0.05 ; Filament gcode LA 1.5
    M900 K30 ; Filament gcode LA 1.0`
    }

}

function getEndGCode(printerModel, maxZ) {


    const zToMoveTo = Math.min(maxZ + 5, printerSpecificSettings[printerModel].maxPrintHeight);

    if (printerModel === "PrusaMk3s") {
        return `
    G4 ; wait
    M221 S100 ; reset flow
    M900 K0 ; reset LA
    M907 E538 ; reset extruder motor current
    M104 S0 ; turn off temperature
    M140 S0 ; turn off heatbed
    M107 ; turn off fan
    G1 Z${zToMoveTo} ; Move print head up
    G1 X0 Y200 F3000 ; home X axis
    M84 ; disable motors`}
}

const printerSpecificSettings = {
    "PrusaMk3s": {
        "nozzleDiameter": 1.75,
        "extrusionType": "len",
        "maxPrintHeight": 250
    },
    "Ultimaker2": {
        "nozzleDiameter": 1.75,
        "extrusionType": "len"

    },
    "PrusaMini": {
        "nozzleDiameter": 1.75,
        "extrusionType": "len"
    }

};

function disableTab(tabElement) {
    if (!tabElement.classList.contains("disabledMenuButton")) {
        tabElement.classList.add("disabledMenuButton");
    }
}

function enableTab(tabElement) {
    if (tabElement.classList.contains("disabledMenuButton")) {
        tabElement.classList.remove("disabledMenuButton")
    }
}

function hidePage(page) {
    page.style.display = "none";
}

function showPage(page) {
    page.style.display = "unset";
}

function activatePage(tabElement, pageId) {

    for (let element of menuTabs) {
        disableTab(element);
    }

    for (let element of menuPages) {
        hidePage(element);
    }

    enableTab(tabElement)
    showPage(document.getElementById(pageId));
}


const retractionSettings = document.getElementById("retractionSettings");

const retractionSubFieldLabels = retractionSettings.getElementsByClassName("subField");
const retractionSubFieldInputs = retractionSettings.getElementsByTagName("input");

const autoRetractSelect = document.getElementById("autoRetract");

//autoRetractSelect.addEventListener("change", () => enableOrDisableSubFields(retractionSubFieldLabels, retractionSubFieldInputs));

function enableOrDisableSubFields(subFieldLabels, subFieldInputs) {

    if (autoRetractSelect.value === "Yes") {

        for (let element of subFieldLabels) {
            if (element.classList.contains("subFieldDisabled"))
                element.classList.remove("subFieldDisabled");
        }
        for (let element of subFieldInputs) {

            if (element.disabled)
                element.disabled = false;
        }
    }
    else {

        for (let element of subFieldLabels) {
            if (!element.classList.contains("subFieldDisabled"))
                element.classList.add("subFieldDisabled");
        }
        for (let element of subFieldInputs) {

            if (!element.disabled)
                element.disabled = true;
        }
    }
}


let currentSettings = { printerSettings: {}, retractionSettings: {}, temperatureSettings: {} }
const settingsPages = ["printerSettings", "retractionSettings", "temperatureSettings"];

function loadDefaultSettings() {



    settingsPages.forEach((settingsPages) => {
        settingsMenuPage = document.getElementById(settingsPages);
        const inputFields = settingsMenuPage.getElementsByTagName("input");
        const selectFields = settingsMenuPage.getElementsByTagName("select");

        for (let element of inputFields) {
            currentSettings[settingsPages][element.id] = Number(element.placeholder);
            element.addEventListener('change', () => onValueChange(element, settingsPages));
        }

        for (let element of selectFields) {
            currentSettings[settingsPages][element.id] = element.options[0].value;
            element.addEventListener('change', () => onValueChange(element, settingsPages));
        }
    });
}

function loadSettingsFromCache() {
    const cachedSettings = localStorage.getItem("settings");

    if (cachedSettings != null)
        currentSettings = JSON.parse(cachedSettings);
}

function saveSettingsToCache() {
    localStorage.setItem("settings", JSON.stringify(currentSettings));
}


function loadSettingsForms() {

    settingsPages.forEach((settingsPage) => {
        const keys = Object.keys(currentSettings[settingsPage]);

        keys.forEach((key) => {
            document.getElementById(key).value = currentSettings[settingsPage][key];
        });

    });
    enableOrDisableSubFields(retractionSubFieldLabels, retractionSubFieldInputs);

}

function onValueChange(element, settingsPageKey) {

    switch (element.type) {
        case "number":
            if (element.value != "")
                currentSettings[settingsPageKey][element.id] = Number(element.value);
            else
                currentSettings[settingsPageKey][element.id] = Number(element.placeholder);
            break;
        default:
            if (element.value != "")
                currentSettings[settingsPageKey][element.id] = element.value;
            else
                currentSettings[settingsPageKey][element.id] = element.placeholder;
            break;
    }

    saveSettingsToCache();
    enableOrDisableSubFields(retractionSubFieldLabels, retractionSubFieldInputs);
}

function resetSetting() {
    loadDefaultSettings();
    saveSettingsToCache();
    loadSettingsForms();

}

loadDefaultSettings();
loadSettingsFromCache();
saveSettingsToCache();
loadSettingsForms();

