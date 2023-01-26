import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

const Wad = require('web-audio-daw');

export function makeWadDriver() {
    function wadDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (payload) => {
                const saw = new Wad({source : 'sine'});
                
                const beep = (depth, payload, final) => {
                    saw.play({...payload.config, env:{attack: .01, release:.02}});
                    setTimeout(() => {
                        saw.stop();
                        setTimeout(() => {
                            if(depth < payload.repeat) {
                                depth += 1;
                                beep(depth, payload, (depth==payload.repeat));
                            }
                        }, 900);
                    }, payload.length/(final?1:7));
                }
                beep(1, payload, false);
            }
        }); 
    }
  
    return wadDriver;
}