let definedParameters = {}; // public
let parameterObjects = []; // internal bookkeeping (private to file)

const definedParametersDiv = document.getElementById("definedParameters");

document.getElementById("addParameter").addEventListener("click", () => {
  const nameElem = document.getElementById("parameterName");
  const valueElem = document.getElementById("parameterValue");
  addParameter(nameElem.value, valueElem.value);
  nameElem.value = "";
  valueElem.value = "";
});

const updateParamObject = (index, type) => (element) => {
  const elementIdx = parameterObjects.findIndex((e) => e.index === index);

  if (type === 'key') {
    parameterObjects[elementIdx].key = element.target.value;
  } else if (type === 'value') {
    parameterObjects[elementIdx].val = element.target.value;
  }

  updateDefinedParameters();
  saveParametersToCache();
};

function addParameter(paraName, paraValue) {
  const uniqueIndex = Math.random();
  if (paraName != "" && paraValue != "") {
    parameterObjects.push({ key: paraName, val: paraValue, index: uniqueIndex});
    updateDefinedParameters();
    saveParametersToCache();
  }

  const newParameterElem = document.createElement("span");
  const newParameterElemKey = document.createElement("input");
  const newParameterElemValue = document.createElement("input");

  newParameterElemKey.value = paraName;
  newParameterElemKey.oninput = updateParamObject(uniqueIndex, 'key');
  newParameterElemValue.value = paraValue;
  newParameterElemValue.oninput = updateParamObject(uniqueIndex, 'value');

  newParameterElem.appendChild(newParameterElemKey);
  newParameterElem.appendChild(newParameterElemValue);

  definedParametersDiv.appendChild(newParameterElem);
}

// derive definedParameters from parameterObjects
function updateDefinedParameters() {
  definedParameters = {};

  parameterObjects.forEach((element) => {
    definedParameters[element.key] = element.val;
  });
}

function loadParameterFromCache() {
  const cachedParameters = localStorage.getItem("parameters");
  let parsedParameters = {}

  if (cachedParameters != null) 
    parsedParameters = JSON.parse(cachedParameters);

  const keys = Object.keys(parsedParameters);
  for (const key of keys) {
    addParameter(key, parsedParameters[key]);
  }
}

function saveParametersToCache() {
  localStorage.setItem("parameters", JSON.stringify(definedParameters));
}

function resetParameters() {
  parameterObjects = [];
  definedParameters = {};
  definedParametersDiv.innerHTML = "";
  saveParametersToCache();
}

loadParameterFromCache();
updateDefinedParameters();
saveParametersToCache();
