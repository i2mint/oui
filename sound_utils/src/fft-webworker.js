var fftWorker = `
importScripts('https://otosense.analogcloudsandbox.io/static/js/fft/complex_array.js');
importScripts('https://otosense.analogcloudsandbox.io/static/js/fft/fft.js');


self.addEventListener('message', function(e) {
    // self.postMessage(e.data);
    var fftData = [];
    var bufData = e.data;
    var fftBufferSize = 512;
    var data = new complex_array.ComplexArray(fftBufferSize);
    var numBins = bufData.length/(fftBufferSize);
    var globalMax = 0;
    var nFactor = 1;
    for (var i = 0; i < bufData.length; i++) {
        if (bufData[i] > globalMax) {
            globalMax = bufData[i];
        }
    }
    if (globalMax < 0.5) {
        nFactor = 1 / globalMax;
    }
    for (var bin = 0; bin < numBins; bin++) {
        data.map(function(value, i) { value.real = bufData[bin * fftBufferSize + i] * nFactor; });
        var frequencies = data.FFT();
        if (bin < numBins - 1) fftData.push( getHalfArray( frequencies.magnitude() ) );
    };
    scaleFFTData(fftData); //scale the data before the drawSpectrum call

    self.postMessage(fftData);
}, false);

function scaleFFTData(data) {
    for (var bin = 0; bin < data.length; bin++) {
        for (var i = 0; i < data[bin].length; i++) {
            data[bin][i] = Math.log( 100*data[bin][i] + 1 );
        }
    }
}

function getHalfArray(array){
    var half = new Float32Array(array.length/2);
    for (var i = 0; i < array.length/2; i++) {
        half[i] = array[i];
    }
    return half;
}
`

exports.default = fftWorker;
