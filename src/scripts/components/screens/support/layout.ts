import xs from 'xstream';
import {div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen} from '../../../models/general';
import {svg} from '../../../utils/svg';

import {utils} from '../../../utils/utils';
import {VoiceCommands as cmd, VoiceCommandsInfo as cmdInfo} from '../../../utils/voiceCommands';
import {HeaderLayout} from '../../generic/header';
import {ComponentNavigation} from '../../generic/componentNavigation';
import { textLabels } from '../../../utils/labels';

const childOptions = {type: Screen.Support};

export function SupportLayout(sources: Sources): Sinks {
    const state = sources.state.stream;
    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);

    return {
        DOM: view(xs.combine(state, header.DOM, componentNavigation.DOM)),
        state: xs.merge(header.state),
        history: xs.empty(),
        cookie: xs.merge(header.cookie),
        fullscreen: header.fullscreen
    };
}

function view(input) {
    return input.map(([state, header, navigation]) => {
        const index = state.nav ? state.nav.index : 0;

        const body = div(`.body${index == 1 ?'.coming-soon':''}`, index == 0 ? [
            div('.memes', [ 
                div('.meme', [div('.icon', utils.SVGContent(svg.legendCap)), div('.value', textLabels.memes.cap)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendRounds)), div('.value', textLabels.memes.rounds)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendBigtime)), div('.value', textLabels.memes.bigtime)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendTime)), div('.value', textLabels.memes.time)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendReps)), div('.value', textLabels.memes.reps)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendDistance)), div('.value', textLabels.memes.distance)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendCalories)), div('.value', textLabels.memes.calories)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendDeficit)), div('.value', textLabels.memes.deficit)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendKetlb)), div('.value', textLabels.memes.ketlb)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendPace)), div('.value', textLabels.memes.pace)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendPlay)), div('.value', textLabels.memes.play)]),
                div('.meme', [div('.icon', utils.SVGContent(svg.legendCalendar)), div('.value', textLabels.memes.calendar)]),
            ]),
            div('.memes.vocab', [ 
                div('.meme', [div('.icon', 'AMRAP'), div('.value', textLabels.vocab.amrap)]),
                div('.meme', [div('.icon', 'AFAP'), div('.value', textLabels.vocab.afap)]),
                div('.meme', [div('.icon', 'CAP'), div('.value', textLabels.vocab.cap)]),
                div('.meme', [div('.icon', '1RM'), div('.value', textLabels.vocab.orm)]),
                div('.meme', [div('.icon', '#RM'), div('.value', textLabels.vocab.nrm)]),
                div('.meme', [div('.icon', 'BTH'), div('.value', textLabels.vocab.bth)]),
                div('.meme', [div('.icon', 'UNBK'), div('.value', textLabels.vocab.unbk)]),
            ])
        ] : (
            index == 1 ? 
                [
                    div('.prime'),
                    div('CHATBOT COMING SOON')
                ] 
            : 
                div('.memes.commands', 
                    Object.keys(cmd).map(screenKey => {
                        Object.keys(cmd[screenKey]).map(commandKey => {
                            div('.meme', [div('.icon', cmd[screenKey][commandKey]), div('.value', `${cmdInfo[screenKey][commandKey]}`)])
                        })
                    })
                )
        ));

        return div('.wrap', [header, navigation, body])
    });
}

