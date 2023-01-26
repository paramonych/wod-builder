import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export function makeStorageReadDriver() {
    var storedCreds = xs.create();

    function storageReadDriver(sink: Stream<string>) {  
        sink.addListener({
            next: (key) => {
                storedCreds.shamefullySendNext({key: key, value: localStorage.getItem(key)});
            }
        }); 

        const source = xs.create({
            start: listener => {
                storedCreds.addListener({
                    next: (o: any) => {
                        listener.next(o);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return storageReadDriver;
}