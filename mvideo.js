const path = require('path')
const { FFScene, FFText, FFVideo, FFAlbum, FFImage, FFAudio, FFVideoAlbum, FFCreator } = require("ffcreator");
const ffmpeg = require('fluent-ffmpeg');

const video1 = path.join(__dirname, './asset/video/22.mov');
const video2 = path.join(__dirname, './asset/video/23.mov');
const audio = path.join(__dirname, './asset/audio/test.mp3');
const font1 = path.join(__dirname, './font/font1.ttf');
const font2 = path.join(__dirname, './font/font2.ttf');
const img = path.join(__dirname, "./asset/img/test222.png")

const videoPaths = [
  video1,
  video2
]

// 用于存储每个视频的时长
const videoInfo = [];

const getVideInfo = (videoPath) => {
  return new Promise((resolve, reject) => {
    // 获取视频时长
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error:', err);
      } else {
        // const durationInSeconds = metadata.format.duration;
        // console.log('Duration in seconds:', durationInSeconds);
        const duration = metadata.format.duration;
        const { width, height } = metadata.streams[0];
        videoInfo.push({ path: videoPath, duration, width, height});
        resolve(duration);
      }
    });
  })
}

async function processVideos() {
  try {
    // 并行获取视频时长
    const durations = await Promise.all(videoPaths.map(getVideInfo));
    // 在这里处理视频时长数组
    console.log('Video Durations:', durations);

    console.log('videoInfo', videoInfo)

    // 计算总时长并下取整
    const totalDuration = Math.ceil(durations.reduce((sum, duration) => sum + duration, 0));
    console.log('totalDuration:', totalDuration)

    const width = 500;
    const height = 680

    // Create FFCreator instance
    const creator = new FFCreator({
        width: 500,
        height: 680,
        fps: 30,
        clarity: 'medium', // medium high low 画面渲染质量
        cover: img
    });

    // Create scene
    const scene = new FFScene();
    scene.setBgColor("#000");
    // scene.setDuration(30);
    // scene.setTransition("GridFlip", 2);

    // Create Image and add animation effect
    // const image = new FFImage({ path: img });
    // image.setXY(250, 340);
    // image.setScale(2);
    // image.setWH(500, 680);
    // image.addEffect('fadeInDown', 1, 1);
    // scene.addChild(image);

    // const fvideo = new FFVideo({
    //   path: video1,
    //   width: width,
    //   height: height,
    //   x: width / 2,
    //   y: height / 2,
    //   ss: '00:00:00',
    //   to: '00:00:26',
    // });
    // console.log('getWH', fvideo.getWH())
    // fvideo.setAudio(true);
    // scene.addChild(fvideo);

    const faudio = new FFAudio({ path: audio, volume: 0.9, fadeIn: 4, fadeOut: 4, loop: true })
    creator.addAudio(faudio);

    const album = new FFVideoAlbum({
      list: videoPaths,
      width: width,
      height: height,
      x: width / 2,
      y: height / 2,
      ss: '00:00:00',
      to: '00:00:' + totalDuration
    });
    // album.addEffect('fadeInUp', 1, 1);
    scene.addChild(album);

    // 创建文字
    const text = new FFText({
      text: '欢迎来到天鹅到家',
      x: 250,
      y: 80
    });
    text.setColor('#ffffff');
    text.setBackgroundColor('#b33771');
    text.addEffect('fadeInDown', 1, 1);
    text.alignCenter();
    text.setFont(font1);
    text.setStyle({
      padding: [4, 12, 6, 12]
    });
    scene.addChild(text);
  
    // 床架场景1
    scene.setDuration(totalDuration);
    creator.addChild(scene);

    creator.output(path.join(__dirname, "./output/example.mp4"));
    creator.start();        // Start processing
    creator.closeLog();     // Close log (including perf)

    creator.on('start', () => {
        console.log(`FFCreator start`);
    });
    creator.on('error', e => {
        console.log(`FFCreator error: ${JSON.stringify(e)}`);
    });
    creator.on('progress', e => {
      console.log(`FFCreator progress: ${(e.percent * 100) >> 0}%`);
    });
    creator.on('complete', e => {
      console.log(`FFCreator completed: \n USEAGE: ${e.useage} \n PATH: ${e.output} `);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}
processVideos()
