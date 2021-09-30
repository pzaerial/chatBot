const fs = require("fs");
const request = require('request');
const tmi = require('tmi.js');
const config = require('./config.json');

// Read data file
var data = null;
try {
    let rawJSON = fs.readFileSync('./data.json');
    data = JSON.parse(rawJSON);
} catch (err) {
    console.log(`Error reading data from disk: ${err}`);
    process.exit(1)
}
formatData();
var lastSync = new Date();

// Read config
const opts = {
    identity: {
        username: config.username,
        password: config.oauth
    },
    channels: [
        config.channel
    ]
};

//Connect to Twitch & setup handlers
const client = new tmi.client(opts);
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();

//Successful connection event
function onConnectedHandler (addr, port) {
    console.log(`Connected to ${addr}:${port}`);
}

//Read chat & delegate commands.
function onMessageHandler (channel, context, msg, self) {
    if (self) { return; } //Ignore messages from this bot

    //Remove whitespace from chat message
    const commandName = msg.trim();
    const commandArray = commandName.split(" ");

    //(if/else) Chain of command
    if (commandName === '!commands') {
        console.log("User " + context.username + " requested command !commands.");
        commands(channel, context);
    } else if (commandName.toLowerCase() === '!dws') {
        console.log("User " + context.username + " requested command !dws.");
        webServicesVoting(channel, context, "dws");
    } else if (commandName.toLowerCase() === '!iws') {
        console.log("User " + context.username + " requested command !iws.");
        webServicesVoting(channel, context, "iws");
    } else if (commandName.toLowerCase() === '!pws') {
        console.log("User " + context.username + " requested command !pws.");
        webServicesVoting(channel, context, "pws");
    } else if (commandArray[0].toString() === '!addpoints') {
        console.log("User " + context.username + " requested command !addpoints.");
        addPoints(channel, context, commandArray);
    } else if (commandArray[0].toString() === '!points') {
        console.log("User " + context.username + " requested command !points.");
        getPoints(channel, context, commandArray);
    } else if (commandArray[0].toString() === '!setpoints') {
        console.log("User " + context.username + " requested command !setpoints.");
        setPoints(channel, context, commandArray);
    } else if (commandName === '!test') {
        console.log("User " + context.username + " requested command !http.");
        http(channel, context);
    } else {
        console.log(`Unknown command ${commandName}`);
    }

    var curTime = new Date();
    if(Math.abs(curTime.getTime() - lastSync.getTime()) > 3600000){
        console.log("Syncing chatbot data... Time since last sync: " + Math.abs(curTime.getTime() - lastSync.getTime()))
        syncData();
        lastSync = curTime;
    }
}

/**
  * List all available commands.
  */
function commands (channel, context) {
    client.say(channel, "@" + context.username + ": !commands !pws !dws !iws");
}

/**
  * Vote on which web services platform is your favorite, PWS, DWS, or IWS.
  */
function webServicesVoting (channel, context, choice) {
    var choiceUpper = choice.toUpperCase();
    if (data['voting'][choice] == null) {
        data['voting'][choice] = 1;
    } else {
        data['voting'][choice] = data['voting'][choice] + 1;
    }
    client.say(channel, "@" + context.username + ": Thank you for voting for " + choiceUpper + "! The current standings are PWS: " + data['voting']['pws'] + ", DWS: " + data['voting']['dws'] + ", IWS: " + data['voting']['iws'] + ".");
}

/**
  * PWS/DWS/IWS channel-agnostic points!
  */
function setPoints(channel, context, commandArray) {
    if(!(context["user-type"] === "mod") && !(context.username === channel.replace("#", ""))){
        console.log("User " + context.username + " requested command !setpoints but was not a moderator.");
        return;
    }
    if(commandArray == null || commandArray.length != 3){
        client.say(channel, "@" + context.username + ", Usage: !setpoints [username] [amount]");
        return;
    }
    var user = commandArray[1].toString();
    var amount = parseInt(commandArray[2]);
    if (!(typeof amount === 'number' && isFinite(amount))) {
        client.say(channel, "@" + context.username + ": You can only set integer amounts of points.");
        return;
    }

    setUserPoints(user, amount);
    client.say(channel, "Set @" + user + " points to " + data['points'][user] + ".");
}

function addPoints(channel, context, commandArray) {
    if(!(context["user-type"] === "mod") && !(context.username === channel.replace("#", ""))){
        console.log("User " + context.username + " requested command !addPoints but was not a moderator.");
        return;
    }
    if(commandArray == null || commandArray.length != 3){
        client.say(channel, "@" + context.username + ", Usage: !addPoints [username] [amount]");
        return;
    }
    var user = commandArray[1].toString();
    var amount = parseInt(commandArray[2]);
    if (!(typeof amount === 'number' && isFinite(amount))) {
        client.say(channel, "@" + context.username + ": You can only add integer amounts of points.");
        return;
    }

    if (data['points'][user] == null) {
        setUserPoints(user, amount);
        client.say(channel, "Set @" + user + " points to " + amount + ".");
    } else {
        setUserPoints(user, data['points'][user] + amount);
        client.say(channel, "Set @" + user + " points to " + data['points'][user] + ".");
    }
}

function getPoints(channel, context, commandArray) {
    if(!(context["user-type"] === "mod") && !(context.username === channel.replace("#", ""))){
        console.log("User " + context.username + " requested command !points but was not a moderator.");
        return;
    }
    if(commandArray == null || commandArray.length > 2){
        client.say(channel, "@" + context.username + ", Usage: !points [username]");
        return;
    }
    if(commandArray.length == 1){
        client.say(channel, "@" + context.username + " has " + data['points'][user] + " points.");
    } else {
        var user = commandArray[1].toString();
        client.say(channel, "@" + user + " has " + data['points'][user] + " points.");
    }
}

function setUserPoints(user, amount) {
    data['points'][user] = amount;
}

/**
  * Test functions.
  */
function http (channel, context) {
    request('https://node.whitney.rip', {json: true}, (error, response, body) => {
        username = context.username
        if(error) {
            client.say(channel, "@" + username + ": Response not recorded! Try again!");
            return console.log(error);
        }
        if(response.statusCode == 200){
            client.say(channel, "@" + username + ": Response recorded!");
        } else {
            client.say(channel, "@" + username + ": Response not recorded! Try again!");
        }
    });
}

/**
  * Private helper methods.
  */
function syncData () {
    try {
        let jsonString = JSON.stringify(data);
        fs.writeFileSync('./data.json', jsonString)
    } catch (err) {
        console.log(`Error writing data to disk: ${err}`);
        process.exit(1)
    }
}

function formatData () {
    if(data['voting'] == null) {
        data['voting'] = {};
    }
    if(data['points'] == null) {
        data['points'] = {};
    }
}

