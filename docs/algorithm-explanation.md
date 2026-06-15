# Penjelasan Algoritma AI — Othello/Reversi

## 1. Minimax

Minimax adalah algoritma pencarian game tree di mana:
- **MAX player** (AI) berusaha **memaksimalkan** nilai evaluasi
- **MIN player** (lawan) berusaha **meminimalkan** nilai evaluasi

### Pseudocode
```
function minimax(state, depth, isMaximizing):
  if depth == 0 or game_over(state):
    return evaluate(state)

  if isMaximizing:
    best = -∞
    for each move in valid_moves(state):
      child = apply_move(state, move)
      val   = minimax(child, depth-1, false)
      best  = max(best, val)
    return best
  else:
    best = +∞
    for each move in valid_moves(state):
      child = apply_move(state, move)
      val   = minimax(child, depth-1, true)
      best  = min(best, val)
    return best
```

### Kompleksitas
- **Time:** O(b^d) — b = branching factor, d = depth
- **Space:** O(b·d)

---

## 2. Alpha-Beta Pruning

Optimasi Minimax dengan memangkas cabang yang tidak perlu dievaluasi.
- **α (alpha):** Nilai terbaik yang bisa dijamin oleh MAX
- **β (beta):** Nilai terbaik yang bisa dijamin oleh MIN
- Pemangkasan terjadi ketika **α ≥ β**

### Kondisi Pangkas
- **Beta cut-off:** Di node MAX, jika nilai ≥ β → pangkas sisa saudara
- **Alpha cut-off:** Di node MIN, jika nilai ≤ α → pangkas sisa saudara

### Kompleksitas
- **Best case:** O(b^(d/2)) — seperti depth dua kali lipat!
- **Average case:** O(b^(3d/4))
- **Worst case:** O(b^d) — sama dengan Minimax biasa

---

## 3. Fungsi Heuristic

Terdiri dari 5 komponen evaluasi:

| Komponen | Bobot | Keterangan |
|---|---|---|
| Coin Parity | 10 | Selisih jumlah disc |
| Mobility | 5 | Jumlah langkah valid |
| Corner Occupancy | 25 | Disc di sudut board |
| Stability | 25 | Disc yang tidak bisa dibalik |
| Positional Weight | 10 | Nilai posisi strategis |

---

## 4. Move Ordering

Untuk meningkatkan efisiensi Alpha-Beta, langkah diurutkan berdasarkan:
1. Langkah ke sudut (corner) — prioritas tertinggi
2. Langkah berdasarkan bobot posisi
3. Langkah ke tepi board
4. Langkah ke posisi tengah