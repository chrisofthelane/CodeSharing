//14 - Convert Events with Parameter

/*
    Retrieve plug-in parameter values
    
    Call GetParameter() with the parameter name to return a value (number object)
    with the parameter's current value. GetParameter() is typically used inside
    the "HandleMIDI function" or "ProcessMIDI function"
*/

//This example converts modulation events into note events and provides a slider
//to determine note lengths

var NeedsTimingInfo = true;

var cooling = false;
var coolingExpiredTime = 0;
var thresholdActive = false;
var collecting = false;
var currentHighValue = 0;
var collectingExpiredTime = 0;

var timingInfo;
//create a slider (default range 0 - 100)
var PluginParameters = [{   name:"CollectingMs", type:"lin", minValue:0, maxValue: 1000, 
                                                numberOfSteps:1000, defaultValue:100},
                        {	name:"CooldownMs", type:"lin", minValue:0, maxValue: 10000, 
												numberOfSteps:10000, defaultValue:2000},
                        {	name:"MinOneShotVelocity", type:"lin", minValue:0, maxValue: 127, 
												numberOfSteps:127, defaultValue:50},
						{	name:"MinOneShotPitch", type:"lin", minValue:0, maxValue: 127, 
												numberOfSteps:127, defaultValue:30},
						{	name:"MaxOneShotPitch", type:"lin", minValue:0, maxValue: 127, 
												numberOfSteps:127, defaultValue:120},
                        {   name:"MinOneShotVel", type:"lin", minValue:0, maxValue: 127, 
                                                numberOfSteps:127, defaultValue:30},
                        {   name:"MaxOneShotVel", type:"lin", minValue:0, maxValue: 127, 
                                                numberOfSteps:127, defaultValue:120},
						{	name:"OneShot CC", type:"lin", minValue:0, maxValue: 127, 
												numberOfSteps:127, defaultValue:25},
                        {   name:"OneShot Ch", type:"lin", minValue:1, maxValue: 16, 
                                                numberOfSteps:15, defaultValue:1},
                        {   name:"OneShot Length", type:"lin", minValue:0.1, maxValue: 8, 
                                                numberOfSteps: 50, defaultValue:2},
                        ];

	
function HandleOneShotCC(event)
{
    var minVelocity = GetParameter("MinOneShotVelocity");
    //check all events for dropping below threshold
    if (thresholdActive && event.value <= minVelocity)
    {
        thresholdActive = false;
    }

    //then check if we're in collecting mode.
    if (collecting == true)
    {
        if (event.value > currentHighValue){
            currentHighValue = event.value;
        }
        return;
    }
    
    if (cooling == false && thresholdActive == false && event.value > minVelocity)
    {
        thresholdActive = true;
        currentHighValue = event.value;
        collectingExpiredTime = ConvertBeatsToMs(timingInfo.blockEndBeat) + GetParameter("CollectingMs");
        collecting = true;
    }
}

function ProcessMIDI()
{
    timingInfo = GetTimingInfo();

    var blockStartTime = ConvertBeatsToMs(timingInfo.blockStartBeat);

    //check if collecting has expired
    if (collecting == true)
    {
        if (collectingExpiredTime < blockStartTime){
            collecting = false;
            TriggerOneShot();
        }
    }

    //also check cooling progress
    if (cooling == true)
    {
        if (coolingExpiredTime < blockStartTime)
        {
            cooling = false;
        }
    }
}

function TriggerOneShot()
{
    var note = new NoteOn; //create a NoteOn object
        
        //since CC range is 0-127, and pitch range is 1-127
        //convert a cc value of 0 to 1
        if(currentHighValue == 0)
            currentHighValue = 1;
            
        note.pitch = ScaleValue(currentHighValue, GetParameter("MinOneShotVelocity"), 127, GetParameter("MinOneShotPitch"), GetParameter("MaxOneShotPitch"));
        note.velocity = ScaleValue(currentHighValue, GetParameter("MinOneShotVelocity"), 127, GetParameter("MinOneShotVel"), GetParameter("MaxOneShotVel")); 
        note.channel = GetParameter("OneShot Ch");
        note.send(); //send note on
        Trace(note);
        var off = new NoteOff(note); //create a NoteOff object that inherits the
                                     //NoteOn's pitch and velocity
                                                 
        off.sendAfterBeats(GetParameter("OneShot Length"));
                                          
        coolingExpiredTime = ConvertBeatsToMs(timingInfo.blockEndBeat) + GetParameter("CooldownMs");
        cooling = true;       
}

function HandleMIDI(event) {

    event.send();

    if (event instanceof ControlChange && event.number == GetParameter("OneShot CC"))
    {
        HandleOneShotCC(event);
    }

}

function ScaleValue (inputValue, inputMin, inputMax, outputMin, outputMax) {
	return (((outputMax - outputMin) * (inputValue - inputMin)) / (inputMax - inputMin)) + outputMin;
}

function ConvertBeatsToMs( beats ){
	var msPerBeat = 60000 / GetTimingInfo().tempo;
	return beats * msPerBeat;
}