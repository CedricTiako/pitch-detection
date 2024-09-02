
async function getAnalyser(audioContext , element){
    try{
        let stream = null 
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        if(!element){
            stream =  await navigator.mediaDevices.getUserMedia({ audio: true });
        }else{
            stream = element.captureStream();
            element.play()
        }
        const source = audioContext.createMediaStreamSource(stream);
        const lowpassFilter = audioContext.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(1500, audioContext.currentTime);
        source.connect(lowpassFilter)
        lowpassFilter.connect(analyser);
        return analyser
    }catch(err){
        console.error('Error accessing media devices:', err);
    }
}

async function getProcessor(audioContext){
    try{
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const audioData = [];

        processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer.getChannelData(0); // Canal 0
            audioData.push(new Float32Array(inputBuffer)); // Stocker les échantillons
        };
        const source = audioContext.createMediaStreamSource(stream);
        processor.connect(audioContext.destination);
        source.connect(processor);
        return processor
    }catch(err){
        console.error('Error accessing media devices:', err);
    }
}

async function startRecord(){
    try{
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioData = [];

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioData.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioData, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            playback.src = URL.createObjectURL(audioBlob);
            playback.play();
            console.log('AudioBuffer', audioBuffer);
        };

    }catch(err){
        console.error('Error accessing media devices:', err);
    }
}

function getFrequencyData(analyser){
    let data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data
}

function getTimeDomainData(analyser){
    let data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    return data
}

function drawSpectre(processedData , canvas){
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    let ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0, 0, 0 , 5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    let barWidth = WIDTH / processedData.length;
    let barHeight;
    let x = 0;
    for (let i = 0; i < processedData.length; i++) {
        barHeight = processedData[i];
        x = i * barWidth; // Linear scale        
        ctx.fillStyle = `rgb(${barHeight + 100}, 255, 255)`;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
    }
}

function getMoyArray(fr){
    let sumamp = 0
    for(let i = 0; i < fr.length;i++){
        sumamp += fr[i]
    }
    return (sumamp/fr.length)*2
}

function getAmplitudeMoyeneArray(dataArray){
    ret = Array(dataArray.length)
    for (let j = 0; j < dataArray.length; j++){
        ret.push(getMoyArray(dataArray[j]))
    }
    return ret
}

function removeNoise(data , limit){
    let ret = Array()
    for(let i of data){
        if(i>limit) ret.push(i);
    }
    return ret
}

function compareDataList(array1, array2) {
    let length = Math.min(array1.length, array2.length)
    let sum = 0
    for (let j = 0; j < length; j++) {
        sum += Math.abs((array1[j] - array2[j]));
    }
    let mse = sum/length
    return mse;
}
