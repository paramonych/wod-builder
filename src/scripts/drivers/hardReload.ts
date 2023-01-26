import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export function makeHardReloadDriver() {
    var status = xs.create();

    function hardReloadDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (payload) => {
                if(payload ) {
                    switch(payload.type) {
                        case 'reload':
                            window.location.reload(); break;
                        case 'location':
                            window.location = payload.location; break;
                    }
                }
            }
        }); 

        const source = xs.create({
            start: listener => {
                status.addListener({
                    next: (some: any) => {
                        listener.next(some);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return hardReloadDriver;
}