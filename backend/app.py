from flask import Flask, request, jsonify, send_from_directory, render_template, Response
from flask_cors import CORS
import requests
import os
import json
from urllib.parse import urlencode, quote
import traceback

app = Flask(__name__, static_folder='../static', static_url_path='/static')
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)  # 启用更详细的CORS支持

# 网易云音乐API
NETEASE_BASE_URL = "https://music.163.com"
NETEASE_SEARCH_API = "http://music.163.com/api/search/get"
NETEASE_SONG_URL_API = "https://music.163.com/weapi/song/enhance/player/url/v1"
NETEASE_LYRIC_API = "https://music.163.com/weapi/song/lyric"

# 酷狗音乐API
KUGOU_SEARCH_API = "http://mobilecdn.kugou.com/api/v3/search/song"
KUGOU_SONG_URL_API = "http://m.kugou.com/app/i/getSongInfo.php"
KUGOU_LYRIC_API = "http://m.kugou.com/app/i/krc.php"

# QQ音乐API
QQ_SEARCH_API = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp"
QQ_SONG_URL_API = "https://u.y.qq.com/cgi-bin/musicu.fcg"
QQ_LYRIC_API = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg"

# 音乐API配置
MUSIC_API = {
    'search': 'https://music.163.com/weapi/cloudsearch/pc',
    'song_url': 'https://music.163.com/weapi/song/enhance/player/url/v1',
    'lyric': 'https://music.163.com/weapi/song/lyric'
}

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Origin': 'https://music.163.com',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# 加密参数
def get_encrypted_params():
    return {
        "csrf_token": "",
        "encodeType": "aac",
        "level": "standard",
        "encodeType": "mp3"
    }

# 静态文件服务
@app.route('/')
def index():
    try:
        return send_from_directory('../', 'index.html')
    except Exception as e:
        print(f"Error serving index.html: {e}")
        return "Error serving index.html", 500

@app.route('/<path:path>')
def serve_file(path):
    try:
        # 首先检查是否是js、css或images目录下的文件
        for directory in ['js', 'css', 'images']:
            full_path = os.path.join('..', directory, path)
            if os.path.exists(full_path):
                return send_from_directory(os.path.join('..', directory), path)
        
        # 然后检查是否在根目录
        root_path = os.path.join('..', path)
        if os.path.exists(root_path):
            return send_from_directory('..', path)
        
        print(f"File not found: {path}")
        return f"File not found: {path}", 404
        
    except Exception as e:
        print(f"Error serving {path}: {e}")
        return f"Error serving {path}", 500

@app.route('/api/proxy/<path:url>')
def proxy(url):
    """代理请求，解决跨域问题"""
    try:
        # 获取原始请求的所有参数
        args = request.args.copy()
        
        # 构建完整URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        
        if args:
            url = f'{url}?{urlencode(args)}'
        
        print(f"代理请求URL: {url}")
        
        # 发送代理请求
        response = requests.get(
            url,
            headers={
                'User-Agent': HEADERS['User-Agent'],
                'Referer': 'https://music.163.com/',
                'Accept': '*/*'
            },
            stream=True,
            timeout=10
        )
        
        # 检查响应状态
        if response.status_code != 200:
            print(f"代理请求失败: 状态码={response.status_code}, 响应={response.text[:200]}")
            return jsonify({"error": "代理请求失败"}), response.status_code
        
        # 构建代理响应
        proxy_response = Response(
            response.iter_content(chunk_size=8192),
            content_type=response.headers.get('content-type', 'audio/mpeg'),
            status=response.status_code
        )
        
        # 添加必要的响应头
        proxy_response.headers['Access-Control-Allow-Origin'] = '*'
        proxy_response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        proxy_response.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept'
        proxy_response.headers['Cache-Control'] = 'no-cache'
        
        return proxy_response
        
    except Exception as e:
        print(f"代理请求发生异常: {str(e)}")
        print(f"异常堆栈: {traceback.format_exc()}")
        return jsonify({"error": f"代理请求失败: {str(e)}"}), 500

@app.route('/api/search')
def search():
    """搜索音乐"""
    try:
        keyword = request.args.get('keyword', '').strip()
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))
        
        if not keyword:
            return jsonify({"error": "关键词不能为空"}), 400
        
        print(f"搜索参数: keyword={keyword}, page={page}, pageSize={page_size}")
        
        # 构造搜索URL
        search_url = "https://music.163.com/api/search/get"
        params = {
            's': keyword,
            'type': 1,
            'offset': (page - 1) * page_size,
            'limit': page_size,
            'total': True
        }
        
        # 发送搜索请求
        response = requests.get(
            search_url,
            params=params,
            headers={
                'User-Agent': HEADERS['User-Agent'],
                'Referer': 'https://music.163.com',
                'Host': 'music.163.com'
            },
            timeout=10
        )
        
        print(f"搜索响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"搜索请求失败: {response.text}")
            return jsonify({"error": "搜索请求失败"}), response.status_code
        
        data = response.json()
        print(f"搜索响应数据: {json.dumps(data, ensure_ascii=False)[:200]}...")
        
        if data.get('code') == 200 and 'result' in data and 'songs' in data['result']:
            songs = []
            for song in data['result']['songs']:
                songs.append({
                    'id': str(song['id']),
                    'name': song['name'],
                    'artist': song['artists'][0]['name'] if song['artists'] else '未知歌手',
                    'album': song['album']['name'] if 'album' in song else '',
                    'duration': song.get('duration', 0) // 1000,
                    'picUrl': song['album'].get('picUrl', '') if 'album' in song else ''
                })
            return jsonify(songs)
        
        print(f"搜索结果解析失败: {json.dumps(data, ensure_ascii=False)}")
        return jsonify([])
        
    except Exception as e:
        print(f"搜索发生异常: {str(e)}")
        print(f"异常堆栈: {traceback.format_exc()}")
        return jsonify({"error": f"搜索失败: {str(e)}"}), 500

@app.route('/api/song/url')
def get_song_url():
    """获取歌曲播放地址"""
    try:
        song_id = request.args.get('id')
        
        if not song_id:
            return jsonify({"error": "歌曲ID不能为空"}), 400
        
        print(f"获取歌曲URL: song_id={song_id}")
        
        # 尝试多个API获取音乐URL
        apis = [
            # API 1: 标准播放API
            {
                'url': "https://music.163.com/api/song/enhance/player/url",
                'params': {
                    'id': song_id,
                    'ids': f'[{song_id}]',
                    'br': 320000
                }
            },
            # API 2: 下载API
            {
                'url': "https://music.163.com/api/song/enhance/download/url",
                'params': {
                    'id': song_id,
                    'br': 320000
                }
            },
            # API 3: 移动端API
            {
                'url': f"https://music.163.com/api/song/url",
                'params': {
                    'id': song_id,
                    'br': 320000
                }
            }
        ]
        
        # 依次尝试不同的API
        for api in apis:
            try:
                response = requests.get(
                    api['url'],
                    params=api['params'],
                    headers={
                        'User-Agent': HEADERS['User-Agent'],
                        'Referer': 'https://music.163.com/',
                        'Host': 'music.163.com',
                        'Cookie': 'MUSIC_U=1'  # 添加基础Cookie
                    },
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"API响应: {json.dumps(data, ensure_ascii=False)[:200]}...")
                    
                    # 检查是否获取到URL
                    if data.get('code') == 200:
                        if 'data' in data and len(data['data']) > 0:
                            song_info = data['data'][0]
                            if song_info.get('url'):
                                return jsonify({
                                    'url': song_info['url'],
                                    'bitRate': song_info.get('br', 320000),
                                    'format': song_info.get('type', 'mp3'),
                                    'size': song_info.get('size', 0)
                                })
                        elif 'url' in data:
                            return jsonify({
                                'url': data['url'],
                                'bitRate': data.get('br', 320000),
                                'format': 'mp3',
                                'size': data.get('size', 0)
                            })
            except Exception as e:
                print(f"API请求失败: {str(e)}")
                continue
        
        # 如果所有API都失败，尝试使用通用播放地址
        common_url = f"https://music.163.com/song/media/outer/url?id={song_id}.mp3"
        
        # 验证通用地址是否可用
        try:
            check_response = requests.head(
                common_url,
                headers={
                    'User-Agent': HEADERS['User-Agent'],
                    'Referer': 'https://music.163.com/'
                },
                timeout=5,
                allow_redirects=True
            )
            
            if check_response.status_code == 200:
                return jsonify({
                    'url': common_url,
                    'bitRate': 320000,
                    'format': 'mp3'
                })
        except Exception as e:
            print(f"通用地址验证失败: {str(e)}")
        
        # 如果都失败了，返回错误
        return jsonify({"error": "无法获取音乐播放地址"}), 404
        
    except Exception as e:
        print(f"获取播放地址失败: {str(e)}")
        print(f"异常堆栈: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/lyrics')
def get_lyrics():
    """获取歌词（支持多平台）"""
    song_id = request.args.get('id', '')
    
    if not song_id:
        return jsonify({"error": "歌曲ID不能为空"}), 400
    
    try:
        platform, id_num = song_id.split('_', 1)
        
        if platform == 'netease':
            return get_netease_lyrics(id_num)
        elif platform == 'kugou':
            return get_kugou_lyrics(id_num)
        elif platform == 'qq':
            return get_qq_lyrics(id_num)
        else:
            return jsonify({"lyrics": "[00:00.00]暂不支持该平台的歌词\n[00:03.00]请欣赏"})
            
    except Exception as e:
        print(f"获取歌词失败: {str(e)}")
        return jsonify({"lyrics": "[00:00.00]获取歌词失败\n[00:03.00]请稍后重试"})

def get_netease_lyrics(song_id):
    """获取网易云音乐歌词"""
    try:
        url = f"http://music.163.com/api/song/lyric"
        params = {
            'id': song_id,
            'lv': -1,
            'kv': -1,
            'tv': -1
        }
        
        response = requests.get(
            url,
            params=params,
            headers={
                'User-Agent': HEADERS['User-Agent'],
                'Referer': 'https://music.163.com',
                'Host': 'music.163.com'
            },
            timeout=5
        )
        
        if response.status_code != 200:
            return jsonify({"lyrics": "[00:00.00]获取歌词失败\n[00:03.00]请稍后重试"})
            
        data = response.json()
        if data.get('lrc') and data['lrc'].get('lyric'):
            return jsonify({"lyrics": data['lrc']['lyric']})
            
        return jsonify({"lyrics": "[00:00.00]暂无歌词\n[00:03.00]请欣赏"})
        
    except Exception as e:
        print(f"获取网易云歌词失败: {str(e)}")
        return jsonify({"lyrics": "[00:00.00]获取歌词失败\n[00:03.00]请稍后重试"})

# 启动服务器
if __name__ == '__main__':
    app.run(debug=True, port=5000) 