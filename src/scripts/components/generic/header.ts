import xs from 'xstream';
import {div, VNode, img} from '@cycle/dom';
import {Sources, Sinks, Screen} from '../../models/general';
import {utils} from '../../utils/utils';
import {svg} from '../../utils/svg';


const currentUser = utils.blankUser();

export function HeaderLayout(sources: Sources, options): Sinks {
    const state = sources.state.stream;

    const sessionCookie = sources.cookie.select(`getSessionCookieHeader${options.type}`).startWith(null);

    const hamburgerTrigger = sources.DOM.select('#hamburger').events('click');
    const fullscreenTrigger = sources.DOM.select('#fullscreen').events('click');

    const ticks = xs.periodic(1000);

    //STATE MANAGEMENT
    const defaultReducer = xs.of(function defaultReducer(prevState) {
        if(typeof prevState === 'undefined') {
            return {menu: false}; 
        } else {
            return prevState;
        }  
    });

    const hamburgerReducer = hamburgerTrigger.map(_ => {
        return (prevState) => ({...prevState, menu: !prevState.menu});
    });

    const timeReducer = ticks.map(_ => {
        return (prevState) => ({...prevState, time: utils.getLocalTime()});
    });

    const sessionCookieReducer = sessionCookie.map(session => {
        return (prevState) => ({...prevState, session: session});
    });

    const readSessionCookieAction = ticks.mapTo({category: `getSessionCookieHeader${options.type}`, action: 'get', params: ['app']});

    return {
        DOM: view(xs.combine(state, sessionCookie), options.type),
        state: xs.merge(defaultReducer, hamburgerReducer, timeReducer, sessionCookieReducer),
        fullscreen: fullscreenTrigger.mapTo(true),
        cookie: readSessionCookieAction
    };
}

function view(input, type?: Screen) {
    return input.map(([state, sessionCookie]) => 
        div('#header',
            div('.content',
                [
                    div('#hamburger.svg-wrap',
                        sessionCookie 
                        ? div('#profilePic', [
                            div('#avatar', img('.wrap', {attrs: {src: currentUser.avatar}})),
                        ])
                        : utils.SVGContent(svg.whiteHamburger)
                    ),
                    div('.title.svg-wrap', state.time),
                    div('#fullscreen.svg-wrap.header-action', utils.SVGContent(svg.fullscreen))
                ]
            )
        )
    );
}
