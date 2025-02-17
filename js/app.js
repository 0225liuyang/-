// Vue.js 主应用
new Vue({
    el: '#app',
    data: {
        // 搜索相关
        searchKeyword: '',
        searchResults: [],
        isSearching: false,

        // 播放列表
        playlist: [],
        currentSongIndex: -1,

        // 播放器状态
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        progress: 0,
        volume: 80,
        isMuted: false,
        audioPlayer: null,

        // 歌词相关
        currentLyrics: [],
        currentLyricTime: 0,

        // 主题
        isDarkTheme: false
    },

    computed: {
        // 是否有上一首歌
        hasPreviousSong() {
            return this.currentSongIndex > 0;
        },

        // 是否有下一首歌
        hasNextSong() {
            return this.currentSongIndex < this.playlist.length - 1;
        },

        // 当前播放的歌曲
        currentSong() {
            return this.currentSongIndex >= 0 ? this.playlist[this.currentSongIndex] : null;
        }
    },

    created() {
        // 创建音频播放器实例
        this.audioPlayer = new Audio();
        
        // 监听播放器事件
        this.audioPlayer.addEventListener('timeupdate', this.updateProgress);
        this.audioPlayer.addEventListener('ended', this.onSongEnded);
        this.audioPlayer.addEventListener('loadedmetadata', this.onSongLoaded);
        
        // 设置初始音量
        this.audioPlayer.volume = this.volume / 100;

        // 从本地存储恢复播放列表和主题设置
        this.restoreState();

        // 添加键盘快捷键监听
        window.addEventListener('keydown', this.handleKeyPress);
    },

    methods: {
        // 搜索音乐
        async searchMusic() {
            if (!this.searchKeyword.trim()) return;
            
            this.isSearching = true;
            this.searchResults = [];
            
            try {
                console.log('开始搜索:', this.searchKeyword);
                const results = await API.searchMusic(this.searchKeyword);
                console.log('搜索结果:', results);
                
                if (Array.isArray(results) && results.length > 0) {
                    this.searchResults = results;
                } else {
                    console.log('未找到相关歌曲');
                    this.$nextTick(() => {
                        const noResults = document.querySelector('.no-results');
                        if (noResults) {
                            noResults.textContent = '未找到相关歌曲，请尝试其他关键词';
                        }
                    });
                }
            } catch (error) {
                console.error('搜索失败:', error);
                this.$nextTick(() => {
                    const noResults = document.querySelector('.no-results');
                    if (noResults) {
                        noResults.textContent = `搜索出错: ${error.message}`;
                    }
                });
            } finally {
                this.isSearching = false;
            }
        },

        // 添加歌曲到播放列表
        addToPlaylist(song) {
            if (!this.playlist.some(item => item.id === song.id)) {
                this.playlist.push(song);
                this.savePlaylist();
                
                // 如果是第一首歌，自动开始播放
                if (this.playlist.length === 1) {
                    this.playSong(song);
                }
            }
        },

        // 播放歌曲
        async playSong(song) {
            try {
                // 获取歌曲播放地址
                const response = await API.getSongUrl(song.mid || song.id);
                if (!response.url) {
                    throw new Error('无法获取歌曲播放地址');
                }

                // 更新当前播放索引
                this.currentSongIndex = this.playlist.findIndex(item => item.id === song.id);

                // 设置音频源
                this.audioPlayer.src = response.url;
                
                // 设置音频时长（如果有）
                if (response.duration) {
                    this.duration = response.duration;
                }

                // 尝试播放
                try {
                    await this.audioPlayer.play();
                    this.isPlaying = true;
                    
                    // 更新文档标题
                    document.title = `${song.name} - ${song.artist} - 酷狗音乐播放器`;
                    
                    // 加载歌词
                    this.loadLyrics(song.mid || song.id);
                } catch (playError) {
                    console.error('播放失败:', playError);
                    if (playError.name === 'NotAllowedError') {
                        alert('浏览器阻止了自动播放，请点击播放按钮手动播放');
                        this.isPlaying = false;
                    } else {
                        throw playError;
                    }
                }
            } catch (error) {
                console.error('获取歌曲信息失败:', error);
                alert(error.message || '播放失败，请稍后重试');
                this.isPlaying = false;
            }
        },

        // 加载歌词
        async loadLyrics(songId) {
            try {
                console.log('加载歌词:', songId);
                const response = await API.getLyrics(songId);
                
                if (response && response.lyrics) {
                    this.currentLyrics = this.parseLyrics(response.lyrics);
                    console.log('解析后的歌词:', this.currentLyrics);
                } else {
                    this.currentLyrics = [];
                    console.log('未获取到歌词');
                }
            } catch (error) {
                console.error('加载歌词失败:', error);
                this.currentLyrics = [];
            }
        },

        // 解析歌词
        parseLyrics(lyricsText) {
            if (!lyricsText) return [];
            
            const lines = lyricsText.split('\n');
            const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
            
            return lines
                .map(line => {
                    const match = timeRegex.exec(line);
                    if (!match) return null;

                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3]);
                    const time = minutes * 60 + seconds + milliseconds / 1000;
                    const text = line.replace(timeRegex, '').trim();

                    return { time, text };
                })
                .filter(item => item !== null)
                .sort((a, b) => a.time - b.time);
        },

        // 更新进度
        updateProgress() {
            this.currentTime = this.audioPlayer.currentTime;
            this.duration = this.audioPlayer.duration;
            this.progress = (this.currentTime / this.duration) * 100;
            this.updateCurrentLyric();
        },

        // 更新当前歌词
        updateCurrentLyric() {
            if (!this.currentLyrics.length) return;
            
            const currentTime = this.audioPlayer.currentTime;
            let foundIndex = -1;
            
            // 查找当前时间对应的歌词
            for (let i = 0; i < this.currentLyrics.length; i++) {
                if (this.currentLyrics[i].time > currentTime) {
                    foundIndex = i - 1;
                    break;
                }
            }
            
            if (foundIndex >= 0) {
                this.currentLyricTime = this.currentLyrics[foundIndex].time;
                this.scrollToCurrentLyric(foundIndex);
            }
        },

        // 滚动到当前歌词
        scrollToCurrentLyric(index) {
            this.$nextTick(() => {
                const container = document.querySelector('.lyrics-container');
                const lyrics = container.querySelectorAll('p');
                if (lyrics[index]) {
                    const lyricElement = lyrics[index];
                    const containerHeight = container.clientHeight;
                    const lyricHeight = lyricElement.clientHeight;
                    const scrollTop = lyricElement.offsetTop - (containerHeight / 2) + (lyricHeight / 2);
                    
                    container.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                }
            });
        },

        // 判断是否是当前播放的歌词
        isCurrentLyric(line) {
            return line.time === this.currentLyricTime;
        },

        // 设置播放进度
        setProgress(event) {
            const progressBar = event.currentTarget;
            const clickPosition = event.offsetX;
            const progressBarWidth = progressBar.offsetWidth;
            const percentage = clickPosition / progressBarWidth;
            
            this.audioPlayer.currentTime = this.duration * percentage;
        },

        // 切换播放/暂停
        async togglePlay() {
            if (!this.currentSong) {
                if (this.playlist.length > 0) {
                    await this.playSong(this.playlist[0]);
                }
                return;
            }
            
            try {
                if (this.isPlaying) {
                    await this.audioPlayer.pause();
                } else {
                    await this.audioPlayer.play();
                }
                this.isPlaying = !this.isPlaying;
            } catch (error) {
                console.error('播放控制失败:', error);
                alert(error.message || '播放控制失败，请稍后重试');
            }
        },

        // 播放上一首
        previousSong() {
            if (this.hasPreviousSong) {
                this.playSong(this.playlist[this.currentSongIndex - 1]);
            }
        },

        // 播放下一首
        nextSong() {
            if (this.hasNextSong) {
                this.playSong(this.playlist[this.currentSongIndex + 1]);
            }
        },

        // 歌曲播放结束
        onSongEnded() {
            if (this.hasNextSong) {
                this.nextSong();
            } else {
                this.isPlaying = false;
            }
        },

        // 歌曲加载完成
        onSongLoaded() {
            this.duration = this.audioPlayer.duration;
        },

        // 切换静音
        toggleMute() {
            this.isMuted = !this.isMuted;
            this.audioPlayer.muted = this.isMuted;
        },

        // 设置音量
        setVolume() {
            this.audioPlayer.volume = this.volume / 100;
            if (this.volume > 0) {
                this.isMuted = false;
                this.audioPlayer.muted = false;
            }
        },

        // 切换主题
        toggleTheme() {
            this.isDarkTheme = !this.isDarkTheme;
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('isDarkTheme', this.isDarkTheme);
        },

        // 格式化时间
        formatTime(seconds) {
            if (!seconds) return '0:00';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },

        // 保存播放列表到本地存储
        savePlaylist() {
            localStorage.setItem('playlist', JSON.stringify(this.playlist));
        },

        // 恢复状态
        restoreState() {
            // 恢复播放列表
            const savedPlaylist = localStorage.getItem('playlist');
            if (savedPlaylist) {
                this.playlist = JSON.parse(savedPlaylist);
            }

            // 恢复主题设置
            const savedTheme = localStorage.getItem('isDarkTheme');
            if (savedTheme === 'true') {
                this.isDarkTheme = true;
                document.body.classList.add('dark-theme');
            }
        },

        // 处理键盘快捷键
        handleKeyPress(event) {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    this.previousSong();
                    break;
                case 'ArrowRight':
                    this.nextSong();
                    break;
                case 'ArrowUp':
                    this.volume = Math.min(100, this.volume + 5);
                    break;
                case 'ArrowDown':
                    this.volume = Math.max(0, this.volume - 5);
                    break;
            }
        },

        // 删除单首歌曲
        removeSong(index) {
            // 如果删除的是当前播放的歌曲
            if (index === this.currentSongIndex) {
                // 停止播放
                this.audioPlayer.pause();
                this.isPlaying = false;
                
                // 清除当前播放的歌曲信息
                this.currentTime = 0;
                this.duration = 0;
                this.progress = 0;
                this.currentLyrics = [];
                
                // 更新文档标题
                document.title = '魔鬼音乐播放器 - 网页版';
            }
            // 如果删除的歌曲在当前播放歌曲之前，需要调整currentSongIndex
            else if (index < this.currentSongIndex) {
                this.currentSongIndex--;
            }
            
            // 从播放列表中移除
            this.playlist.splice(index, 1);
            
            // 保存更新后的播放列表
            this.savePlaylist();
            
            // 如果删除后播放列表为空，重置播放器状态
            if (this.playlist.length === 0) {
                this.currentSongIndex = -1;
            }
        },

        // 清空播放列表
        clearPlaylist() {
            if (confirm('确定要清空播放列表吗？')) {
                // 停止当前播放
                this.audioPlayer.pause();
                this.isPlaying = false;
                
                // 清除播放列表
                this.playlist = [];
                this.currentSongIndex = -1;
                
                // 重置播放器状态
                this.currentTime = 0;
                this.duration = 0;
                this.progress = 0;
                this.currentLyrics = [];
                
                // 更新文档标题
                document.title = '魔鬼音乐播放器 - 网页版';
                
                // 保存空播放列表
                this.savePlaylist();
            }
        }
    },

    watch: {
        // 监听音量变化
        volume() {
            this.setVolume();
        },

        // 监听搜索关键词变化
        searchKeyword(newVal) {
            if (!newVal.trim()) {
                this.searchResults = [];
            }
        },

        // 监听播放时间变化
        currentTime() {
            this.updateCurrentLyric();
        }
    },

    beforeDestroy() {
        // 清理事件监听
        this.audioPlayer.removeEventListener('timeupdate', this.updateProgress);
        this.audioPlayer.removeEventListener('ended', this.onSongEnded);
        this.audioPlayer.removeEventListener('loadedmetadata', this.onSongLoaded);
        window.removeEventListener('keydown', this.handleKeyPress);
    }
}); 