import xs, {Stream} from 'xstream';
import {div, img} from '@cycle/dom';
import {Sources, Sinks, Screen, User} from '../../models/general';
import {utils} from '../../utils/utils';
import {svg} from '../../utils/svg';
import { textLabels } from '../../utils/labels';
import sampleCombine from 'xstream/extra/sampleCombine';
import { endpoints } from '../../utils/const';

const currentUser = utils.blankUser(); // put to and read from top level state

export function AppNavigationLayout(sources: Sources): Sinks {
    const navState = sources.state.stream;

    const logoutRedirect = sources.HTTP.select('logout').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});

    ////////////////////////////////////
    
    const sessionCookie = sources.cookie.select('getSessionCookieHeaderAppNav').startWith(null);
    
    const redHamburgerTrigger = sources.DOM.select('#redHamburger').events('click');

    const accountTrigger = sources.DOM.select('#profile').events('click').compose(sampleCombine(sessionCookie)).filter(([_, session]) => !!session).mapTo(Screen.Account);
    const welcomeTrigger = sources.DOM.select('#profile').events('click').compose(sampleCombine(sessionCookie)).filter(([_, session]) => !session).mapTo(Screen.Welcome);

    const workoutTrigger   = sources.DOM.select('#workout-screen').events('click').mapTo(Screen.Workout).startWith(Screen.Workout);
    const wodbookTrigger   = sources.DOM.select('#wodbook-screen').events('click').mapTo(Screen.Wodbook);
    const availableTrigger = sources.DOM.select('#available-screen').events('click').mapTo(Screen.Available);
    const analyseTrigger   = sources.DOM.select('#analyse-screen').events('click').mapTo(Screen.Analyse);
    
    const coachTrigger   = sources.DOM.select('#coach-screen').events('click').mapTo(Screen.Coach);
    const programTrigger = sources.DOM.select('#program-screen').events('click').mapTo(Screen.Program);
    
    const supportTrigger = sources.DOM.select('#support-screen').events('click').mapTo(Screen.Support);
    const donateTrigger  = sources.DOM.select('#donate-screen').events('click').mapTo(Screen.Donate);

    const loginTrigger = sources.DOM.select('#login').events('click').mapTo(Screen.Welcome);

    const removeSessionAction = sources.DOM.select('#logout').events('click');
  
    const navFlow = xs.merge(accountTrigger, workoutTrigger, wodbookTrigger, availableTrigger, analyseTrigger, coachTrigger, programTrigger, supportTrigger, donateTrigger, loginTrigger, welcomeTrigger);

    // HISTORY SETUP ////////////////////////////////////////////
    const historyOutput = xs.merge( navFlow.map(screen => `/${screen}`));//, removeSession.mapTo('/board'));

    //STATE MANAGEMENT //////////////////////////////////////////
    const redHamburgerReducer = redHamburgerTrigger.map(_ => {
        return (prevState) => ({...prevState, menu: false})
    });

    const menuReducer = navFlow.map(screen => {
        return (prevState) => ({...prevState, screen: screen, menu: false})
    });

    const readSessionCookieAction = xs.periodic(1000).mapTo({category: 'getSessionCookieHeaderAppNav', action: 'get', params: ['app']});

    const removeSessionCookie = logoutRedirect.mapTo({ 
        category: 'removeSession',
        action: 'remove',
        params: ['app', null, {expires: -1}]
    });

    // MAKE HTTP REQUESTS
    const removeUserSessionRequest = removeSessionAction.compose(sampleCombine(sessionCookie))
        .map(([_,sessionCookie]) => {
            return {
                url: endpoints.logout,
                category: 'logout',
                method: 'POST',
                send: {
                    session: sessionCookie 
                }
            };
        });
        
    return {
        DOM: view(currentUser, navState),
        HTTP: xs.merge(removeUserSessionRequest),
        state: xs.merge(redHamburgerReducer, menuReducer),
        cookie: xs.merge(removeSessionCookie, readSessionCookieAction),
        history: historyOutput,
        credsWrite: removeSessionAction.mapTo('logout'),
        hardReload: logoutRedirect,
    };
}

function view(user: User, state) {

    return state.map(state =>
        div('.nav-container',
            [
                div('#header',
                    div('.content',
                        [
                            div('#redHamburger.svg-wrap', utils.SVGContent(svg.redHamburger)),
                            div('#midlogo.svg-wrap', utils.SVGContent(svg.logo)),
                        ]
                    )
                ),
                div('#profile',[
                    div('#profilePic', [
                        div('#avatar', img('.wrap', {attrs: {src: user.avatar}})),
                        div('.red-label', [
                            div('.crown'),
                            div(user.rating)
                        ])
                    ]),
                    div('#profileDetails', [
                        div('.username', user.name),
                        div('.location', user.city)
                    ])
                ]),
                div('#navbar', [
                    div('#wodbook-screen.label', []),
                    div('#wodbook-screen.label', []), // just for padding

                    // div('#workout-screen.label', [
                    //     utils.SVGContent(svg.rope),
                    //     div('.nav-label', textLabels.menu.train)
                    // ]),
                    // div('#wodbook-screen.label', [
                    //     utils.SVGContent(svg.calendar),
                    //     div('.nav-label.red', 'Wodbook')
                    // ]),
                    div('#available-screen.label', [
                        utils.SVGContent(svg.rope),
                        div('.nav-label', textLabels.menu.train)
                    ]),
                    // div('#analyse-screen.label', [
                    //     utils.SVGContent(svg.bulb),
                    //     div('.nav-label.red', 'Analyse')
                    // ]),
                    state.session ? div('#coach-screen.label', [
                        utils.SVGContent(svg.book),
                        div('.nav-label', textLabels.menu.coach)
                    ]) : void 0,
                    div('#program-screen.label', [
                        utils.SVGContent(svg.wod),
                        div('.nav-label', textLabels.menu.program)
                    ]),
                    div('#support-screen.label', [
                        utils.SVGContent(svg.qna),
                        div('.nav-label', textLabels.menu.support)
                    ]),
                    // div('#donate-screen.label', [
                    //     utils.SVGContent(svg.donate),
                    //     div('.nav-label.blue', 'Feedback')
                    // ]),
                    // div('#compete-screen.label', [
                    //     utils.SVGContent(svg.cup),
                    //     div('.nav-label', 'Compete')
                    // ]),
                ]),
                // div('#donate-screen.label', [
                //     utils.SVGContent(svg.feedback),
                //     div('.nav-label', textLabels.menu.feedback)
                // ]),
                state.session ? 
                div('#logout.label', [
                    utils.SVGContent(svg.power),
                    div('.nav-label', textLabels.menu.logout)
                ]) :
                div('#login.label', [
                    utils.SVGContent(svg.power),
                    div('.nav-label', textLabels.menu.login)
                ])
            ]
        )
    );
}