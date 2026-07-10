人物纪事头像投放目录（PRIVATE chronicle，非 AI 课程功能）

用法：
1. 把图片放进本目录，例如 lin.webp
2. 在 frontend/src/chronicle/flows.ts 对应节点写上：
   image: "/chronicle/portraits/lin.webp"

建议：WebP 或压缩 JPG/PNG 均可；原图 JPG/PNG 也行。文件名与节点 id 一致便于查找。
侧栏缩略图可点击，弹层查看原图（不裁切）。
没有 image 字段时页面不显示图片（无占位图）。
