import xs from 'xstream';
import {input, div, object} from '@cycle/dom';
import {Sources} from '../../models/general';
import {DateTime} from 'luxon';
import {utils} from '../../utils/utils';
import {svg} from '../../utils/svg';

export function CalendarLayout(sources: Sources) {
    const state = sources.state.stream;

    //STATE MANAGEMENT
    const defaultReducer = xs.of(function defaultReducer(prevState) {
        return {date: DateTime.local().toLocaleString(DateTime.DATE_SHORT)}; 
    });

    return {
        DOM: view(state),
        state: xs.merge(defaultReducer)
    };
}

function view(state) {
    return state.map((state) => {
        
        return state && state.date ? div(`#calendar`, state.date): void 0;
    });
}