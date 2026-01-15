# 1. 选择基础镜像
FROM node:18-slim

# 2. 替换 Debian 软件源为阿里云镜像 (加速系统包下载，防止连接 Debian 官方源超时)
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 3. [关键修正] 不再安装 google-chrome-stable
# 而是手动安装 Puppeteer 运行所需的依赖库 (这些库都在 Debian 官方源里，国内能连上)
RUN apt-get update \
    && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 4. 优化 Puppeteer 安装配置
# - 跳过默认的 Chromium 下载 (我们只在构建阶段手动安装一次，或者使用系统自带的)
# - 但为了稳妥，我们这里让 puppeteer 下载它需要的版本，但指定位置到 .cache
ENV PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
# 这一行很关键：告诉 Puppeteer 不要把浏览器下载到 ~/.cache，而是项目目录下，方便管理
ENV PUPPETEER_CACHE_DIR=/app/.cache

# 5. 设置工作目录
WORKDIR /app

# 6. 复制并安装依赖
COPY package*.json ./
# 这里的 npm install 会触发 postinstall 脚本去下载 Chromium
# 因为我们配置了国内镜像，速度会有保障
RUN npm install && npm cache clean --force

# 7. 复制源码并构建 TypeScript 项目
COPY . .
RUN npm run build

# 8. 删除开发依赖，只保留生产依赖
# 注意：prune 可能会误删 puppeteer，但因为我们已经安装到 package.json dependencies 里了，通常没事
# 但为了极致精简和避免 bug，建议保留 puppeteer
# 如果空间非常敏感，可以考虑 multi-stage build (多阶段构建)
RUN npm prune --production

# 9. 移除源码文件，只保留构建产物
# 这一步可以进一步减小体积
RUN rm -rf src tsconfig.json

# 10. 创建非特权用户运行服务 (Security Best Practice)
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# 切换用于运行的用户
USER pptruser

# 11. 暴露端口
EXPOSE 3000

# 12. 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 13. 启动命令（使用编译后的 server.js）
CMD ["node", "dist/server.js"]
