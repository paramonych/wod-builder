import xs from 'xstream';
import {input, div, span, label, button, textarea} from '@cycle/dom';
import throttle from 'xstream/extra/throttle';
import isolate from '@cycle/isolate';
import sampleCombine from 'xstream/extra/sampleCombine';
import {Sources, Sinks, Screen} from '../../../models/general';
import {HeaderLayout} from '../../generic/header';
import {endpoints} from '../../../utils/const';
import {textLabels} from '../../../utils/labels';

const childOptions = {type: Screen.Donate};

export function DonateLayout(sources: Sources): Sinks {
    // RECEIVE SUSSESS FEEDBACK SUBMIT RESPONCE & SHOW MESSAGE
    const httpInputFlow = sources.HTTP.select('feedback').flatten().map(res => res.body).startWith(null); // pick only latest responce

    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
   
    const rating = sources.DOM.select('.rating-star').events('input').map(e => e.target.value).startWith('');
    const message = sources.DOM.select('#donation').events('input').map(e => e.target.value).startWith('');
    
    const feedbackSubmitButton = sources.DOM.select('#sendFeedback').events('click');

    const feedbackSubmitAction = feedbackSubmitButton.compose(sampleCombine(rating, message)).compose(throttle(5000));
    // MAKE HTTP REQUESTS
    const feedbackSubmitRequest = feedbackSubmitAction
        .map(([e, rating, message]) => {
            return {
                url: endpoints.feedback,
                category: 'feedback',
                method: 'POST',
                send: {rating: rating, message: message}
            };
        });

    return {
        DOM: view(xs.combine(header.DOM, httpInputFlow)),
        state: header.state,
        HTTP: feedbackSubmitRequest,
        history: xs.empty(),
        fullscreen: header.fullscreen
    };
}

function view(inputStream) {
    return inputStream.map(([hd, response]) => {
        const body = div('.body.coming-soon.donate-body', [ 
            div('.prime'),
            div('.feedback', 
                response && response.message 
                ? div('.response', textLabels.feedback[response.message])
                : [
                    div(textLabels.feedback.question),
                    div('.rating', 
                        span('.star-cb-group',[
                            input('#rating-5.rating-star', {attrs: {type: 'radio', name: 'rating', value: 5}}),
                            label({attrs: {for: 'rating-5'}}),
                            input('#rating-4.rating-star', {attrs: {type: 'radio', name: 'rating', value: 4}}),
                            label({attrs: {for: 'rating-4'}}),
                            input('#rating-3.rating-star', {attrs: {type: 'radio', name: 'rating', value: 3}}),
                            label({attrs: {for: 'rating-3'}}),
                            input('#rating-2.rating-star', {attrs: {type: 'radio', name: 'rating', value: 2}}),
                            label({attrs: {for: 'rating-2'}}),
                            input('#rating-1.rating-star', {attrs: {type: 'radio', name: 'rating', value: 1}}),
                            label({attrs: {for: 'rating-1'}}),
                            input('#rating-0.rating-star.star-cb-clear', {attrs: {type: 'radio', name: 'rating', value: 0}})
                        ])
                    ),
                    textarea('#donation', {attrs: {maxlength: '500', rows: 5, name: 'thoughts', placeholder: textLabels.feedback.placeholder}}),
                    button('#sendFeedback', textLabels.buttons.send)
                ]
            )
        ]);

        return div('.wrap', [hd, body])
    });
}

