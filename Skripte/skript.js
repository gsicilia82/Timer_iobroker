
/* ####################################################################### */
// Nachfolgende Einträge zwingend anpassen:

// Eine Aufzählung für Geräte (z.B. Rollläden) angeben:
var deviceEnum = "enum.functions.blinds";

// Eine Aufzählung für States der Bedingungen:
var deviceCond = "enum.functions.timerconditions";

/* ####################################################################### */
// Nachfolgende Einträge nur optional anpassen:

// Hauptpfad des Timers unter javascript.0
var path = "Devices";

// Schrittweite der Minuten in DropDown für manuelle Zeitangabe
var minIncrement = 2;

// HTML Code aufteilen? Wenn pro Gerät eine eigenständige HTML Tabelle verwendet werden soll
var splitHTML = false;
// false: HTML Code wird vollständig in "Timer.Devices.TableHTML" geschrieben
// true : HTML Code nach Geräten aufteilen -> "Timer.Devices.HTML_<GeräteName>" 

// Log-Modus
var stdLog = true; // elementare Ausgabe, Schedule erstellt/gelöscht
var debugLog = false; // zusätzliche Ausgaben, z.B. zu den Bedingungen

// Logausgabe manipulieren, um z.B. Log-Parser zu verwenden
var logPraefix = "Rollo Timer: ";
var logSuffix = "";

// Anzeige nächster Timer mit Sollwerten?
// true: mit Sollwerten
// false: ohne Sollwerten
var showValues = true;

// Timer-Nr und/oder Symbol anzeigen? (true = Sichtbar)
// Mindestens eine Spalte muss true sein, sonst wird Timer-Nummer angezeigt.
// (Es werden beide Spalten angezeigt, wenn Ansicht gefiltert wird oder "splitHTML == true" ist)
var showTimerNr = true;
var showSymbol = true;

// Spalte für Gruppennummer anzeigen?
var showGroupNr = true;

// Symbole für Timer-Status in Tabelle, kopiert aus: https://emojipedia.org/
var symbDisab = "❌";
var symbEnab = "✅";

// Schriftgröße innerhalb Tabelle (Einheit "em")
var fontSize = 1.0;

// Soll-Werte für States, die nicht als Bools hinterlegt sind. Zahlenwerte können hier angepasst/gelöscht werden.
var sollDropDown = "0;5;10;15;20;30;40;50;60;70;80;90;100;Auf;Ab";
// Soll-Werte für Bool-States true/false (werden automatisch erkannt)
var sollDropDownBool = "An;Aus";
// Falls Soll-Werte individualisiert wurden, bitte nachfolgend die realen Werte hinterlegen/anpassen
var sollWertMapping = {"Auf": 100, "Ab": 0, "An": true, "Aus": false}

// Gruppennamen für Timer
// Es können auch mehr oder weniger als 10 Namen angegeben werden, 
var grpNames = "A;B;C;D;E;F;G;H;I;J";

// Funktionen in Tabelle mit Einfach-Klick (= true) oder Doppel-Klick (= false) ausführen?
var oneClick = true;

// Minimaler Zeitversatz zwischen Ansteuerung der Geräte (in Millisekunden)
// Realer Zeitversatz ergibt sich aus "Tabellenposition des Geräts (beginnend bei 0) * sendWithOffset
// Vorteilhaft, falls Signale bei zeitgleicher Ansteuerung verloren gehen könnten (z.B. 433MHz Aktoren)
var sendWithOffset = 200;

// Random-Zeitangabe auch nutzen wenn gemerkte Timer nachträglich über Bedingung ausgelöst werden?
// Falls Random-Countdown läuft, und Bedingung erfüllt sind, wird dies mit einem grünem Blinken in Tabelle ersichtlich.
// Random-Zeit wird in diesem Fall ausschließlich positiv bewertet (z.B.: -5 Minuten => +5 Minuten)
var bgTimerWithRandom = true;

// Haupt-Style für HTML der Bedingungen
var condStyle = `[class*="timer-select-css"] {display: block;font-weight: 700;color: #fff;line-height: 1.0;
                padding: .5em .5em .5em .5em;width: 100%;max-width: 100%;box-sizing: border-box;
                margin: 0;border: 1px solid #fff;box-shadow: 0 1px 0 1px rgba(0,0,0,.04);border-radius: .5em;
                -moz-appearance: none;-webkit-appearance: none;appearance: none;background-color: rgba(0,0,0,0.1);
                background-repeat: no-repeat, repeat;background-position: right .7em top 50%, 0 0;background-size: .65em auto, 100%;}`;

// Main Tabelle mit Header anzeigen?
var withHeader = true;

// Umschalten der Tabellen-Optik über Klasse
// Uhula CSS-v1: "mdui-table-card" oder "mdui-table-tile"
var toggleClass = "mdui-table-card";

/* ####################################################################### */
/* #### BEI MANUELLEM UPDATE, SKRIPT UNTERHALB DIESER ZEILE ERSETZEN! #### */

/**
 * * Weitere Infos: https://forum.iobroker.net/topic/23346/vorlage-variable-zeitsteuerung-mit-vis-editor
 * * Oder: https://github.com/gsicilia82/Timer_iobroker
 * * Autor: GiuseppeS / gsicilia82
 * 
 * Changelog v1.3.4 04.01.2023 (Skript)
 * - Bugfix: Aktivieren / Deaktivieren von Timern führte nicht zur Aktualisierung der Ansicht
 * 
 * Changelog v1.3.3 02.01.2023 (Skript)
 * - Wenn Aufzählungen nicht existieren oder Hauptaufzählung deviceEnum keine member hat, werden Fehler ausgegeben.
 * 
 * Changelog v1.3.2 20.12.2020 (Skript)
 * - Bugfix: Wenn bei den Bedingungen Strings als Vergleichswerte eingegeben werden müssen, können "" oder '' weggelassen werden!
 * 
 * Changelog v1.3.1 06.12.2020 (Skript)
 * - Steuerung über Buttons optimiert, wenn Device-Name nicht angezeigt wird (bei splitHTML==true oder gefilterte Ansicht)
 * 
 * Changelog v1.2.1 30.11.2020 (Skript)
 * - Bugfix: Updates der IDs von Bedingungen funktioniert nun ohne Fehlermeldung
 * - Lange String Passagen durch Backtick Strings ersetzt (Code besser zu lesen)
 * 
 */

/* ####################################################################### */

var device_members;
var condition_members;



var TageJSON = {1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 7: "So"};
var dblClickBlocker = false
var anzBedingungen = 9;
var scrollID = "javascript." + instance + ".Timer." + path + ".ScrollPos";
var scrollIdEditor = "javascript." + instance + ".Timer.Editor.ScrollPos";


// Falls neue Variablen fehlen, ab hier defaults setzen:
if (typeof oneClick === 'undefined') var oneClick = false;
if (typeof logSuffix === 'undefined') var logSuffix = "";
if (typeof sendWithOffset === 'undefined') var sendWithOffset = 200;
if (typeof bgTimerWithRandom === 'undefined') var bgTimerWithRandom = false;
if (typeof condStyle === 'undefined') var condStyle = `[class*="timer-select-css"] {display: block;font-weight: 700;color: #fff;line-height: 1.0;
                                                        padding: .5em .5em .5em .5em;width: 100%;max-width: 100%;box-sizing: border-box;
                                                        margin: 0;border: 1px solid #fff;box-shadow: 0 1px 0 1px rgba(0,0,0,.04);border-radius: .5em;
                                                        -moz-appearance: none;-webkit-appearance: none;appearance: none;background-color: rgba(0,0,0,0.1);
                                                        background-repeat: no-repeat, repeat;background-position: right .7em top 50%, 0 0;background-size: .65em auto, 100%;}`;
if (typeof withHeader === 'undefined') var withHeader = true;
if (typeof toggleClass === 'undefined') var toggleClass = "";


sollDropDown = sollDropDown + ";Reset";
sollDropDownBool = sollDropDownBool + ";Reset";


// Funktion zum Öffnen/Schließen der Dialogbox (EDIT-PopUp)
function dialogCtrl(cmd){
    // Aus Kompatibilität zu älteren Versionen wird nach bereits definierter Variable DlgWidget abgefragt.
    if (typeof DlgWidget === 'undefined') var DlgWidget = getState("javascript." + instance + ".Timer." + path + ".PopUpWidgetID").val;
    if (cmd == "open"){
        setState("vis.0.control.data"/*Data for control vis*/, DlgWidget );
        setState('vis.0.control.instance'/*Control vis*/, "FFFFFFFF");
        setState("vis.0.control.command"/*Command for vis*/, 'dialog');
        // Für MaterialDesignWidget
        setState("javascript." + instance + ".Timer." + path + ".MaterialDialogWidgetOpen", true);
    }
    else if (cmd == "close"){
        setState("vis.0.control.data"/*Data for control vis*/, DlgWidget );
        setState("vis.0.control.command"/*Command for vis*/, 'dialogClose');
        // Für MaterialDesignWidget
        setState("javascript." + instance + ".Timer." + path + ".MaterialDialogWidgetOpen", false);
    }
}


// Anzahl Keys in JSON ermitteln
function length(obj) {
    return Object.keys(obj).length;
}

// Einfaches Kopieren von JSON Objekten
function jsonCopy(src) {
    return JSON.parse(JSON.stringify(src));
}

// Erstellen des DropDown-Inhalts für Minuten Auswahl in PopUp Editor
function setMinutesDropDown() {
	var strDropDown = "";
    for (var i = 0; i < 60; i += minIncrement) {
        var tmp = (i <= 9 ? "0" : "") + i;
        strDropDown += tmp + ";";
    } 
    strDropDown = strDropDown.slice(0, strDropDown.length - 1); // Entfernen letztes Semikolon
    setState("javascript." + instance + ".Timer.Editor.DropDownMinutes", strDropDown);
}


// Zeigt alle kommenden Timer in Liste (optimiert für DropDown-Liste)
function nextTimer(){
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
    var timeStamp, checkTime, firstKey, splitKey, newKey;
    var allTimer = {};
    Object.keys(TimerJSON).forEach(function(key) {
        for(var i = 1; i <= length(TimerJSON[key]); i++) {
            // Hier werden alle Timer durchlaufen
            if (TimerJSON[key][i].Aktiv && TimerJSON[key][i].ConditionsTrue){
                // Timer ist Aktiv und Bedingungen sind erfüllt
                var tmp = TimerJSON[key][i].CronTage.split(",");
                for(var j = 0; j < tmp.length; j++) {
                    tmp[j] = (tmp[j] == 0 ? 7 : tmp[j]);
                    timeStamp = tmp[j] + " " + TimerJSON[key][i].Zeit;
                    if (showValues){
                        if (allTimer.hasOwnProperty(timeStamp)) {allTimer[timeStamp] += ", " + key + " (" + TimerJSON[key][i].Sollwert + ")"}
                        else {allTimer[timeStamp] = key + " (" + TimerJSON[key][i].Sollwert + ")";}
                    } else {
                        if (allTimer.hasOwnProperty(timeStamp)) {allTimer[timeStamp] += ", " + key}
                        else {allTimer[timeStamp] = key;}
                    }
                }
            }
        }
    });
    var allTimerLength = length(allTimer);
    var d = new Date();
    var actDay = (d.getDay() == 0 ? 7 : d.getDay());
    var actTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);
    var actTimeStamp = actDay + " " + actTime;

    if (allTimerLength == 0){
        setState("javascript." + instance + ".Timer." + path + ".NextDevice", "Keine Timer");
        if (getState("javascript." + instance + ".Timer." + path + ".NextDevices").val != "Keine Timer"){
            setState("javascript." + instance + ".Timer." + path + ".NextDevices", "Keine Timer");
        }
    }
    else if (allTimerLength == 1){
        firstKey = Object.keys(allTimer)[0];
        splitKey = firstKey.split(" ");
        newKey = TageJSON[splitKey[0]] + " " + splitKey[1];
        setState("javascript." + instance + ".Timer." + path + ".NextDevice", newKey + " - " + allTimer[firstKey]);
        if (getState("javascript." + instance + ".Timer." + path + ".NextDevices").val != newKey + " - " + allTimer[firstKey]){
            setState("javascript." + instance + ".Timer." + path + ".NextDevices", newKey + " - " + allTimer[firstKey]);
        }
    }
    else {
        var listBefore = "";
        var listAfter = "";
        var listComplete = "";
        Object.keys(allTimer).sort().forEach(function(key) {
            if (key > actTimeStamp){
                splitKey = key.split(" ");
                newKey = ( parseInt(splitKey[0]) == actDay ? "" : TageJSON[splitKey[0]]) + " " + splitKey[1];
                listAfter += newKey + " - " + allTimer[key] + ";" ;
            }
            else {
                splitKey = key.split(" ");
                newKey = TageJSON[splitKey[0]] + " " + splitKey[1];
                listBefore += newKey + " - " + allTimer[key] + ";" ;
        };
        });
        listComplete = listAfter + listBefore;
        setState("javascript." + instance + ".Timer." + path + ".NextDevice", listComplete.split(";")[0]);
        if (getState("javascript." + instance + ".Timer." + path + ".NextDevices").val != listComplete.slice(0, listComplete.length - 1)){
            setState("javascript." + instance + ".Timer." + path + ".NextDevices", listComplete.slice(0, listComplete.length - 1));
        }
    }
}


// Initiales erstellen des JSON für States der Bedingungen
// Aufruf erfolgt aus main-Function
function createConditionsJSON(){
    var ConditionJSON = {};
    var dropDownListe = "";
    // ConditionJSON wird bei jedem Skript-Start neu erstellt da keine relevanten Alt-Daten vorhanden sind
    for(var i = 0; i < condition_members.length; i++) {
        var condName = getObject(condition_members[i]).common.name;
        ConditionJSON[condName] = condition_members[i];
    }
    // DropDown-Liste: Für alphabetische Sortierung nicht in for-Schleife oben integrierbar
    Object.keys(ConditionJSON).sort().forEach(function(key) {
        dropDownListe += key + ";";
    });
    dropDownListe = dropDownListe.slice(0, dropDownListe.length - 1); // Entfernen letztes Semikolon
    setState("javascript." + instance + ".Timer.Editor.ConditionKeyDropDown", dropDownListe);
    setState("javascript." + instance + ".Timer.Editor.ConditionJSON", JSON.stringify(ConditionJSON));
}


// Bedingungen der Timer werden geprüft und in TimerJSON geschrieben
// Verwendung für VIS: HTML-Tabelle und Next-Timer
// Falls Bedingungen für "gemerkte" Time true werden, dann wird Device gesteuert
var randomTimeouts = {};
function updateCond(){
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
    Object.keys(TimerJSON).forEach(function(key) { // Alle Devices werden durchlaufen
        for(let i = 1; i <= length(TimerJSON[key]); i++) { // Alle Timer innerhalb Devices werden durchlaufen
            let deviceNr = TimerJSON[key][i]["DeviceNr"];
            let scheduleNr = deviceNr * 10 + i;
            let result = condEval(TimerJSON[key][i]);
            TimerJSON[key][i].ConditionsTrue = result;

            // Wenn Bedingungen true sind und aktueller Timer als gemerkter Timer aktiv ist
            // zusätzlich prüfen ob bereits ein setTimeout für diesen Timer läuft
            if (result && subscribesList[key] == scheduleNr && !randomTimeouts[key] ){
                let rand = Math.floor(Math.random() * ( TimerJSON[key][i]["Random"] + 1));
                let sollwert = TimerJSON[key][i]["Sollwert"];
                // ggf. Random-Minuten beachten und in Timeout verrechnen
                let timeout = ( bgTimerWithRandom ? rand*60000 + deviceNr*sendWithOffset/2 : deviceNr*sendWithOffset/2);
                if(stdLog && bgTimerWithRandom && TimerJSON[key][i]["Random"] > 0) console.log(logPraefix + key + " (" + sollwert + ") -> Timer wird in " + rand + " Minuten ausgeführt. Bedingung(en) nachträglich erfüllt!" + logSuffix);
                randomTimeouts[key] = setTimeout(function(){
                    // Tatsächliche Ausführung nur wenn Bedingungen noch nach Verzögerung timeout erfüllt sind!
                    if (condEval(TimerJSON[key][i])){
                        subscribesList[key] = 0; // aus Liste gemerkter Timer entfernen
                        delete randomTimeouts[key];
                        if(debugLog) console.log("Timer im Hintergrund: " + JSON.stringify(subscribesList));
                        if(stdLog) console.log(logPraefix + key + " (" + sollwert + ") -> Timer ausgeführt. Bedingung(en) nachträglich erfüllt!" + logSuffix);
                        setState(TimerJSON[key][i]["ObjID"], mapping(sollwert));
                    } else {
                        delete randomTimeouts[key];
                        if(stdLog) console.log(logPraefix + key + " (" + sollwert + ") -> Timer nicht ausgeführt! Bedingung(en) zwar nachträglich erfüllt aber inzwischen revidiert!" + logSuffix);
                    }
                    tableMain(500);
                }, timeout)
            }
        }
    });
    // Tabellen-Update erfolgt über zwischenweg mit TimerJSON
    setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
}


// Führt Evaluation der Bedingungen durch und gibt true oder false zurück
// Aufruf nur aus Funktion autoScheduler
function condEval(DeviceJSON){
    var sumEval, strEval1, strEval2, strEval3;
    var conditionsNr = parseInt(DeviceJSON.ConditionsNr);
    switch(conditionsNr){
        case 0:
            sumEval = true;
            break;
        default: /* Alle Bedingungen mit && verknüpfen, somit */
            let evalStr = "";
            for (let i = 1; i <= conditionsNr; i++){
                evalStr += DeviceJSON.Conditions[i].ConditionStr;
                if (i < conditionsNr) evalStr += " && ";
            }
            sumEval = eval(evalStr);
            break;
    }
    return sumEval;
}


// Sollwert Mapping zu Variable "sollWertMapping" im oberen Bereich
function mapping(sollwert){
    // Verschiedene Mappings aus Editor-DropDown zu realen States erstellen
    if(sollWertMapping.hasOwnProperty(sollwert)){
        sollwert = sollWertMapping[sollwert]
    } else (sollwert = parseInt(sollwert));

    return sollwert
}

// Schedules werden variabel erstellt; zunächst wird gelöscht und wenn create=true wird neu erstellt
// Auswertung der Bedingungen erfolgt erst bei Ausführung des Schedules
var subscribesList = {}; // -> Gespeicherte Timer werden hier notiert; genutzt für Darstellung in VIS und Abfragen. Beispiel-Aufbau: {"Rollo_Balkon": 22, ...}
var cronArr = [];        // -> Enthält Schedules über alle Devices und Timer, die aktiv sind
function autoScheduler(TimerJSON, device, nr) {
    var condArr = [];
    var deviceNr = TimerJSON[device][nr].DeviceNr;
    var scheduleNr = (deviceNr * 10) + nr;
    var aktiv = TimerJSON[device][nr].Aktiv;
    var cronString = TimerJSON[device][nr].Cron;
    var objID = TimerJSON[device][nr].ObjID;
    var conditionState = TimerJSON[device][nr].ConditionsTrue;
    var rememberState = TimerJSON[device][nr].RememberTimer;
    var conditionsNr = parseInt(TimerJSON[device][nr].ConditionsNr);
    var sollwert = TimerJSON[device][nr].Sollwert;
    
    // Timer zunächst immer löschen (weil täglich neue Astro-Zeiten und Randoms genutzt werden sollen)
    if (cronArr[scheduleNr]){
        if(stdLog) console.log("Schedule für \"" + device + " #" + nr + "\" [" + scheduleNr + "] gelöscht!");
        clearSchedule(cronArr[scheduleNr]); cronArr[scheduleNr] = null;
    } else{
        if(debugLog) console.log("Schedule für \"" + device + " #" + nr + "\" (" + scheduleNr + ") nicht vorhanden! Kein Löschen notwendig!");
    }
    // Timer neu erstellen falls AKTIV == true
    if (aktiv){

        if(stdLog) console.log("Schedule aktiviert: \"" + device + " #" + nr + "\": [" + scheduleNr + "] | " + cronString + " | " + objID + " | " + sollwert);
        
        cronArr[scheduleNr] = schedule(cronString, function(){
            if( condEval(TimerJSON[device][nr]) ){
                setTimeout(function(){
                    if(stdLog) console.log(logPraefix + device + " (" + sollwert + ")" + logSuffix);
                    if (sollwert != "Reset") setState(objID, mapping(sollwert));
                    if (subscribesList[device] > 0){
                        subscribesList[device] = 0;
                        if (randomTimeouts[device]){
                            clearTimeout(randomTimeouts[device]);
                            delete randomTimeouts[device];
                        }
                        if(stdLog) console.log("Aktiver Background-Timer für \"" + device + "\" gelöscht!");
                        if(debugLog) console.log("Noch befindliche Timer im Hintergrund: " + JSON.stringify(subscribesList));
                    }
                    tableMain(500); // aktualisieren der Tabelle
                }, deviceNr*sendWithOffset/2)
            } else if (rememberState){
                if(stdLog) console.log(logPraefix + device + " (" + sollwert + ") -> Timer gespeichert. Bedingung(en) noch nicht erfüllt!" + logSuffix);
                subscribesList[device] = scheduleNr;
                if(debugLog) console.log("Timer im Hintergrund: " + JSON.stringify(subscribesList));
                tableMain(500);
            } else {
                if(stdLog) console.log(logPraefix + device + " (" + sollwert + ") -> Nicht ausgeführt. Bedingung(en) nicht erfüllt!" + logSuffix);
                tableMain(500);
            };
        });
    } else {
        // Falls Timer deaktiviert wird, während es gespeichert war... In Liste zurücksetzen!
        if (subscribesList[device] == scheduleNr){
            if(debugLog) console.log("Schedule für \"" + device + " #" + nr + "\" [" + scheduleNr + "] -> Timer aus Speicher entfernt!");
            subscribesList[device] = 0;
            if(debugLog) console.log("Timer im Hintergrund: " + JSON.stringify(subscribesList));
        }
    }
}


// Background-Timer aus "Timer merken" löschen
function resetBackgroundTimers(target){
    if (target == "all"){
        Object.keys(subscribesList).forEach(function(device) {
            if (subscribesList[device] > 0){
                if(stdLog) console.log("Aktiver Background-Timer für \"" + device + "\" gelöscht!" + (randomTimeouts[device] ? " Random-Countdown gestoppt!" : "" ));
                subscribesList[device] = 0;
                // Falls bereits ein Countdown für Random bei einem gemerkten Timer läuft, auch diesen Countdown stoppen
                if (randomTimeouts[device]){
                    clearTimeout(randomTimeouts[device]);
                    delete randomTimeouts[device];
                }
            }
        });
    } else {
        if (subscribesList[target] > 0){
            if(stdLog) console.log("Aktiver Background-Timer für \"" + target + "\" gelöscht!" + (randomTimeouts[target] ? " Random-Countdown gestoppt!" : "" ));
            subscribesList[target] = 0;
            if (randomTimeouts[target]){
                clearTimeout(randomTimeouts[target]);
                delete randomTimeouts[target];
            }
        } else {
            if(stdLog) console.log("Kein aktiver Background-Timer für \"" + target + "\" gefunden!");
        }
    }
    if(debugLog) console.log("Timer im Hintergrund: " + JSON.stringify(subscribesList));
    tableMain(500);
}


// Cron Tage in Wochentage umwandlen und ggf. abkürzen mit "von - bis"
function shortDays(cronTage) {
	var cronSplit, cronLast;
	var tageVIS = "";
	
	if (cronTage.substring(0,2) == ",0"){
    // 0 mit 7 ersetzen und ans Ende setzen
	  cronTage = cronTage.substring(2,cronTage.length) + ",7";
	}
	// Erstes Komma entfernen
	cronTage = cronTage.substring(1, cronTage.length);

    if (cronTage.length == 1){
        tageVIS = TageJSON[cronTage];
    }
    else if (cronTage.length == 13){
        tageVIS = "täglich";
    }
    else {
        cronSplit = cronTage.split(",");
        cronLast = cronSplit.length - 1;
        // Wenn Anzahl der Elemente = mathematische Differenz dann "aufeinanderfolgend", also kürzen
        if ((cronSplit[cronLast] - cronSplit[0]) == cronLast) {
        tageVIS = TageJSON[cronSplit[0]] + " - " + TageJSON[cronSplit[cronLast]];
        }
        else {
        for (var j = 0; j <= cronLast ; j++){
            tageVIS += TageJSON[cronSplit[j]] + ", ";
        }
        // letztes Komma entfernen
        tageVIS = tageVIS.substring(0, tageVIS.length-1);
        }
    }
  return tageVIS;
}

// Input:  Minute + Stunde + Zufallsbereich (1 bis 59 Min) + Vorzeichen von Zufall
// Return: Json Object mit Struktur von timeJSON, siehe unten
function randomTime(min,std,rand,opt) {
    // Erstellung des JSON mit Vorbelegung der Keys
    var timeJSON = {"Zeit": "23:59", "Cron": "59 23 * * *", "Std": "23", "Min": "59"};
    if (rand > 0){
        if (rand > 59) {rand = 59;}
        if (opt === "pm"){var delta_min = Math.floor(Math.random() * (rand - (-1 * rand) + 1) + (-1 * rand));}
        if (opt === "p"){var delta_min = Math.floor(Math.random() * (rand + 1));}
        if (opt === "m"){var delta_min = Math.floor(Math.random() * (rand + 1) - rand);}
    	min += delta_min;
    	if (min >= 60){std++;min -= 60;}
    	else if (min < 0){std--;min += 60;}
    	if (std >= 24){std -= 24;}
    	else if (std < 0){std += 24;}
    }
	timeJSON.Zeit = (std <= 9 ? "0" : "") + std + ":" + (min <= 9 ? "0" : "") + min;
	timeJSON.Std = std;
	timeJSON.Min = min;
	timeJSON.Cron = min + " " + std + " *" + " * "; // Wochentage für Cron bewusst nicht vorhanden, wird später angehängt
    return timeJSON;
}

// Input timeJSON aus function randomTime + Offset + Vorzeichen von Offset
// Output timeJSON mit verrechnetem Offset
function offsetTime(randJSON,offset,opt) {
    var min = randJSON.Min, std = randJSON.Std, delta_min = 0, delta_std = 0;
    var timeJSON = {"Zeit": "23:59", "Cron": "59 23 * * *", "Std": "23", "Min": "59"};
    if (offset > 0){
        if (opt === "p"){ delta_std = Math.trunc(      offset / 60 ); delta_min =      offset - delta_std * 60}
        if (opt === "m"){ delta_std = Math.trunc( -1 * offset / 60 ); delta_min = -1 * offset - delta_std * 60}
        min += delta_min;
        std += delta_std;
    	if (min >= 60){std++;min -= 60;}
        else if (min < 0){std--;min += 60;}
    	if (std >= 24){std -= 24;}
    	else if (std < 0){std += 24;}
    }
	timeJSON.Zeit = (std <= 9 ? "0" : "") + std + ":" + (min <= 9 ? "0" : "") + min;
	timeJSON.Std = std;
	timeJSON.Min = min;
	timeJSON.Cron = min + " " + std + " *" + " * "; // Wochentage für Cron bewusst nicht vorhanden, wird später angehängt
    return timeJSON;
}

// Setzt die 3 Felder für Astro-DropDown Werte, Texte und das Json für spätere Berechnungen.
function setAstro(withRecalc=true) {
    var strWerte = "manuell";
    var strTexte = "manuell";
    var AstroJSON = {};
    var tmpAstro;
    var astro_times = ["sunrise", "sunriseEnd", "goldenHourEnd", "solarNoon", "goldenHour", "sunsetStart", "sunset", "dusk", "nauticalDusk", "nadir", "nauticalDawn", "dawn"]
    var defaultJSON = {"Zeit" : "10:00", "Std" : 10, "Min" : 0};
    
    astro_times.forEach(function(entry) {
        tmpAstro = entry;
        var zeit = formatDate(getDateObject(getAstroDate(tmpAstro, undefined, 0)), "hh:mm");
        var zeitSplit = zeit.split(':');
        AstroJSON[tmpAstro] = jsonCopy(defaultJSON);
		AstroJSON[tmpAstro].Zeit = zeit;
		AstroJSON[tmpAstro].Std = parseInt(zeitSplit[0]);
		AstroJSON[tmpAstro].Min = parseInt(zeitSplit[1]);
        strTexte += ";" + tmpAstro + ", " + zeit;
        strWerte += ";" + tmpAstro;
    });

	setState("javascript." + instance + ".Timer.Astro.DropDownAstroTexte", strTexte);
	setState("javascript." + instance + ".Timer.Astro.DropDownAstroWerte", strWerte);
	setState("javascript." + instance + ".Timer.Astro.AstroJSON", JSON.stringify(AstroJSON));

    if (withRecalc) setTimeout(recalc, 10000);
}


// recalc wird täglich nach Bezug neuer Astrodaten ausgeführt und berechnet Random neu
// Trigger erfolgt vorzugsweise nach Trigger für setAstro
// recalc erfolgt auch wenn CopyAll im Editor PopUp aktiviert wird
function recalc() {
    var CalcJSON = {};
    var astro, device, nr;
    var AstroJSON = JSON.parse(getState("javascript." + instance + ".Timer.Astro.AstroJSON").val);
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
    Object.keys(TimerJSON).forEach(function(key) {
        for(var i = 1; i <= length(TimerJSON[key]); i++) {
            astro = TimerJSON[key][i].Astro;
            device = key;
            nr = i;
            if (astro === "manuell" ){
                CalcJSON = randomTime(parseInt(TimerJSON[key][i].Min,10), parseInt(TimerJSON[key][i].Std,10), TimerJSON[key][i].Random, TimerJSON[key][i].RandPM);
            }
            else {
                CalcJSON = randomTime(parseInt(AstroJSON[astro].Min,10), parseInt(AstroJSON[astro].Std,10), TimerJSON[key][i].Random, TimerJSON[key][i].RandPM);
                CalcJSON = offsetTime(CalcJSON, TimerJSON[key][i].Offset, TimerJSON[key][i].OffsetPM);
            }
            TimerJSON[key][i].Zeit = CalcJSON.Zeit;
            TimerJSON[key][i].Cron = CalcJSON.Cron + TimerJSON[key][i].CronTage;
            TimerJSON[key][i].ConditionsTrue = condEval(TimerJSON[key][i]);
            autoScheduler(TimerJSON, key, i);
        }
    });
    setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
    setState("javascript." + instance + ".Timer.Editor.Nummer", "", true);
    setState("javascript." + instance + ".Timer.Editor.Device", "", true);
}


// Auswahl des Timers wird automatisch zurückgesetzt; für dauerhaft bessere Optik und Schutz vor Fehleingaben
var focusTimeOut;
function delFocusOnTimer(option) {
    if (option){
        if (focusTimeOut) {clearTimeout(focusTimeOut); focusTimeOut = null;}
        focusTimeOut = setTimeout(function(){
                setState("javascript." + instance + ".Timer.Editor.Nummer", "", true);
                setState("javascript." + instance + ".Timer.Editor.Device", "", true);
            }, 5000)
    } else {
        if (focusTimeOut) {clearTimeout(focusTimeOut); focusTimeOut = null;}
    }
}

// Hilfsfunktion für Select-HTML in Editor
function getSelector({ selectClass, defOption, listOptions, selectedOption, condNr, column }){
    // "<" and ">" are html tags, therefore mapping is required!
    let map = {"==": "==", "!=": "!=", "<=": "&#60;=", "<": "&#60;", ">": "&#62;", ">=": "&#62;="};
    //if (debugLog) console.log("Class: " + selectClass + " | Default: " + defOption + " | Selected: " + selectedOption + " | CondNr: " + condNr + " | Column: " + column);
    let html = '<select class="' + selectClass + '" onchange="setOnEdit' + path + '(this.value)">';
    let listItems = listOptions.split(";");
     /* Beispiel: value = 2~state~AtHome */
    if ( defOption != "" ) html += '<option ' + (selectedOption == "" ? 'selected' : '' ) + ' disabled value="' + condNr + "~" + column + "~" + defOption + '">' + defOption + '</option>';
    for (let i = 0; i < listItems.length; i++){
        html += '<option ' + (selectedOption == listItems[i] ? 'selected' : '' ) + ' value="' + condNr + "~" + column + "~" + listItems[i] + '">' + (column == "comp" ? map[listItems[i]] : listItems[i]) + '</option>';
    }
    html += '</select>';
    return html
}

// HTML-Erzeugung für Darstellung der Bedingungen in Editor
function makeCondHtml(toBottom=false){
    let ConditionJSON = JSON.parse(getState("javascript." + instance + ".Timer.Editor.ConditionJSON").val);
    let listCondStates = getState("javascript." + instance + ".Timer.Editor.ConditionKeyDropDown").val;

    let countCond = getState("javascript." + instance + ".Timer.Editor.ConditionsNr").val;

    let html = `
            <style>
              ${condStyle}
             .timer-select-css:focus {color: #fff;background-color: rgba(0,0,0,0.9);}
             .timer-select-css-green:focus {color: #fff;background-color: rgba(0,0,0,0.9);}
             .timer-select-css-red:focus {color: #fff;background-color: rgba(0,0,0,0.9);}
             .timer-select-css-red {border: 1px solid #f00;color: #FF0000;}
             .timer-select-css-green {border: 1px solid #00FF7F;color: #00FF7F;}
            </style>`;

    html += '<body><table id=tableEditor-' + path + ' style="font-size:1em;width:100%;table-layout:fixed;"><tbody>';

    for (let i = 1; i <= countCond; i++){
        let selectClass;
        let isBool;
        let state = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "State").val;
        let comp  = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Comp").val;
        let value = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Value").val;

        ( state != "" && getObject(ConditionJSON[state]).common.type == "boolean" ? isBool = true : isBool = false );

        // Class für farbige Darstellung wählen
        if (state == "" || comp == "" || value == ""){
            selectClass = "timer-select-css";
        } else if (getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Result").val){
            selectClass = "timer-select-css-green";
        } else {
            selectClass = "timer-select-css-red";
        }
        
        // Selects für HTML erstellen
        html += '<tr' + ( i == countCond ? ' id="bottom" ' : '') + '><td colspan="4">';
        html += getSelector({ selectClass:selectClass, defOption:"Bitte wählen", listOptions: listCondStates, selectedOption:state, condNr:i, column:"state" });
        
        if (state != ""){ // Weitere Selects bzw. Input erst nach State-AUswahl anzeigen
            html += '</td><td style="width:50px" colspan="1">';
            html += getSelector({ selectClass:selectClass, defOption:"?", listOptions:(isBool ? "==;!=" : "==;!=;<=;<;>;>="), selectedOption:comp, condNr:i, column:"comp" });
            html += '</td><td style="width:65px" colspan="1">';
            html += (isBool  ? getSelector({ selectClass:selectClass, defOption:"?", listOptions:"true;false", selectedOption:value, condNr:i, column:"value" }) : "" )
            html += (!isBool ? '<input class="' + selectClass + '" value="' +  value + '" type="text" onchange="setOnEdit' + path + '(\'' + i + "~value~" + '\' + this.value)">' : "" )
        } else {
            html += '</td><td colspan="1">';
            html += '</td><td colspan="1">';
        }

        html += '</td></tr>';
    }

    html += '</tbody></table></body>';
    
    html += `
        <script>
            var targetEleEditor;
            setTimeout( ()=> {
                targetEleEditor = $("#tableEditor-${path}").closest(".vis-tpl-basic-HTML");
                ${toBottom ? 'document.getElementById( "bottom" ).scrollIntoView();' : `targetEleEditor.scrollTop(${getState(scrollIdEditor).val});` }
            }, 20 )
            function setOnEdit${path}(val) {
                var objID = "javascript.${instance}.Timer.Editor.ClickTarget";
                servConn.setState(objID, val + "~" + targetEleEditor.scrollTop() );}
        </script>`;

    setState("javascript." + instance + ".Timer.Editor.ConditionsHtml", html);
}


// Editor öffnen
function openEditor(device, nr){
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
    
    // Wenn Zielgerät ein Boolean, dann Sollwert-DropDown entsprechend befüllen (An/Aus o.ä)
    if (getObject(TimerJSON[device][1].ObjID).common.type == "boolean"){
        setState("javascript." + instance + ".Timer.Editor.SollwertDropDown", sollDropDownBool);
    } else {
        setState("javascript." + instance + ".Timer.Editor.SollwertDropDown", sollDropDown);
    }

    // Editor States befüllen
    createConditionsJSON(); // DropDown-Liste für Auswahl der Bedingungen
    setMinutesDropDown();   // DropDown-Liste für Minuten-Auswahl erstellen

    var stateArr = ["Zeit","Std","Min","Cron","Sollwert","TageVIS","CronTage","Astro","Random","RandPM","Offset","OffsetPM","Mo","Di","Mi","Do","Fr","Sa","So","RememberTimer","ConditionsNr","Gruppe"];
    for (let key of stateArr){
        setState("javascript." + instance + ".Timer.Editor." + key, TimerJSON[device][nr][key], true);
    }

    for (let i = 1; i <= anzBedingungen; i++){
        setState("javascript." + instance + ".Timer.Editor.Condition" + i, TimerJSON[device][nr].Conditions[i].ConditionStr, true);
        setState("javascript." + instance + ".Timer.Editor.Cond" + i + "State", TimerJSON[device][nr].Conditions[i].CondState, true);
        setState("javascript." + instance + ".Timer.Editor.Cond" + i + "Comp", TimerJSON[device][nr].Conditions[i].CondComp, true);
        setState("javascript." + instance + ".Timer.Editor.Cond" + i + "Value", TimerJSON[device][nr].Conditions[i].CondValue, true);
        if (i <= TimerJSON[device][nr].ConditionsNr){
            setState("javascript." + instance + ".Timer.Editor.Cond" + i + "Result", eval(TimerJSON[device][nr].Conditions[i].ConditionStr));
        } else {
            setState("javascript." + instance + ".Timer.Editor.Cond" + i + "Result", false);
        }
    }
    setState(scrollIdEditor, 0);
    setTimeout(makeCondHtml,200);

    setTimeout(dialogCtrl,400,"open");
    delFocusOnTimer(false); // Auswahl des Timers nicht automatisch zurücksetzen!
}


// Wenn Status "Aktiv" über Tabellen-Klick geändert wird
function toggleActivation(device, nr) {
    
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val); // einlesen der Einträge aus State

    TimerJSON[device][nr].Aktiv = !TimerJSON[device][nr].Aktiv;
    // Schedule setzen bzw. löschen
    TimerJSON[device][nr].ConditionsTrue = condEval(TimerJSON[device][nr]);
    autoScheduler(TimerJSON, device, nr);
    setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON), true); // rückschreiben in State
}

// ENDE DER HILFS-FUNKTIONEN
// ##########################################################################################################
// ##########################################################################################################
// Trigger bzw. Schedules für Funktionen

function activateSchedules(){

    // Astro-Zeiten werden täglich aktualisiert, anschließend neu Berechnung der Timer
    schedule('1 4 * * *', setAstro);

    // Darstellung zukünftiger Timer
    schedule('30 * * * * *', nextTimer);
}

// ENDE DER Trigger bzw. Schedules
// ##########################################################################################################
// ##########################################################################################################
// NACHFOLGEND DIE TRIGGER AUS VIS

function activateTrigger(){

    if(debugLog) console.log("Standard-Subscribtions aktiviert!");
    

    // One-Click Aktion aus Tabelle zur Auswahl des Timers
    on({id: "javascript." + instance + ".Timer." + path + ".clickTarget", change: "any"}, function (obj) {

        delFocusOnTimer(true);

        if (debugLog) console.log("Klick aus Tabelle erkannt. Übergebener Wert: " + obj.state.val);
        
        setState("javascript." + instance + ".Timer.ActiveTable", path);

        var tmp = obj.state.val.split("~");
        var btnSource = tmp[2]; // Button-Funktion wird eingelesen

        // States müssen gesetzt werden, damit die Buttons "Add" und "Del" einen Ziel-Timer haben
        if (tmp[0] != "all") { // "all" ist ein Tag der Überschriften, daher folgt keine Timer-Auswahl
            setState("javascript." + instance + ".Timer.Editor.Device", tmp[0]);
            setStateDelayed("javascript." + instance + ".Timer.Editor.Nummer", parseInt(tmp[1]), 50, false);
        }

        if (oneClick == true){ // Wenn Tabellen Funktionen mit One-Click gewünscht werden ...

            if (btnSource == "time"){ // Edit-Dialog öffnen bei Doppelklick IST-Zeit-Button
                openEditor(tmp[0], parseInt(tmp[1]));
            }

            if (btnSource == "digit" || btnSource == "symb"){ // Aktivieren/Deaktivieren des Timers
                toggleActivation(tmp[0], parseInt(tmp[1]));
                tableMain(2000);
            }

            if (btnSource == "cond"){ // Löschen der Timer im Hintergrund
                resetBackgroundTimers(tmp[0]);
                tableMain(2000);
            }
        }
    });

    // Double-Click Aktion aus Tabelle für Spezialfunktionen
    on({id: "javascript." + instance + ".Timer." + path + ".dblClickTarget", change: "any"}, function (obj) {
    	
        if(debugLog) console.log("Doppelklick aus Tabelle erkannt. Übergebener Wert: " + obj.state.val);

        var tmp = obj.state.val.split("~");
        var btnSource = tmp[2]; // Button-Funktion wird eingelesen

        if (btnSource == "dev"){ // Edit-Dialog öffnen bei Doppelklick Geräte-Button
            openEditor(tmp[0], parseInt(tmp[1])); // Parameter: (Device, Nummer)
        }

        if (oneClick == false){ // Restl. Doppelklick-Funktionen deaktivieren, wenn One-Click gewünscht wird

            if (btnSource == "time"){ // Edit-Dialog öffnen bei Doppelklick IST-Zeit-Button
                openEditor(tmp[0], parseInt(tmp[1]));
            }

            if (btnSource == "digit" || btnSource == "symb"){ // Aktivieren/Deaktivieren des Timers
                toggleActivation(tmp[0], parseInt(tmp[1]));
                tableMain(2000);
            }

            if (btnSource == "cond"){ // Löschen der Timer im Hintergrund
                resetBackgroundTimers(tmp[0]);
                tableMain(2000);
            }
        }
    });


    // Alle Backgroud-Timer aus "Timer merken" löschen
    on({id: "javascript." + instance + ".Timer." + path + ".ResetBackgroundTimers", change: "ne"}, function (obj) {
        if (obj.state.val) {
            resetBackgroundTimers("all"); // = Alle löschen
            setStateDelayed("javascript." + instance + ".Timer." + path + ".ResetBackgroundTimers", false, 500, false);
        }
    });


    // Device aus Filter-DropDown in VIS, triggert ausschließlich HTML-Darstellung
    on({id: "javascript." + instance + ".Timer." + path + ".FilterDevice", change: "ne", ack: false}, function (obj) {
        tableMain(0);
    });


    // Trigger zur Erstellung der Tabelle in VIS
    on({id: "javascript." + instance + ".Timer." + path + ".TimerJSON", change: "ne", ack: false}, function (obj) {
        tableMain(0);
    });

    // Bedingungen für Timer werden auf Änderung geprüft (Trigger auf Array aus Aufzählung in "deviceCond")
    on({id: condition_members, change: "any"}, function (obj) {
        updateCond();
    });


    // Trigger auf Sollwerte/Devices: Wenn Sollwert geändert, dann löschen des Hintergrund-Timer (falls vorhanden)
    on({id: device_members, change: "ne"}, function (obj) {
        // Zurücksetzen gemerkter Timer aus "subscribesList{}" wenn Device getriggert wurde
        let device = obj.common.name;
        if (subscribesList[device] > 0){
            subscribesList[device] = 0;
            if(stdLog) console.log("Aktiver Background-Timer für \"" + device + "\" gelöscht: Device wurde verändert!" + (randomTimeouts[device] ? " Random-Countdown gestoppt!" : "" ));
            if(debugLog) console.log("Timer im Hintergrund: " + JSON.stringify(subscribesList));
            if (randomTimeouts[device]){
                clearTimeout(randomTimeouts[device]);
                delete randomTimeouts[device];
            }
            tableMain(500);
        }
    });


    // Bedingungen für Timer werden auf Änderung geprüft (Trigger auf Array aus Aufzählung in "deviceCond")
    on({id: "javascript." + instance + ".Timer.ActiveTable", change: "any"}, function (obj) {
        if (obj.state.val == path && EditSubsArr.length == 0){
            activateEditorTrigger();
        } else if (obj.state.val != path) {
            // Delete Editor Triggers...
            for (let i in EditSubsArr){
                unsubscribe(EditSubsArr[i]);
            }
            EditSubsArr = [];
            if (focusTimeOut) {clearTimeout(focusTimeOut); focusTimeOut = null;}
            if(debugLog) console.log("Editor-Subscribtions gelöscht!");
        }
    });

} // Ende activateTrigger()



var EditSubsArr = [];
function activateEditorTrigger(){

    if(debugLog) console.log("Editor-Subscribtions aktiviert!");

    // Trigger wenn Timer-Nummer vom Device aktualisiert wird 
    EditSubsArr[0] = on({id: "javascript." + instance + ".Timer.Editor.Add", change: "any", ack: false}, function (obj) {
        var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
        var baseNr = getState("javascript." + instance + ".Timer.Editor.Nummer").val;
        var device = getState("javascript." + instance + ".Timer.Editor.Device").val;
        var nr;

        // Zeit für Timer Fokus wird neu gestartet
        delFocusOnTimer(true);

        // Error-Handling
        if (getState("javascript." + instance + ".Timer.Editor.Device").val == ""){
            console.warn("Es wurde kein Timer gewählt. Bitte Timer wählen und Button 'ADD' innerhalb 5s betätigen")
            return
        }
        var devlen = length(TimerJSON[device]);

        if (baseNr == devlen){// Neuen Timer anhängen falls Basis für neuen Timer der letzte Timer war
            nr = devlen + 1;
            TimerJSON[device][nr] = TimerJSON[device][devlen];
            // Falls kopierter Timer aktiv war wird der Neue auch direkt gesetzt
            TimerJSON[device][nr].ConditionsTrue = condEval(TimerJSON[device][nr]);
            autoScheduler(TimerJSON, device, nr);

            setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
            setState("javascript." + instance + ".Timer.Editor.Nummer", nr);
        } else {
            // Mittendrin einfügen: Alle Timer darüber um eine Position verschieben
            // -> Timer zunächst deaktivieren, dann verschieben und erneut aktivieren, alte Position löschen
            for(var j = devlen; j > baseNr; j--){
                var tmpAktiv = TimerJSON[device][j].Aktiv;
                TimerJSON[device][j].Aktiv = false
                TimerJSON[device][j].ConditionsTrue = condEval(TimerJSON[device][j]);
                autoScheduler(TimerJSON, device, j);
                TimerJSON[device][j+1] = TimerJSON[device][j];
                TimerJSON[device][j+1].Aktiv = tmpAktiv;
                TimerJSON[device][j+1].ConditionsTrue = condEval(TimerJSON[device][j+1]);
                autoScheduler(TimerJSON, device, j+1);
                delete TimerJSON[device][j];
            }
            nr = baseNr + 1;
            TimerJSON[device][nr] = TimerJSON[device][baseNr];
            TimerJSON[device][nr].ConditionsTrue = condEval(TimerJSON[device][nr]);
            autoScheduler(TimerJSON, device, nr);
            setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
            setState("javascript." + instance + ".Timer.Editor.Nummer", nr);
        }
    });


    // Trigger des Delete-Button für Löschen eines Timer-Eintrags
    EditSubsArr[1] = on({id: "javascript." + instance + ".Timer.Editor.Del", change: "any", ack: false}, function (obj) {
        
        // Error-Handling
        if (getState("javascript." + instance + ".Timer.Editor.Device").val == ""){
            console.warn("Es wurde kein Timer gewählt. Bitte Timer wählen und Button 'DEL' innerhalb 5s betätigen")
            return
        }
        
        var device = getState("javascript." + instance + ".Timer.Editor.Device").val;
        var nr = getState("javascript." + instance + ".Timer.Editor.Nummer").val;
        var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
        var devlen = length(TimerJSON[device]);

        // Zeit für Timer Fokus wird neu gestartet
        delFocusOnTimer(true);
    
        if (devlen > 1 ){
            // Aktueller Timer wird gelöscht
            TimerJSON[device][nr].Aktiv = false;
            autoScheduler(TimerJSON, device, nr); // Timer wird gelöscht da Aktiv=false
            delete TimerJSON[device][nr];
            
            if (nr < devlen){ // Wenn gelöschter Timer mittendrin, dann Rest verschieben
                for (var j = nr; j < devlen ; j++) {
                    var tmpAktiv = TimerJSON[device][j+1].Aktiv
                    TimerJSON[device][j+1].Aktiv = false
                    autoScheduler(TimerJSON, device, j+1);          // Timer wird gelöscht da Aktiv=false
                    TimerJSON[device][j] = TimerJSON[device][j+1];  // Timer wird auf niedrigere Position kopiert
                    delete TimerJSON[device][j+1];
                    TimerJSON[device][j].Aktiv = tmpAktiv;
                    TimerJSON[device][j].ConditionsTrue = condEval(TimerJSON[device][j]);
                    autoScheduler(TimerJSON, device, j);
                }
            }
            devlen = length(TimerJSON[device]);
            setState("javascript." + instance + ".Timer.Editor.Nummer", devlen);
            setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
        }
        else {
            // Letzter Timer und somit Device wird gelöscht
            TimerJSON[device][1].Aktiv = false;
            autoScheduler(TimerJSON, device, 1); // Timer wird gelöscht da Aktiv=false
            delete TimerJSON[device];
            var dropDownListe = getState("javascript." + instance + ".Timer." + path + ".DropDownDevice").val;

            console.log(dropDownListe.includes(";" + device + ";"));

            if(dropDownListe.includes(device + ";")){
                console.log("Device gefunden")
                dropDownListe = dropDownListe.replace(device + ";", "");
            }
            else if(dropDownListe.includes(";" + device)){
                console.log("Device am Ende gefunden")
                dropDownListe = dropDownListe.replace(";" + device, "");
            }
            setState("javascript." + instance + ".Timer." + path + ".DropDownDevice", dropDownListe, true);
            setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
            setState("javascript." + instance + ".Timer.Editor.Device", Object.keys(TimerJSON)[0]);
            setState("javascript." + instance + ".Timer.Editor.Nummer", 1);
        }
    });
    

    // Trigger zum Erstellen der Bedingungen als String für späteres eval()
    EditSubsArr[2] = on({id: new RegExp('javascript\.' + instance + '\.Timer\.Editor\.Cond[0-9]+Comp' + "|" +  'javascript\.' + instance + '\.Timer\.Editor\.Cond[0-9]+State' + "|" + 'javascript\.' + instance + '\.Timer\.Editor\.Cond[0-9]+Value'), change: "ne"}, function (obj) {
        var ConditionJSON = JSON.parse(getState("javascript." + instance + ".Timer.Editor.ConditionJSON").val);
        var condNr = obj.id.split(".").pop().match(/\d+/)[0];
        var CondState = getState("javascript." + instance + ".Timer.Editor.Cond" + condNr + "State").val
        if (CondState == "") return
        var CondComp = getState("javascript." + instance + ".Timer.Editor.Cond" + condNr + "Comp").val
        var CondValue = getState("javascript." + instance + ".Timer.Editor.Cond" + condNr + "Value").val
        var CondType = getObject(ConditionJSON[CondState]).common.type;
        CondValue = CondValue.replace(/['"]+/g, ''); // Eliminate Quotes in case they are set in Editor
        var strCond = "";
        if (CondType == "string" || CondType == "mixed") {
            strCond = `getState("${ConditionJSON[CondState]}").val ${CondComp} "${CondValue}"`;
        } else {
            strCond = `getState("${ConditionJSON[CondState]}").val ${CondComp} ${CondValue}`;
        }
        console.log(strCond);
        setState("javascript." + instance + ".Timer.Editor.Condition" + condNr, strCond);
        if (CondState != "" && CondComp != "" && CondValue != "") {
            try {
                setState("javascript." + instance + ".Timer.Editor.Cond" + condNr + "Result", eval(strCond));
            } catch (e){
                // Beispiel für ignorierbare Fehler:
                // Wenn Bedingung voll gesetzt war und der Vergleichs-State von "string" zu "boolean" oder "number" gewechselt wird,
                // wird zunächst direkt versucht neu auszuwerten -> führt zu Fehler: z.B getState("adapter.0.boolState").val = "on"
            }
        }
    });


    // Bei Änderung der Zeiten oder Astros im PopUp-View werden direkt End-Zeiten berechnet
    EditSubsArr[3] = on({id: ["javascript." + instance + ".Timer.Editor.Std","javascript." + instance + ".Timer.Editor.Min","javascript." + instance + ".Timer.Editor.Random","javascript." + instance + ".Timer.Editor.RandPM",
                            "javascript." + instance + ".Timer.Editor.Offset","javascript." + instance + ".Timer.Editor.OffsetPM","javascript." + instance + ".Timer.Editor.Astro"], change: "ne", ack: false}, function (obj) {
        
        var astro = getState("javascript." + instance + ".Timer.Editor.Astro").val;
        var CalcJSON = {};
        var min, std;
        
        var rand = getState("javascript." + instance + ".Timer.Editor.Random").val;
        var randpm = getState("javascript." + instance + ".Timer.Editor.RandPM").val;
        var offset = getState("javascript." + instance + ".Timer.Editor.Offset").val;
        var offsetPM = getState("javascript." + instance + ".Timer.Editor.OffsetPM").val;
        
        if (astro === "manuell" ){
            min = getState("javascript." + instance + ".Timer.Editor.Min").val;
            std = getState("javascript." + instance + ".Timer.Editor.Std").val;
            CalcJSON = randomTime(parseInt(min,10),parseInt(std,10),rand,randpm);
        }
        else {
            var AstroJSON = JSON.parse(getState("javascript." + instance + ".Timer.Astro.AstroJSON").val);
            CalcJSON = randomTime(AstroJSON[astro].Min,AstroJSON[astro].Std,rand,randpm);
            CalcJSON = offsetTime(CalcJSON,offset,offsetPM);
        }
        // Eintrag für vollst. Cron aktualisieren
        setState("javascript." + instance + ".Timer.Editor.Zeit", CalcJSON.Zeit);
        var CronTage = getState("javascript." + instance + ".Timer.Editor.CronTage").val;
        setState("javascript." + instance + ".Timer.Editor.Cron", (CalcJSON.Cron + CronTage));
        
    });


    // Änderung der ausgewählten Tage triggern sofort den Tage-String-Eintrag, so wird OK-Trigger übersichtlicher
    EditSubsArr[4] = on({id: ["javascript." + instance + ".Timer.Editor.Mo","javascript." + instance + ".Timer.Editor.Di","javascript." + instance + ".Timer.Editor.Mi",
                            "javascript." + instance + ".Timer.Editor.Do","javascript." + instance + ".Timer.Editor.Fr","javascript." + instance + ".Timer.Editor.Sa","javascript." + instance + ".Timer.Editor.So"], change: "ne"}, function (obj) {
        
        var strTage = "";  // Nur für Anzeige
        var cronTage = ""; // Für setzen von Cron-Schedule
        if(getState("javascript." + instance + ".Timer.Editor.So").val){cronTage += ",0";}
        if(getState("javascript." + instance + ".Timer.Editor.Mo").val){cronTage += ",1";}
        if(getState("javascript." + instance + ".Timer.Editor.Di").val){cronTage += ",2";}
        if(getState("javascript." + instance + ".Timer.Editor.Mi").val){cronTage += ",3";}
        if(getState("javascript." + instance + ".Timer.Editor.Do").val){cronTage += ",4";}
        if(getState("javascript." + instance + ".Timer.Editor.Fr").val){cronTage += ",5";}
        if(getState("javascript." + instance + ".Timer.Editor.Sa").val){cronTage += ",6";}
        
        // String für VIS übersetzen, kürzen und setzen
        setState("javascript." + instance + ".Timer.Editor.TageVIS", shortDays(cronTage));
        
        cronTage = cronTage.substring(1, cronTage.length);
        setState("javascript." + instance + ".Timer.Editor.CronTage", cronTage);

        // Cron-Eintrag anpassen
        var cronSplit = getState("javascript." + instance + ".Timer.Editor.Cron").val.split(" ");
        setState("javascript." + instance + ".Timer.Editor.Cron", (cronSplit[0] + " " + cronSplit[1] + " " + cronSplit[2] + " " + cronSplit[3] + " " + cronTage));
        
    });


    // Trigger für OK-Button in PopUp-View; alle Werte werden in TimerJSON gesichert
    EditSubsArr[5] = on({id: "javascript." + instance + ".Timer.Editor.OK", change: "any", ack: false}, function (obj) {
        
        var device = getState("javascript." + instance + ".Timer.Editor.Device").val;
        var nr = getState("javascript." + instance + ".Timer.Editor.Nummer").val;
        var group = getState("javascript." + instance + ".Timer.Editor.Gruppe").val;
        var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val); //einlesen der Einträge aus State
        var copyAll = getState("javascript." + instance + ".Timer.Editor.CopyAll").val;
        var copyCond = getState("javascript." + instance + ".Timer.Editor.CopyCond").val;
        var errorMsg = "";

        TimerJSON[device][nr].Gruppe = getState("javascript." + instance + ".Timer.Editor.Gruppe").val;
        TimerJSON[device][nr].ConditionsNr = getState("javascript." + instance + ".Timer.Editor.ConditionsNr").val;

        // Validierung der Bedingungen vor Übernahme des Timers, wenn nicht valide, wird Fenster nicht geschlossen
        var returnFlag = false;
        for (let i = 1; i <= TimerJSON[device][nr].ConditionsNr; i++){
            var condStr = getState("javascript." + instance + ".Timer.Editor.Condition" + i).val;
            try {
                eval(condStr);
                if (condStr == "") {
                    errorMsg += "Bedingung " + i + " wurde gesetzt, ist aber leer.\nBitte korrigieren und übernehmen!";
                    returnFlag = true;
                }
            } catch (e){
                errorMsg += "Fehler in Bedingung: " + i + ".\nBitte korrigieren und übernehmen!";
                returnFlag = true;
            }
        }

        
        if (returnFlag) {
            console.log(errorMsg); 
            setState("javascript." + instance + ".Timer.Editor.ErrorMsg", "Bedingung(en) fehlerhaft!");
            setTimeout(() => {
                setState("javascript." + instance + ".Timer.Editor.ErrorMsg", "");
            }, 7000)
            return
        }

        if (!copyAll || !copyCond) {
            if (!copyAll){
                var stateArr = ["Zeit","Std","Min","Cron","Sollwert","TageVIS","CronTage","Astro","Random","RandPM","Offset","OffsetPM","Mo","Di","Mi","Do","Fr","Sa","So"];
                for (let key of stateArr){
                    TimerJSON[device][nr][key] = getState("javascript." + instance + ".Timer.Editor." + key).val;
                }
            }
            if (!copyCond){
                TimerJSON[device][nr].RememberTimer = getState("javascript." + instance + ".Timer.Editor.RememberTimer").val;
                TimerJSON[device][nr].ConditionsNr = getState("javascript." + instance + ".Timer.Editor.ConditionsNr").val;
                for (let i = 1; i <= anzBedingungen; i++){
                    if (i <= TimerJSON[device][nr].ConditionsNr){
                        TimerJSON[device][nr].Conditions[i].ConditionStr = getState("javascript." + instance + ".Timer.Editor.Condition" + i).val; 
                        TimerJSON[device][nr].Conditions[i].CondState = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "State").val; 
                        TimerJSON[device][nr].Conditions[i].CondComp = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Comp").val; 
                        TimerJSON[device][nr].Conditions[i].CondValue = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Value").val; 
                    } else {
                        TimerJSON[device][nr].Conditions[i].ConditionStr = ""; 
                        TimerJSON[device][nr].Conditions[i].CondState = ""; 
                        TimerJSON[device][nr].Conditions[i].CondComp = ""; 
                        TimerJSON[device][nr].Conditions[i].CondValue = ""; 
                    }
                }
            }
            // Schedule setzen bzw. löschen wenn sowohl Zeiten als auch Beidngungen nicht für Gruppe gelten sollen
            if (!copyAll && !copyCond) {
                TimerJSON[device][nr].ConditionsTrue = condEval(TimerJSON[device][nr]);
                autoScheduler(TimerJSON, device, nr);
                setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
            }
        }

        if (copyAll || copyCond){
            Object.keys(TimerJSON).forEach(function(key) {
                device = key;
                for(let nr = 1; nr <= length(TimerJSON[key]); nr++) {
                    if (TimerJSON[device][nr]["Gruppe"] == group){
                        if (copyAll){
                            setState("javascript." + instance + ".Timer.Editor.CopyAll", false);
                            var stateArr = ["Zeit","Std","Min","Cron","Sollwert","TageVIS","CronTage","Astro","Random","RandPM","Offset","OffsetPM","Mo","Di","Mi","Do","Fr","Sa","So"];
                            for (let key of stateArr){
                                TimerJSON[device][nr][key] = getState("javascript." + instance + ".Timer.Editor." + key).val;
                            }
                        }
                        if (copyCond){
                            setState("javascript." + instance + ".Timer.Editor.CopyCond", false);
                            TimerJSON[device][nr].RememberTimer = getState("javascript." + instance + ".Timer.Editor.RememberTimer").val;
                            TimerJSON[device][nr].ConditionsNr = getState("javascript." + instance + ".Timer.Editor.ConditionsNr").val;
                            for (let i = 1; i <= anzBedingungen; i++){
                                if (i <= TimerJSON[device][nr].ConditionsNr){
                                    TimerJSON[device][nr].Conditions[i].ConditionStr = getState("javascript." + instance + ".Timer.Editor.Condition" + i).val; 
                                    TimerJSON[device][nr].Conditions[i].CondState = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "State").val; 
                                    TimerJSON[device][nr].Conditions[i].CondComp = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Comp").val;
                                    TimerJSON[device][nr].Conditions[i].CondValue = getState("javascript." + instance + ".Timer.Editor.Cond" + i + "Value").val; 
                                } else {
                                    TimerJSON[device][nr].Conditions[i].ConditionStr = ""; 
                                    TimerJSON[device][nr].Conditions[i].CondState = ""; 
                                    TimerJSON[device][nr].Conditions[i].CondComp = ""; 
                                    TimerJSON[device][nr].Conditions[i].CondValue = ""; 
                                }
                            }
                        }
                    }
                }
            });
            setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON));  // rückschreiben in State
            setTimeout(recalc,100);
        }
        // Dialog schließen
        dialogCtrl("close");
        // Zeit für Timer Fokus wird neu gestartet
        delFocusOnTimer(true);
        
    });


    // Button Abbrechen
    EditSubsArr[6] = on({id: "javascript." + instance + ".Timer.Editor.ButtonAbbrechen", change: "any", ack: false}, function (obj) {
        // Dialog schließen
        dialogCtrl("close");
        // Zeit für Timer Fokus wird neu gestartet
        delFocusOnTimer(true);
    });


    // Hinweis geben wenn als Sollwert "Reset" ausgewählt wurde.
    EditSubsArr[7] = on({id: "javascript." + instance + ".Timer.Editor.Sollwert", change: "any"}, function (obj) {
        if (obj.state.val == "Reset"){
            setState("javascript." + instance + ".Timer.Editor.ErrorMsg", "Reset löscht gemerkten Timer! Gerät wird nicht aktiv gesetzt.");
            setTimeout(() => {
                setState("javascript." + instance + ".Timer.Editor.ErrorMsg", "");
            }, 7000)
        }
    });


    // Anzahl Bedingungen geändert
    EditSubsArr[8] = on({id: "javascript." + instance + ".Timer.Editor.ConditionsNr", change: "any", ack: false}, function (obj) {
        makeCondHtml(true);
    });

    // Input aus Editor-HTML-Tabelle
    EditSubsArr[9] = on({id: "javascript." + instance + ".Timer.Editor.ClickTarget", change: "any"}, function (obj) {
        let value = obj.state.val;
        if (debugLog) console.log(value);
        let tmp = value.split("~");
        setState(scrollIdEditor, tmp[3]);
        switch(tmp[1]){
            case "state":
                setState("javascript." + instance + ".Timer.Editor.Cond" + tmp[0] + "State", tmp[2]);
                break;
            case "comp":
                setState("javascript." + instance + ".Timer.Editor.Cond" + tmp[0] + "Comp", tmp[2]);
                break;
            case "value":
                setState("javascript." + instance + ".Timer.Editor.Cond" + tmp[0] + "Value", tmp[2]);
                break;
        }
        setTimeout(makeCondHtml,100);
    });

}
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++  initiales Erstellen und Schreiben der Objekte im State nur beim ersten Start ++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


createState("Timer.Editor.ConditionJSON", "", {
    name: 'JSON für Conditions in VIS',
    desc: 'JSON für Conditions in VIS',
    type: 'string',
    role: 'value',
    unit: ''
});
createState("Timer." + path + ".ResetBackgroundTimers", false, {
    type: "boolean", 
    role: "button"
});
createState("Timer." + path + ".MaterialDialogWidgetOpen", false, {
    type: "boolean", 
    role: "state"
});
createState("Timer.Editor.ErrorMsg", "", {
    type: "string", 
    role: "state"
});

createState("Timer.ActiveTable");

createState("Timer." + path + ".NextDevice");
createState("Timer." + path + ".FilterDevice");
createState("Timer." + path + ".NextDevices");
createState("Timer." + path + ".clickTarget");
createState("Timer." + path + ".dblClickTarget");
createState("Timer." + path + ".DropDownDevice");
createState("Timer." + path + ".DropDownGruppe");
createState("Timer." + path + ".TimerJSON");
createState("Timer." + path + ".TableHTML");
createState("Timer." + path + ".ScrollPos");
createState("Timer." + path + ".PopUpWidgetID");

createState("Timer.Astro.AstroJSON");
createState("Timer.Astro.DropDownAstroWerte");
createState("Timer.Astro.DropDownAstroTexte");

createState("Timer.Editor.ScrollPos");
createState("Timer.Editor.ClickTarget");
createState("Timer.Editor.OK");
createState("Timer.Editor.ButtonAbbrechen");
createState("Timer.Editor.DropDownMinutes");
createState("Timer.Editor.Gruppe");
createState("Timer.Editor.Del");
createState("Timer.Editor.Add");
createState("Timer.Editor.CopyAll");
createState("Timer.Editor.CopyCond");
createState("Timer.Editor.Astro");
createState("Timer.Editor.Device");
createState("Timer.Editor.Nummer");
createState("Timer.Editor.Zeit");
createState("Timer.Editor.Cron");
createState("Timer.Editor.TageVIS");
createState("Timer.Editor.CronTage");
createState("Timer.Editor.Mo");
createState("Timer.Editor.Di");
createState("Timer.Editor.Mi");
createState("Timer.Editor.Do");
createState("Timer.Editor.Fr");
createState("Timer.Editor.Sa");
createState("Timer.Editor.So");
createState("Timer.Editor.Std");
createState("Timer.Editor.Min");
createState("Timer.Editor.Sollwert");
createState("Timer.Editor.SollwertDropDown");
createState("Timer.Editor.Random");
createState("Timer.Editor.RandPM");
createState("Timer.Editor.Offset");
createState("Timer.Editor.OffsetPM");
createState("Timer.Editor.RememberTimer");

createState("Timer.Editor.ConditionsHtml");
createState("Timer.Editor.ConditionKeyDropDown");
createState("Timer.Editor.Condition");
createState("Timer.Editor.ConditionsNr");

for (let i = 1; i < 10; i++){
    createState("Timer.Editor.Condition" + i);
    createState("Timer.Editor.Cond" + i + "State");
    createState("Timer.Editor.Cond" + i + "Comp");
    createState("Timer.Editor.Cond" + i + "Value");
    createState("Timer.Editor.Cond" + i + "Result");
}

var DefaultInhalte = {
    "1":
        {"ObjID": "",
        "DeviceNr": "", // wird für cron-schedules genutzt
        "Aktiv": false,
        "Zeit":"10:00",
        "Std": "10",
        "Min": "00",
        "Sollwert":"100", // Sollwert der Geräte
        "TageVIS": "täglich", // Für Anzeige
        "CronTage": "0,1,2,3,4,5,6",
        "Cron": "0 10 * * 0,1,2,3,4,5,6",
        "Astro":"manuell",
        "Gruppe": grpNames.split(";")[0],
        "Random":"0",
        "RandPM":"pm",
        "Offset":"0",
        "OffsetPM":"m",
        "RememberTimer": false,
        "ConditionsNr": "0",
        "ConditionsTrue": true,
        "Conditions":{
            "1":{
                "ConditionStr": "",
                "CondState": "",
                "CondComp": "==",
                "CondValue": ""
            }
        },
        "Mo": true,
        "Di": true,
        "Mi": true,
        "Do": true,
        "Fr": true,
        "Sa": true,
        "So": true,
        },
    "2":
        {"ObjID": "",
        "DeviceNr": "", // wird für cron-schedules genutzt
        "Aktiv": false,
        "Zeit":"19:00",
        "Std": "19",
        "Min": "00",
        "Sollwert": "0", // Sollwert der Geräte
        "TageVIS": "täglich", // Für Anzeige
        "CronTage": "0,1,2,3,4,5,6",
        "Cron": "0 19 * * 0,1,2,3,4,5,6",
        "Astro":"manuell",
        "Gruppe": grpNames.split(";")[1],
        "Random":"0",
        "RandPM":"pm",
        "Offset":"0",
        "OffsetPM":"m",
        "RememberTimer": false,
        "ConditionsTrue": true,
        "ConditionsNr": "0",
        "Conditions":{
            "1":{
                "ConditionStr": "",
                "CondState": "",
                "CondComp": "",
                "CondValue": ""
            }
        },
        "Mo": true,
        "Di": true,
        "Mi": true,
        "Do": true,
        "Fr": true,
        "Sa": true,
        "So": true,
        },
};

function main () {

    try{
        device_members = getObject(deviceEnum).common.members;
    } catch (e){
        console.error( `Error by reading members from enumeration '${deviceEnum}'!`);
        return;
    }

    try{
        condition_members = getObject(deviceCond).common.members;
    } catch (e){
        console.error( `Error by reading members from enumeration '${deviceCond}'!`);
        return;
    }

    if ( device_members.length === 0){
        console.error( `Enumeration '${deviceEnum}' has no members. Please add states to enumeration and start script again!`);
        return;
    }


    var dropDownListe = "";
    var devName;
    var TimerJSON = {};
    var idCounter = 0;
    setState(scrollID, 0); // Reset Scroll-Position from Table
    if (debugLog) stdLog = true;
    if (!showTimerNr && !showSymbol){showTimerNr = true;}
    // ConditionJSON wird mit jedem Start neu eingelesen
    setTimeout(updateCond,500);
    setAstro(false); // false = ohne direkte Neuberechnung der Timer
    if (getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val === null) {
        // Erste Initialisierung falls Objekte noch nicht existieren
        console.warn("States werden neu erstellt! Script bitte erneut starten!");
        for(var i = 0; i < device_members.length; i++) {
            devName = getObject(device_members[i]).common.name;
            dropDownListe += devName + ";";
            TimerJSON[devName] = jsonCopy(DefaultInhalte);
            TimerJSON[devName][1].ObjID = TimerJSON[devName][2].ObjID = device_members[i];
            TimerJSON[devName][1].DeviceNr = TimerJSON[devName][2].DeviceNr = idCounter;
            if (getObject(device_members[i]).common.type == "boolean"){
                TimerJSON[devName][1].Sollwert = "An";
                TimerJSON[devName][2].Sollwert = "Aus";
            }
            idCounter += 2;
        }
        dropDownListe = dropDownListe.slice(0, dropDownListe.length - 1); // Entfernen letztes Semikolon
        setState("javascript." + instance + ".Timer." + path + ".DropDownDevice", dropDownListe, true);
        setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON)); //rückschreiben der Einträge in State
    }
    else {
        TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
        dropDownListe = getState("javascript." + instance + ".Timer." + path + ".DropDownDevice").val;
        // Wenn dropdown leer weil neu vom Skript-Update, erst json komplett einlesen
        if (getState("javascript." + instance + ".Timer." + path + ".DropDownDevice").val === null) {
            dropDownListe = "";
            Object.keys(TimerJSON).forEach(function(key) {
                dropDownListe += key + ";";
            });
            dropDownListe = dropDownListe.slice(0, dropDownListe.length - 1); // Entfernen letztes Semikolon
            setState("javascript." + instance + ".Timer." + path + ".DropDownDevice", dropDownListe, true);
        }
        // Check ob neue Device hinzugekommen sind oder IDs der Bedingungen verändert wurden
        var ConditionJSON = {};
        for(var i = 0; i < condition_members.length; i++) {
            var condName = getObject(condition_members[i]).common.name;
            ConditionJSON[condName] = condition_members[i];
        }
        for(var i = 0; i < device_members.length; i++) {
            devName = getObject(device_members[i]).common.name;
            if(!TimerJSON.hasOwnProperty(devName)){
                console.log("Device # " + devName + " # fehlt und wird neu hinzugefügt!");
                // Zunächst DropDownListe für Devices erweitern
                dropDownListe += ";" + devName;
                // Device mit DefaultInhalt erstellen
                TimerJSON[devName] = jsonCopy(DefaultInhalte);
                TimerJSON[devName][1].ObjID = TimerJSON[devName][2].ObjID = device_members[i];
                if (getObject(device_members[i]).common.type == "boolean"){
                    TimerJSON[devName][1].Sollwert = "An";
                    TimerJSON[devName][2].Sollwert = "Aus";
                }
            } 
            // Wenn Device bereits vorhanden ist, check nach geänderter ID und neue Anbindung der IDs von Bedingungen
            else {
                Object.keys(TimerJSON[devName]).forEach(function(nr) {
                    // Device ID prüfen und ggf ersetzen
                    if (TimerJSON[devName][nr]["ObjID"] != device_members[i]) {
                        console.log("Veränderte ObjID entdeckt: ALT = " + TimerJSON[devName][nr]["ObjID"] + " | NEU = " + device_members[i]);
                        TimerJSON[devName][nr]["ObjID"] = device_members[i];
                    }
                    // Wenn Timer Bedingungen enthält, dann Auswerte-String für Bedingung neu erstellen
                    var condCount = TimerJSON[devName][nr]["ConditionsNr"];
                    if (condCount > 0) {
                        //let condName = getObject(condition_members[i]).common.name;
                        //ConditionJSON[condName] = condition_members[i];
                        for(let j = 1; j <= condCount; j++) {
                            var CondState = TimerJSON[devName][nr]["Conditions"][j]["CondState"];
                            var CondComp = TimerJSON[devName][nr]["Conditions"][j]["CondComp"];
                            var CondValue = TimerJSON[devName][nr]["Conditions"][j]["CondValue"];
                            TimerJSON[devName][nr]["Conditions"][j]["ConditionStr"] = "getState(\"" + ConditionJSON[CondState] + "\").val " + CondComp + " " + CondValue
                            
                        };
                    }
                });
            }
        }
        // #############################################
        // Anpassung der JSON-Objekte nach Skript-Update
        var flagGroup = false
        Object.keys(TimerJSON).forEach(function(key) {
            for(let i = 1; i <= length(TimerJSON[key]); i++) {
                // States erstellen falls Split aktiviert ist
                if (splitHTML){
                    let strState = "Timer." + path + ".HTML_" + key;
                    strState = (strState.slice(-1) == ".") ? strState.slice(0, strState.length - 1) : strState;
                    createState(strState);
                }
                // Key "Gruppe" neu hinzufügen
                if(!TimerJSON[key][i].hasOwnProperty("Gruppe")){
                    flagGroup = true
                    TimerJSON[key][i]["Gruppe"] = grpNames.split(";")[0];
                }
                // Key "RememberTimer" neu hinzufügen
                if(!TimerJSON[key][i].hasOwnProperty("RememberTimer")){
                    TimerJSON[key][i]["RememberTimer"] = false;
                }
                // Bedingungen von 3 auf 9 erweitern
                for(let j = 2; j <= anzBedingungen; j++) {
                    if(!TimerJSON[key][i]["Conditions"].hasOwnProperty(j)){
                        TimerJSON[key][i]["Conditions"][j] = {};
                        TimerJSON[key][i]["Conditions"][j] = {"ConditionStr": "","CondState": "","CondComp": "","CondValue": ""};
                    }
                }
            };
        });
        if (flagGroup){
            setState("javascript." + instance + ".Timer." + path + ".DropDownGruppe", grpNames, true);
        }
        // #############################################
        // Anpassung der States nach Skript-Update #####

        if (existsState("javascript." + instance + ".Timer." + path + ".ScrollPos")) deleteState("javascript." + instance + ".Timer." + path + ".ScrollPos");

        // Ende der Erweiterungen ######################
        // #############################################

        // Schedules werden immer nach Start des Skripts automatisch erstellt
        // recalc Funktion nicht erlaubt, da JSON in State nicht aktuell sein muss (z.B. neue Devices in Aufzählung erkannt)
        Object.keys(TimerJSON).forEach(function(key) {
            subscribesList[key] = 0;
            for(let i = 1; i <= length(TimerJSON[key]); i++) {
                TimerJSON[key][i].DeviceNr = idCounter;
                TimerJSON[key][i].ConditionsTrue = condEval(TimerJSON[key][i]);
                autoScheduler(TimerJSON, key, i);
            };
            idCounter += 2;
        });
        // States sichern
        setState("javascript." + instance + ".Timer." + path + ".DropDownDevice", dropDownListe, true); 
        setState("javascript." + instance + ".Timer." + path + ".TimerJSON", JSON.stringify(TimerJSON)); //rückschreiben der Einträge in State
        tableMain(2000);
    }
    setState("javascript." + instance + ".Timer." + path + ".DropDownGruppe", grpNames, true); 
    //set default Filter
    setState("javascript." + instance + ".Timer." + path + ".FilterDevice", "Alle"); 
    for (var firstKey in TimerJSON) break;
    setTimeout(activateSchedules,1000); // Crons aktivieren
    setTimeout(activateTrigger,1000);   // Trigger aktivieren
    setTimeout(setState, 1500, "javascript." + instance + ".Timer.Editor.Device", firstKey);
    setTimeout(setState, 1800, "javascript." + instance + ".Timer.Editor.Nummer", 1)
    delFocusOnTimer(true);
}
setTimeout(main,1500);


//##########################################################################################################
// NACHFOLGEND die Erstellung der JSON Tabelle und HTML Aufbereitung
//##########################################################################################################

function buildTableArray() {
    var tabelle = [];
    var tmpAstro, tmpRand, tmpOffset, dropDownListe, dropDownItems, key, tmpClass;
    var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
    // Reihenfolge aus "Timer.Devices.DropDownDevice" entnehmen, statt alle Keys durchlaufen 
    dropDownListe = getState("javascript." + instance + ".Timer." + path + ".DropDownDevice").val;
    dropDownItems = dropDownListe.split(";");
    for(var i = 0; i < dropDownItems.length; i++) {
        key = dropDownItems[i];
        for (var j = 1; j <= Object.keys(TimerJSON[key]).length; j++) {
            var tempJsonNr = TimerJSON[key][j]; // JSON Objekt wird umkopiert um im weiteren Verlauf ohne Indizes zu arbeiten
            var scheduleNr = ( tempJsonNr.DeviceNr * 10 ) + j;
            tmpAstro = tempJsonNr.Astro == "manuell" ? (tempJsonNr.Std + ":" + tempJsonNr.Min) : tempJsonNr.Astro;
            if (tempJsonNr.Random != "0"){
                switch(tempJsonNr.RandPM){
                    case "p": tmpRand = "+" + " " + tempJsonNr.Random; break;
                    case "m": tmpRand = "-" + " " + tempJsonNr.Random; break;
                    case "pm": tmpRand = "±" + " " + tempJsonNr.Random; break;
                }
            } else {
                tmpRand = " "
            }
            if (tempJsonNr.Offset != "0"){
                switch(tempJsonNr.OffsetPM){
                    case "p": tmpOffset = "+" + " " + tempJsonNr.Offset; break;
                    case "m": tmpOffset = "-" + " " + tempJsonNr.Offset; break;
                }
            } else {
                tmpOffset = " "
            }
            if (tempJsonNr.Astro == "manuell"){tmpOffset = " "}
            tmpClass = "";
            if (tempJsonNr.RememberTimer){
                if (tempJsonNr.ConditionsTrue){
                    if (randomTimeouts[key]){
                        tmpClass = "class=timer-remember-green-blink";
                    } else {
                        tmpClass = "class=timer-remember-green-glow";
                    }
                } else{
                    if (subscribesList[key] == scheduleNr){
                        tmpClass = "class=timer-remember-red-blink";
                    } else {
                        tmpClass = "class=timer-remember-red-glow";
                    }
                }
            }
            tabelle.push({
                "Geraet"    : key,
                "Nr"        : j, 
                "Aktiv"     : tempJsonNr.Aktiv,
                "Gruppe"    : tempJsonNr.Gruppe,
                "CondNr"    : tempJsonNr.ConditionsNr,
                "CondTrue"  : tempJsonNr.ConditionsTrue,
                "Class"     : tmpClass,
                "Zeit"      : tempJsonNr.Zeit,
                "Tage"      : tempJsonNr.TageVIS,
                "Sollwert"  : tempJsonNr.Sollwert,
                "Astro"     : tmpAstro,
                "offset"    : tmpOffset,
                "rand"      : tmpRand,
            });
        }
    }
    return tabelle;
}


// Button überträgt bei Klick den Wert:
// Pfad~Gerät~Timer-Nummer~Funktion
function getButtonCode(buttonVal, buttonText, color){
    return `<button class="timer-button-${color}" value="${buttonVal}" id="${buttonVal}" onclick="setOnClick${path}(this.value)" ondblclick="setOnDblClick${path}(this.value)" >${buttonText}</button>`;
}

// Button Code für Umschaltung der Timer (on/off)
function getSwitchButtonCode(buttonVal, buttonText, color){
    return `<button class="timer-button-${color}" value="${buttonVal}" id="${buttonVal}" onclick="${ !oneClick ? 'setOnClick' : 'switchOnClick'}${path}(this.value)"
            ${ !oneClick ? 'ondblclick="switchOnDblClick' + path + '(this.value)"' : '' }>${buttonText}</button>`;
}

// Button überträgt bei Klick den Wert:
// Pfad~Gerät~Timer-Nummer~Funktion
function getFakeButtonCode(buttonText){
    return `<button style="border:none; background-color:transparent; color:white; font-size:1.0em; text-align:left" >${buttonText}</button>`;
}

// Header Button to switch Design by Class-Toggle
function getDesignButton(buttonText){
    return `<button style="border:none; background-color:transparent; color:white; font-size:1.0em; text-align:left"
            ${ oneClick ? ` onclick="switchDesign${path}()"` : ` ondblclick="switchDesign${path}()` } >${buttonText}</button>`;
}

function jsonToHtml(tabelle, withDevice) {
  
	var html = "";
    var astro = "";
    var tmpTage = "";
    var backgroundTimerExists = false;

    // Klasse für das Blinken der Bedingungen wenn Timer im Hintergrund
    html = `
        <style>
            .timer-remember-green-glow {
                filter: drop-shadow(0px 0px 2px #4CAF50) drop-shadow(0px 0px 2px #4CAF50) drop-shadow(0px 0px 4px #4CAF50)
            }
            .timer-remember-red-glow {
                filter: drop-shadow(0px 0px 2px #F44336) drop-shadow(0px 0px 2px #F44336) drop-shadow(0px 0px 4px #F44336)
            }
            .timer-remember-green-blink {
                animation: timer-remember-green-blink-ani 1s linear infinite;
            }
            .timer-remember-red-blink {
                animation: timer-remember-red-blink-ani 1s linear infinite;
            }
            @keyframes timer-remember-green-blink-ani {
                0%,50% {filter: drop-shadow(0px 0px 4px #4CAF50) drop-shadow(0px 0px 4px #4CAF50) drop-shadow(0px 0px 4px #4CAF50); }
                51% {filter: none;}
            }
            @keyframes timer-remember-red-blink-ani {
                0%,50% {filter: drop-shadow(0px 0px 4px #F44336) drop-shadow(0px 0px 4px #F44336) drop-shadow(0px 0px 4px #F44336); }
                51% {filter: none;}
            }
            .timer-button-white { border:none; background-color:transparent; color:white;   font-size:1.0em; text-align:left; }
            .timer-button-red   { border:none; background-color:transparent; color:red;     font-size:1.0em; text-align:left; }
            .timer-button-green { border:none; background-color:transparent; color:#00FF7F; font-size:1.0em; text-align:left; }
            
            .timer-remember-wiggle { animation: timer-remember-wiggle-ani 1.5s linear infinite; }
            
            @keyframes timer-remember-wiggle-ani {
                0%, 7% { transform: rotateZ(0); }
                15% { transform: rotateZ(-15deg); }
                20% { transform: rotateZ(10deg); }
                25% { transform: rotateZ(-10deg); }
                30% { transform: rotateZ(6deg); }
                35% { transform: rotateZ(-4deg); }
                40%, 100% { transform: rotateZ(0); }
            }
        </style>`;

    // Prüfen ob aktive Background-Timer existieren, damit "Bed" in Überschrift entsprechend dargestellt werden kann
    for (var i=0; i<tabelle.length; i++){
        if (tabelle[i].Class == "class=timer-remember-red-blink"){
            backgroundTimerExists = true;
        }
    }

    // Überschriften der Tabelle
    html += "<table id=tableMain-" + path + " style='font-size:" + fontSize + "em;width:100%;'>\n";

    if (withHeader) html += "<thead>\n<tr>\n"
         + ( withDevice  ?  "<th style='text-align:left;'>" + getDesignButton("Device") + "</th>\n"  : "" ) /* Wenn "splitHTML==true" oder Ansicht gefiltert wird, dann keine Spalte "Device" */
         + ( !withDevice  ?  "<th style='text-align:left;'>" + getDesignButton("Nr") + "</th>\n"  : "" )    /* Wenn Device ausgeblendet ist, dann dient Timer-Nummer als alternative Steuerung */
         + ( showTimerNr && withDevice ?  "<th style='text-align:left;'>" + getFakeButtonCode("Nr") + "</th>\n"  : "" )
         + ( showSymbol || !withDevice ?  "<th style='text-align:left;'>" + getFakeButtonCode("Aktiv") + "</th>\n"   : "" )
         /* Nachfolgend die Darstellung von "Bed" in zwei Zeilen zwecks lesbarkeit */
         + ( !backgroundTimerExists  ?  "<th style='text-align:left;'>" + getFakeButtonCode("Bed") + "</th>\n"   : "" )
         + ( backgroundTimerExists  ?  "<th class=timer-remember-red-blink style='text-align:left;'>" + getButtonCode("all~0~cond", "Bed", "red") + "</th>\n"   : "" )
         + ( showGroupNr ?  "<th style='text-align:left;'>Grp</th>\n"                                : "" )
         + "<th style='text-align:left;'>" + getFakeButtonCode("Zeit") + "</th>\n"
         + "<th style='text-align:left;'>Wochentag</th>\n"
         + "<th style='text-align:left;'>Soll</th>\n"
         + "<th style='text-align:left;'>Astro</th>\n"
         + "<th style='text-align:left;'>Offset</th>\n"
         + "<th style='text-align:left;'>Zufall</th>\n"
         + "</tr></thead>";

    html += "<tbody>\n\n";

    // Erstellen der einzelnen Tabelleneinträge
	for (var i=0; i<tabelle.length; i++){

    	html += "<tr>\n"
              + ( withDevice  ? "<td>" + getButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~dev", tabelle[i].Geraet, "white") + "</td>\n" : "" )
              + ( !withDevice  ? "<td>" + getButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~dev", tabelle[i].Nr, "white") + "</td>\n" : "" )
              + ( showTimerNr && withDevice ? "<td>" + getSwitchButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~digit", tabelle[i].Nr, ( tabelle[i].Aktiv ? "green"  : "red" ) ) + "</td>\n" : "" )
              + ( showSymbol || !withDevice ? "<td>" + getSwitchButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~symb", ( tabelle[i].Aktiv ? symbEnab : symbDisab ), ( tabelle[i].Aktiv ? "green"  : "red" ) ) + "</td>\n" : "" )
              + ( tabelle[i].CondNr > 0 ? "<td " + tabelle[i].Class + ">" + getButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~cond", "*" + tabelle[i].CondNr, ( tabelle[i].CondTrue ? "green" : "red" ) ) + "</td>\n" : "<td> </td>\n" )
              + ( showGroupNr ? "<td>" + tabelle[i].Gruppe + "</td>" : "" )
              + "<td>" + getButtonCode(tabelle[i].Geraet + "~" + tabelle[i].Nr + "~time", tabelle[i].Zeit, "white") + "</td>\n"
              + "<td>" + tabelle[i].Tage + "</td>\n"
              + "<td>" + tabelle[i].Sollwert + "</td>\n"
              + "<td>" + tabelle[i].Astro + "</td>\n"
              + "<td>" + tabelle[i].offset + "</td>\n"
              + "<td>" + tabelle[i].rand + "</td>\n"
              + "</tr>\n\n";
    }
    html += "</tbody></table>\n\n";

    // Funktionen für Klick und Doppel-Klick werden direkt im html Code der Buttons hinterlegt
    // html-Element der Tabelle ist nach Reload der Seite nicht sofort erreichbar, daher wird es nochmals in Funktionen integriert
    html += `
        <script>
          setTimeout( ()=> {
             var targetEditorID = $("#tableMain-${path}").closest(".vis-view").children(".dialogIdentifier")[0].id;
             var objID = "javascript.${instance}.Timer.${path}.PopUpWidgetID";
             servConn.setState(objID, targetEditorID);
          }, 1000 )

          function setOnClick${path}(val) {
             var objID = "javascript.${instance}.Timer.${path}.clickTarget";
             servConn.setState(objID, val);
          }
          
          function setOnDblClick${path}(val) {
             var objID = "javascript.${instance}.Timer.${path}.dblClickTarget";
             servConn.setState(objID, val);
          }
          
          function switchOnClick${path}(val, recursiveCall=false){
             var keys = val.split("~")
             var caller = keys.pop();
             var elem = document.getElementById(val);
             if(elem){
                elem.className = ( elem.className == "timer-button-green" ? "timer-button-red" : "timer-button-green");
                if (caller == "symb") {
                   var symbEnab = "${symbEnab}";
                   var symbDisab = "${symbDisab}";
                   elem.innerHTML = ( elem.innerHTML == symbEnab ? symbDisab : symbEnab);
                }
             }
             if (!recursiveCall) {
                switchOnClick${path}(keys.join("~") + (caller == "symb" ? "~digit" : "~symb"), true);
             } else {
                setOnClick${path}(val)
             }
          }

          function switchDesign${path}(){
              $("#tableMain-${path}").closest(".vis-tpl-basic-HTML").toggleClass("${toggleClass}");
          }

          function switchOnDblClick${path}(val, recursiveCall=false){
             var keys = val.split("~")
             var caller = keys.pop();
             var elem = document.getElementById(val);
             if(elem){
                elem.className = ( elem.className == "timer-button-green" ? "timer-button-red" : "timer-button-green");
                if (caller == "symb") {
                   var symbEnab = "${symbEnab}";
                   var symbDisab = "${symbDisab}";
                   elem.innerHTML = ( elem.innerHTML == symbEnab ? symbDisab : symbEnab);
                }
             }
             if (!recursiveCall) {
                switchOnDblClick${path}(keys.join("~") + (caller == "symb" ? "~digit" : "~symb"), true);
             } else {
                setOnDblClick${path}(val)
             }
          }
        </script>'
        `;

	return html;
}

var tableTimeout;
function tableMain(delay) {
    
    if (tableTimeout) {clearTimeout(tableTimeout); tableTimeout = null;}

    tableTimeout = setTimeout(function(){
        
        var device;
        var TimerJSON = JSON.parse(getState("javascript." + instance + ".Timer." + path + ".TimerJSON").val);
        var filterDev = getState("javascript." + instance + ".Timer." + path + ".FilterDevice").val;
        var tabelle = buildTableArray();

        if (splitHTML) {
            var tableIndex = 0;
            Object.keys(TimerJSON).forEach(function(device) {
                var timerNr = Object.keys(TimerJSON[device]).length;
                var strState = "Timer." + path + ".HTML_" + device;
                // Falls Device mit einem Punkt endet, muss dieser entfernt werden um State zu erstellen
                strState = (strState.slice(-1) == ".") ? strState.slice(0, strState.length - 1) : strState;
                setState(strState, jsonToHtml(tabelle.slice(tableIndex, tableIndex + timerNr), false));
                tableIndex += timerNr;
            });
        }
        else {
            var strState = "javascript." + instance + ".Timer." + path + ".TableHTML";
            if (filterDev == "Alle") {
                setState(strState, jsonToHtml(tabelle, true));
            } else {
                var filteredTable = [];
                for (let i = 0; i < tabelle.length; i++){
                    device = tabelle[i]["Geraet"];
                    if ( device == filterDev){
                        filteredTable.push(tabelle[i]);
                    }
                }
                setState(strState, jsonToHtml(filteredTable, false));
            }
        }
    },delay);
}
