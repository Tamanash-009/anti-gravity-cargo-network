/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — SVG Charts
   Sparklines, Bar Charts, Line Charts, Donut Charts
   ============================================================ */

// ---- Sparkline ----
export function renderSparkline(container, data, options = {}) {
  const {
    width = container.clientWidth || 120,
    height = 36,
    color = '#3b82f6',
    fill = true,
    strokeWidth = 1.5,
  } = options;

  if (!data || data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 3;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${width},${height} L0,${height} Z`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.overflow = 'visible';

  if (fill) {
    const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fillPath.setAttribute('d', fillD);
    fillPath.setAttribute('fill', `url(#spark-grad-${color.replace('#','')})`);
    fillPath.setAttribute('opacity', '0.18');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    const gradId = `spark-grad-${color.replace('#','')}`;
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', color); stop1.setAttribute('stop-opacity', '0.5');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', color); stop2.setAttribute('stop-opacity', '0');
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(fillPath);
  }

  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  linePath.setAttribute('d', pathD);
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke', color);
  linePath.setAttribute('stroke-width', strokeWidth);
  linePath.setAttribute('stroke-linecap', 'round');
  linePath.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(linePath);

  // Last point dot
  const lastPt = pts[pts.length - 1];
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', lastPt[0]);
  dot.setAttribute('cy', lastPt[1]);
  dot.setAttribute('r', 2.5);
  dot.setAttribute('fill', color);
  svg.appendChild(dot);

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Bar Chart ----
export function renderBarChart(container, data, options = {}) {
  const {
    width = container.clientWidth || 400,
    height = 160,
    barColor = '#3b82f6',
    labelKey = 'label',
    valueKey = 'value',
    showLabels = true,
    showValues = false,
    gridLines = 4,
  } = options;

  const maxVal = Math.max(...data.map(d => d[valueKey]));
  const barGap = 4;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;
  const chartHeight = showLabels ? height - 28 : height;
  const padTop = 8;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const colors = Array.isArray(barColor) ? barColor : data.map(() => barColor);

  // Grid lines
  for (let i = 0; i <= gridLines; i++) {
    const y = padTop + ((gridLines - i) / gridLines) * (chartHeight - padTop);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0); line.setAttribute('x2', width);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
  }

  data.forEach((d, i) => {
    const barH = Math.max(2, ((d[valueKey] / maxVal) * (chartHeight - padTop)));
    const x = i * (barWidth + barGap);
    const y = chartHeight - barH;
    const color = colors[i % colors.length];

    // Defs for gradient
    const defs = svg.querySelector('defs') || (() => {
      const d2 = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(d2, svg.firstChild);
      return d2;
    })();

    const gradId = `bar-grad-${i}`;
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gradId); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.5');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', barH);
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('rx', 3);
    svg.appendChild(rect);

    if (showLabels && d[labelKey]) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', height - 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', 'rgba(255,255,255,0.35)');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = d[labelKey];
      svg.appendChild(text);
    }
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Line Chart ----
export function renderLineChart(container, datasets, options = {}) {
  const {
    width = container.clientWidth || 400,
    height = 160,
    showGrid = true,
    showDots = false,
    labels = [],
    padTop = 12,
    padBottom = 28,
    padLeft = 40,
    padRight = 12,
  } = options;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const allValues = datasets.flatMap(ds => ds.data);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const toX = (i) => padLeft + (i / (datasets[0].data.length - 1)) * chartW;
  const toY = (v) => padTop + chartH - ((v - minVal) / range) * chartH;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Grid
  if (showGrid) {
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = padTop + (i / gridCount) * chartH;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padLeft); line.setAttribute('x2', width - padRight);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      line.setAttribute('stroke-width', 1);
      svg.appendChild(line);

      const val = maxVal - (i / gridCount) * range;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', padLeft - 6);
      text.setAttribute('y', y + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', 'rgba(255,255,255,0.3)');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = val >= 1000 ? (val/1000).toFixed(0)+'K' : Math.round(val);
      svg.appendChild(text);
    }
  }

  // X labels
  if (labels.length > 0) {
    const step = Math.ceil(labels.length / 7);
    labels.forEach((label, i) => {
      if (i % step !== 0) return;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', toX(i));
      text.setAttribute('y', height - 6);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', 'rgba(255,255,255,0.3)');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = label;
      svg.appendChild(text);
    });
  }

  // Lines
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  datasets.forEach((ds, di) => {
    const pts = ds.data.map((v, i) => [toX(i), toY(v)]);
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

    // Fill
    const gradId = `line-grad-${di}`;
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gradId); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', ds.color); s1.setAttribute('stop-opacity', '0.2');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', ds.color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);

    const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fillPath.setAttribute('d', `${pathD} L${toX(pts.length-1)},${padTop+chartH} L${toX(0)},${padTop+chartH} Z`);
    fillPath.setAttribute('fill', `url(#${gradId})`);
    svg.appendChild(fillPath);

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', pathD);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', ds.color);
    linePath.setAttribute('stroke-width', ds.strokeWidth || 2);
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(linePath);

    if (showDots) {
      pts.forEach(([cx, cy]) => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', 3);
        dot.setAttribute('fill', ds.color); dot.setAttribute('stroke', 'var(--bg-surface)'); dot.setAttribute('stroke-width', 2);
        svg.appendChild(dot);
      });
    }
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Donut Chart ----
export function renderDonut(container, segments, options = {}) {
  const {
    size = 100,
    strokeWidth = 14,
    gap = 2,
    centerLabel = '',
    centerSub = '',
  } = options;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  // Background circle
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', size/2); bg.setAttribute('cy', size/2); bg.setAttribute('r', radius);
  bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'rgba(255,255,255,0.06)');
  bg.setAttribute('stroke-width', strokeWidth);
  svg.appendChild(bg);

  let offset = 0;
  const gapAngle = (gap / circumference) * 360;

  segments.forEach(seg => {
    const fraction = seg.value / total;
    const arcLen = fraction * circumference;
    const dashArray = `${arcLen - gap} ${circumference}`;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', size/2); circle.setAttribute('cy', size/2); circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', seg.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', dashArray);
    circle.setAttribute('stroke-dashoffset', -offset);
    circle.setAttribute('stroke-linecap', 'round');
    circle.style.transition = 'stroke-dasharray 0.6s ease';
    circle.style.transformOrigin = 'center';
    circle.style.transform = 'rotate(-90deg)';
    svg.appendChild(circle);

    offset += arcLen;
  });

  // Center text
  if (centerLabel) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', size/2); text.setAttribute('y', size/2 - (centerSub ? 5 : 0));
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '18'); text.setAttribute('font-weight', '800');
    text.setAttribute('fill', 'var(--text-1)'); text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = centerLabel;
    svg.appendChild(text);

    if (centerSub) {
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('x', size/2); sub.setAttribute('y', size/2 + 14);
      sub.setAttribute('text-anchor', 'middle'); sub.setAttribute('dominant-baseline', 'middle');
      sub.setAttribute('font-size', '10'); sub.setAttribute('font-weight', '500');
      sub.setAttribute('fill', 'var(--text-3)'); sub.setAttribute('font-family', 'Inter, sans-serif');
      sub.textContent = centerSub;
      svg.appendChild(sub);
    }
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Gauge ----
export function renderGauge(container, value, max = 100, options = {}) {
  const { size = 80, color = '#3b82f6', label = '', strokeWidth = 10 } = options;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.min(value / max, 1);
  const filled = pct * circumference;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size * 0.6);
  svg.setAttribute('viewBox', `0 0 ${size} ${size * 0.6}`);
  svg.setAttribute('overflow', 'visible');

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const startX = strokeWidth/2;
  const endX = size - strokeWidth/2;
  const centerX = size/2;
  const centerY = size * 0.55;
  bg.setAttribute('d', `M${startX},${centerY} A${radius},${radius} 0 0 1 ${endX},${centerY}`);
  bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'rgba(255,255,255,0.08)');
  bg.setAttribute('stroke-width', strokeWidth); bg.setAttribute('stroke-linecap', 'round');
  svg.appendChild(bg);

  const fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  fill.setAttribute('d', `M${startX},${centerY} A${radius},${radius} 0 0 1 ${endX},${centerY}`);
  fill.setAttribute('fill', 'none'); fill.setAttribute('stroke', color);
  fill.setAttribute('stroke-width', strokeWidth); fill.setAttribute('stroke-linecap', 'round');
  fill.setAttribute('stroke-dasharray', `${filled} ${circumference}`);
  fill.style.transition = 'stroke-dasharray 0.8s ease';
  svg.appendChild(fill);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', centerX); text.setAttribute('y', centerY);
  text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '16');
  text.setAttribute('font-weight', '800'); text.setAttribute('fill', 'var(--text-1)');
  text.setAttribute('font-family', 'Inter, sans-serif');
  text.textContent = `${Math.round(pct * 100)}%`;
  svg.appendChild(text);

  if (label) {
    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('x', centerX); sub.setAttribute('y', centerY + 14);
    sub.setAttribute('text-anchor', 'middle'); sub.setAttribute('font-size', '9');
    sub.setAttribute('fill', 'var(--text-3)'); sub.setAttribute('font-family', 'Inter, sans-serif');
    sub.textContent = label;
    svg.appendChild(sub);
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Heatmap (fleet utilization) ----
export function renderHeatmap(container, data, options = {}) {
  const { cols = 24, rows = 7, cellSize = 14, gap = 3 } = options;
  const width = cols * (cellSize + gap) - gap;
  const height = rows * (cellSize + gap) - gap;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const colors = ['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.25)', 'rgba(59,130,246,0.45)', 'rgba(59,130,246,0.65)', 'rgba(59,130,246,0.85)', '#3b82f6'];

  data.forEach((row, r) => {
    row.forEach((val, c) => {
      const idx = Math.min(Math.floor(val * colors.length), colors.length - 1);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', c * (cellSize + gap));
      rect.setAttribute('y', r * (cellSize + gap));
      rect.setAttribute('width', cellSize); rect.setAttribute('height', cellSize);
      rect.setAttribute('rx', 2);
      rect.setAttribute('fill', colors[idx]);
      svg.appendChild(rect);
    });
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

// ---- Progress ring animation ----
export function animateCounter(el, from, to, duration = 800, formatter = (v) => Math.round(v)) {
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
