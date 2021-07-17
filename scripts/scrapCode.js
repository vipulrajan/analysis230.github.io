let currentPosition = {
    x: 0,
    y: 0,
    z: 0
};
let parsedCode;

const constants = {
    moveType: {
        Pr: "Pr",
        Tr: "Tr"
    },
    homePosition: {
        x: 0,
        y: 0,
        z: 0
    },
    extrusionType: {
        vol: "vol",
        len: "len"
    },
    commands: {
        G0: "G0",
        G1: "G1"
    },
    valueType: {
        ABS: "ABS",
        REL: "REL",
        EXP: "expression",
        EXPC: "expressionConditional"
    },
    autoRetractTypes:
    {
        yes: "Yes",
        no: "No"
    },
    overrideKeys: ["E", "F", "M"]

}

let generatedGCode = [];
let generatedGCodeCurrentLine;

function sinDegrees(angle) {
    return Math.sin(angle * (Math.PI / 180));
}

function cosDegrees(angle) {
    return Math.cos(angle * (Math.PI / 180));
}

function tanDegrees(agle) {
    return Math.tan(angle * (Math.PI / 180));
}

function asinDegrees(value) {
    return Math.asin(value) * (180 / Math.PI);
}

function acosDegrees(value) {
    return Math.acos(value) * (180 / Math.PI);
}

Math.sinDegrees = sinDegrees;
Math.cosDegrees = cosDegrees;
Math.tanDegrees = tanDegrees;
Math.asinDegrees = asinDegrees;
Math.acosDegrees = acosDegrees;


function equatePositions(pos1, pos2) {
    return pos1.x == pos2.x && pos1.y == pos2.y && pos1.z == pos2.z;
}


function getDistance(pos1, pos2) {
    return Math.sqrt(Math.pow((pos1.x - pos2.x), 2) + Math.pow((pos1.y - pos2.y), 2) + Math.pow((pos1.z - pos2.z), 2));
}

function getKey(obj, key) {

    if (obj == undefined)
        return null;
    else {
        if (obj[key] == undefined)
            return null;
        else
            return obj[key];
    }
}


function calculateNewPosition(previousPosition, newPositionArguments) {

    const resultingPosition = {}
    if (newPositionArguments.x.type === constants.valueType.ABS) {
        resultingPosition["x"] = newPositionArguments.x.value;
    }
    else if (newPositionArguments.x.type === constants.valueType.REL) {
        resultingPosition["x"] = previousPosition["x"] + newPositionArguments.x.value;
    }
    else if (newPositionArguments.x.type === constants.valueType.EXP || newPositionArguments.x.type === constants.valueType.EXPC) {
        resultingPosition["x"] = solveExpression(newPositionArguments.x, newPositionArguments.tVal, previousPosition.x, previousPosition.y, previousPosition.z, previousPosition.x, newPositionArguments.tStep);
    }


    if (newPositionArguments.y.type === constants.valueType.ABS) {
        resultingPosition["y"] = newPositionArguments.y.value;
    }
    else if (newPositionArguments.y.type === constants.valueType.REL) {
        resultingPosition["y"] = previousPosition["y"] + newPositionArguments.y.value;
    }
    else if (newPositionArguments.y.type === constants.valueType.EXP || newPositionArguments.y.type === constants.valueType.EXPC) {
        resultingPosition["y"] = solveExpression(newPositionArguments.y, newPositionArguments.tVal, previousPosition.x, previousPosition.y, previousPosition.z, previousPosition.y, newPositionArguments.tStep);
    }

    if (newPositionArguments.z.type === constants.valueType.ABS) {
        resultingPosition["z"] = newPositionArguments.z.value;
    }
    else if (newPositionArguments.z.type === constants.valueType.REL) {
        resultingPosition["z"] = previousPosition["z"] + newPositionArguments.z.value;
    }
    else if (newPositionArguments.z.type === constants.valueType.EXP || newPositionArguments.z.type === constants.valueType.EXPC) {
        resultingPosition["z"] = solveExpression(newPositionArguments.z, newPositionArguments.tVal, previousPosition.x, previousPosition.y, previousPosition.z, previousPosition.z, newPositionArguments.tStep);
    }

    return resultingPosition;

}

function addRetract(currentZ, zHop, zHopSpeed, retractionValue, retractionSpeed) {


    let generatedCommand = {};
    generatedCommand["G"] = 1;
    generatedCommand["Z"] = eval(currentZ + zHop);
    generatedCommand["F"] = zHopSpeed;

    generatedLines.push(generatedCommand);

    generatedCommand = {};
    generatedCommand["G"] = 1;
    generatedCommand["E"] = eval(-1 * retractionValue);
    generatedCommand["F"] = retractionSpeed;

    generatedLines.push(generatedCommand);


}

function addUnRetract(currentZ, zHop, zHopSpeed, unretractionValue, unRetractionSpeed) {
    let generatedCommand = {};
    generatedCommand["G"] = 1;
    generatedCommand["E"] = unretractionValue;
    generatedCommand["F"] = unRetractionSpeed;

    generatedLines.push(generatedCommand);

    generatedCommand = {};
    generatedCommand["G"] = 1;
    generatedCommand["Z"] = eval(currentZ - zHop);
    generatedCommand["F"] = zHopSpeed;

    generatedLines.push(generatedCommand);
}

function addLine(objStartPosition, objEndPosition, strPrintTravel, dblWidth, dblHeight, objSpeeds, dblFeedstockFilamentDiameter, strExtrusionUnits, objOverrides) {

    let eMultiplier = 1;
    if (strExtrusionUnits === constants.extrusionType.vol)
        eMultiplier = 1;
    else if (strExtrusionUnits === constants.extrusionType.len)
        eMultiplier = 4 / (Math.PI * Math.pow(dblFeedstockFilamentDiameter, 2));

    if (!equatePositions(currentPosition, objStartPosition) && strPrintTravel === constants.moveType.Pr)
        addLine(currentPosition, objStartPosition, constants.moveType.Tr, dblWidth, dblHeight, objSpeeds, dblFeedstockFilamentDiameter, strExtrusionUnits, objOverrides);




    const parametersOfCommand = {};

    const generatedCommand = {};

    const distance = getDistance(objStartPosition, objEndPosition);

    if (strPrintTravel === constants.moveType.Tr) {

        if (getKey(objOverrides, "F") === null) {
            parametersOfCommand["F"] = objSpeeds.Tr;
        }
        else {
            parametersOfCommand["F"] = getKey(objOverrides, "F").value;
        }

        parametersOfCommand["E"] = 0;

        generatedCommand["G"] = 0;
        generatedCommand["X"] = objEndPosition.x;
        generatedCommand["Y"] = objEndPosition.y;
        generatedCommand["F"] = parametersOfCommand["F"]

        if (currentSettings.retractionSettings.autoRetract === constants.autoRetractTypes.yes && distance >= currentSettings.retractionSettings.threshHoldDistance) {

            const zHop = currentSettings.retractionSettings.zHop;
            const zHopSpeed = currentSettings.retractionSettings.zHopSpeed;

            addRetract(currentPosition.z, zHop, zHopSpeed, currentSettings.retractionSettings.retraction, currentSettings.retractionSettings.retractionSpeed);
            generatedCommand["Z"] = eval(objEndPosition.z + currentSettings.retractionSettings.zHop);

            generatedLines.push(generatedCommand);

            addUnRetract(objEndPosition.z + currentSettings.retractionSettings.zHop, zHop, zHopSpeed, currentSettings.retractionSettings.unretraction, currentSettings.retractionSettings.unretractionSpeed);


        }
        else {
            generatedCommand["Z"] = objEndPosition.z;
            generatedLines.push(generatedCommand);
        }
    }
    else if (strPrintTravel === constants.moveType.Pr) {

        if (getKey(objOverrides, "F") === null) {
            parametersOfCommand["F"] = objSpeeds.Pr;
        }
        else {
            parametersOfCommand["F"] = getKey(objOverrides, "F").value;
        }


        const vol = ((dblWidth - dblHeight) * dblHeight + Math.PI * dblHeight * dblHeight / 4) * distance;

        if (getKey(objOverrides, "E") !== null) {
            parametersOfCommand["E"] = getKey(objOverrides, "E").value;
        }
        else {
            parametersOfCommand["E"] = eMultiplier * vol;
        }

        if (getKey(objOverrides, "M") !== null) {
            parametersOfCommand["E"] = parametersOfCommand["E"] * getKey(objOverrides, "M").value;
        }

        generatedCommand["G"] = 1;
        generatedCommand["X"] = objEndPosition.x;
        generatedCommand["Y"] = objEndPosition.y;
        generatedCommand["Z"] = objEndPosition.z;
        generatedCommand["F"] = parametersOfCommand["F"];
        generatedCommand["E"] = parametersOfCommand["E"];

        generatedLines.push(generatedCommand);
    }

    currentPosition = objEndPosition;

}


function solveExpression(expression, tVal, xVal, yVal, zVal, defaultValue, tStep) {


    let returnValue;
    if (expression.type === constants.valueType.EXP) {
        returnValue = eval(expression.value);
    }
    else if (expression.type === constants.valueType.EXPC) {
        const keys = Object.keys(expression.value);

        if (!keys.includes("elif") && !keys.includes("else")) {
            if (eval(expression.value["if"].condition))
                returnValue = eval(expression.value["if"].returnValue);
            else
                returnValue = defaultValue;
        }
        else if (!keys.includes("elif") && keys.includes("else")) {
            if (eval(expression.value["if"].condition))
                returnValue = eval(expression.value["if"].returnValue);
            else
                returnValue = eval(expression.value["else"].returnValue);
        }
        else if (keys.includes("elif") && !keys.includes("else")) {
            if (eval(expression.value["if"].condition))
                returnValue = eval(expression.value["if"].returnValue);

            const elifObjects = expression.value["elif"];

            for (let efilObject of elifObjects) {
                if (returnValue === undefined && eval(efilObject.condition)) {
                    returnValue = eval(efilObject.returnValue);
                    break;
                }
            }

            if (returnValue === undefined)
                returnValue = defaultValue;
        }
        else if (keys.includes("elif") && keys.includes("else")) {
            if (eval(expression.value["if"].condition))
                returnValue = eval(expression.value["if"].returnValue);

            const elifObjects = expression.value["elif"];

            for (let efilObject of elifObjects) {
                if (returnValue === undefined && eval(efilObject.condition)) {
                    returnValue = eval(efilObject.returnValue);
                    break;
                }
            }

            if (returnValue === undefined)
                returnValue = eval(expression.value["else"].returnValue);
        }

    }

    return returnValue;
}

function getPolarPoint(centrePosition, radius, angle) {
    const x = radius * Math.cosDegrees(angle) + centrePosition.x;
    const y = radius * Math.sinDegrees(angle) + centrePosition.y;

    return { "x": x, "y": y };
}

function stringifyGcode(object) {

    if (object.Z !== undefined && object.Z !== null)
        object.Z = object.Z + currentSettings.printerSettings.zOffset;


    const keys = Object.keys(object);

    const gcodeString = [];

    gcodeString.push("G" + object["G"]);

    for (let key of keys) {

        if (object[key] === "E")
            object[key] = Number(object[key].toFixed(5));
        else
            object[key] = Number(object[key].toFixed(3));

        if (key !== "G")
            gcodeString.push(key + object[key]);
    }

    return gcodeString.join(" ");
}

function polarDisplacementOfLine(line, centrePos, angleDisplacement, radiusDisplacement, zDisplacement) {

    const startPos = line.startPos;
    const endPos = line.endPos;

    const radiusStart = getDistance(startPos, centrePos);

    let angleStart = Math.acosDegrees((startPos.x - centrePos.x) / radiusStart);

    if (startPos.y < centrePos.y) {
        angleStart = 360 - angleStart;
    }


    const radiusEnd = getDistance(endPos, centrePos);

    let angleEnd = Math.acosDegrees((endPos.x - centrePos.x) / radiusEnd);

    if (endPos.y < centrePos.y) {
        angleEnd = 360 - angleEnd;
    }


    const newRadiusStart = radiusStart + radiusDisplacement;
    const newRadiusEnd = radiusEnd + radiusDisplacement;

    const newAngleStart = angleStart + angleDisplacement;
    const newAngleEnd = angleEnd + angleDisplacement;

    let newStartPos = getPolarPoint(centrePos, newRadiusStart, newAngleStart);
    newStartPos["z"] = startPos.z + zDisplacement;

    let newEndPos = getPolarPoint(centrePos, newRadiusEnd, newAngleEnd);
    newEndPos["z"] = endPos.z + zDisplacement;

    line["startPos"] = newStartPos;
    line["endPos"] = newEndPos;

    return line;
}

function getLines(parsedLine) {

    let linesToDraw = [];


    const speeds = {};


    speeds[constants.moveType.Tr] = currentSettings.temperatureSettings.travelSpeed;
    speeds[constants.moveType.Pr] = currentSettings.temperatureSettings.printSpeed;


    const nozzleDiameter = printerSpecificSettings[currentSettings.printerSettings.printerType]["nozzleDiameter"];
    const extrusionType = printerSpecificSettings[currentSettings.printerSettings.printerType]["extrusionType"];
    //addLine(startPos, endPos, parsedLine.mType.value, parsedLine.width.value, parsedLine.height.value, speeds, nozzleDiameter, extrusionType, parsedLine.overrides);

    switch (parsedLine.name) {
        case "lineCartesian": {
            let startPos = calculateNewPosition(parsedLine["currentPosition"], { x: parsedLine.x1, y: parsedLine.y1, z: parsedLine.z1 });
            let endPos = calculateNewPosition(startPos, { x: parsedLine.x2, y: parsedLine.y2, z: parsedLine.z2 });

            let mType = parsedLine.mType.value;
            let width = parsedLine.width.value;
            let height = parsedLine.height.value;
            let overrides = parsedLine.overrides;

            linesToDraw.push({
                "startPos": startPos,
                "endPos": endPos,
                "mType": mType,
                "width": width,
                "height": height,
                "overrides": overrides,
                "speeds": speeds,
                "nozzleDiameter": nozzleDiameter,
                "extrusionType": extrusionType
            });
            break;
        }

        case "lineEquation": {


            let posCurrent = parsedLine["currentPosition"];
            for (let tVal = parsedLine.tStart.value; tVal < parsedLine.tEnd.value; tVal = tVal + parsedLine.tStep.value) {


                const tStep = parsedLine.tStep.value;

                let startPos;

                if (tVal === parsedLine.tStart.value) {
                    startPos = calculateNewPosition(posCurrent, { x: parsedLine.xf, y: parsedLine.yf, z: parsedLine.zf, tVal: tVal, tStep: tStep });
                }
                else {
                    startPos = posCurrent;
                }

                let endPos = calculateNewPosition(startPos, { x: parsedLine.xf, y: parsedLine.yf, z: parsedLine.zf, tVal: tVal + tStep, tStep: tStep });


                //solveExpression(expression, tVal, xVal, yVal, zVal, defaultValue, tStep)
                const width = solveExpression(parsedLine.width, tVal, currentPosition.x, currentPosition.y, currentPosition.z, undefined, tStep);
                const height = solveExpression(parsedLine.height, tVal, currentPosition.x, currentPosition.y, currentPosition.z, undefined, tStep);


                let overrides;
                if (parsedLine.overrides !== undefined) {

                    const overrideKeys = Object.keys(parsedLine.overrides);

                    const overrides = {};
                    for (let key of overrideKeys) {
                        overrides[key] = {};
                        overrides[key]["value"] = solveExpression(parsedLine.overrides[key], tVal, currentPosition.x, currentPosition.y, currentPosition.z, undefined, tStep);
                    }
                }

                linesToDraw.push({
                    "startPos": startPos,
                    "endPos": endPos,
                    "mType": constants.moveType.Pr,
                    "width": width,
                    "height": height,
                    "overrides": overrides,
                    "speeds": speeds,
                    "nozzleDiameter": nozzleDiameter,
                    "extrusionType": extrusionType
                });

                posCurrent = endPos;

            }


            break;
        }

        case "linePolar": {

            const centrePosition = calculateNewPosition(currentPosition, { x: parsedLine.xCentre, y: parsedLine.yCentre, z: parsedLine.zCentre });
            const radiusOne = parsedLine.radiusPoint1.value;
            const angleStart = parsedLine.angleStart.value;
            const z1 = parsedLine.z1.value;
            const radiusTwo = parsedLine.radiusPoint2.value;
            const angleEnd = parsedLine.angleEnd.value;
            const z2 = parsedLine.z2.value;


            const startPos = getPolarPoint(centrePosition, radiusOne, angleStart);
            startPos.z = centrePosition.z + z1;

            const endPos = getPolarPoint(centrePosition, radiusTwo, angleEnd);
            endPos.z = centrePosition.z + z2;


            linesToDraw.push({
                "startPos": startPos,
                "endPos": endPos,
                "mType": parsedLine.mType.value,
                "width": parsedLine.width.value,
                "height": parsedLine.height.value,
                "overrides": parsedLine.overrides,
                "speeds": speeds,
                "nozzleDiameter": nozzleDiameter,
                "extrusionType": extrusionType
            });

            break;
        }

        case "repeatPolar": {


            let posCurrent = parsedLine["currentPosition"];

            const positionalArguments = calculateNewPosition(posCurrent, { x: parsedLine.xCentre, y: parsedLine.yCentre, z: parsedLine.zDisp });

            const repeatedFeatures = parsedLine.repeatedFeatures.value;
            const xCentre = positionalArguments.x;
            const yCentre = positionalArguments.y;
            let zDisp = 0;
            let angleDisplacement = 0;
            let radiusDisplacement = 0;

            for (let j = 0; j < parsedLine.numberOfRepeats.value; j++) {

                console.log("calculating repeate " + (j + 1) + " of " + parsedLine.numberOfRepeats.value);
                zDisp += parsedLine.zDisp.value;
                angleDisplacement += parsedLine.angleIncrement.value;
                radiusDisplacement += parsedLine.radiusIncrement.value;

                for (let i of repeatedFeatures) {

                    const featureLines = getLines(parsedCode[i - 1]);

                    const displacedLines = featureLines.map((line) => polarDisplacementOfLine(line, { x: xCentre, y: yCentre, z: line.startPos.z }, angleDisplacement, radiusDisplacement, zDisp));

                    linesToDraw = linesToDraw.concat(displacedLines);
                }
            }

            break;
        }
    }

    return linesToDraw;
}
function getGCode(editor) {

    generatedLines = [];
    currentPosition = {
        x: 0,
        y: 0,
        z: 0
    };


    parsedCode = [];
    parsedCode = parseCode(editor);



    for (let parsedLine of parsedCode) {

        parsedLine["currentPosition"] = currentPosition;

        generatedLines.push([]);
        generatedLinesCurrentLine = generatedLines[generatedLines.length - 1];

        switch (parsedLine.name) {
            case "lineCartesian": {

                const lineParamters = getLines(parsedLine)[0];
                addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.speeds, lineParamters.nozzleDiameter, lineParamters.extrusionType, lineParamters.overrides);


                break;
            }

            case "lineEquation": {


                const lines = getLines(parsedLine);

                for (let lineParamters of lines) {
                    addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.speeds, lineParamters.nozzleDiameter, lineParamters.extrusionType, lineParamters.overrides);

                }

                break;
            }


            case "linePolar": {

                const lineParamters = getLines(parsedLine)[0];
                addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.speeds, lineParamters.nozzleDiameter, lineParamters.extrusionType, lineParamters.overrides);

                break;
            }

            case "repeatPolar": {

                const lines = getLines(parsedLine);

                for (let lineParamters of lines) {
                    addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.speeds, lineParamters.nozzleDiameter, lineParamters.extrusionType, lineParamters.overrides);

                }

                break;
            }
        }

    }

    const stringifiedGCode = generatedLines.map((command) => {
        return stringifyGcode(command);
    });
    return stringifiedGCode;
}
/*
parses the code from Editor on the top to prepare it for GCODE generation
*/
function parseCode(editor) {


    localStorage.setItem("code", editor.getValue());
    const intermediateParsedCode = [];
    let errorMessage = "";

    const lines = editor.getValue().split("\n");

    for (let i = 0; i < lines.length; i++) {
        const value = lines[i];
        if (value.trim().length > 0) {
            try {
                const result = {};

                result["code"] = PARSERINTERMEDIATE.parse(value);
                result["lineNumber"] = i + 1;
                intermediateParsedCode.push(result);
            }
            catch (err) {
                errorMessage = errorMessage + "intermediateParse: " + "(" + (i + 1) + ", " + err.location.start.column + "): " + err.message + "\n";
            }
        }

    }

    //lineCartesian(0, 0, 0, 0, 0, 0, Pr, 0, 0)


    const substitutedIntermediateParsedCode = intermediateParsedCode.map((element) => {

        const code = element.code;
        let substitutedStatement = "";

        substitutedStatement = substitutedStatement + code.name + "("

        const args = []
        for (let arg of code.arguments) {


            if (arg.type === "variable") {
                if (arg.value in definedParameters)
                    args.push(definedParameters[arg.value]);
                else
                    errorMessage = errorMessage + "line " + element.lineNumber + ": parameter " + arg.value + " doesn't exist\n";
            }
            else if (arg.type === "REL")
                args.push("R" + arg.value)
            else if (arg.type == "overrides") {
                const keys = Object.keys(arg);

                const overrideStrings = [];

                for (let key of keys)
                    if (key !== "type")
                        overrideStrings.push(key + "=" + arg[key].value);


                args.push("[" + overrideStrings.join(",") + "]");

            }
            else if (arg.type === "expression") {
                const regex = /`.*`/g;


                const variablesToReplace = arg.value.match(regex);

                let result = arg.value;

                if (variablesToReplace !== null) {
                    for (let elem of variablesToReplace) {
                        if (elem.slice(1, -1) in definedParameters)
                            result = result.replace(elem, definedParameters[elem.slice(1, -1)]);
                        else
                            errorMessage = errorMessage + "line " + element.lineNumber + ": parameter " + elem.slice(1, -1) + " doesn't exist\n";

                    }
                }

                args.push(result);
            }

            else if (arg.type === "range") {

                args.push("'" + arg.value.join(", ") + "'");
            }
            else
                args.push(arg.value);
        }

        substitutedStatement = substitutedStatement + args.join(", ") + ")";


        return { "code": substitutedStatement, "lineNumber": element.lineNumber };

    })


    const parsedCode = Array(lines.length).fill({});

    for (let intermediateLine of substitutedIntermediateParsedCode) {
        try {

            const parsedCodeObj = PARSER.parse(intermediateLine.code);
            parsedCodeObj["lineNumber"] = intermediateLine.lineNumber;
            parsedCode[intermediateLine.lineNumber - 1] = parsedCodeObj;
        }
        catch (err) {
            errorMessage = errorMessage + "finalParse: " + "(" + (intermediateLine.lineNumber) + ", " + err.location.start.column + "): " + err.message + "\n";

        }
    }


    if (errorMessage.length > 0) {
        alert(errorMessage);
        return [];
    }
    else
        return parsedCode;
}
