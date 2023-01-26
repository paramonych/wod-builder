import xs from 'xstream';
import {div, VNode} from '@cycle/dom';
import throttle from 'xstream/extra/throttle';
import {Sources, Sinks, Screen} from '../../models/general';
import {utils} from '../../utils/utils';
import {svg} from '../../utils/svg';
import {navOptions} from '../../utils/navOptions';
import {VoiceCommands as cmd} from '../../utils/voiceCommands';
import {textLabels} from '../../utils/labels';
import sampleCombine from 'xstream/extra/sampleCombine';

export function ComponentNavigation(sources: Sources, options): Sinks {
    const state = sources.state.stream;
    const screenType = options.type;

    const prev = sources.DOM.select("#prevLabel").events("click").mapTo(-1);
    const next = sources.DOM.select("#nextLabel").events("click").mapTo(1);

    const externalIndex = state.filter(state => !state.index && state.externalIndex).map(state => state.externalIndex).startWith(null);

    const command = sources.DOM.select(".label-wrap:not(.inactive)").events("click").compose(throttle(1000)).map(e => e.ownerTarget.dataset.action);
    
    const action = xs.merge(prev, next);
    const optionsList = navOptions[screenType] as string[];

    const componentTabIndex = action.fold((x: number, y: number) => {
        return (x+y > optionsList.length) ? 1 : (x+y < 1 ? optionsList.length : x+y);
    }, 1);

    return {
        DOM: view(xs.combine(componentTabIndex, externalIndex), screenType, optionsList),
        clickCommand: screenType == Screen.Coach ? xs.merge(prev, next) : command,
        history: action.compose(sampleCombine(componentTabIndex)).map(([_,index]) => `/${screenType}/n/${index}`)
    };
}

function view(input, screenType, optionsList: string[]) {
    return input.map(([index, externalIndex]) => {
        return div(`#${screenType.replace('Short','')}-nav.screen-nav`, 
            div(`.content`, [
                div('#prevLabel.svg-wrap', optionsList.length > 1 ? utils.SVGContent(svg.left) : void 0),
                outOfScreenTypeLabel(screenType, optionsList, (externalIndex ? externalIndex : index) -1),
                div('#nextLabel.svg-wrap', optionsList.length > 1 ? utils.SVGContent(svg.right) : void 0)
            ])
        )
        });
}

function outOfScreenTypeLabel(screenType, optionsList, index): VNode {

    switch(screenType) {
        case `${Screen.Program}`:
        case `${Screen.Workout}`:
        case `${Screen.Workout}Short`:
            var command = textLabels.nav[screenType][optionsList[index]]//cmd[screenType][optionsList[index]];
            return div('.label-wrap', {attrs: {'data-action': command}}, [
                div('.label-sub', textLabels.action.click),
                div('.label', command)
            ]);
        case `${Screen.Coach}`:
        case `${Screen.Wodbook}`:
            // NON CLICKABLE CASES
            var command = textLabels.nav[screenType][optionsList[index]]
            return div('.label-wrap.inactive', {attrs: {'data-action': command}}, [
                div('.label', command)
            ]);
        default:
            var command = cmd[optionsList[index]];
            return div('.label', optionsList[index]);
    }
}

