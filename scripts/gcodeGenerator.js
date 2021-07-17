let currentPosition = {
    x: 0,
    y: 0,
    z: 0
};
let parsedCode;

const constants = {
    moveType: {
        Pr: "Pr",
        Tr: "Tr",
        AddedTr: "ATr",
        GC: "GCode"
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
let generatedLines = [];
let generatedLinesCurrentLine;

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

    const returnCommands = [];

    let generatedCommand1 = {};
    generatedCommand1["G"] = 1;
    generatedCommand1["Z"] = eval(currentZ + zHop);
    generatedCommand1["F"] = zHopSpeed;

    returnCommands.push(generatedCommand1);

    let generatedCommand2 = {};
    generatedCommand2["G"] = 1;
    generatedCommand2["E"] = eval(-1 * retractionValue);
    generatedCommand2["F"] = retractionSpeed;

    returnCommands.push(generatedCommand2);

    return returnCommands;
}

function addUnRetract(currentZ, zHop, zHopSpeed, unretractionValue, unRetractionSpeed) {

    const returnCommands = [];

    let generatedCommand1 = {};
    generatedCommand1["G"] = 1;
    generatedCommand1["E"] = unretractionValue;
    generatedCommand1["F"] = unRetractionSpeed;

    returnCommands.push(generatedCommand1);

    let generatedCommand2 = {};
    generatedCommand2["G"] = 1;
    generatedCommand2["Z"] = eval(currentZ - zHop);
    generatedCommand2["F"] = zHopSpeed;

    returnCommands.push(generatedCommand2);

    return returnCommands;
}

function addLine(objStartPosition, objEndPosition, strPrintTravel, dblWidth, dblHeight, objOverrides) {



    if (!equatePositions(currentPosition, objStartPosition))
        addLine(currentPosition, objStartPosition, constants.moveType.AddedTr, dblWidth, dblHeight);


    const lineObj = {
        "startPos": objStartPosition,
        "endPos": objEndPosition,
        "mType": strPrintTravel,
        "width": dblWidth,
        "height": dblHeight,
        "overrides": objOverrides
    }

    generatedLinesCurrentLine.push(lineObj);


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



    for (let key of keys) {

        if (object[key] === "E")
            object[key] = Number(object[key].toFixed(5));
        else
            object[key] = Number(object[key].toFixed(3));

        gcodeString.push(key + object[key]);
    }

    return gcodeString.join(" ");
}

function cartesianDisplacementOfLine(line, displacementParameters) {

    const retLine = { ...line };
    const startPos = line.startPos;
    const endPos = line.endPos;

    const newStartPos = calculateNewPosition(startPos, displacementParameters);
    const newEndPos = calculateNewPosition(endPos, displacementParameters);

    retLine["startPos"] = newStartPos;
    retLine["endPos"] = newEndPos;

    return retLine;

}

function polarDisplacementOfLine(line, centrePos, angleDisplacement, radiusDisplacement, zDisplacement) {

    const retLine = { ...line };
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

    retLine["startPos"] = newStartPos;
    retLine["endPos"] = newEndPos;

    return retLine;
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


            if (parsedLine.tStep.value > 0)
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


                    let overrides = {};
                    if (parsedLine.overrides !== undefined) {

                        const overrideKeys = Object.keys(parsedLine.overrides);


                        for (let key of overrideKeys) {
                            overrides[key] = {};
                            overrides[key]["value"] = solveExpression(parsedLine.overrides[key], tVal, currentPosition.x, currentPosition.y, currentPosition.z, undefined, tStep);
                        }
                    }

                    const distance = Number(getDistance(startPos, endPos).toFixed(5));
                    if (distance != 0) {
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
                    }

                    posCurrent = endPos;

                }

            else
                for (let tVal = parsedLine.tStart.value; tVal > parsedLine.tEnd.value; tVal = tVal + parsedLine.tStep.value) {


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


                    let overrides = {};
                    if (parsedLine.overrides !== undefined) {

                        const overrideKeys = Object.keys(parsedLine.overrides);


                        for (let key of overrideKeys) {
                            overrides[key] = {};
                            overrides[key]["value"] = solveExpression(parsedLine.overrides[key], tVal, currentPosition.x, currentPosition.y, currentPosition.z, undefined, tStep);
                        }
                    }

                    const distance = Number(getDistance(startPos, endPos).toFixed(5));
                    if (distance != 0) {
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
                    }

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

                zDisp += parsedLine.zDisp.value;
                angleDisplacement += parsedLine.angleIncrement.value;
                radiusDisplacement += parsedLine.radiusIncrement.value;

                for (let i of repeatedFeatures) {

                    const featureLines = generatedLines[i - 1].filter((elem) => elem.mType !== constants.moveType.AddedTr);
                    const displacedLines = featureLines.map((line) => {

                        if (line.mType !== constants.moveType.GC)
                            return polarDisplacementOfLine(line, { x: xCentre, y: yCentre, z: line.startPos.z }, angleDisplacement, radiusDisplacement, zDisp);

                        else
                            return line;
                    });

                    linesToDraw = linesToDraw.concat(displacedLines);
                }
            }

            break;
        }

        case "repeatCartesian": {

            let posCurrent = parsedLine["currentPosition"];

            const positionalArguments = { x: parsedLine.xDisp, y: parsedLine.yDisp, z: parsedLine.zDisp };

            const xDisp = parsedLine.xDisp.value;
            const yDisp = parsedLine.yDisp.value;
            const zDisp = parsedLine.zDisp.value;

            const repeatedFeatures = parsedLine.repeatedFeatures.value;

            for (let j = 1; j <= parsedLine.numberOfRepeats.value; j++) {

                const displacementArguments = { ...positionalArguments };
                displacementArguments.x.value = xDisp * j;
                displacementArguments.y.value = yDisp * j;
                displacementArguments.z.value = zDisp * j;

                for (let i of repeatedFeatures) {

                    const featureLines = generatedLines[i - 1].filter((elem) => elem.mType !== constants.moveType.AddedTr);
                    const displacedLines = featureLines.map((line) => {
                        if (line.mType !== constants.moveType.GC)
                            return cartesianDisplacementOfLine(line, displacementArguments)

                        else
                            return line;
                    });

                    linesToDraw = linesToDraw.concat(displacedLines);
                }
            }

            break;
        }
    }

    return linesToDraw;
}

function removeUneededHeadersFromGCode(prevValuesOfParameters, currentGCodeCommand) {

    //{x: undefined, y:undefined, z:undefined, feedRate: undefined}

    for (let key of Object.keys(prevValuesOfParameters)) {
        if (prevValuesOfParameters[key] === currentGCodeCommand[key]) {
            delete currentGCodeCommand[key];
        }
        else {
            prevValuesOfParameters[key] = currentGCodeCommand[key];
        }
    }


}

function lineToGCode(objStartPosition, objEndPosition, strPrintTravel, dblWidth, dblHeight, prevValuesOfParameters, objOverrides) {

    const objSpeeds = {};


    objSpeeds[constants.moveType.Tr] = currentSettings.temperatureSettings.travelSpeed;
    objSpeeds[constants.moveType.Pr] = currentSettings.temperatureSettings.printSpeed;


    const dblFeedstockFilamentDiameter = printerSpecificSettings[currentSettings.printerSettings.printerType]["nozzleDiameter"];
    const strExtrusionUnits = printerSpecificSettings[currentSettings.printerSettings.printerType]["extrusionType"];

    let eMultiplier = 1;
    if (strExtrusionUnits === constants.extrusionType.vol)
        eMultiplier = 1;
    else if (strExtrusionUnits === constants.extrusionType.len)
        eMultiplier = 4 / (Math.PI * Math.pow(dblFeedstockFilamentDiameter, 2));




    const parametersOfCommand = {};

    const generatedCommand = {};

    let commandsToReturn = [];
    let retractionCommand = [];
    let unretractionCommand = [];


    const distance = getDistance(objStartPosition, objEndPosition);

    if (strPrintTravel === constants.moveType.Tr || strPrintTravel === constants.moveType.AddedTr) {

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

            retractionCommand = addRetract(objStartPosition.z, zHop, zHopSpeed, currentSettings.retractionSettings.retraction, currentSettings.retractionSettings.retractionSpeed);
            //generatedCommand["Z"] = eval(objEndPosition.z + currentSettings.retractionSettings.zHop);

            generatedCommand["Z"] = objEndPosition.z;

            removeUneededHeadersFromGCode(prevValuesOfParameters, generatedCommand)
            if (generatedCommand["Z"] !== undefined)
                generatedCommand["Z"] = objEndPosition.z + currentSettings.retractionSettings.zHop;

            //generatedLines.push(generatedCommand);

            unretractionCommand = addUnRetract(objEndPosition.z + currentSettings.retractionSettings.zHop, zHop, zHopSpeed, currentSettings.retractionSettings.unretraction, currentSettings.retractionSettings.unretractionSpeed);


        }
        else {
            generatedCommand["Z"] = objEndPosition.z;
            removeUneededHeadersFromGCode(prevValuesOfParameters, generatedCommand)
            //generatedLines.push(generatedCommand);
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

        removeUneededHeadersFromGCode(prevValuesOfParameters, generatedCommand)
        //generatedLines.push(generatedCommand);
    }

    commandsToReturn = commandsToReturn.concat(retractionCommand);
    commandsToReturn.push(generatedCommand);
    commandsToReturn = commandsToReturn.concat(unretractionCommand);

    return commandsToReturn;

}

function convertGeneratedLinesToGcode() {

    const prevValuesOfParameters = { "X": undefined, "Y": undefined, "Z": undefined, "F": undefined }

    for (let lineGroup of generatedLines) {
        for (let line of lineGroup) {
            //(objStartPosition, objEndPosition, strPrintTravel, dblWidth, dblHeight, prevValuesOfParameters, objOverrides) 
            if (line.mType === constants.moveType.GC)
                generatedGCode.push(line.value.value);
            else
                generatedGCode = generatedGCode.concat(lineToGCode(line.startPos, line.endPos, line.mType, line.width, line.height, prevValuesOfParameters, line.overrides));
        }
    }

    return prevValuesOfParameters;
}

function getGCode(editor) {

    generatedGCode = [{ G: 0, X: 100, Y: -3, Z: 0 }];
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
                addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.overrides);


                break;
            }

            case "lineEquation": {


                const lines = getLines(parsedLine);

                for (let lineParamters of lines) {
                    addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.overrides);

                }

                break;
            }


            case "linePolar": {

                const lineParamters = getLines(parsedLine)[0];
                addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.overrides);

                break;
            }

            case "repeatPolar": {

                const lines = getLines(parsedLine);

                for (let lineParamters of lines) {

                    if (lineParamters.mType !== constants.moveType.GC)
                        addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.overrides);
                    else
                        generatedLinesCurrentLine.push(lineParamters);
                }

                break;
            }

            case "repeatCartesian": {

                const lines = getLines(parsedLine);

                for (let lineParamters of lines) {
                    if (lineParamters.mType !== constants.moveType.GC)
                        addLine(lineParamters.startPos, lineParamters.endPos, lineParamters.mType, lineParamters.width, lineParamters.height, lineParamters.overrides);
                    else
                        generatedLinesCurrentLine.push(lineParamters);
                }

                break;
            }

            case "customGCode": {

                parsedLine["mType"] = constants.moveType.GC;

                generatedLinesCurrentLine.push(parsedLine);
                break;
            }
        }

    }



    const lastValuesOfParameters = convertGeneratedLinesToGcode();

    const stringifiedGCode = generatedGCode.map((command) => {
        return stringifyGcode(command);
    });
    return [stringifiedGCode, lastValuesOfParameters];
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
                    if (key !== "type") {

                        const regex = /`[a-zA-Z0-9_]+`/g;


                        const variablesToReplace = arg[key].value.match(regex);

                        let result = arg[key].value;

                        if (variablesToReplace !== null) {
                            for (let elem of variablesToReplace) {
                                if (elem.slice(1, -1) in definedParameters)
                                    result = result.replace(elem, definedParameters[elem.slice(1, -1)]);
                                else
                                    errorMessage = errorMessage + "line " + element.lineNumber + ": parameter " + elem.slice(1, -1) + " doesn't exist\n";

                            }
                        }



                        overrideStrings.push(key + "=" + result);
                    }

                args.push("[" + overrideStrings.join(",") + "]");

            }
            else if (arg.type === "expression") {
                const regex = /`[a-zA-Z0-9_]+`/g;


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

            else if (arg.type === "gCode") {

                const keys = Object.keys(arg.value);

                let stringGCode = "`";
                for (let key of keys) {
                    stringGCode = stringGCode + key + arg.value[key] + " ";
                }

                stringGCode = stringGCode + "`";

                args.push(stringGCode);
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
