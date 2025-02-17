// 音频播放器控制类
class AudioPlayerController {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.volume = 1;
        this.isMuted = false;

        // 绑定事件处理器
        this.bindEvents();
    }

    // 绑定音频事件
    bindEvents() {
        // 播放结束事件
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        // 音频错误事件
        this.audio.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
            this.handleError(e);
        });

        // 音频加载事件
        this.audio.addEventListener('loadstart', () => {
            console.log('开始加载音频');
        });

        // 音频可以播放事件
        this.audio.addEventListener('canplay', () => {
            console.log('音频可以播放');
        });

        // 音频播放中断事件
        this.audio.addEventListener('stalled', () => {
            console.log('音频播放中断');
            this.handleStalled();
        });

        // 音频缓冲事件
        this.audio.addEventListener('waiting', () => {
            console.log('音频缓冲中');
        });
    }

    // 设置音频源
    setSource(url) {
        if (!url) {
            throw new Error('无效的音频地址');
        }
        this.audio.src = url;
        this.audio.load();
    }

    // 播放
    play() {
        if (!this.audio.src) {
            throw new Error('未设置音频源');
        }
        this.audio.play().catch(this.handleError);
        this.isPlaying = true;
    }

    // 暂停
    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    // 切换播放/暂停
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // 设置音量
    setVolume(value) {
        if (value < 0 || value > 1) {
            throw new Error('音量值必须在 0-1 之间');
        }
        this.volume = value;
        this.audio.volume = value;
    }

    // 切换静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
    }

    // 设置播放进度
    seek(time) {
        if (time < 0 || time > this.audio.duration) {
            throw new Error('无效的时间点');
        }
        this.audio.currentTime = time;
    }

    // 获取当前播放时间
    getCurrentTime() {
        return this.audio.currentTime;
    }

    // 获取音频总时长
    getDuration() {
        return this.audio.duration;
    }

    // 获取播放进度百分比
    getProgress() {
        if (!this.audio.duration) return 0;
        return (this.audio.currentTime / this.audio.duration) * 100;
    }

    // 设置播放列表
    setPlaylist(songs) {
        if (!Array.isArray(songs)) {
            throw new Error('播放列表必须是数组');
        }
        this.playlist = songs;
        this.currentIndex = -1;
    }

    // 添加歌曲到播放列表
    addToPlaylist(song) {
        this.playlist.push(song);
    }

    // 从播放列表移除歌曲
    removeFromPlaylist(index) {
        if (index < 0 || index >= this.playlist.length) {
            throw new Error('无效的索引');
        }
        this.playlist.splice(index, 1);
        if (index === this.currentIndex) {
            this.currentIndex = -1;
        } else if (index < this.currentIndex) {
            this.currentIndex--;
        }
    }

    // 播放指定索引的歌曲
    playAt(index) {
        if (index < 0 || index >= this.playlist.length) {
            throw new Error('无效的索引');
        }
        this.currentIndex = index;
        this.setSource(this.playlist[index].url);
        this.play();
    }

    // 播放下一首
    playNext() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.playAt(this.currentIndex + 1);
        }
    }

    // 播放上一首
    playPrevious() {
        if (this.currentIndex > 0) {
            this.playAt(this.currentIndex - 1);
        }
    }

    // 清空播放列表
    clearPlaylist() {
        this.playlist = [];
        this.currentIndex = -1;
        this.pause();
        this.audio.src = '';
    }

    // 获取当前播放的歌曲
    getCurrentSong() {
        if (this.currentIndex === -1) return null;
        return this.playlist[this.currentIndex];
    }

    // 错误处理
    handleError(error) {
        console.error('播放器错误:', error);
        // 这里可以添加错误处理逻辑，比如显示错误提示、重试等
    }

    // 处理播放中断
    handleStalled() {
        // 尝试重新加载并播放
        this.audio.load();
        if (this.isPlaying) {
            this.play();
        }
    }

    // 销毁播放器
    destroy() {
        this.pause();
        this.audio.src = '';
        this.playlist = [];
        this.currentIndex = -1;
    }
}

// 导出播放器控制器
window.AudioPlayerController = AudioPlayerController; 