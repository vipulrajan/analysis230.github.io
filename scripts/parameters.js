let definedParameters = {};

const definedParametersDiv = document.getElementById("definedParamters");

document.getElementById("addParameter").addEventListener('click', () => addParameter(document.getElementById("parameterName"), document.getElementById("parameterValue")));

function addParameter(paraNameInput, paraValueInput) {

    const paraName = paraNameInput.value;
    const paraValue = paraValueInput.value;
    if (paraName != "" && paraValue != "") {
        definedParameters[paraName] = paraValue;
        saveParameterseToCache();
        updateDefinedParameters();
    }

    paraNameInput.value = "";
    paraValueInput.value = "";
}

function updateDefinedParameters() {

    const keys = Object.keys(definedParameters);

    definedParametersDiv.innerHTML = "";
    keys.forEach((key) => {
        definedParametersDiv.innerHTML = definedParametersDiv.innerHTML + `<span style='margin-bottom:10px; margin-left:5px'>${key}:${definedParameters[key]}<span>`;
    });

}

function loadParameterFromCache() {
    const cachedParameters = localStorage.getItem("parameters");

    if (cachedParameters != null)
        definedParameters = JSON.parse(cachedParameters);
}

function saveParameterseToCache() {
    localStorage.setItem("parameters", JSON.stringify(definedParameters));
}

function resetParameters() {
    definedParameters = {};
    saveParameterseToCache();
    updateDefinedParameters();
}

loadParameterFromCache();
saveParameterseToCache();
updateDefinedParameters();