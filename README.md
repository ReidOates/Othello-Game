# 🎮 Othello AI - Minimax & Alpha-Beta Pruning

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

Aplikasi web interaktif untuk bermain Othello (Reversi) melawan agen *Artificial Intelligence*. Project ini dibangun sebagai implementasi dari algoritma **Pencarian Adversarial (Adversarial Search)** menggunakan pendekatan **Minimax** dan **Alpha-Beta Pruning**.

🌐 **[Live Demo: Mainkan Sekarang!](ISI_LINK_GITHUB_PAGES_KAMU)**

---

## 🎯 Latar Belakang Project
Project ini dikembangkan untuk memenuhi tugas mata kuliah **Kecerdasan Buatan (Artificial Intelligence)** program studi S1 Teknik Informatika. Fokus utama dari aplikasi ini adalah visualisasi interaktif dari bagaimana mesin mengambil keputusan dalam lingkungan kompetitif (*zero-sum game*).

## ✨ Fitur Utama
- **Lawan AI Pintar**: Bermain melawan AI dengan tingkat kesulitan (*Search Depth*) yang dapat diatur dari 1 hingga 5.
- **Dua Algoritma Pencarian**:
  - `Minimax`: Algoritma fundamental untuk mencari nilai optimal di setiap langkah.
  - `Alpha-Beta Pruning`: Optimasi Minimax yang memangkas cabang kalkulasi yang tidak relevan.
- **Live Game Tree Visualization**: Visualisasi *real-time* pohon pencarian AI yang digambar menggunakan SVG, memudahkan analisis langkah AI.
- **Glassmorphism UI**: Antarmuka modern, responsif, serta mendukung *Dark Mode* dan *Light Mode*.
- **Real-time Statistics**: Menampilkan metrik performa AI secara langsung seperti *Nodes Evaluated*, *Nodes Pruned*, dan waktu eksekusi.

## 🧠 Evaluasi Heuristik
AI menilai kekuatan posisi papan menggunakan kombinasi faktor strategis:
1. **Coin Parity**: Selisih jumlah bidak antara AI dan pemain.
2. **Mobility**: Jumlah langkah valid yang tersedia (semakin banyak opsi, semakin baik).
3. **Corner Occupancy**: Penguasaan titik sudut papan yang stabil (skor tertinggi).
4. **Stability & Positional Weight**: Evaluasi bobot statis berdasarkan posisi bidak di atas papan untuk menghindari area berbahaya.

## 🚀 Cara Menjalankan
Aplikasi ini berjalan murni di sisi klien (*Client-Side*) menggunakan Vanilla JavaScript. Tidak diperlukan instalasi server atau dependensi tambahan.

1. **Clone repository ini**:
```bash
   git clone [https://github.com/ReidOates/adversarial-search-301240032.git](https://github.com/ReidOates/adversarial-search-301240032.git)
```
1. Buka folder project.

2. Jalankan aplikasi: Buka file index.html langsung di browser Anda atau gunakan ekstensi Live Server di VS Code.

📂 Struktur Direktori
📦 othello-ai
 ┣ 📂 css           # Styling aplikasi
 ┣ 📂 docs          # Dokumentasi algoritma
 ┣ 📂 js
 ┃ ┣ 📂 ai          # Logic AI (Minimax, Alpha-Beta, Heuristik)
 ┃ ┣ 📂 ui          # Komponen interface (Panel, Renderer)
 ┃ ┣ 📂 utils       # Helper functions & constants
 ┃ ┣ 📜 game.js     # Game engine core
 ┃ ┗ 📜 main.js     # Entry point aplikasi
 ┣ 📜 index.html    # File utama
 ┗ 📜 README.md     # Dokumentasi project

 👨‍💻 Author
Anonim - S1 Teknik Informatika

Dibuat untuk pembelajaran mata kuliah Kecerdasan Buatan.
