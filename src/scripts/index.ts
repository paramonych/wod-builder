import '../styles/font/fontstylesheet.less';
import '../styles/main.less';

import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';

import {run}                from '@cycle/run';
import {makeDOMDriver, div} from '@cycle/dom';
import {makeHTTPDriver}     from '@cycle/http';
import {makeHistoryDriver}  from '@cycle/history';
import {withState}          from '@cycle/state';
import isolate              from '@cycle/isolate';
import {makeCookieDriver}   from 'cycle-cookie-driver';
import {makeSpeechSynthesisDriver, SpeechSynthesisAction, makeSpeechRecognitionDriver, SpeechRecognitionAction} from '@cycle-robot-drivers/speech';

import {makeShareDriver} from './drivers/share';
import {makeCompressDriver} from './drivers/compress';
import {makeDecompressDriver} from './drivers/decompress';
import {makeQRCodeDriver} from './drivers/qr-maker';
import {makeQRScannerDriver} from './drivers/qr-scanner';
import {makeWadDriver} from './drivers/wad';
import {makeCredentialsWriteDriver} from './drivers/credentialsWrite';
import {makeCredentialsReadDriver} from './drivers/credentialsRead';
import {makeStorageReadDriver} from './drivers/storageRead';
import {makeStorageWriteDriver} from './drivers/storageWrite';
import {makeFullscreenDriver} from './drivers/fullscreen';
import {makeHardReloadDriver} from './drivers/hardReload';

import {AppNavigationLayout} from './components/generic/appNavigation';

import {WorkoutLayout}   from './components/screens/workout/layout';
import {WelcomeLayout}   from './components/screens/welcome/layout';
import {CoachLayout}     from './components/screens/coach/layout';
import {ProgramLayout}   from './components/screens/program/layout';
import {AnalyseLayout}   from './components/screens/analyse/layout';
import {WodbookLayout}   from './components/screens/wodbook/layout';
import {AvailableLayout} from './components/screens/available/layout';
import {AccountLayout}   from './components/screens/account/layout';
import {SupportLayout}   from './components/screens/support/layout';
import {DonateLayout}    from './components/screens/donate/layout';

import {outOfUrlLocationContext} from './resolvers/history'

import {Program} from './models/workout';
import {Sources, Screen, Sinks} from './models/general';
import {defaults, utils} from './utils/utils';
import {endpoints} from './utils/const';
import { textLabels } from './utils/labels';

function main(sources: Sources): Sinks {
  const appState = sources.state.stream;

  // VIDEO AD - series of provocative clips for different sports - the guy trying to use noname posedetection mobile app 
  // after asked by some stranger sportsman to check his technique
  // having errors detected in the technique but saying OH great! nice technique! I got a go! and running away 
  // the slogan - "don't trust words trust people - opencoach"

  // COMPONENTS SETUP ////////////////////////////////////
  const navigation = isolate(AppNavigationLayout, {'*': 'nav', state: {
      get: state => ({screen: state.screen, menu: state.menu, session: state.session}), //there is no child state fields except that we are passing here
      set: (state, childState) => ({...state, screen: childState.screen, menu: childState.menu}) // updating only single attribute with new value from child component
  }})({...sources});

  const accountScreen   = isolate(AccountLayout, Screen.Account)({...sources});
  const welcomeScreen   = isolate(WelcomeLayout, Screen.Welcome)({...sources});

  const workoutsScreen  = isolate(WorkoutLayout, Screen.Workout)({...sources});
  const wodbookScreen   = isolate(WodbookLayout, Screen.Wodbook)({...sources});
  const availableScreen = isolate(AvailableLayout, Screen.Available)({...sources});
  const analyseScreen   = isolate(AnalyseLayout, Screen.Analyse)({...sources});

  const coachScreen     = isolate(CoachLayout, Screen.Coach)({...sources});
  const programScreen   = isolate(ProgramLayout, Screen.Program)({...sources});

  const supportScreen   = isolate(SupportLayout, Screen.Support)({...sources});
  const donateScreen    = isolate(DonateLayout, Screen.Donate)({...sources});

  // RECEIVE SUSSESS AUTH RESPONCE & SET COOKIE
  const httpInputFlow = sources.HTTP.select('authorizeIndex').flatten(); // pick only latest responce

  const sessionInputFlow = httpInputFlow.filter(res => res.body.session != void 0);

  const setSessionFromAuthResponse = sessionInputFlow
      .map(res => ({
          category: 'setSessionIndexAuth',
          action: 'set',
          params: ['app', res.body.session, {expires: 365}]
      }));

  // GET STORED REQUEST ///////////////////////////////////////
  const credsToAutologin = sources.credsRead.filter(o => !!o.user).map(o => o.user);

  // SESSION VERIFICATION  ////////////////////////////////////
  const sessionCookie = sources.cookie.select('getSessionCookieIndex');
  const noSessionCookie = sessionCookie.filter(session => !session);
  const setSessionFromLocalStorage = noSessionCookie.compose(sampleCombine(sources.storageRead)).filter(([_, o]) => o.key == 'user').map(([_, o]) => ({
    category: 'restoreSessionCookieFromLocalStorage',
    action: 'set',
    params: ['app', o.value, {expires: 365}]
  }));
  
  const seconds = xs.periodic(1000).startWith(0);
  const once = xs.periodic(1000); // making a 1 second delay to check if the session cookie still exists
  const getCookieSession = seconds.mapTo({category: 'getSessionCookieIndex', action: 'get', params: ['app']});
  const autologinTrigger = xs.combine(once, appState).filter(([_,state]) => state.session == void 0).take(1);
  
  // SPEECH RECOGNITION ////////////////////////////////////
  const speechRecognitionAction = isolate(SpeechRecognitionAction, textLabels.labels.recognition)({
      state: sources.state,
      SpeechRecognition: sources.SpeechRecognition,
      goal: programScreen.micOn.mapTo({goal_id: {stamp: Date.now(), id: 'sr'}, goal: {}}),
      cancel: programScreen.micOff,
  });

  const speechDetectResult = speechRecognitionAction.result.filter(r => r.status.status === 'SUCCEEDED').startWith({result:''}).map(r => r.result);
  
  // SPEECH SYNTHESIS ////////////////////////////////////
  const commonSpeechFlow = xs.merge(welcomeScreen.SpeechFlow, programScreen.SpeechFlow, workoutsScreen.SpeechFlow, wodbookScreen.SpeechFlow, availableScreen.SpeechFlow);
  
  const speechSynthesisAction = isolate(SpeechSynthesisAction, textLabels.labels.synthesis)({
    state: sources.state,
    SpeechSynthesis: sources.SpeechSynthesis,
    goal: commonSpeechFlow.map(text => ({goal_id: {stamp: Date.now(), id: 'ss'}, goal: text})),
    cancel: xs.never(),
  }); 

  // STATE MANAGEMENT ////////////////////////////////////d
  const cookieReducer = sessionCookie.map(sessionCookie => {return (prevState?) => ({...prevState, session: sessionCookie})});
  const internalNavReducer = navigation.state.map(navState => {return (prevState?) => ({...prevState, ...defaults.hideMenu1})});
  const externalNavReducer = sources.history.map(location => {return (prevState?) => outOfUrlLocationContext(location, prevState)});
  const voiceCommandsReducer = xs.from(speechDetectResult).map(command => {
    return (prevState?) => ({...prevState, program: {...prevState?.program, command: command, feedback:'', dest: 'voiceCommandsReducer'}})
  });

  const httpAuthFlow = credsToAutologin
    .map(user => {
        return {
            url: endpoints.login,
            category: 'authorizeIndex',
            method: 'POST',
            send: {email: user.id, pwd: user.pwd}
        };
    });

  // RESULTING OBJECT ////////////////////////////////////  
  return {
    DOM: view(xs.combine(appState, navigation.DOM, welcomeScreen.DOM, accountScreen.DOM, workoutsScreen.DOM, wodbookScreen.DOM, availableScreen.DOM, analyseScreen.DOM, coachScreen.DOM, programScreen.DOM, supportScreen.DOM, donateScreen.DOM)),
    cookie: xs.merge(setSessionFromAuthResponse, setSessionFromLocalStorage, getCookieSession, workoutsScreen.cookie, wodbookScreen.cookie, availableScreen.cookie, welcomeScreen.cookie, programScreen.cookie, coachScreen.cookie, supportScreen.cookie, navigation.cookie),
    HTTP: xs.merge(httpAuthFlow, navigation.HTTP, welcomeScreen.HTTP, programScreen.HTTP, workoutsScreen.HTTP, donateScreen.HTTP, coachScreen.HTTP, wodbookScreen.HTTP, availableScreen.HTTP),
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    SpeechRecognition: speechRecognitionAction.SpeechRecognition,
    state: xs.merge(cookieReducer, voiceCommandsReducer, internalNavReducer, navigation.state, welcomeScreen.state, accountScreen.state, workoutsScreen.state, wodbookScreen.state, availableScreen.state, analyseScreen.state, coachScreen.state, programScreen.state, supportScreen.state, donateScreen.state, speechSynthesisAction.state, speechRecognitionAction.state, externalNavReducer),
    history: xs.merge(navigation.history, accountScreen.history, workoutsScreen.history, wodbookScreen.history, availableScreen.history, analyseScreen.history, coachScreen.history, supportScreen.history, donateScreen.history, welcomeScreen.history),
    share: xs.merge(programScreen.share, workoutsScreen.share),
    credsWrite: xs.merge(navigation.credsWrite, welcomeScreen.credsWrite),
    credsRead: xs.merge(autologinTrigger),
    storageRead: xs.merge(programScreen.storageRead),
    hardReload: xs.merge(navigation.hardReload, welcomeScreen.hardReload, coachScreen.hardReload, wodbookScreen.hardReload, availableScreen.hardReload, programScreen.hardReload),
    storageWrite: xs.merge(programScreen.storageWrite),
    compressor: xs.merge(programScreen.compressor),
    decompressor: xs.merge(programScreen.decompressor, workoutsScreen.decompressor),
    QR: xs.merge(programScreen.QR, workoutsScreen.QR),
    scanQR: xs.merge(workoutsScreen.scanQR, availableScreen.scanQR),
    wad: xs.merge(workoutsScreen.wad),
    fullscreen: xs.merge(coachScreen.fullscreen, accountScreen.fullscreen, supportScreen.fullscreen, wodbookScreen.fullscreen, availableScreen.fullscreen, workoutsScreen.fullscreen, programScreen.fullscreen)
  };
}

function view(appFlow: Stream<T>) {
  return appFlow.map(([wodState, navigation, welcomeScreen, accountScreen, workoutScreen, wodbookScreen, availableScreen, analyseScreen, coachScreen, programScreen, supportScreen, donateScreen]) => {
    //const exposeMenu = wodState.screen && wodState[wodState.screen] && wodState[wodState.screen].header.calendar != void 0 ? '' : (wodState[wodState.screen] && wodState[wodState.screen].header.menu ? '.expose-menu' : '.hide-menu');
    //const exposeCalendar = wodState.screen && wodState[wodState.screen] && wodState[wodState.screen].header.menu != void 0 ? '' : (wodState[wodState.screen] && wodState[wodState.screen].header.calendar ? '.expose-calendar' : '.hide-calendar');

    //return div(`#container${exposeMenu}${exposeCalendar}`, [

    const exposeMenu = wodState.screen && wodState[wodState.screen] && wodState[wodState.screen].header && wodState[wodState.screen].header.menu ? '.expose-menu' : '.hide-menu';
    
    return div(`#container${exposeMenu}`, [
      wodState[wodState.screen] ? void 0 : 
      div('.welcome-layer.layer', [
        div('.welcome-logo')
      ]),
      div('#navigation', navigation),
      div(`#screen.${wodState.screen}`, outOfWodScreenState(wodState.screen, accountScreen, workoutScreen, wodbookScreen, availableScreen, analyseScreen, coachScreen, programScreen, supportScreen, donateScreen, welcomeScreen))
    ]);
  });
}

function outOfWodScreenState(screen, accountScreen, workoutScreen, wodbookScreen, availableScreen, analyseScreen, coachScreen, programScreen, supportScreen, donateScreen, welcomeScreen) {
  switch (screen) {
    case Screen.Account:
      return accountScreen;

    case Screen.Workout:
      return workoutScreen;
    case Screen.Wodbook:
      return wodbookScreen;
    case Screen.Available:
      return availableScreen;
    case Screen.Welcome:
      return welcomeScreen;
    case Screen.Analyse:
      return analyseScreen;

    case Screen.Coach:
      return coachScreen;
    case Screen.Program:
      return programScreen;
    
    case Screen.Support:
      return supportScreen;
    case Screen.Donate:
      return donateScreen;
    default:
      return workoutScreen;
  }
}

run(withState(main), {
    DOM: makeDOMDriver('#app'),
    cookie: makeCookieDriver(),
    HTTP: makeHTTPDriver(),
    SpeechSynthesis: makeSpeechSynthesisDriver(),
    SpeechRecognition: makeSpeechRecognitionDriver(), // set if(navigator.language) {recognition.lang = navigator.language} into this function
    // or find a way to pass the lang parameter through sinks
    history: makeHistoryDriver({
      forceRefresh: false,     
      keyLength: 7  
    }),
    share: makeShareDriver(),
    compressor: makeCompressDriver(),
    credsWrite: makeCredentialsWriteDriver(),
    credsRead: makeCredentialsReadDriver(),
    storageRead: makeStorageReadDriver(),
    hardReload: makeHardReloadDriver(),
    storageWrite: makeStorageWriteDriver(),
    decompressor: makeDecompressDriver(),
    QR: makeQRCodeDriver(),
    scanQR: makeQRScannerDriver(),
    wad: makeWadDriver(),
    fullscreen: makeFullscreenDriver()
});

import '../styles/transform/wiring.less';


