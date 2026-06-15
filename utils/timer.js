/**
 * timer.js
 * ========
 * Utilitas pengukur waktu eksekusi AI.
 * Menggunakan Performance API untuk presisi tinggi (sub-milidetik).
 */

/**
 * Kelas Timer untuk mengukur waktu eksekusi
 * Digunakan untuk mengukur berapa lama Minimax / Alpha-Beta berjalan
 */
export class Timer {
  constructor() {
    this._start = 0;
    this._end   = 0;
    this._laps  = []; // Untuk multiple measurements
  }

  /** Mulai pengukuran */
  start() {
    this._start = performance.now();
    this._laps  = [];
    return this;
  }

  /**
   * Rekam lap (checkpoint waktu)
   * @param {string} label - Label untuk lap ini
   */
  lap(label = '') {
    const t = performance.now() - this._start;
    this._laps.push({ label, time: t });
    return t;
  }

  /**
   * Hentikan timer dan kembalikan waktu elapsed dalam ms
   * @returns {number} Waktu dalam ms
   */
  stop() {
    this._end = performance.now();
    return this.elapsed;
  }

  /** Waktu elapsed dalam ms (bisa dipanggil kapan saja setelah start) */
  get elapsed() {
    const end = this._end || performance.now();
    return end - this._start;
  }

  /** Semua lap yang direkam */
  get laps() {
    return [...this._laps];
  }

  /** Reset timer */
  reset() {
    this._start = 0;
    this._end   = 0;
    this._laps  = [];
    return this;
  }
}

/**
 * Fungsi utilitas cepat: ukur waktu eksekusi sebuah fungsi
 * @param {Function} fn - Fungsi yang diukur
 * @returns {{ result: any, time: number }} Hasil dan waktu dalam ms
 *
 * Contoh penggunaan:
 *   const { result, time } = measure(() => minimax(board, 5, BLACK));
 *   console.log(`Selesai dalam ${time.toFixed(2)} ms`);
 */
export function measure(fn) {
  const t = new Timer().start();
  const result = fn();
  const time = t.stop();
  return { result, time };
}