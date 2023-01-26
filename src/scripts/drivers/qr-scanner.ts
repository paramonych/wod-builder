import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

import jsQR from "jsqr";
import { appDomain } from '../utils/const';

export function makeQRScannerDriver() {
    var payload = xs.create();

    function qrCodeScannerDriver(sink: Stream<string>) {  
        sink.addListener({
            next: () => {
                //1) start the scanner
                //2) in the promise on qr detect event fire the event payload.shamefullySendNext(true);
                //3) stop the scanner

                const video = document.createElement("video");
                const canvasElement = document.getElementById("canvas");
                const canvas = canvasElement.getContext("2d");
                const loadingMessage = document.getElementById("scan-label");
                const primeLogo = document.getElementById("scaner");

                var imageData;
                var code;
                var mediaStream;
                var timeout;
            
                // Use facingMode: environment to attemt to get the front camera on phones
                navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", height: {max: 1080} } }).then(function(stream) {
                    mediaStream = stream;
                    video.srcObject = mediaStream;
                    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                    video.play();
                    requestAnimationFrame(tick);
                    primeLogo.hidden = true;
                    loadingMessage.style.top = '0';
                    timeout = setTimeout(dropMediaStream, 10000);
                })
                .catch((error) => loadingMessage.innerText = error);
  
                function tick() {
                    if(video.readyState === video.HAVE_ENOUGH_DATA) {
                        if(canvasElement.hidden) {
                            canvasElement.hidden = false;
                    
                            canvasElement.height = video.videoHeight;
                            canvasElement.width = video.videoWidth;
                        }
                
                        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                        imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                        code = jsQR(imageData.data, imageData.width, imageData.height, {inversionAttempts: "dontInvert",});
                
                        if(code && ~code.data.indexOf(`${appDomain}/workout/z/`)) {
                            canvasElement.hidden = true;
                            
                            video.pause();
                            video.remove();

                            payload.shamefullySendNext(code.data);
                            primeLogo.hidden = false;

                            if(mediaStream) {
                                mediaStream.getTracks().forEach(track => track.stop());
                            }
                            loadingMessage.style.top = 'calc(20vh)';
                            return;
                        } else if(code) {
                            loadingMessage.innerText = 'THIS IS NOT THE OPENCOACH CODE';
                        } else {
                            loadingMessage.innerText = 'PLEASE PUT THE QR CODE IN FRONT OF YOUR CAMERA';
                        }
                    }

                    if(timeout) {
                        requestAnimationFrame(tick);
                    } else {
                        canvasElement.hidden = true;
                        
                        video.pause();
                        video.remove();
    
                        primeLogo.hidden = false;
    
                        if(mediaStream) {
                            mediaStream.getTracks().forEach(track => track.stop());
                        }
                        loadingMessage.style.top = 'calc(20vh)';
                    }
                }

                function dropMediaStream() {
                    clearTimeout(timeout);
                    timeout = void 0;
                }

                // <input type="file" id="mypic" accept="image/*" capture="camera">
                
                // function previewFile() {
                //     const preview = document.querySelector('img');
                //     const file = document.querySelector('input[type=file]').files[0];
                //     const reader = new FileReader();
                  
                //     reader.addEventListener("load", function () {
                //         preview.src = reader.result; // feed to QR scanner method
                //     }, false);
                  
                //     if (file) {
                //       reader.readAsDataURL(file);
                //     }
                // }
            }
        }); 

        const source = xs.create({
            start: listener => {
                payload.addListener({
                    next: (resolvedDestination: string) => {
                        //3) read the resulting link
                        
                        listener.next(resolvedDestination || appDomain);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return qrCodeScannerDriver;
}