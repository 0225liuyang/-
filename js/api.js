// API 接口封装
const API = {
    // 基础 URL
    baseURL: 'http://localhost:5000/api',

    // 通用请求方法
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('请求URL:', url);
            
            // 添加默认请求头
            const headers = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            };

            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include'  // 允许发送cookies
            });

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API响应错误:', response.status, errorText);
                throw new Error(`请求失败: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    // 搜索音乐
    async searchMusic(keyword, page = 1, pageSize = 20, platform = 'all') {
        try {
            if (!keyword || !keyword.trim()) {
                throw new Error('搜索关键词不能为空');
            }

            console.log('开始搜索音乐:', keyword, '平台:', platform);
            const encodedKeyword = encodeURIComponent(keyword.trim());
            const url = `/search?keyword=${encodedKeyword}&page=${page}&pageSize=${pageSize}&platform=${platform}`;
            
            console.log('搜索请求URL:', url);
            const data = await this.request(url);
            
            if (!Array.isArray(data)) {
                console.error('搜索结果格式错误:', data);
                return [];
            }
            
            return data;
        } catch (error) {
            console.error('搜索音乐失败:', error);
            throw error;
        }
    },

    // 获取歌曲详情
    async getSongDetail(songId) {
        return await this.request(`/song/detail?id=${songId}`);
    },

    // 获取歌曲播放地址
    async getSongUrl(songId) {
        try {
            console.log('获取歌曲URL:', songId);
            const response = await this.request(`/song/url?id=${songId}`);
            
            if (!response.url) {
                throw new Error('无法获取歌曲播放地址');
            }

            // 检查URL格式并处理
            let finalUrl = response.url;
            if (!finalUrl.startsWith('http')) {
                finalUrl = `${this.baseURL}/proxy/${finalUrl}`;
            }
            
            // 验证URL是否可访问
            try {
                const checkResponse = await fetch(finalUrl, { 
                    method: 'HEAD',
                    headers: {
                        'Referer': 'https://music.163.com/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (!checkResponse.ok) {
                    // 如果直接访问失败，尝试使用代理
                    finalUrl = `${this.baseURL}/proxy/music.163.com/song/media/outer/url?id=${songId}.mp3`;
                    console.log('使用代理URL:', finalUrl);
                }
            } catch (error) {
                console.error('URL验证失败:', error);
                // 使用代理URL作为备选
                finalUrl = `${this.baseURL}/proxy/music.163.com/song/media/outer/url?id=${songId}.mp3`;
                console.log('使用备用代理URL:', finalUrl);
            }
            
            console.log('最终的播放URL:', finalUrl);
            
            return {
                url: finalUrl,
                duration: response.duration || 0,
                bitRate: response.bitRate || 320000,
                format: response.format || 'mp3',
                size: response.size || 0
            };
        } catch (error) {
            console.error('获取歌曲播放地址失败:', error);
            // 使用通用播放地址作为最后的备选
            const fallbackUrl = `${this.baseURL}/proxy/music.163.com/song/media/outer/url?id=${songId}.mp3`;
            console.log('使用通用播放地址:', fallbackUrl);
            return {
                url: fallbackUrl,
                bitRate: 128000,
                format: 'mp3'
            };
        }
    },

    // 获取歌词
    async getLyrics(songId) {
        try {
            console.log('获取歌词:', songId);
            const response = await this.request(`/lyrics?id=${songId}`);
            
            if (!response.lyrics) {
                throw new Error('无法获取歌词');
            }
            
            // 解析歌词
            const lyrics = response.lyrics.split('\n').map(line => {
                const match = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g.exec(line);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3]);
                    const text = match[4].trim();
                    const time = minutes * 60 + seconds + milliseconds / 1000;
                    return { time, text };
                }
                return null;
            }).filter(item => item !== null);
            
            if (lyrics.length === 0) {
                throw new Error('歌词解析失败');
            }
            
            return { lyrics: response.lyrics, parsedLyrics: lyrics };
        } catch (error) {
            console.error('获取歌词失败:', error);
            const defaultLyrics = '[00:00.00]暂无歌词\n[00:03.00]请欣赏';
            return { 
                lyrics: defaultLyrics,
                parsedLyrics: [
                    { time: 0, text: '暂无歌词' },
                    { time: 3, text: '请欣赏' }
                ]
            };
        }
    },

    // 获取歌手信息
    async getArtistInfo(artistId) {
        return await this.request(`/artist?id=${artistId}`);
    },

    // 获取专辑信息
    async getAlbumInfo(albumId) {
        return await this.request(`/album?id=${albumId}`);
    },

    // 获取推荐歌单
    async getRecommendPlaylists(limit = 10) {
        return await this.request(`/recommend/playlists?limit=${limit}`);
    },

    // 获取热门歌曲
    async getHotSongs(limit = 20) {
        return await this.request(`/hot/songs?limit=${limit}`);
    },

    // 获取新歌榜
    async getNewSongs(limit = 20) {
        return await this.request(`/new/songs?limit=${limit}`);
    },

    // 获取排行榜
    async getRankings() {
        return await this.request('/rankings');
    },

    // 获取排行榜详情
    async getRankingDetail(rankingId) {
        return await this.request(`/ranking/detail?id=${rankingId}`);
    },

    // 获取歌单详情
    async getPlaylistDetail(playlistId) {
        return await this.request(`/playlist/detail?id=${playlistId}`);
    },

    // 获取相似歌曲
    async getSimilarSongs(songId, limit = 10) {
        return await this.request(`/similar/songs?id=${songId}&limit=${limit}`);
    },

    // 获取歌手热门歌曲
    async getArtistHotSongs(artistId, limit = 20) {
        return await this.request(`/artist/songs?id=${artistId}&limit=${limit}`);
    },

    // 获取歌手专辑
    async getArtistAlbums(artistId, page = 1, pageSize = 20) {
        return await this.request(`/artist/albums?id=${artistId}&page=${page}&pageSize=${pageSize}`);
    },

    // 获取评论
    async getComments(resourceType, resourceId, page = 1, pageSize = 20) {
        return await this.request(`/comments?type=${resourceType}&id=${resourceId}&page=${page}&pageSize=${pageSize}`);
    },

    // 错误处理
    handleError(error) {
        console.error('API错误:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return '网络连接错误，请检查网络设置';
        }
        
        if (error.message.includes('404')) {
            return '请求的资源不存在';
        }
        
        return error.message || '发生未知错误';
    }
};

// 导出 API 对象
window.API = API; 