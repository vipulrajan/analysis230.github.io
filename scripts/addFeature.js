const featurePrototypes = {
    lineCartesian: "lineCartesian(X1, Y1, Z1, X2, Y2, Z2, Pr/Tr, W, H, [Overrides])",
    lineEquation: "lineEquation(Xf, Yf, Zf, tStart, tEnd, tStep, W, H, [Overrides])",
    arc: "arc(XCentre, YCentre, ZCentre, r, aStart, arcAngle, CW/CCW, nSegments, [Overrides])",
    linePolar: "linePolar(xCentre, yCentre, zCentre, radiusPoint1, angleStart, Z1, radiusPoint2, angleEnd, Z2, Pr/Tr, W, H,[Overrides])",
    repeatPolar: "repeatPolar('repeatedFeatures', xCentre, yCentre, angleDisplacement, radiusDisplacement, zDisp, numberOfRepeats, 'repeatRules')",
    repeatCartesian: "repeatCartesian('repeatedFeatures', xDisp, yDisp, zDisp, numberOfRepeats, 'repeatRules')",
    customGCode: "customGCode(`gcode`)"
    //Line	Polar	X-centre	Y-centre	RadiusOfPoint1	AngleStart (0=+X,90=+Y)	Z1	RadiusOfPoint2	AngleEnd (0=+X,90=+Y)	Z2	"Print" or "Travel"	NomWidth	NomHeight	E=?;F=?;T=?     EvalueOverride;F-SpeedOverride:ToolNumber		

}

//3	Circle/arc	X-centre	Y-centre	Z-centre	Radius	AngleStart (0=+X,90=+Y)	ArcAngle (0-360)	CW or anti-CW	NumberOfSegments	NomWidth	NomHeight	E=?;F=?;T=?     EvaluePerSegmentOverride;F-SpeedOverride:ToolNumber						FirstLayerExtrusionMultiplier	1	no units																			
function addFeature(feature) {
    editor.insert(featurePrototypes[feature]);
    editor.insert("\n")
    document.getElementById("blurLayer").style.display = "none";
}


