// 简单的 PCA 降维实现（用于 embedding 可视化）
// 输入：n×d 的向量矩阵，输出：n×3 的降维结果

export function pca3(vectors: number[][]): number[][] {
  const n = vectors.length;
  if (n === 0) return [];
  const d = vectors[0].length;

  // 1. 中心化
  const mean = new Array(d).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < d; i++) mean[i] += v[i] / n;
  }
  const centered = vectors.map((v) => v.map((x, i) => x - mean[i]));

  // 2. 用幂迭代法求前 3 个主成分（避免 SVD 的大矩阵计算）
  const components: number[][] = [];
  const dims = Math.min(3, d);

  // 残差矩阵（逐步减去已求成分的投影）
  const residual = centered.map((row) => [...row]);

  for (let c = 0; c < dims; c++) {
    // 随机初始化单位向量
    let pc = new Array(d).fill(0).map(() => Math.random() - 0.5);
    const norm = Math.sqrt(pc.reduce((s, x) => s + x * x, 0));
    pc = pc.map((x) => x / norm);

    // 幂迭代
    for (let iter = 0; iter < 50; iter++) {
      // residual × pc
      const proj = residual.map((row) => row.reduce((s, x, i) => s + x * pc[i], 0));
      // residual^T × proj → 新 pc
      const newPc = new Array(d).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) {
          newPc[j] += residual[i][j] * proj[i];
        }
      }
      const newNorm = Math.sqrt(newPc.reduce((s, x) => s + x * x, 0));
      if (newNorm < 1e-10) break;
      pc = newPc.map((x) => x / newNorm);
    }

    components.push(pc);

    // 从残差中减去这个成分的投影
    for (let i = 0; i < n; i++) {
      const dot = residual[i].reduce((s, x, j) => s + x * pc[j], 0);
      for (let j = 0; j < d; j++) {
        residual[i][j] -= dot * pc[j];
      }
    }
  }

  // 3. 投影到前 3 个主成分
  const result = vectors.map((v) => {
    return components.map((pc) => {
      return v.reduce((s, x, i) => s + x * pc[i], 0);
    });
  });

  // 4. 归一化到 [-3, 3] 范围便于可视化
  const maxAbs = Math.max(...result.flat().map(Math.abs), 0.01);
  return result.map((row) => row.map((x) => (x / maxAbs) * 3));
}
