import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export function makeFullscreenDriver() {
    var processStatus = xs.create();

    function fullscreenDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (enable) => {
                if(enable) {
                    if(document.fullscreenEnabled && !document.fullscreenElement) {
                        var app = document.getElementById('app');

                        if(app.requestFullscreen) {
                            app.requestFullscreen();
                        } else if(app.webkitrequestFullscreen) {
                            app.webkitRequestFullscreen();
                        } else if(app.mozRequestFullscreen) {
                            app.mozRequestFullScreen();
                        }
                    }
                } else {
                    document.exitFullscreen();
                }
            }
        }); 

        const source = xs.create({
            start: listener => {
                processStatus.addListener({
                    next: (type: any) => {
                        listener.next(type);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return fullscreenDriver;
}