import xs from 'xstream';
import {div, img} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen, User} from '../../../models/general';
import {utils} from '../../../utils/utils';
import {HeaderLayout} from '../../generic/header';
import { appDomain } from '../../../utils/const';

const currentUser = utils.blankUser(); // put to and read from top level state

const childOptions = {type: Screen.Account};

export function AccountLayout(sources: Sources): Sinks {
    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);

    return {
        DOM: view(header.DOM),
        state: header.state,
        history: xs.empty(),
        fullscreen: header.fullscreen
    };
}

function view(header) {
    return header.map(hd => {
        const body = div('.body', [ 
            div('#profile',[
                div('#profilePic', [
                    div('#avatar', img('.wrap', {attrs: {src: currentUser.avatar}})),
                    div('.red-label', [
                        div('.crown'),
                        div(currentUser.rating)
                    ])
                ]),
                div('#profileDetails', [
                    div('.username', currentUser.name),
                    div('.location', currentUser.city)
                ])
            ]),
            div('#qr', img('.qr', {attrs: {src: utils.getQrChartLink(appDomain)}}))
        ]);

        return div('.wrap', [hd, body])
    });
}
