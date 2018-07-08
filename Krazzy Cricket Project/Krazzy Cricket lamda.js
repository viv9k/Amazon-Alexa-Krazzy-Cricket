  // 1. Text strings =====================================================================================================
  //    Modify these strings and messages to change the behavior of your Lambda function

  const languageStrings = {
      'en': {
          'translation': {
              'WELCOME' : "Welcome to the Krazzy Cricket skill. ",
              'TITLE'   : "Crazy cricket",
              'HELP'    : "In this game we both will select a number from 0 - 6. you will bat and i will ball, if both are same then you are out else you get score.  You can ask for the targets, or just say continue if you are ready. Once you are playing, just say Your number to Play to the next ball in the game. You can also ask the game score at any time by saying Score.",
              'STOP'    : "Okay, play again soon."
          }
      }
      // , 'de-DE': { 'translation' : { 'WELCOME'   : "Guten Tag etc." } }
  };
  const data = {
    // TODO: Replace this data with your own.
      "targets" :
          [
              {"name": "sixes",  "qty": 5, "units": ""},
              {"name": "four",    "qty": 4, "units": ""  },
              {"name": "wickets", "qty": 3, "units": "while balling" }
          ],
      "steps" :
      [
          '<say-as interpret-as="interjection">Strategic gameplay</say-as>',
          '<say-as interpret-as="interjection">Fine Single</say-as>',
          '<say-as interpret-as="interjection">struggling there</say-as>',
          '<say-as interpret-as="interjection">Easy game</say-as>',
          '<say-as interpret-as="interjection">Fantastic shot</say-as>',
          '<say-as interpret-as="interjection">clasic hit</say-as>',
          '<say-as interpret-as="interjection">magnificent shot</say-as>'
          ],
      "audiofiles" :
      [
        '<audio src="https://s3.amazonaws.com/cricket3007/ICC+Cricket+World+Cup+2015+Official+Theme+Song.mp3"/>',
        '<audio src="https://s3.amazonaws.com/cricket3007/bat%2Bhit%2Bball.mp3"/>',
        '<audio src="https://s3.amazonaws.com/cricket3007/wicket.mp3"/>',
        '<audio src="https://s3.amazonaws.com/cricket3007/caughtball.mp3"/>',
        '<audio src="https://s3.amazonaws.com/cricket3007/Cheering.mp3"/>'
        ]
  };
  const welcomeCardImg = {
      smallImageUrl: '',
      largeImageUrl: ''
  };
  // 2. Skill Code =======================================================================================================

  const Alexa = require('alexa-sdk');
  const AWS = require('aws-sdk');  // this is defined to enable a DynamoDB connection from local testing
  const AWSregion = 'us-east-1';   // eu-west-1
  var persistenceEnabled;
  AWS.config.update({
      region: AWSregion
  });

  exports.handler = function(event, context, callback) {
      var alexa = Alexa.handler(event, context);
      // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
      alexa.dynamoDBTableName = 'KrazzyCricket'; // creates new table for session.attributes
      if (alexa.dynamoDBTableName == 'KrazzyCricket' ){
        persistenceEnabled=true;
      } else {
        persistenceEnabled=false;
      }
      alexa.resources = languageStrings;
      alexa.registerHandlers(handlers);
      alexa.execute();

  };
  
  var currentScore = 0;
  var highScore = 0;
  var nbat = 0;
  var flag = 0;
  var b=1;
  
  const handlers = {
      'LaunchRequest': function () {

          this.attributes['bat'] = 0;
          this.attributes['currentScore'] = 0;
          this.attributes['highScore'];
          var say = "";
          
          if (!this.attributes['highScore'] ) {

              say = data.audiofiles[0] + ' ' + this.t('WELCOME') + ' ' + this.t('HELP');

              this.response.cardRenderer(this.t('TITLE'), this.t('WELCOME'), welcomeCardImg);

          } 
          else {

              say ='Welcome back. Your High Score is '
                  + this.attributes['highScore']
                  + '. Say reset if you want to set the high score back to 0. '
                  + ' Ready to play a new game?';

              this.response.cardRenderer('Ready?', "\n" + say);
          }
          this.response.speak(say).listen(say);
          this.emit(':responseReady');
      },

      'TargetsIntent': function () {
          
          var say = "";
          var list = [];
          for (var i = 0; i < data.targets.length; i++) {
              var item = data.targets[i];
              list.push(item.qty + ' ' + item.units + ' ' + item.name);
          }
          say += sayArray(list,'and');
          say = 'The targets for you are, ' + say + '. Are you ready to play? ';
          var reprompt = 'Say continue if you are ready to Play the crazy Cricket Game';

          var cardlist = list.toString().replace(/\,/g, '\n');

          this.response.cardRenderer(this.t('TITLE') + ' scroe board', cardlist);
          this.response.speak(say).listen(reprompt);

          this.emit(':responseReady');
      },
      
      'PlayIntent': function () {
        currentScore = 0;
        nbat = 0;
        flag = 0;
        b=1;
        
        this.response.speak('bat').listen('bat');
        
        this.emit(':responseReady');
      },
      'AMAZON.YesIntent': function () {
          this.emit('PlayIntent');

      },
      'AMAZON.NoIntent': function () {
          this.response.speak('Okay, see you next time!');
          this.emit(':responseReady');
      },
      'AMAZON.PauseIntent': function () {

          var say = "If you pause, you'll lose your progress. Do you want to go to the next step?";

          // cross-session persistence is enabled
          if (persistenceEnabled){
            say = 'Okay, Saving your score.';
          }
          this.response.speak(say);
          this.emit(':responseReady');
      },

      'StartGameIntent': function () {
          this.attributes['bat'] = this.event.request.intent.slots.bat.value;
          var ball = selectrandom(0,7);
          var bat = this.attributes['bat'];
          nbat = bat/1;
          if(nbat>=7 || nbat<0)
          {
            this.response.speak('<say-as interpret-as="interjection">no way</say-as>'+'start again');
          }
          else if(ball == bat)
          {
              //delete this.attributes['highScore'];
              var out = Math.random() < 0.5 ? 2 : 3;
              if (flag == 0)
              {
              say = data.audiofiles[out] + 'You are out. I balled ' + ball + '. ' + ' Your score is ' + currentScore + '.';
              }
              else{
                say = data.audiofiles[out] + 'You are out. I balled ' + ball + '. ' + ' Your score is ' + currentScore + '. <say-as interpret-as="interjection">balle balle</say-as>' + 'You have made a new high score.';
              }
              this.response.cardRenderer(this.t('TITLE'), 'You are Out!', welcomeCardImg);

          }
          else{
            this.attributes['currentScore']+=nbat;
            currentScore = this.attributes['currentScore'];
            
            highScore = incrementScore.call(this, currentScore);
            
            var say = data.audiofiles[1] +' '+ data.steps[bat] + ' ' + '. Ball was ' + ball +'. <say-as interpret-as="interjection">Next bat</say-as>';
            var reprompt = 'You can say Pause, Stop, or Next.';
              
            reprompt += currentScore;
            this.response.cardRenderer('Score is ' + currentScore, say);
            this.response.listen(reprompt);
          }
          this.response.speak(say);
          if(b==6)
          {
            this.emit('ScoreIntent');
          }
          else{
            b++;
          }
          this.emit(':responseReady');
      },
      'ScoreIntent': function () {
        var say;
        if(b==6)
        {
          b=1;
          if(currentScore>=50)
          {
            say = data.audiofiles[4] + "Over finished. your score is " + currentScore + ". A change in a balling, continue batting.";
          }
          else{
            say = "Over finished. your score is " + currentScore + ". A change in a balling, continue batting.";
          }
          this.response.speak(say).listen("Start playing new over just say your bat.");
        }
        else{
          this.response.speak("your score is " + currentScore + ". Continue with your bat.").listen("Begin playing just say your bat.");
        }
          this.emit(':responseReady');
      },
      'AMAZON.HelpIntent': function () {
          if (!this.attributes['highScore']) {  // new session
              this.response.speak(this.t('HELP')).listen(this.t('HELP'));
          } else {
              highScore = this.attributes['highScore'];
              var say = 'Your high score is ' + highScore + ' of the ' + this.t('TITLE') + ' game. ';
              var reprompt = 'Say play to start new game or Targets to hear the list of targets.';
              this.response.speak(say + reprompt).listen(reprompt);
          }
          this.emit(':responseReady');
      },
      'AMAZON.StartOverIntent': function () {
          delete this.attributes['highScore'];
          this.emit('LaunchRequest');
      },
      'AMAZON.CancelIntent': function () {
          this.response.speak(this.t('STOP'));
          this.emit(':responseReady');
      },
      'AMAZON.StopIntent': function () {
          this.emit('SessionEndedRequest');
      },
      'SessionEndedRequest': function () {
          console.log('session ended!');
          this.response.speak('Your score is '+ currentScore + '. ' + '<say-as interpret-as="interjection">bye bye</say-as>');
          this.emit(':responseReady');
      }
  };

  //    END of Intent Handlers {} ========================================================================================
  // 3. Helper Function  =================================================================================================

  function incrementScore(currentScore){ 
      if(!this.attributes['highScore'])
      {
          this.attributes['highScore'] = currentScore;
      }
      else if(this.attributes['highScore'] < currentScore)
      {
        this.attributes['highScore'] = currentScore;
        flag = 1;
      }
      return this.attributes['highScore'];
  }
  
  
  function selectrandom(a,b){
    var num = Math.floor(Math.random() * (b - a));
    return num;
  }


  function sayArray(myData, andor) {
      //say items in an array with commas and conjunctions.
      // the first argument is an array [] of items
      // the second argument is the list penultimate word; and/or/nor etc.

      var listString = '';

      if (myData.length == 1) {
          //just say the one item
          listString = myData[0];
      } else {
          if (myData.length == 2) {
              //add the conjuction between the two words
              listString = myData[0] + ' ' + andor + ' ' + myData[1];
          } else if (myData.length == 4 && andor=='and'){
              //read the four words in pairs when the conjuction is and
              listString=myData[0]+" and "+myData[1]+", as well as, "
                  + myData[2]+" and "+myData[3];

          }  else {
              //build an oxford comma separated list
              for (var i = 0; i < myData.length; i++) {
                  if (i < myData.length - 2) {
                      listString = listString + myData[i] + ', ';
                  } else if (i == myData.length - 2) {            //second to last
                      listString = listString + myData[i] + ', ' + andor + ' ';
                  } else {                                        //last
                      listString = listString + myData[i];
                  }
              }
          }
      }

      return(listString);
  }