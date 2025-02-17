# 魔鬼音乐播放器

## 项目简介
这是一个基于 Web 的音乐播放器，提供在线音乐播放功能。项目采用前后端分离架构，前端使用 HTML5 + CSS3 + Vue.js 开发，后端使用 Python Flask 框架。

## 功能特点
- 🎵 音乐搜索：支持歌名、歌手搜索
- ▶️ 在线播放：支持在线播放音乐，带进度条控制
- 📝 歌词同步：实时显示歌词，支持歌词滚动
- 📋 播放列表：支持播放列表管理（添加、删除、清空）
- 🌙 主题切换：支持日间/夜间模式切换
- 🎚️ 音量控制：支持音量调节和静音
- ⌨️ 快捷键控制：支持键盘快捷键操作

## 技术栈
### 前端
- HTML5 + CSS3
- Vue.js 2.6
- Axios
- Flexbox 和 Grid 布局
- 响应式设计

### 后端
- Python 3.x
- Flask 框架
- Flask-CORS

## 项目结构
```
├── README.md                 # 项目说明文档
├── index.html               # 主页面
├── css/                     # 样式文件目录
│   ├── style.css           # 主样式文件
│   ├── player.css          # 播放器样式
│   └── dark-theme.css      # 夜间模式样式
├── js/                      # JavaScript 文件目录
│   ├── app.js              # Vue 主应用
│   ├── player.js           # 播放器控制
│   └── api.js              # API 接口封装
├── images/                  # 图片资源目录
└── backend/                 # 后端代码目录
    ├── app.py              # Flask 应用主文件
    └── requirements.txt     # Python 依赖文件
```

## 快速开始

### 环境要求
- Python 3.x
- Node.js 和 npm（可选，用于开发）
- 现代浏览器（Chrome, Firefox, Edge 等）

### 安装步骤
1. 克隆项目
```bash
git clone https://github.com/0225liuyang/-.git
cd -
```

2. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

3. 启动后端服务
```bash
python app.py
```

4. 在浏览器中访问
```
http://localhost:5000
```

## 使用说明
1. 搜索音乐：在顶部搜索框输入关键词
2. 播放控制：使用底部播放器控制栏
3. 播放列表：
   - 点击"添加到播放列表"添加歌曲
   - 点击歌曲右侧删除按钮删除
   - 点击"清空列表"清空全部
4. 主题切换：点击右上角主题切换按钮
5. 快捷键：
   - 空格：播放/暂停
   - 左右方向键：上一曲/下一曲
   - 上下方向键：音量调节

## 开发规范
- HTML 采用语义化标签
- CSS 使用 Flexbox 和 Grid 布局
- JavaScript 采用模块化开发
- 所有代码添加中文注释
- 遵循 W3C 标准规范

## 后续计划
- [ ] 添加用户登录功能
- [ ] 实现音乐收藏功能
- [ ] 添加播放历史记录
- [ ] 支持多音质切换
- [ ] 优化移动端适配
- [ ] 添加音乐下载功能
- [ ] 实现歌单导入导出

## 贡献
欢迎提交问题和功能需求！如果你想贡献代码：
1. Fork 本仓库
2. 创建新的分支
3. 提交你的修改
4. 创建 Pull Request

## 许可证
本项目采用 MIT 许可证

## 页面布局说明
主页面采用响应式设计，分为以下几个主要区域：
1. 顶部导航栏：包含搜索框和主题切换按钮
2. 左侧边栏：显示播放列表和历史记录
3. 主内容区：显示搜索结果和歌曲信息
4. 底部播放器：包含播放控制、进度条和音量控制
5. 右侧歌词区：显示实时歌词

## 后续优化计划
- [ ] 添加用户登录功能
- [ ] 实现音乐收藏功能
- [ ] 添加播放历史记录
- [ ] 支持多音质切换
- [ ] 优化移动端适配
- [ ] 添加音乐下载功能
- [ ] 实现歌单导入导出

## 安装和运行
1. 克隆项目到本地
2. 安装前端依赖：`npm install`
3. 安装后端依赖：`pip install -r requirements.txt`
4. 启动后端服务：`python backend/app.py`
5. 在浏览器中访问：`http://localhost:5000`

## 贡献
欢迎提交问题和功能需求！如果你想贡献代码：
1. Fork 本仓库
2. 创建新的分支
3. 提交你的修改
4. 创建 Pull Request

## 许可证
本项目采用 MIT 许可证

## 贡献
欢迎提交问题和功能需求！如果你想贡献代码：
1. Fork 本仓库
2. 创建新的分支
3. 提交你的修改
4. 创建 Pull Request

## 许可证
本项目采用 MIT 许可证

 