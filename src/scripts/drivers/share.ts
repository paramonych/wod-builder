import xs, {Stream} from 'xstream';
import { appDomain } from '../utils/const';
import {SharePayload} from '../utils/interfaces';

export function makeShareDriver() {
    return (payload$: Stream<SharePayload>) => { 
        payload$.addListener({
            next: payload => {
                if (navigator.share) {
                    navigator.share({
                        title: `${payload.title || 'OpenCoach WOD'}`,
                        url: `${payload.url || appDomain}`
                    }).then(() => {
                        console.log('Thanks for sharing!', payload.url);
                    })
                    .catch(console.error);
                } else {
                    window.open((String)(payload.url), '_blank');
                }
            }
        }); 
    }
}