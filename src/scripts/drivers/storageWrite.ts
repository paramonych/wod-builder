import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

var comp = require('lz-string');

export function makeStorageWriteDriver() {
    var processStatus = xs.create();

    function storageWriteDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (payload) => {
                if(payload && payload.type && payload.value) {
                    var compressed = comp.compressToEncodedURIComponent(JSON.stringify(payload.value));

                    localStorage.setItem(payload.type, compressed);
                } else if(payload && payload.type && payload.value == void 0) {
                    localStorage.removeItem(payload.type);
                }
            }
        }); 

        const source = xs.create({
            start: listener => {
                processStatus.addListener({
                    next: (some: any) => {
                        listener.next(some);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return storageWriteDriver;
}