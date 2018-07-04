
var MediaAPI = {
    mediaRecorder: null,
    recordedBlobs: null,
    recordedVideo: null,
    selectedVideo : null,
    init : function(video){
        this.recordedVideo = video;
    },
    //截图
    snapCapture: function() {
        if(!this.selectedVideo) return;
        var video = this.selectedVideo;
        var capture = $("<canvas/>").get(0);
        const videoWidth = video.videoWidth,
            videoHeight = video.videoHeight;
        if (videoWidth && videoHeight) {
            capture.width = videoWidth;
            capture.height = videoHeight;
            capture.getContext('2d').drawImage(
                video, 0, 0, videoWidth, videoHeight
            );

            var html = template("snapshot-item-tpl", { base64Data: capture.toDataURL('image/png') })
            if ($("#snapcapture-list").hasClass("empty")) {
                $("#snapcapture-list").removeClass("empty").html('');
            }
            $("#snapcapture-list").append(html);
        } else {
            setTimeout(snapCapture, 200);
        }
    },

    //本地录制
    startRecording: function(succ, error) {
        var stream = Stream.remote || Stream.local;
        var self = this;

        function handleStop(event) {
            console.log('Recorder stopped: ', event);
        }

        function handleDataAvailable(event) {
            if (event.data && event.data.size > 0) {
                self.recordedBlobs.push(event.data);
            }
        }
        var options = { mimeType: 'video/webm', bitsPerSecond: 100000 };
        this.recordedBlobs = [];
        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e0) {
            console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
                options = { mimeType: 'video/webm,codecs=vp9', bitsPerSecond: 100000 };
                this.mediaRecorder = new MediaRecorder(stream, options);
            } catch (e1) {
                console.log('Unable to create MediaRecorder with options Object: ', e1);
                try {
                    options = 'video/vp8'; // Chrome 47
                    this.mediaRecorder = new MediaRecorder(stream, options);
                } catch (e2) {
                    alert('MediaRecorder is not supported by this browser.\n\n' +
                        'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                    console.error('Exception while creating MediaRecorder:', e2);
                    if (error) error();
                    return;
                }
            }
        }
        if (succ) succ();
        // recordButton.textContent = 'Stop Recording';
        // playButton.disabled = true;
        // downloadButton.disabled = true;
        this.mediaRecorder.onstop = handleStop;
        this.mediaRecorder.ondataavailable = handleDataAvailable;
        this.mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', this.mediaRecorder);
        this.recordedVideo.poster = "https://dummyimage.com/260x200/&text=Recording...";
        this.recordedVideo.srcObject = null;
        this.recordedVideo.controls = false;
    },
    stopRecording: function(cb) {
        this.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        this.recordedVideo.controls = true;
        this.recordedVideo.poster = null;
        this.recordedVideo.autoplay = null;
        var superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
        if (cb) cb();
    },
    play: function() {
        if(this.recordedVideo){
            this.recordedVideo.play();
        }
    },

    download: function() {
        var blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'record.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

};