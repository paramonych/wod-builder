import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

const qrious = require('qrious');

export function makeQRCodeDriver() {
    var payload = xs.create();

    function qrCodeDriver(sink: Stream<string>) {  
        sink.addListener({
            next: (directURLtoConvert: string) => {
                payload.shamefullySendNext(directURLtoConvert);
            }
        }); 

        const source = xs.create({
            start: listener => {
                payload.addListener({
                    next: (directURL: string) => {
                        const qr = new qrious();
                        qr.set({
                            level: 'H',
                            padding: 0,
                            size: 500,
                            value: directURL
                        });
                        listener.next({image: qr.toDataURL('image/jpeg'), payload: directURL});
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return qrCodeDriver;
}