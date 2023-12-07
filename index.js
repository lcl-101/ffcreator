const path = require('path')
const { spawn } = require('child_process');
const { FFScene, FFText, FFVideo, FFAlbum, FFImage, FFAudio, FFVideoAlbum, FFCreator } = require("ffcreator");
const ffmpeg = require('fluent-ffmpeg');

const video1 = path.join(__dirname, './asset/video/30.mov');
const audio = path.join(__dirname, './asset/audio/ad.mp3');
// const font1 = path.join(__dirname, './font/font1.ttf');
const font2 = path.join(__dirname, './font/font2.ttf');
const img = path.join(__dirname, "./asset/img/test222.png")
const outPath = path.join(__dirname, "./output/blur/")

// 随机5位数
function generateRandomCertificate() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let certificate = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    certificate += characters.charAt(randomIndex);
  }

  return certificate;
}

const getVideoFileNameWithoutExtension = (videopath) => {
  const fileName = path.basename(videopath);
  const fileNameWithoutExtension = fileName.replace(/\..+$/, ''); // 去掉.后面的字符串
  return fileNameWithoutExtension;
};

// 高斯模糊
const setBoxBlur = (videopath, outname) => {
  return new Promise((resolve, reject) => {
    const startTime = new Date(); // 获取开始时间
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', videopath,
      '-vf', 'boxblur=40',
      '-c:a', 'copy',
      outname
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      // 这里可以处理 stdout 数据
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const message = data.toString();

      if (message.includes('Error:')) {
        console.error('Error:', message);
        // 处理错误逻辑
      } else if (message.includes('Warning:')) {
        console.warn('Warning:', message);
        // 处理警告逻辑
      } else {
        console.log('Log:', message);
        // 处理日志逻辑
      }
    });

    ffmpegProcess.on('close', (code) => {
      const endTime = new Date(); // 获取结束时间
      const executionTime = endTime - startTime; // 计算执行时间
      console.log(`耗时: ${executionTime} 毫秒`);
      if (code === 0) {
        console.log('命令执行成功');
        resolve({
          code: 200,
          msg: 'success',
          path: outname,
          executionTime: executionTime
        });
      } else {
        console.error(`命令执行失败，退出码: ${code}`);
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
  });
};


const videoPaths = [
  video1
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
        videoInfo.push({ path: videoPath, duration, width, height, name: getVideoFileNameWithoutExtension(metadata.format.filename) });
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

    // 开启高斯模糊
    const outName = outPath + videoInfo[0].name + generateRandomCertificate() + ".mp4"
    await setBoxBlur(video1, outName);

    // 计算总时长并下取整
    const totalDuration = Math.ceil(durations.reduce((sum, duration) => sum + duration, 0));
    console.log('totalDuration:', totalDuration)

    const width = 720;
    const height = 1280;

    // Create FFCreator instance
    const creator = new FFCreator({
        width: width,
        height: height,
        fps: 30,
        clarity: 'medium', // medium high low 画面渲染质量
        cover: img
    });

    // Create scene
    const scene = new FFScene();
    scene.setBgColor("#000");

    const faudio = new FFAudio({ path: audio, volume: 0.9, fadeIn: 4, fadeOut: 4, loop: true })
    creator.addAudio(faudio);

    const bgvideo = new FFVideo({
      path: outName,
      width: width,
      height: height,
      x: width / 2,
      y: height / 2,
      ss: '00:00:00',
      to: '00:00:' + Math.ceil(durations[0]),
    });
    bgvideo.setAudio(false);
    scene.addChild(bgvideo);

    const fvideo = new FFVideo({
      path: video1,
      width: width,
      height: videoInfo[0].height/(videoInfo[0].width / width),
      x: width / 2,
      y: height / 2,
      ss: '00:00:00',
      to: '00:00:' + Math.ceil(durations[0]),
    });
    fvideo.setAudio(false);
    scene.addChild(fvideo);

    // 创建文字
    const text = new FFText({
      text: '欢迎来到天鹅到家',
      x: width / 2,
      y: 200
    });
    text.setColor('#F75B04');
    text.addEffect('fadeInDown', 1, 1);
    text.alignCenter();
    text.setStyle({
      fontSize: '74px',
      stroke:  '#FDE79E',
      strokeThickness: 8
    });
    scene.addChild(text);

    const text2 = new FFText({
      text: '保姆/月嫂/育儿嫂/养老护工/保洁',
      x: width / 2,
      y: 300
    });
    text2.setColor('#F75B04');
    text2.addEffect('fadeInDown', 1, 1);
    text2.alignCenter();
    text2.setStyle({
      fontSize: '42px',
      stroke:  '#FDE79E',
      strokeThickness: 8
    });
    scene.addChild(text2);


    const text3 = new FFText({
      text: '全国招聘 免费报名 不限经验 上户保障',
      x: width / 2,
      y: 960
    });
    text3.setColor('#fff');
    text3.alignCenter();
    text3.setStyle({
      fontSize: '32px'
    });
    scene.addChild(text3);

    // 床架场景1
    scene.setDuration(totalDuration);
    creator.addChild(scene);

    creator.output(path.join(__dirname, `./output/${videoInfo[0].name}.mp4`));
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
